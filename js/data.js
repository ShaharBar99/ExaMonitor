/**
 * Fake Data Service
 * Simulates API responses for the exam monitoring system.
 */

export const studentsData = [
    { id: 101, name: "דניאל כהן", image: "DC", status: "present", timeInStatus: "01:00" },
    { id: 102, name: "מיכל לוי", image: "ML", status: "toilet", timeInStatus: "00:04" },
    { id: 103, name: "אבי דוידוב", image: "AD", status: "present", timeInStatus: "01:00" },
    { id: 104, name: "שרה אברהם", image: "SA", status: "submitted", timeInStatus: "00:00" },
    { id: 105, name: "יוסי מזרחי", image: "YM", status: "present", timeInStatus: "01:00" },
    { id: 106, name: "נועה גולן", image: "NG", status: "present", timeInStatus: "01:00" },
    { id: 107, name: "רון שחר", image: "RS", status: "toilet", timeInStatus: "00:12" }, 
    { id: 108, name: "גלית יצחק", image: "GY", status: "present", timeInStatus: "01:00" },
];

export const botMessages = [
    { sender: "bot", text: "שלום ישראל, הבחינה החלה בשעה 09:00. בהצלחה!", time: "09:00", alert: false },
    { sender: "bot", text: "שים לב: רון שחר נמצא בשירותים מעל 10 דקות.", time: "09:45", alert: true },
];