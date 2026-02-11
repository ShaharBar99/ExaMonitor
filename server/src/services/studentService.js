// server/src/services/studentService.js

import { supabaseAdmin } from "../lib/supabaseClient.js";

/**
 * Retrieves exams for a specific student based on their course registrations.
 * @param {string} studentId - The ID of the student.
 * @returns {Promise<Array>} A list of exams the student is registered for.
 */
async function getStudentExamsByStudentId(studentId) {
  const { data, error } = await supabaseAdmin
    .from("course_registrations")
    .select(`
      id,
      course_id,
      courses (
        id,
        course_name,
        course_code,
        exams (
          id,
          original_start_time,
          original_duration,
          extra_time,
          status
        )
      )
    `)
    .eq("student_id", studentId);

  if (error) {
    throw new Error(error.message);
  }

  const flattened = [];

  for (const reg of data || []) {
    const course = reg.courses;
    const exams = course?.exams || [];
    for (const exam of exams) {
      flattened.push({
        registration_id: reg.id,
        course_id: course?.id,
        course_name: course?.course_name,
        course_code: course?.course_code,
        exam_id: exam?.id,
        original_start_time: exam?.original_start_time,
        original_duration: exam?.original_duration,
        extra_time: exam?.extra_time,
        status: exam?.status,
      });
    }
  }

  return flattened;
}

/**
 * Service for student-related operations.
 */
export const studentService = { getStudentExamsByStudentId };
