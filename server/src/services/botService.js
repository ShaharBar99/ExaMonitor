import { supabaseAdmin } from '../lib/supabaseClient.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * פונקציה פנימית לשליפת נתונים קבועים מה-DB
 */
const getExamContext = async (examId) => {
    try {
        // שליפת נתוני המבחן והקורס
        const { data: exam } = await supabaseAdmin
            .from('exams')
            .select('*, courses:course_id(course_name, course_code)')
            .eq('id', examId)
            .single();

        // שליפת אירועים חריגים (כי הם לא תמיד נמצאים ב-liveStats של הפרונט)
        const { data: incidents } = await supabaseAdmin
            .from('exam_incidents')
            .select('*')
            .eq('exam_id', examId);

        return { 
            exam: exam || {}, 
            incidents: incidents || [] 
        };
    } catch (e) {
        console.error("Database Fetch Error:", e);
        return null;
    }
};

// New helper function to format stats when AI is unavailable
   const getStatsFallback = (stats) => {
        const present = stats?.present || 0;
        const out = stats?.out || 0;
        const submitted = stats?.submitted || 0;
        const longestOut = stats?.longestOutName;

        let summary = `🤖 (מענה אוטומטי): חלה שגיאה זמנית בחיבור ל-AI, אך הנה תמונת המצב הנוכחית:\n`;
        summary += `• ${present} סטודנטים נוכחים בכיתה.\n`;
        summary += `• ${out} סטודנטים נמצאים כרגע בחוץ.`;
        
        if (longestOut) {
            summary += ` (${longestOut} בחוץ הכי הרבה זמן).`;
        }
        
        summary += `\n• ${submitted} סטודנטים כבר הגישו את המבחן.`;

        return summary;
    }

/**
 * Service for handling AI bot interactions.
 */
export const BotService = {
    /**
     * Generates a reply from the AI bot.
     * @param {string} message - The user's message.
     * @param {string} role - The user's role.
     * @param {string} examId - The exam ID.
     * @param {object} currentStats - Current exam statistics.
     * @returns {Promise<string>} The bot's reply.
     */
    async getReply(message, role, examId, currentStats) {
        try {
            // 1. קבלת הקשר מה-DB
            const context = await getExamContext(examId);
            
            // 2. הכנת הנתונים החיים (עדיפות לנתונים מה-Frontend אם קיימים)
            const stats = currentStats?.liveStats || currentStats || {};
            
            // 3. בניית ה-Prompt הדינמי
            const prompt = `
                אתה עוזר AI חכם ונחמד למשגיח בבחינה.
                
                פרטי המבחן מהמערכת:
                - קורס: ${context?.exam?.courses?.course_name || 'לא ידוע'}
                - אירועים חריגים רשומים: ${context?.incidents?.length || 0}
                
                תמונת מצב חיה מהכיתה (זמן אמת):
                - נוכחים כרגע: ${stats.present || 0}
                - סטודנטים בחוץ: ${stats.out || 0}
                - הגישו את המבחן: ${stats.submitted || 0}
                - הכי הרבה זמן בחוץ: ${stats.longestOutName || 'אין כרגע'}

                שאלה מהמשגיח: "${message}"

                הנחיות לתשובה:
                - אם השאלה היא "מה המצב" או בקשת דוח, תן סיכום נחמד עם אימוג'ים.
                - אם השאלה ספציפית, ענה עליה ישירות ובקצרה.
                - ענה בעברית טבעית ומקצועית.
                - אל תעצור באמצע התשובה (יש לך עד 2048 tokens).
            `;

            // 4. פנייה ל-Gemini
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { 
                        temperature: 0.7, 
                        maxOutputTokens: 2048,
                        topP: 0.95
                    }
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            const botReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

            return botReply || "אני רואה את הנתונים, אבל מתקשה לנסח תשובה כרגע. איך עוד אוכל לעזור?";

        } catch (error) {
            console.error("BotService Critical Error:", error);
            return getStatsFallback(currentStats?.liveStats || {});
        }
    
    }
};