// src/mocks/coursesMock.js

export function listMockCourses() {
  return [
    {
      id: "course-1",
      course_name: "Mathematics 101",
      course_code: "MATH101",
      lecturer_id: "lecturer-1",
      lecturer_name: "Dr. David Smith",
      lecturer_email: "david.smith@university.edu",
      student_count: 25,
      created_at: "2026-01-15T10:00:00Z",
    },
    {
      id: "course-2",
      course_name: "Physics 201",
      course_code: "PHYS201",
      lecturer_id: "lecturer-2",
      lecturer_name: "Prof. Rachel Johnson",
      lecturer_email: "rachel.johnson@university.edu",
      student_count: 18,
      created_at: "2026-01-16T11:00:00Z",
    },
    {
      id: "course-3",
      course_name: "Introduction to Programming",
      course_code: "CS101",
      lecturer_id: "lecturer-3",
      lecturer_name: "Dr. Michael Chen",
      lecturer_email: "michael.chen@university.edu",
      student_count: 32,
      created_at: "2026-01-17T12:00:00Z",
    },
  ];
}

export function listMockCourseStudents(courseId) {
  const studentsByCourse = {
    "course-1": [
      {
        id: "student-1",
        full_name: "John Doe",
        email: "john.doe@university.edu",
        student_id: "12345",
        registration_id: "reg-1",
      },
      {
        id: "student-2",
        full_name: "Jane Smith",
        email: "jane.smith@university.edu",
        student_id: "12346",
        registration_id: "reg-2",
      },
      {
        id: "student-3",
        full_name: "Bob Johnson",
        email: "bob.johnson@university.edu",
        student_id: "12347",
        registration_id: "reg-3",
      },
    ],
    "course-2": [
      {
        id: "student-4",
        full_name: "Alice Williams",
        email: "alice.williams@university.edu",
        student_id: "12348",
        registration_id: "reg-4",
      },
      {
        id: "student-5",
        full_name: "Charlie Brown",
        email: "charlie.brown@university.edu",
        student_id: "12349",
        registration_id: "reg-5",
      },
    ],
    "course-3": [
      {
        id: "student-6",
        full_name: "Diana Prince",
        email: "diana.prince@university.edu",
        student_id: "12350",
        registration_id: "reg-6",
      },
    ],
  };

  return studentsByCourse[courseId] || [];
}

export function createMockCourse(courseData) {
  return {
    ok: true,
    course: {
      id: `course-${Date.now()}`,
      course_name: courseData.course_name,
      course_code: courseData.course_code,
      lecturer_id: courseData.lecturer_id || null,
      lecturer_name: "Mock Lecturer",
      student_count: 0,
      created_at: new Date().toISOString(),
    },
  };
}

export function deleteMockCourse(courseId) {
  return {
    id: courseId,
    deleted: true,
  };
}

export function addMockStudentToCourse(courseId, studentData) {
  return {
    ok: true,
    registration: {
      id: `reg-${Date.now()}`,
      student_id: studentData.student_id,
      student_name: "Mock Student",
    },
  };
}

export function bulkImportMockStudents(courseId, count = 5) {
  return {
    imported: count,
    failed: 0,
    skipped: 0,
    errors: [],
  };
}

export function removeMockStudent(courseId, studentId) {
  return {
    deleted: true,
  };
}
