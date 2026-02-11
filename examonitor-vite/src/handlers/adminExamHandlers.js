import { apiFetch } from "../api/http";

/**
 * Uploads an Excel file to import exams.
 * @param {FormData} formData - Contains the 'file' field
 * @returns {Promise<Object>} Result object { success, failed, errors:[], created:[] }
 */
export async function importExams(formData) {
    // Use apiFetch directly as 'post' helper does not exist
    // apiFetch handles FormData logic (detects instance and omits Content-Type header so browser sets boundary)
    return apiFetch('/admin/exams/import', {
        method: 'POST',
        body: formData
    });
}

/**
 * Fetches a list of exams with optional filtering.
 * @param {object} [filters={}] - Filter criteria (status, q).
 * @param {string} [filters.status] - Filter by exam status.
 * @param {string} [filters.q] - Search query.
 * @returns {Promise<Object>} The API response containing the list of exams.
 */
export async function fetchExams(filters = {}) {
    // Build query params
    const q = new URLSearchParams();
    if (filters.status) q.set("status", filters.status);
    if (filters.q) q.set("q", filters.q);

    // apiFetch handles token automatically via localStorage if not passed explicitly, or we can pass it
    return apiFetch(`/admin/exams?${q.toString()}`, { method: 'GET' });
}

/**
 * Creates a new exam.
 * @param {object} examData - The data for the new exam.
 * @returns {Promise<Object>} The created exam object.
 */
export async function createExam(examData) {
    return apiFetch('/admin/exams', {
        method: 'POST',
        body: examData
    });
}

/**
 * Deletes an exam by ID.
 * @param {string} examId - The ID of the exam to delete.
 * @returns {Promise<Object>} The result of the deletion.
 */
export async function deleteExam(examId) {
    return apiFetch(`/admin/exams/${examId}`, {
        method: 'DELETE'
    });
}

/**
 * Updates an existing exam.
 * @param {string} examId - The ID of the exam to update.
 * @param {object} examData - The updated exam data.
 * @returns {Promise<Object>} The updated exam object.
 */
export async function updateExam(examId, examData) {
    return apiFetch(`/admin/exams/${examId}`, {
        method: 'PATCH',
        body: examData
    });
}
