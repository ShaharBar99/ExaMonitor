import { studentsData, botMessages } from './data.js';
import { createStudentCard, createChatMessage } from './components.js';

/**
 * Application State
 */
let currentStudents = [...studentsData]; // Copy of data to allow mutation

/**
 * Core Logic Functions
 */
function renderApp() {
    renderStudents();
    updateStats();
}

function renderStudents() {
    const grid = document.getElementById('students-grid');
    grid.innerHTML = currentStudents.map(student => createStudentCard(student)).join('');
}

function renderChat() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML = botMessages.map(msg => createChatMessage(msg)).join('');
}

function updateStats() {
    const present = currentStudents.filter(s => s.status === 'present').length;
    const toilet = currentStudents.filter(s => s.status === 'toilet').length;
    const submitted = currentStudents.filter(s => s.status === 'submitted').length;

    document.getElementById('stat-present').innerText = present;
    document.getElementById('stat-toilet').innerText = toilet;
    document.getElementById('stat-submitted').innerText = submitted;
}

function handleStudentAction(studentId, newStatus) {
    const studentIndex = currentStudents.findIndex(s => s.id === parseInt(studentId));
    if (studentIndex !== -1) {
        currentStudents[studentIndex].status = newStatus;
        if (newStatus === 'toilet') {
            currentStudents[studentIndex].timeInStatus = "00:00";
        }
        renderApp(); // Re-render to show changes
    }
}

function startExamTimer() {
    let duration = 5399; // seconds
    const timerEl = document.getElementById('exam-timer');
    
    setInterval(() => {
        duration--;
        const h = Math.floor(duration / 3600);
        const m = Math.floor((duration % 3600) / 60);
        const s = duration % 60;
        timerEl.innerText = 
            `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, 1000);
}

/**
 * Event Listeners Setup
 * Using Event Delegation for better performance
 */
function setupEventListeners() {
    const grid = document.getElementById('students-grid');
    
    grid.addEventListener('click', (e) => {
        if (e.target.classList.contains('action-btn')) {
            const id = e.target.dataset.id;
            const action = e.target.dataset.action;
            handleStudentAction(id, action);
        }
    });
}

/**
 * Initialization
 */
document.addEventListener('DOMContentLoaded', () => {
    renderApp();
    renderChat();
    setupEventListeners();
    startExamTimer();
});