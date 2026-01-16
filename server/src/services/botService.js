import { supabaseAdmin } from '../lib/supabaseClient.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

/**
 * פונקציית עזר לחישוב זמן נותר במבחן - כולל טיפול ב-Timezone
 */
const calculateExamTiming = (exam) => {
    if (!exam || !exam.original_start_time) return { remaining: 0, isOver: true, status: 'אין נתונים' };

    const startTime = new Date(exam.original_start_time);
    const totalDurationMinutes = Number(exam.original_duration || 0) + Number(exam.extra_time || 0);
    const endTime = new Date(startTime.getTime() + totalDurationMinutes * 60000);
    const now = new Date();

    const diffMs = endTime - now;
    const diffMinutes = Math.floor(diffMs / 60000);

    // טיפול במקרה של מספרים קיצוניים (כמו ה-10,000 שקיבלת)
    // אם ההפרש גדול מ-12 שעות, כנראה שהתאריך ב-DB אינו להיום
    const isReasonable = Math.abs(diffMinutes) < 720; 

    return {
        remaining: isReasonable ? diffMinutes : (diffMinutes > 0 ? "מעל 12 שעות" : "הסתיים מזמן"),
        isOver: diffMinutes <= 0,
        endTime: endTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        actualMinutes: diffMinutes
    };
};

/**
 * פונקציית הגיבוי החכמה - מנתחת את ה-DB ומחזירה תשובות ספציפיות ללא AI
 */
const getSmartResponse = async (message, role, examId, stats) => {
    const msg = message.toLowerCase();

    // אם יש לנו stats מהקליינט, נשתמש בהם מיד - זה הכי אמין
    if (stats) {
        if (msg.includes('סטטוס') || msg.includes('כמה') || msg.includes('מצב')) {
            return [
                `📊 *סיכום מצב (זמן אמת):*`,
                `🏠 סטודנטים בכיתה: ${stats.liveStats.present}`,
                `✅ סטודנטים סיימו: ${stats.liveStats.submitted}`,
                `🚶 סטודנטים בחוץ: ${stats.liveStats.out}`,
                `📈 אחוז הגשה: ${stats.liveStats.percentFinished}%`
            ].join('\n'); // מחבר את המערך לירידות שורה נקיות
        }

        if (msg.includes('שירותים') || msg.includes('בחוץ')) {
            return `🚶 כרגע יש ${stats.liveStats.out} סטודנטים מחוץ לכיתה.
    ${stats.liveStats.longestOutName ? `⏳ הכי הרבה זמן בחוץ: ${stats.liveStats.longestOutName}.` : ''}`;
        }
    }

    // אם אין stats, או ששואלים על זמן, נשאר עם הלוגיקה המקורית מה-DB
    try {
        const { data: exam } = await supabaseAdmin
            .from('exams')
            .select('*, courses:course_id(course_name)')
            .eq('id', examId)
            .single();

        const timing = calculateExamTiming(exam);

        if (msg.includes('זמן') || msg.includes('נותר') || msg.includes('שעה')) {
            if (timing.isOver) return "המבחן הסתיים רשמית.";
            return `למבחן ב${exam?.courses?.course_name || 'קורס'} נותרו עוד ${timing.remaining} דקות.`;
        }

        return "אני פועל במצב נתונים משולב. שאל אותי על 'סטטוס כיתה' או 'זמן נותר'.";

    } catch (error) {
        console.error('SmartResponse Error:', error);
        return "שגיאה בגישה לנתוני המבחן.";
    }
};

/**
 * פנייה ל-API של Gemini
 */
const callGeminiAPI = async (prompt) => {
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
        })
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error('Invalid AI response');
    
    return data.candidates[0].content.parts[0].text;
};

/**
 * בניית הפרומפט ל-AI עם הקשר מלא מה-DB
 */
const buildPrompt = async (message, role, examId) => {
    try {
        const { data: exam } = await supabaseAdmin
            .from('exams')
            .select('*, courses:course_id(course_name, course_code)')
            .eq('id', examId).single();

        const { data: attendance } = await supabaseAdmin
            .from('attendance')
            .select('status, student_breaks(exit_time, return_time)')
            .eq('classroom_id', examId);

        const timing = calculateExamTiming(exam);
        const outNow = attendance?.filter(a => a.student_breaks?.some(b => !b.return_time)).length || 0;

        return `אתה עוזר AI למשגיחי בחינות. ענה בעברית.
        הקשר מבחן:
        - קורס: ${exam?.courses?.course_name}
        - זמן נותר: ${timing.remaining} דקות.
        - סטודנטים בחוץ כעת: ${outNow}
        - סטטוס מבחן: ${exam?.status}
        
        שאלת המשגיח: ${message}`;
    } catch (e) {
        return `ענה כעוזר כללי (נתוני DB לא זמינים). שאלה: ${message}`;
    }
};

export const BotService = {
    async getReply(message, role, examId, stats) {
        try {
            // ניסיון ראשון: AI
            if (GEMINI_API_KEY) {
                const prompt = await buildPrompt(message, role, examId);
                return await callGeminiAPI(prompt);
            }
            // אם אין מפתח, עוברים לגיבוי
            return await getSmartResponse(message, role, examId, stats);
        } catch (error) {
            console.error('Falling back to SmartResponse due to:', error.message);
            return await getSmartResponse(message, role, examId, stats);
        }
    },

    /**
     * פונקציה לבדיקת התראות יזומות (זמן וחריגות)
     */
    async getProactiveAlerts(examId) {
        try {
            const { data: exam } = await supabaseAdmin.from('exams').select('*').eq('id', examId).single();
            const { data: attendance } = await supabaseAdmin.from('attendance').select('*, student_breaks(*)').eq('classroom_id', examId);
            
            const timing = calculateExamTiming(exam);
            const alerts = [];

            // התראות זמן
            if (timing.actualMinutes === 30) alerts.push("התראה: נותרו 30 דקות בדיוק לסיום המבחן.");
            if (timing.actualMinutes === 10) alerts.push("התראה דחופה: 10 דקות אחרונות!");

            // התראות שירותים
            const longBreaks = attendance?.filter(a => a.student_breaks?.some(b => !b.return_time && (new Date() - new Date(b.exit_time)) > 15 * 60000));
            if (longBreaks?.length > 0) alerts.push(`אזהרה: יש ${longBreaks.length} סטודנטים שחרגו מהזמן המותר בחוץ.`);

            return alerts;
        } catch (e) { return []; }
    },

    async getStatus() {
        return { online: true, ai_available: !!GEMINI_API_KEY, version: '2.5' };
    }
};