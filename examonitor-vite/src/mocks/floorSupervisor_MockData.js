export const AVAILABLE_SUPERVISORS = [
  { id: 1, name: "ישראל ישראלי" },
  { id: 2, name: "שרה כהן" },
  { id: 3, name: "אבי לוי" }
];

export const INITIAL_ROOMS = [
  { 
    id: "302", 
    examName: "מבוא למדעי המחשב", 
    status: "active", 
    studentsCount: 25, 
    submittedCount: 5, 
    supervisor: "ישראל ישראלי" 
  },
  { 
    id: "401", 
    examName: "מבוא למדעי המחשב", 
    status: "warning", 
    studentsCount: 20, 
    submittedCount: 2, 
    supervisor: "שרה כהן" 
  },
  { 
    id: "105", 
    examName: "מתמטיקה בדידה", 
    status: "active", 
    studentsCount: 15, 
    submittedCount: 10, 
    supervisor: "אבי לוי" 
  }
];