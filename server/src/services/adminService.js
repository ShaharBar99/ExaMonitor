import { supabaseAdmin } from '../lib/supabaseClient.js';
import xlsx from 'xlsx';

export const AdminService = {
  /**
   * Returns users from profiles.
   * Adds placeholder fields if DB doesn't contain them yet.
   */
  async listUsers() {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, created_at, username, is_active')
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
      is_active: u.is_active ?? true,          // placeholder (no column yet)
      created_at: u.created_at, // real if exists
      permissions: [],          // placeholder (no column yet)
    }));
  },

  async updateUserStatus(userId, is_active) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: !!is_active })
      .eq('id', userId)
      .select('id, full_name, email, role, created_at, username, is_active')
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
      username: data.username ?? '',
      is_active: data.is_active ?? true,
      created_at: data.created_at,
      permissions: [],
    };
  }
  ,

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


  async createUser({ full_name, username, email, password, role }) {
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
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert([
      {
        id: user.id,
        email: user.email,
        full_name: full_name,
        role,
        username,
        is_active: true
      },
    ]);

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
          role
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

  async importExamsFromExcel(buffer, adminUserId) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // raw: false ensures we get formatted strings if needed
    const rows = xlsx.utils.sheet_to_json(sheet, { raw: false });

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    let rowIndex = 1;

    for (const row of rows) {
      rowIndex++;

      // Keys (normalize)
      const normalized = {};
      Object.keys(row).forEach(k => normalized[k.trim().toLowerCase()] = row[k]);

      const lecturerEmail = normalized['lecturer email'] || normalized['lecturer_email'] || normalized['דואל מרצה'] || normalized['אימייל מרצה'];
      const courseName = normalized['course name'] || normalized['course_name'] || normalized['שם קורס'];
      const courseCode = normalized['course code'] || normalized['course_code'] || normalized['קוד קורס'];
      const examDate = normalized['exam date'] || normalized['exam_date'] || normalized['תאריך בחינה'];
      const examTime = normalized['exam time'] || normalized['exam_time'] || normalized['שעת התחלה'];
      const duration = normalized['duration'] || normalized['original_duration'] || normalized['משך בחינה'];

      // Basic Validation
      if (!lecturerEmail || !courseCode || !examDate || !examTime || !duration) {
        results.failed++;
        results.errors.push({
          row: rowIndex,
          error: `Missing fields. Found: Email=${lecturerEmail}, Code=${courseCode}, Date=${examDate}, Time=${examTime}, Duration=${duration}`
        });
        continue;
      }

      try {
        // 1. Identify Lecturer
        const { data: lecturer, error: lecturerError } = await supabaseAdmin
          .from('profiles')
          .select('id, role')
          .eq('email', lecturerEmail.trim())
          .single();

        if (lecturerError || !lecturer) {
          throw new Error(`Lecturer not found: ${lecturerEmail}`);
        }
        if (lecturer.role !== 'lecturer') {
          throw new Error(`User ${lecturerEmail} is not a lecturer`);
        }

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

        // 3. Prepare Start Time
        const combinedDateTimeStr = `${examDate} ${examTime}`;
        // Attempt parsing - expecting standard formats mostly. 
        // If imports fail due to date format, we might need luxon or moment, but trying native first.
        const startTimestamp = new Date(combinedDateTimeStr);

        if (isNaN(startTimestamp.getTime())) {
          throw new Error(`Invalid date/time: ${combinedDateTimeStr}`);
        }

        const isoStartTime = startTimestamp.toISOString();

        // 4. Validation (Duplicates)
        const { data: existingExam, error: conflictError } = await supabaseAdmin
          .from('exams')
          .select('id')
          .eq('course_id', courseId)
          .eq('original_start_time', isoStartTime)
          .maybeSingle();

        if (conflictError) throw new Error(`Conflict check failed: ${conflictError.message}`);

        if (existingExam) {
          throw new Error(`Exam already exists for ${courseCode} at ${combinedDateTimeStr}`);
        }

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
        const { error: linkError } = await supabaseAdmin
          .from('exam_lecturers')
          .insert({
            exam_id: newExam.id,
            lecturer_id: lecturer.id
          });

        if (linkError) {
          // Rollback exam
          await supabaseAdmin.from('exams').delete().eq('id', newExam.id);
          throw new Error(`Link lecturer failed, exam rollback: ${linkError.message}`);
        }

        results.success++;

      } catch (err) {
        results.failed++;
        results.errors.push({
          row: rowIndex,
          error: err.message
        });
      }
    }

    // Audit Trail
    if (results.success > 0 || results.failed > 0) {
      await supabaseAdmin.from('audit_trail').insert({
        user_id: adminUserId,
        action: 'IMPORT_EXAMS',
        metadata: { success: results.success, failed: results.failed, filename: 'excel_upload' }
      });
    }

    return results;
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
};