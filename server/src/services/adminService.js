import { supabaseAdmin } from '../lib/supabaseClient.js';
import xlsx from 'xlsx';
import validationService from './validationService.js';

async function logAudit(userId, action, metadata = {}) {
  try {
    if (!userId) return;
    await supabaseAdmin.from('audit_trail').insert({ user_id: userId, action, metadata });
  } catch (err) {
    console.error('Failed to write audit log', err);
  }
}

export const AdminService = {
  /**
   * Returns users from profiles.
   * Adds placeholder fields if DB doesn't contain them yet.
   */
  async listUsers() {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, created_at, username, is_active, student_id')
    console.log('AdminService.listUsers: fetched', data); // Debug log

    if (error) {
      const err = new Error(error.message);
      err.status = 500;
      throw err;
    }

    // contract expects: id, full_name, email, role, is_active, created_at, permissions :contentReference[oaicite:1]{index=1}
    return (data || []).map((u) => ({
      id: u.id,
      full_name: u.full_name ?? '',
      email: u.email ?? '',
      role: u.role ?? 'student',
      username: u.username ?? '',
      student_id: u.student_id ?? '',
      is_active: u.is_active ?? true,          // placeholder (no column yet)
      created_at: u.created_at, // real if exists
      permissions: [],          // placeholder (no column yet)
    }));
  },

  async updateUserRole(userId, role) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', userId).select('id, full_name, email, role, created_at, username, is_active, student_id')
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    // Also update auth metadata
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { role }
    });

    await logAudit(null, 'UPDATE_USER_ROLE', { user_id: userId, new_role: role });

    return {
      id: data.id,
      full_name: data.full_name ?? '',
      email: data.email ?? '',
      role: data.role ?? 'student',
      username: data.username ?? '',
      student_id: data.student_id ?? '',
      is_active: data.is_active ?? true,
      created_at: data.created_at,
      permissions: [],
    };
  },

  async updateUserStatus(userId, is_active) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: !!is_active })
      .eq('id', userId)
      .select('id, full_name, email, role, created_at, username, is_active, student_id')
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    await logAudit(null, 'UPDATE_USER_STATUS', { user_id: userId, is_active: !!is_active });

    return {
      id: data.id,
      full_name: data.full_name ?? '',
      email: data.email ?? '',
      role: data.role ?? 'student',
      username: data.username ?? '',
      student_id: data.student_id ?? '',
      is_active: data.is_active ?? true,
      created_at: data.created_at,
      permissions: [],
    };
  }
  ,

  async updateUser(userId, { full_name, username, email, password, role, is_active }) {
    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (is_active !== undefined) updates.is_active = !!is_active;
    // student_id is intentionally not updatable
    // password is not stored in profiles table, handled separately for auth user

    if (Object.keys(updates).length === 0 && !password) {
      const err = new Error('No updates provided'); err.status = 400; throw err;
    }

    // --- Conflict Checks ---
    if (updates.username) {
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', updates.username)
        .neq('id', userId)
        .single();
      if (existing) {
        const err = new Error('Username already taken'); err.status = 409; throw err;
      }
    }
    if (updates.email) {
        const { data: existing } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', updates.email)
            .neq('id', userId)
            .single();
        if (existing) {
            const err = new Error('Email already in use'); err.status = 409; throw err;
        }
    }

    // --- Auth User Update ---
    const authUpdates = {};
    const user_metadata = {};
    if (updates.email) authUpdates.email = updates.email;
    if (password) authUpdates.password = password;
    if (updates.full_name) user_metadata.full_name = updates.full_name;
    if (updates.role) user_metadata.role = updates.role;
    if (updates.username) user_metadata.username = updates.username;
    if (Object.keys(user_metadata).length > 0) {
        const { data: { user: currentUser } } = await supabaseAdmin.auth.admin.getUserById(userId);
        authUpdates.user_metadata = { ...currentUser.user_metadata, ...user_metadata };
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates);
      if (authError) {
        const err = new Error(`Auth update failed: ${authError.message}`);
        err.status = authError.status || 500;
        throw err;
      }
    }

    // --- Profile Update ---
    let data, error;
    if (Object.keys(updates).length > 0) {
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .update(updates)
            .eq('id', userId).select('id, full_name, email, role, created_at, username, is_active, student_id')
            .single();
        data = profileData;
        error = profileError;
    } else {
        // If only password was changed, we still need to fetch the user data to return
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles').select('id, full_name, email, role, created_at, username, is_active, student_id')
            .eq('id', userId)
            .single();
        data = profileData;
        error = profileError;
    }
    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    await logAudit(null, 'UPDATE_USER', { user_id: userId, updates: { ...updates, password: password ? 'updated' : 'not-updated' } });

    return data;
  },

  async updateUserPermissions(userId, permissions) {
    // Placeholder because DB might not have permissions column.
    // We'll just return the existing user + requested permissions.
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return {
      id: data.id,
      full_name: data.full_name ?? '',
      email: data.email ?? '',
      role: data.role ?? 'student',
      is_active: data.is_active ?? true,          // placeholder
      created_at: data.created_at,
      permissions: permissions || [], // placeholder
    };
  },

  async getAudit(limit = 50, offset = 0) {
    const { data, error, count } = await supabaseAdmin
      .from('audit_trail')
      .select('id, user_id, action, metadata, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return { items: data || [], total: count ?? 0 };
  },

  async listSecurityAlerts(status) {
    let q = supabaseAdmin
      .from("failed_login_attempts")
      .select("id, created_at, attempted_username, attempted_role, ip_address, reason, status")
      .order("created_at", { ascending: false });

    if (status) q = q.eq("status", status);

    const { data, error } = await q;

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return (data || []).map((r) => ({
      id: r.id,
      ts: r.created_at,
      username: r.attempted_username,
      role: r.attempted_role,
      ip: r.ip_address,
      reason: r.reason,
      status: r.status,
    }));
  },

  async resolveSecurityAlert(id) {
    const { data, error } = await supabaseAdmin
      .from("failed_login_attempts")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, created_at, attempted_username, attempted_role, ip_address, reason, status")
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return {
      alert: {
        id: data.id,
        ts: data.created_at,
        username: data.attempted_username,
        role: data.attempted_role,
        ip: data.ip_address,
        reason: data.reason,
        status: data.status,
      },
    };
  },


  async createUser({ full_name, username, email, password, role, student_id }) {
    // 1. Validate student_id if role is student
    if (role === 'student') {
      if (!student_id) {
        const err = new Error('Student ID is required for student role');
        err.status = 400;
        throw err;
      }
      // Check for duplicate student_id
      const { data: existingStudent } = await supabaseAdmin
        .from('profiles')
        .select('student_id')
        .eq('student_id', student_id)
        .single();
      if (existingStudent) {
        const err = new Error('A user with this Student ID already exists');
        err.status = 409;
        throw err;
      }
    }
    // 1. Check if user already exists in profiles (optional, but good for custom error)
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      const err = new Error('User with this username already exists');
      err.status = 409;
      throw err;
    }

    // 2. Create user in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role, username }
    });

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    const user = data.user;

    // 3. Upsert into profiles table
    // Note: If you have a Trigger, this might be redundant or cause conflict depending on logic.
    // Assuming manual sync is safe/required as per authService logic.
    const profileData = {
      id: user.id,
      email: user.email,
      full_name: full_name,
      role,
      username,
      is_active: true,
    };

    if (role === 'student' && student_id) {
      profileData.student_id = student_id;
    }
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert([profileData]);

    if (profileError) {
      // Cleanup auth user if profile fails
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      const err = new Error(profileError.message);
      err.status = 500;
      throw err;
    }

    return {
      id: user.id,
      email: user.email,
      full_name: full_name,
      role: role,
      username: username,
      student_id: role === 'student' ? student_id : null,
      is_active: true,
      created_at: new Date().toISOString(),
      permissions: [],
    };
  },

  async bulkUsersFromExcel(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const results = {
      success: 0,
      failed: 0,
      errors: [],
      created: []
    };

    for (const row of rows) {
      // Normalize keys to lowercase to be more forgiving
      const normalized = {};
      Object.keys(row).forEach((k) => {
        normalized[k.toLowerCase()] = row[k];
      });

      // Expected valid keys: name (or full id), username, email, password, role
      const name = normalized.name || normalized.full_name || normalized['שם מלא'];
      const username = normalized.username || normalized['שם משתמש'];
      const email = normalized.email || normalized['אימייל'];
      const password = normalized.password || normalized['סיסמה'];
      const role = normalized.role || normalized['תפקיד'] || 'student';
      const student_id = normalized.student_id || normalized['student id'] || normalized['מספר סטודנט'];

      if (!username || !email || !password) {
        results.failed++;
        results.errors.push({
          username: username || 'Unknown',
          error: 'Missing required fields (username, email, password)'
        });
        continue;
      }

      try {
        const newUser = await this.createUser({
          full_name: name,
          username,
          email,
          password,
          role,
          student_id: role === 'student' ? student_id : undefined,
        });
        results.success++;
        results.created.push(newUser.username);
      } catch (err) {
        results.failed++;
        results.errors.push({ username, error: err.message });
      }
    }

    return results;
  },

  async importExamsFromExcel(buffer, adminUserId) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { raw: false });

    const results = { success: 0, failed: 0, errors: [] };

    for (const row of rows) {
      const normalized = {};
      Object.keys(row).forEach((k) => {
        normalized[k.toLowerCase().trim()] = row[k];
      });

      const courseCode = normalized['course code'] || normalized['course_code'];
      const courseName = normalized['course name'] || normalized['course_name'];
      const lecturerEmail = normalized['lecturer email'] || normalized['lecturer_email'];
      const examDate = normalized['date'] || normalized['exam date'];
      const examTime = normalized['time'] || normalized['exam time'];
      const duration = normalized['duration'];

      if (!courseCode || !examDate || !examTime || !duration || !lecturerEmail) {
        results.failed++;
        results.errors.push({ row, error: 'Missing required fields (course_code, date, time, duration, lecturer_email)' });
        continue;
      }

      try {
        await this.createExam({
          courseCode, courseName, lecturerEmail, examDate, examTime, duration,
        }, adminUserId);
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ row, error: err.message });
      }
    }
    return results;
  },

  async listExams(filters = {}, limit = 50, offset = 0) {
    let q = supabaseAdmin
      .from('exams')
      .select(`
        id, original_start_time, original_duration, status, extra_time,
        courses ( id, course_name, course_code ),
        exam_lecturers (
          profiles ( id, full_name, email )
        )
      `, { count: 'exact' })
      .order('original_start_time', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filters.status) {
      q = q.eq('status', filters.status);
    }

    // For search, we need to search on related tables. 
    // Supabase simple client doesn't support deep filtering easily in one query without !inner or complex modifiers.
    // However, given the requirement: "enable to search exams by course name or course symbol"
    // We can try to use the !inner hint on joined courses if filter.q is present.
    // Or, for simplicity and stability if OR relation across joined tables is tricky, we can filter in memory if result set is small, 
    // or use a more complex RPC. 
    // Let's try the direct approach with !inner check on courses.
    if (filters.q) {
      // Search by course code or name
      // Syntax: courses!inner(course_code, course_name)
      // We'll filter where course code OR course name ILIKE %q%
      // Note: Supabase JS syntax for OR across columns: .or('col1.ilike.%q%,col2.ilike.%q%')
      // Applying this to a foreign table requires the foreign table to be selected with !inner and then applying .or on it?
      // Actually, easiest way often is just:
      // .or(`course_code.ilike.%${filters.q}%,course_name.ilike.%${filters.q}%`, { foreignTable: 'courses' })
      // Let's modify the select first to ensure inner join reference is valid if we use a filter.

      // Actually, simpler approach for common use case: 
      // We cannot easily do "OR" across parent and child fields without complications using standard client.
      // But searching course code/name is JUST on the child table 'courses'.
      q = q.not('courses', 'is', null); // Ensure course exists
      // We need to switch the select to use !inner if we filter? Not strictly required for .textSearch but for .or with foreignTable it is better.
      // Let's try the foreign table filter syntax:
      q = q.or(`course_code.ilike.%${filters.q}%,course_name.ilike.%${filters.q}%`, { foreignTable: 'courses' });
    }

    const { data, error, count } = await q;

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    // Flatten structure for UI
    const items = (data || []).map(e => {
      // exam_lecturers is an array of objects due to join
      const lecturers = e.exam_lecturers?.map(el => el.profiles).filter(Boolean) || [];
      const lecturer = lecturers[0] || {}; // Primary lecturer

      return {
        id: e.id,
        date: e.original_start_time, // ISO string
        duration: e.original_duration,
        status: e.status,
        course_name: e.courses?.course_name || 'Unknown',
        course_code: e.courses?.course_code || 'Unknown',
        course_id: e.courses?.id || null,
        lecturer_name: lecturer.full_name || '',
        lecturer_email: lecturer.email || '',
      };
    });

    return { items, total: count ?? 0 };
  },

  async deleteExam(examId) {
    // Deleting an exam usually requires deleting related rows (exam_lecturers).
    // Supabase cascade delete might handle this if foreign keys are set up with ON DELETE CASCADE.
    // If not, we manually delete.

    // 1. Delete links
    await supabaseAdmin.from('exam_lecturers').delete().eq('exam_id', examId);

    // 2. Delete exam
    const { error } = await supabaseAdmin.from('exams').delete().eq('id', examId);
    if (error) throw new Error(error.message);
    return { id: examId, deleted: true };
  },

  async deleteUser(userId) {
    // 1. Delete from Auth (admin)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) throw new Error(`Auth delete failed: ${authError.message}`);

    // 2. Delete from Profiles (should cascade or be manual)
    // If we rely on cascade from auth.users -> public.profiles, we might be good.
    // But typically we want to ensure profile is gone.
    const { error: dbError } = await supabaseAdmin.from('profiles').delete().eq('id', userId);

    // Note: If auth delete cascades, dbError might be "row not found" or null.
    // We'll assume success if auth delete worked.

    return { id: userId, deleted: true };
  },

  async createExam({ courseCode, courseName, lecturerEmail, examDate, examTime, duration }, adminUserId) {
    // 1. Identify/Validate Lecturer
    const { data: lecturer, error: lecturerError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('email', String(lecturerEmail).trim())
      .single();

    if (lecturerError || !lecturer) throw new Error(`Lecturer not found: ${lecturerEmail}`);
    if (lecturer.role !== 'lecturer') throw new Error(`User ${lecturerEmail} is not a lecturer`);

    // 2. Handle Course
    let courseId;
    const { data: existingCourse } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('course_code', String(courseCode).trim())
      .single();

    if (existingCourse) {
      courseId = existingCourse.id;
    } else {
      if (!courseName) throw new Error(`Course ${courseCode} not found and no name provided`);
      const { data: newCourse, error: createCourseError } = await supabaseAdmin
        .from('courses')
        .insert({
          course_code: String(courseCode).trim(),
          course_name: String(courseName).trim(),
          lecturer_id: lecturer.id
        })
        .select('id')
        .single();
      if (createCourseError) throw new Error(`Create course failed: ${createCourseError.message}`);
      courseId = newCourse.id;
    }

    // 3. Prepare Time
    const combinedDateTimeStr = `${examDate} ${examTime}`;
    const startTimestamp = new Date(combinedDateTimeStr);
    if (isNaN(startTimestamp.getTime())) throw new Error(`Invalid date/time: ${combinedDateTimeStr}`);
    const isoStartTime = startTimestamp.toISOString();

    // 4. Duplicate Check
    const { data: existingExam } = await supabaseAdmin
      .from('exams')
      .select('id')
      .eq('course_id', courseId)
      .eq('original_start_time', isoStartTime)
      .maybeSingle();

    if (existingExam) throw new Error(`Exam already exists here`);

    // 5. Insert Exam
    const { data: newExam, error: insertExamError } = await supabaseAdmin
      .from('exams')
      .insert({
        course_id: courseId,
        original_start_time: isoStartTime,
        original_duration: Number(duration),
        status: 'pending'
      })
      .select('id')
      .single();

    if (insertExamError) throw new Error(`Insert exam failed: ${insertExamError.message}`);

    // 6. Link Lecturer
    await supabaseAdmin.from('exam_lecturers').insert({
      exam_id: newExam.id,
      lecturer_id: lecturer.id
    });

    // Audit
    await supabaseAdmin.from('audit_trail').insert({
      user_id: adminUserId,
      action: 'CREATE_EXAM',
      metadata: { exam_id: newExam.id, course: courseCode }
    });

    return newExam;
  },


  /**
   * Update an exam's time/duration/course and validate conflicts
   */
  async updateExam(examId, { original_start_time, original_duration, extra_time, course_id }, adminUserId) {
    // Build update payload
    const updates = {};
    if (original_start_time !== undefined) updates.original_start_time = original_start_time;
    if (original_duration !== undefined) updates.original_duration = Number(original_duration);
    if (extra_time !== undefined) updates.extra_time = Number(extra_time);
    if (course_id !== undefined) updates.course_id = course_id;

    if (Object.keys(updates).length === 0) {
      const err = new Error('No updates provided'); err.status = 400; throw err;
    }

    // Normalize start time if provided
    if (updates.original_start_time) {
      const dt = new Date(updates.original_start_time);
      if (isNaN(dt.getTime())) {
        const err = new Error('Invalid original_start_time'); err.status = 400; throw err;
      }
      updates.original_start_time = dt.toISOString();
    }

    // Fetch existing exam to know current window
    const { data: existingExam, error: existingExamErr } = await supabaseAdmin
      .from('exams')
      .select('id, course_id, original_start_time, original_duration, extra_time')
      .eq('id', examId)
      .single();

    if (existingExamErr || !existingExam) {
      const err = new Error('Exam not found'); err.status = 404; throw err;
    }

    const newStart = updates.original_start_time || existingExam.original_start_time;
    const newDuration = updates.original_duration || existingExam.original_duration;
    const newExtra = updates.extra_time !== undefined ? updates.extra_time : existingExam.extra_time;

    // Validate conflicts for all classrooms attached to this exam
    const { data: classrooms, error: clsErr } = await supabaseAdmin
      .from('classrooms')
      .select('id, room_number, supervisor_id')
      .eq('exam_id', examId);

    if (clsErr) {
      const err = new Error(clsErr.message); err.status = 500; throw err;
    }

    for (const cls of (classrooms || [])) {
      const conflicts = await validationService.check_conflicts('exam_update', {
        exam_id: examId,
        existing_classroom_id: cls.id,
        room_number: cls.room_number,
        supervisor_id: cls.supervisor_id,
        new_start_time: newStart,
        original_duration: newDuration,
        extra_time: newExtra,
      });
      if (conflicts && conflicts.length > 0) {
        const err = new Error(conflicts.join('; ')); err.status = 409; throw err;
      }
    }

    // Apply update
    const { data: updatedExam, error: updateError } = await supabaseAdmin
      .from('exams')
      .update(updates)
      .eq('id', examId)
      .select('id, course_id, original_start_time, original_duration, extra_time, status')
      .single();

    if (updateError) {
      const err = new Error(updateError.message); err.status = 400; throw err;
    }

    // Audit
    try {
      await logAudit(adminUserId, 'UPDATE_EXAM', { exam_id: examId, updates });
    } catch (e) {
      // swallow audit errors
      console.error('Audit write failed', e.message);
    }

    return updatedExam;
  },

  /**
   * List all courses with student count and lecturer info
   */
  async listCourses(filters = {}) {
    let q = supabaseAdmin
      .from('courses')
      .select(`
        id,
        course_name,
        course_code,
        created_at,
        lecturer_id,
        profiles ( id, full_name, email ),
        course_registrations ( id )
      `);

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      q = q.or(`course_name.ilike.${searchTerm},course_code.ilike.${searchTerm}`);
    }

    if (filters.lecturer_id) {
      q = q.eq('lecturer_id', filters.lecturer_id);
    }

    q = q.order('created_at', { ascending: false });

    const { data, error } = await q;

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    // Format response
    return (data || []).map(c => ({
      id: c.id,
      course_name: c.course_name,
      course_code: c.course_code,
      lecturer_id: c.lecturer_id,
      lecturer_name: c.profiles?.full_name || 'Unassigned',
      lecturer_email: c.profiles?.email || '',
      student_count: c.course_registrations?.length || 0,
      created_at: c.created_at,
    }));
  },

  /**
   * Create a new course
   */
  async createCourse({ course_name, course_code, lecturer_id }) {
    if (!course_name || !course_code) {
      const err = new Error('course_name and course_code are required');
      err.status = 400;
      throw err;
    }

    // Check for duplicate course code
    const { data: existing } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('course_code', course_code)
      .single();

    if (existing) {
      const err = new Error(`Course code "${course_code}" already exists`);
      err.status = 409;
      throw err;
    }

    // If lecturer_id is provided, validate it exists and is a lecturer
    if (lecturer_id) {
      const { data: lecturer, error: lecturerError } = await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('id', lecturer_id)
        .single();

      if (lecturerError || !lecturer) {
        const err = new Error('Lecturer not found');
        err.status = 404;
        throw err;
      }

      if (lecturer.role !== 'lecturer') {
        const err = new Error('User is not a lecturer');
        err.status = 400;
        throw err;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('courses')
      .insert({
        course_name,
        course_code,
        lecturer_id: lecturer_id || null,
      })
      .select('id, course_name, course_code, lecturer_id, created_at')
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 500;
      throw err;
    }

    // Fetch lecturer info if exists
    let lecturerName = 'Unassigned';
    if (data.lecturer_id) {
      const { data: lecturer } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', data.lecturer_id)
        .single();
      lecturerName = lecturer?.full_name || 'Unknown';
    }

    return {
      course: {
        id: data.id,
        course_name: data.course_name,
        course_code: data.course_code,
        lecturer_id: data.lecturer_id,
        lecturer_name: lecturerName,
        student_count: 0,
        created_at: data.created_at,
      },
    };
  },

  /**
   * Update course details
   */
  async updateCourse(courseId, { course_name, course_code, lecturer_id }) {
    const updates = {};
    if (course_name !== undefined) updates.course_name = course_name;
    if (course_code !== undefined) updates.course_code = course_code;
    if (lecturer_id !== undefined) updates.lecturer_id = lecturer_id;

    if (Object.keys(updates).length === 0) {
      return { course: {} };
    }

    // If changing course_code, check for duplicates
    if (course_code) {
      const { data: existing } = await supabaseAdmin
        .from('courses')
        .select('id')
        .eq('course_code', course_code)
        .neq('id', courseId)
        .single();

      if (existing) {
        const err = new Error(`Course code "${course_code}" already exists`);
        err.status = 409;
        throw err;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('courses')
      .update(updates)
      .eq('id', courseId)
      .select('id, course_name, course_code, lecturer_id, created_at')
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return { course: data };
  },

  /**
   * Delete a course
   */
  async deleteCourse(courseId) {
    // Delete related course_registrations first
    await supabaseAdmin.from('course_registrations').delete().eq('course_id', courseId);

    // Delete course
    const { error } = await supabaseAdmin.from('courses').delete().eq('id', courseId);

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return { id: courseId, deleted: true };
  },

  /**
   * Get students in a course
   */
  async getCourseStudents(courseId) {
    const { data, error } = await supabaseAdmin
      .from('course_registrations')
      .select(`
        id,
        student_id,
        profiles ( id, full_name, email, student_id )
      `)
      .eq('course_id', courseId);

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return (data || []).map(cr => ({
      id: cr.profiles?.id || cr.student_id,
      full_name: cr.profiles?.full_name || 'Unknown',
      email: cr.profiles?.email || '',
      student_id: cr.profiles?.student_id || '',
      registration_id: cr.id,
    }));
  },

  /**
   * Get available students for a course (students not yet enrolled)
   */
  async getAvailableStudents(courseId) {
    // Get all students with role 'student'
    const { data: allStudents, error: allError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, student_id')
      .eq('role', 'student');

    if (allError) {
      const err = new Error(allError.message);
      err.status = 400;
      throw err;
    }

    // Get students already in this course
    const { data: enrolled, error: enrollError } = await supabaseAdmin
      .from('course_registrations')
      .select('student_id')
      .eq('course_id', courseId);

    if (enrollError) {
      const err = new Error(enrollError.message);
      err.status = 400;
      throw err;
    }

    // Get IDs of enrolled students
    const enrolledIds = new Set((enrolled || []).map(r => r.student_id));

    // Filter out already enrolled students
    const available = (allStudents || [])
      .filter(s => !enrolledIds.has(s.id))
      .map(s => ({
        id: s.id,
        full_name: s.full_name || 'Unknown',
        email: s.email || '',
        student_id: s.student_id || '',
      }));

    return available;
  },

  /**
   * Add student to course manually
   */
  async addStudentToCourse(courseId, { student_id, email, id }) {
    // Find student by ID (profile ID from client) or student_id column or email
    let student = null;
    let studentError = null;

    // Try by profile ID first (when sent from available students list)
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, student_id')
        .eq('id', id)
        .single();
      student = data;
      studentError = error;
    }

    // Try by student_id column if not found
    if (!student && student_id) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, student_id')
        .eq('student_id', student_id)
        .single();
      student = data;
      studentError = error;
    }

    // Try by email if not found
    if (!student && email) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, student_id')
        .eq('email', email)
        .single();
      student = data;
      studentError = error;
    }

    if (studentError || !student) {
      const err = new Error('Student not found');
      err.status = 404;
      throw err;
    }

    // Check if already registered
    const { data: existing } = await supabaseAdmin
      .from('course_registrations')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', student.id)
      .single();

    if (existing) {
      const err = new Error('Student already registered in this course');
      err.status = 409;
      throw err;
    }

    // Add registration
    const { data, error } = await supabaseAdmin
      .from('course_registrations')
      .insert({
        course_id: courseId,
        student_id: student.id,
      })
      .select('id')
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 500;
      throw err;
    }

    return {
      registration: {
        id: data.id,
        student_id: student.id,
        student_name: student.full_name,
      },
    };
  },

  /**
   * Bulk import students to course from Excel
   */
  async bulkImportStudentsToCourse(courseId, buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const results = {
      imported: 0,
      failed: 0,
      errors: [],
      skipped: 0,
    };

    for (const row of rows) {
      // Normalize keys to lowercase
      const normalized = {};
      Object.keys(row).forEach((k) => {
        normalized[k.toLowerCase()] = row[k];
      });

      // Accept various column name variations
      const studentId = normalized.student_id || normalized['student id'] || normalized['מספר סטודנט'];
      const email = normalized.email || normalized['אימייל'];
      const fullName = normalized.full_name || normalized['name'] || normalized['שם מלא'];

      if (!studentId && !email) {
        results.failed++;
        results.errors.push({
          row: row,
          error: 'Missing student_id or email',
        });
        continue;
      }

      try {
        // Find student
        let studentQuery = supabaseAdmin.from('profiles').select('id, full_name, email, student_id');

        if (studentId) {
          studentQuery = studentQuery.eq('student_id', String(studentId).trim());
        } else {
          studentQuery = studentQuery.eq('email', String(email).trim());
        }

        const { data: student } = await studentQuery.single();

        if (!student) {
          results.failed++;
          results.errors.push({
            studentId: studentId || email,
            error: 'Student not found in system',
          });
          continue;
        }

        // Check if already registered
        const { data: existing } = await supabaseAdmin
          .from('course_registrations')
          .select('id')
          .eq('course_id', courseId)
          .eq('student_id', student.id)
          .single();

        if (existing) {
          results.skipped++;
          continue;
        }

        // Add registration
        await supabaseAdmin.from('course_registrations').insert({
          course_id: courseId,
          student_id: student.id,
        });

        results.imported++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          studentId: studentId || email,
          error: err.message,
        });
      }
    }

    return results;
  },

  /**
   * Remove student from course
   */
  async removeStudentFromCourse(courseId, studentId) {
    const { error } = await supabaseAdmin
      .from('course_registrations')
      .delete()
      .eq('course_id', courseId)
      .eq('student_id', studentId);

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return { deleted: true };
  },

  /**
   * Import courses from Excel file
   */
  async importCoursesFromExcel(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { raw: false });

    const results = {
      imported: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    let rowIndex = 1;

    for (const row of rows) {
      rowIndex++;

      // Normalize keys
      const normalized = {};
      Object.keys(row).forEach(k => normalized[k.trim().toLowerCase()] = row[k]);

      const courseCode = normalized['course code'] || normalized['course_code'] || normalized['קוד קורס'];
      const courseName = normalized['course name'] || normalized['course_name'] || normalized['שם קורס'];
      const lecturerEmail = normalized['lecturer email'] || normalized['lecturer_email'] || normalized['דואל מרצה'];

      // Validate required fields
      if (!courseCode || !courseName) {
        results.failed++;
        results.errors.push({
          row: rowIndex,
          error: 'Missing course code or course name'
        });
        continue;
      }

      try {
        // Check if course already exists
        const { data: existingCourse } = await supabaseAdmin
          .from('courses')
          .select('id')
          .eq('course_code', String(courseCode).trim())
          .single();

        if (existingCourse) {
          results.skipped++;
          continue;
        }

        // If lecturer email provided, find lecturer
        let lecturerId = null;
        if (lecturerEmail) {
          const { data: lecturer } = await supabaseAdmin
            .from('profiles')
            .select('id, role')
            .eq('email', lecturerEmail.trim())
            .single();

          if (lecturer && lecturer.role === 'lecturer') {
            lecturerId = lecturer.id;
          }
        }

        // Create course
        const { data: newCourse, error: courseError } = await supabaseAdmin
          .from('courses')
          .insert({
            course_code: String(courseCode).trim(),
            course_name: String(courseName).trim(),
            lecturer_id: lecturerId
          })
          .select('id')
          .single();

        if (courseError) {
          throw new Error(`Failed to create course: ${courseError.message}`);
        }

        results.imported++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          courseCode: courseCode,
          error: err.message
        });
      }
    }

    return results;
  },

  // ========== CLASSROOMS (ADMIN) ==========

  async listClassroomsForAdmin(filters = {}) {
    let query = supabaseAdmin
      .from('classrooms')
      .select(`
        id,
        exam_id,
        room_number,
        supervisor_id,
        floor_supervisor_id,
        created_at,
        exams:exam_id (
          id,
          course_id,
          original_start_time,
          status
        ),
        supervisor:supervisor_id (
          id,
          full_name,
          email
        ),
        floor_supervisor:floor_supervisor_id (
          id,
          full_name,
          email
        )
      `)
      .order('room_number', { ascending: true });

    if (filters.exam_id) {
      query = query.eq('exam_id', filters.exam_id);
    }

    if (filters.search) {
      query = query.ilike('room_number', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return (data || []).map(classroom => ({
      id: classroom.id,
      room_number: classroom.room_number,
      exam_id: classroom.exam_id,
      supervisor_id: classroom.supervisor_id,
      floor_supervisor_id: classroom.floor_supervisor_id,
      supervisor_name: classroom.supervisor?.full_name || null,
      floor_supervisor_name: classroom.floor_supervisor?.full_name || null,
      exam_course_id: classroom.exams?.course_id || null,
      exam_start_time: classroom.exams?.original_start_time || null,
      created_at: classroom.created_at,
    }));
  },

  async createClassroomForAdmin(classroomData, adminUserId) {
    const { exam_id, room_number, supervisor_id, floor_supervisor_id } = classroomData;

    if (!exam_id || !room_number) {
      const err = new Error('exam_id and room_number are required');
      err.status = 400;
      throw err;
    }

    // Verify exam exists
    const { data: exam, error: examError } = await supabaseAdmin
      .from('exams')
      .select('id')
      .eq('id', exam_id)
      .single();

    if (examError || !exam) {
      const err = new Error('Exam not found');
      err.status = 404;
      throw err;
    }

    // Run conflict validations (classroom allocation & supervisor scheduling)
    const conflicts = await validationService.check_conflicts('classroom_create', {
      exam_id,
      room_number: room_number,
      supervisor_id,
    });

    if (conflicts && conflicts.length > 0) {
      const err = new Error(conflicts.join('; '));
      err.status = 409; // conflict
      throw err;
    }

    const { data, error } = await supabaseAdmin
      .from('classrooms')
      .insert({
        exam_id,
        room_number: String(room_number).trim(),
        supervisor_id: supervisor_id || null,
        floor_supervisor_id: floor_supervisor_id || null,
      })
      .select(`
        id,
        exam_id,
        room_number,
        supervisor_id,
        floor_supervisor_id,
        created_at,
        supervisor:supervisor_id (
          id,
          full_name
        ),
        floor_supervisor:floor_supervisor_id (
          id,
          full_name
        )
      `)
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    const result = {
      classroom: {
        id: data.id,
        room_number: data.room_number,
        exam_id: data.exam_id,
        supervisor_id: data.supervisor_id,
        floor_supervisor_id: data.floor_supervisor_id,
        supervisor_name: data.supervisor?.full_name || null,
        floor_supervisor_name: data.floor_supervisor?.full_name || null,
      },
    };

    await logAudit(adminUserId, 'create_classroom', { classroom: result.classroom });
    return result;
  },

  async updateClassroomForAdmin(classroomId, classroomData, adminUserId) {
    const { room_number, supervisor_id, floor_supervisor_id, exam_id } = classroomData;

    const updateData = {};
    if (room_number !== undefined) updateData.room_number = String(room_number).trim();
    if (supervisor_id !== undefined) updateData.supervisor_id = supervisor_id;
    if (floor_supervisor_id !== undefined) updateData.floor_supervisor_id = floor_supervisor_id;
    if (exam_id !== undefined) updateData.exam_id = exam_id;

    // Fetch existing classroom to get exam context
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('classrooms')
      .select('id, exam_id, room_number')
      .eq('id', classroomId)
      .single();

    if (fetchErr || !existing) {
      const err = new Error('Classroom not found');
      err.status = 404;
      throw err;
    }

    const conflicts = await validationService.check_conflicts('classroom_update', {
      existing_classroom_id: classroomId,
      exam_id: updateData.exam_id || existing.exam_id,
      room_number: updateData.room_number || existing.room_number,
      supervisor_id: updateData.supervisor_id,
    });

    if (conflicts && conflicts.length > 0) {
      const err = new Error(conflicts.join('; '));
      err.status = 409;
      throw err;
    }

    const { data, error } = await supabaseAdmin
      .from('classrooms')
      .update(updateData)
      .eq('id', classroomId)
      .select(`
        id,
        exam_id,
        room_number,
        supervisor_id,
        floor_supervisor_id,
        supervisor:supervisor_id (
          id,
          full_name
        ),
        floor_supervisor:floor_supervisor_id (
          id,
          full_name
        )
      `)
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    const result = {
      classroom: {
        id: data.id,
        room_number: data.room_number,
        exam_id: data.exam_id,
        supervisor_id: data.supervisor_id,
        floor_supervisor_id: data.floor_supervisor_id,
        supervisor_name: data.supervisor?.full_name || null,
        floor_supervisor_name: data.floor_supervisor?.full_name || null,
      },
    };
    await logAudit(adminUserId, 'update_classroom', { classroom: result.classroom });
    return result;
  },

  async deleteClassroomForAdmin(classroomId) {
    const { error } = await supabaseAdmin
      .from('classrooms')
      .delete()
      .eq('id', classroomId);

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return { success: true };
  },

  async assignSupervisorsToClassroom(classroomId, assignmentData, adminUserId) {
    const { supervisor_id, floor_supervisor_id } = assignmentData;

    const updateData = {};
    if (supervisor_id !== undefined) updateData.supervisor_id = supervisor_id;
    if (floor_supervisor_id !== undefined) updateData.floor_supervisor_id = floor_supervisor_id;

    if (Object.keys(updateData).length === 0) {
      const err = new Error('At least one supervisor field is required');
      err.status = 400;
      throw err;
    }

    // Validate supervisor scheduling conflicts
    const { data: existing } = await supabaseAdmin
      .from('classrooms')
      .select('id, exam_id, room_number')
      .eq('id', classroomId)
      .single();

    if (!existing) {
      const err = new Error('Classroom not found');
      err.status = 404;
      throw err;
    }

    const conflicts = await validationService.check_conflicts('assign_supervisor', {
      existing_classroom_id: classroomId,
      exam_id: existing.exam_id,
      room_number: existing.room_number,
      supervisor_id: supervisor_id,
      floor_supervisor_id: floor_supervisor_id,
    });

    if (conflicts && conflicts.length > 0) {
      const err = new Error(conflicts.join('; '));
      err.status = 409;
      throw err;
    }

    const { data, error } = await supabaseAdmin
      .from('classrooms')
      .update(updateData)
      .eq('id', classroomId)
      .select(`
        id,
        exam_id,
        room_number,
        supervisor_id,
        floor_supervisor_id,
        supervisor:supervisor_id (
          id,
          full_name
        ),
        floor_supervisor:floor_supervisor_id (
          id,
          full_name
        )
      `)
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    const result = {
      classroom: {
        id: data.id,
        room_number: data.room_number,
        exam_id: data.exam_id,
        supervisor_id: data.supervisor_id,
        floor_supervisor_id: data.floor_supervisor_id,
        supervisor_name: data.supervisor?.full_name || null,
        floor_supervisor_name: data.floor_supervisor?.full_name || null,
      },
    };

    await logAudit(adminUserId, 'assign_supervisors', { classroom: result.classroom, assignment: assignmentData });
    return result;
  },

  async getSupervisorsForAssignment() {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['supervisor', 'floor_supervisor'])
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return (data || []).map(supervisor => ({
      id: supervisor.id,
      full_name: supervisor.full_name,
      email: supervisor.email,
      role: supervisor.role,
    }));
  },

  async importClassroomsFromExcel(buffer, adminUserId) {
    console.log("Starting classroom import...");
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { raw: false });

    console.log(`Processing ${rows.length} rows from Excel`);

    const results = {
      imported: 0,
      updated: 0,
      failed: 0,
      errors: []
    };

    let rowIndex = 1;

    for (const row of rows) {
      rowIndex++;

      // Normalize keys
      const normalized = {};
      Object.keys(row).forEach(k => normalized[k.trim().toLowerCase()] = row[k]);

      const roomNumber = normalized['room number'] || normalized['room_number'] || normalized['رقم الحجرة'];
      const examId = normalized['exam id'] || normalized['exam_id'] || normalized['معرف الاختبار'];
      const supervisorEmail = normalized['supervisor email'] || normalized['supervisor_email'] || normalized['بريد المراقب'];
      const floorSupervisorEmail = normalized['floor supervisor email'] || normalized['floor_supervisor_email'] || normalized['بريد مراقب الطابق'];

      console.log(`Row ${rowIndex}: room="${roomNumber}", exam="${examId}", supervisor="${supervisorEmail}"`);

      // Validate required fields
      if (!roomNumber || !examId) {
        results.failed++;
        results.errors.push({
          row: rowIndex,
          error: 'Missing room_number or exam_id'
        });
        console.log(`  -> FAILED: Missing required fields`);
        continue;
      }

      try {
        // Find supervisor if email provided
        let supervisorId = null;
        if (supervisorEmail) {
          const { data: supervisor } = await supabaseAdmin
            .from('profiles')
            .select('id, role')
            .eq('email', supervisorEmail.trim())
            .single();

          if (supervisor) {
            console.log(`  -> Found supervisor: ${supervisor.id}, role=${supervisor.role}`);
            if (supervisor.role === 'supervisor') {
              supervisorId = supervisor.id;
            } else {
              console.log(`  -> Supervisor role mismatch: expected 'supervisor', got '${supervisor.role}'`);
            }
          } else {
            console.log(`  -> Supervisor not found with email: ${supervisorEmail.trim()}`);
          }
        }

        // Find floor supervisor if email provided
        let floorSupervisorId = null;
        if (floorSupervisorEmail) {
          const { data: floorSupervisor } = await supabaseAdmin
            .from('profiles')
            .select('id, role')
            .eq('email', floorSupervisorEmail.trim())
            .single();

          if (floorSupervisor) {
            console.log(`  -> Found floor supervisor: ${floorSupervisor.id}, role=${floorSupervisor.role}`);
            if (floorSupervisor.role === 'floor_supervisor') {
              floorSupervisorId = floorSupervisor.id;
            } else {
              console.log(`  -> Floor supervisor role mismatch: expected 'floor_supervisor', got '${floorSupervisor.role}'`);
            }
          } else {
            console.log(`  -> Floor supervisor not found with email: ${floorSupervisorEmail.trim()}`);
          }
        }

        // Check if classroom with same room_number AND exam_id already exists
        const { data: existingClassroom, error: selectError } = await supabaseAdmin
          .from('classrooms')
          .select('id')
          .eq('room_number', String(roomNumber).trim())
          .eq('exam_id', String(examId).trim())
          .single();

        // Run conflict checks before update/create
        const conflicts = await validationService.check_conflicts('import_row', {
          existing_classroom_id: existingClassroom?.id,
          exam_id: String(examId).trim(),
          room_number: String(roomNumber).trim(),
          supervisor_id: supervisorId,
          floor_supervisor_id: floorSupervisorId,
        });

        if (conflicts && conflicts.length > 0) {
          results.failed++;
          results.errors.push({ row: rowIndex, roomNumber: roomNumber, error: conflicts.join('; ') });
          console.log(`  -> FAILED: Conflicts: ${conflicts.join('; ')}`);
          continue;
        }

        if (existingClassroom) {
          // UPDATE existing classroom with new supervisor assignments
          const { data: updatedClassroom, error: updateError } = await supabaseAdmin
            .from('classrooms')
            .update({
              supervisor_id: supervisorId,
              floor_supervisor_id: floorSupervisorId,
            })
            .eq('id', existingClassroom.id)
            .select('id')
            .single();

          if (updateError) {
            throw new Error(`Failed to update classroom: ${updateError.message}`);
          }

          results.updated++;
          console.log(`  -> UPDATED: Classroom ${existingClassroom.id} with new supervisors`);
        } else {
          // CREATE new classroom
          const { data: newClassroom, error: classroomError } = await supabaseAdmin
            .from('classrooms')
            .insert({
              room_number: String(roomNumber).trim(),
              exam_id: String(examId).trim(),
              supervisor_id: supervisorId,
              floor_supervisor_id: floorSupervisorId,
            })
            .select('id')
            .single();

          if (classroomError) {
            throw new Error(`Failed to create classroom: ${classroomError.message}`);
          }

          results.imported++;
          console.log(`  -> CREATED: New classroom ${newClassroom.id}`);
        }
      } catch (err) {
        results.failed++;
        results.errors.push({
          row: rowIndex,
          roomNumber: roomNumber,
          error: err.message
        });
        console.log(`  -> FAILED: ${err.message}`);
      }
    }

    console.log(`Import complete: imported=${results.imported}, updated=${results.updated}, failed=${results.failed}`);
    try {
      await logAudit(adminUserId, 'import_classrooms', { summary: results });
    } catch (err) {
      console.error('Failed to log audit for import', err);
    }
    return results;
  },
};