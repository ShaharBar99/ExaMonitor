// src/handlers/courseHandlers.js

import * as coursesApiDefault from "../api/coursesApi";

/**
 * Fetch all courses
 */
export async function fetchCourses(filters = {}, deps = {}) {
  const coursesApi = deps.coursesApi || coursesApiDefault;

  const data = await coursesApi.listCourses(filters);
  const courses = data?.courses || [];
  console.log("fetchCourses: retrieved", courses.length, "courses");
  return { ok: true, data: { courses } };
}

/**
 * Create a new course
 */
export async function createNewCourse(courseData, deps = {}) {
  const coursesApi = deps.coursesApi || coursesApiDefault;

  // Validate required fields
  if (!courseData.course_name || !courseData.course_code) {
    throw new Error("course_name and course_code are required");
  }

  const data = await coursesApi.createCourse(courseData);
  return { ok: true, data };
}

/**
 * Update course details
 */
export async function updateCourseDetails(courseId, courseData, deps = {}) {
  const coursesApi = deps.coursesApi || coursesApiDefault;

  const data = await coursesApi.updateCourse(courseId, courseData);
  return { ok: true, data };
}

/**
 * Delete a course
 */
export async function deleteCourseHandler(courseId, deps = {}) {
  const coursesApi = deps.coursesApi || coursesApiDefault;

  const data = await coursesApi.deleteCourse(courseId);
  return { ok: true, data };
}

/**
 * Add single student to course
 */
export async function addStudentToCourseHandler(courseId, studentData, deps = {}) {
  const coursesApi = deps.coursesApi || coursesApiDefault;

  const data = await coursesApi.addStudentToCourse(courseId, studentData);
  return { ok: true, data };
}

/**
 * Bulk import students to course from Excel
 */
export async function importStudentsToCourse(courseId, formData, deps = {}) {
  const coursesApi = deps.coursesApi || coursesApiDefault;

  const data = await coursesApi.bulkAddStudentsToCourse(courseId, formData);
  return { ok: true, data };
}

/**
 * Get students in a course
 */
export async function fetchCourseStudents(courseId, deps = {}) {
  const coursesApi = deps.coursesApi || coursesApiDefault;

  const data = await coursesApi.getCourseStudents(courseId);
  const students = data?.students || [];
  return { ok: true, data: { students } };
}

/**
 * Remove student from course
 */
export async function removeStudentFromCourseHandler(courseId, studentId, deps = {}) {
  const coursesApi = deps.coursesApi || coursesApiDefault;

  const data = await coursesApi.removeStudentFromCourse(courseId, studentId);
  return { ok: true, data };
}

/**
 * Filter courses based on search/lecturer
 */
export function filterCourses(courses, filters = {}) {
  const list = Array.isArray(courses) ? courses : [];
  const q = String(filters.search || "").trim().toLowerCase();

  return list.filter((c) => {
    const name = String(c?.course_name || "").toLowerCase();
    const code = String(c?.course_code || "").toLowerCase();

    return !q || name.includes(q) || code.includes(q);
  });
}
/**
 * Import courses from Excel file
 */
export async function importCoursesFromExcel(formData, deps = {}) {
  console.log("courseHandlers: importCoursesFromExcel called");
  const coursesApi = deps.coursesApi || coursesApiDefault;

  const data = await coursesApi.importCourses(formData);
  return { ok: true, data };
}

/**
 * Get available students for a course (not yet enrolled)
 */
export async function fetchAvailableStudents(courseId, deps = {}) {
  const coursesApi = deps.coursesApi || coursesApiDefault;

  const data = await coursesApi.getAvailableStudents(courseId);
  const students = data?.students || [];
  return { ok: true, data: { students } };
}

/**
 * Get lecturers assigned to a course
 */
export async function fetchCourseLecturers(courseId, deps = {}) {
  const coursesApi = deps.coursesApi || coursesApiDefault;

  const data = await coursesApi.getCourseLecturers(courseId);
  const lecturers = data?.lecturers || [];
  return { ok: true, data: { lecturers } };
}

/**
 * Get available lecturers for a course (not yet assigned)
 */
export async function fetchAvailableLecturers(courseId, deps = {}) {
  const coursesApi = deps.coursesApi || coursesApiDefault;

  const data = await coursesApi.getAvailableLecturers(courseId);
  const lecturers = data?.lecturers || [];
  return { ok: true, data: { lecturers } };
}

/**
 * Add lecturer to course
 */
export async function addLecturerToCourseHandler(courseId, lecturerData, deps = {}) {
  const coursesApi = deps.coursesApi || coursesApiDefault;

  const data = await coursesApi.addLecturerToCourse(courseId, lecturerData);
  return { ok: true, data };
}

/**
 * Remove lecturer from course
 */
export async function removeLecturerFromCourseHandler(courseId, lecturerId, deps = {}) {
  const coursesApi = deps.coursesApi || coursesApiDefault;

  const data = await coursesApi.removeLecturerFromCourse(courseId, lecturerId);
  return { ok: true, data };
}
