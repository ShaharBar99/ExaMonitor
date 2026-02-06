import { apiFetch } from "../api/http";

/**
 * Uploads an Excel file to import exams.
 * @param {FormData} formData - Contains the 'file' field
 * @returns {Promise<Object>} { success, failed, errors:[], created:[] }
 */
export async function importExams(formData) {
    // Use apiFetch directly as 'post' helper does not exist
    // apiFetch handles FormData logic (detects instance and omits Content-Type header so browser sets boundary)
    return apiFetch('/admin/exams/import', {
        method: 'POST',
        body: formData
    });
}

export async function fetchExams(filters = {}) {
    // Build query params
    const q = new URLSearchParams();
    if (filters.status) q.set("status", filters.status);
    if (filters.q) q.set("q", filters.q);

    // apiFetch handles token automatically via localStorage if not passed explicitly, or we can pass it
    return apiFetch(`/admin/exams?${q.toString()}`, { method: 'GET' });
}

export async function createExam(examData) {
    return apiFetch('/admin/exams', {
        method: 'POST',
        body: examData
    });
}

export async function deleteExam(examId) {
    return apiFetch(`/admin/exams/${examId}`, {
        method: 'DELETE'
    });
}
