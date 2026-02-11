import React from 'react';


export default function CourseLecturersTab({ lecturers, examLecturerIds, isDark, isLoading = false, onAddLecturer, onRemoveLecturer, currentUserId }) {
    lecturers = lecturers || [];
    const examLecturerIdSet = new Set(examLecturerIds || []);

    const rows = lecturers.map((lec) => {
        const id = lec.id || lec.lecturer_id; // just in case
        const isAssigned = examLecturerIdSet.has(id);

        return {
            id,
            name: lec.full_name || lec.name || '---',
            email: lec.email || '---',
            isAssigned,
            isSelf: id === currentUserId,
        };
    });


    return (
        <div className={`rounded-[30px] md:rounded-[50px] p-6 md:p-12 shadow-2xl overflow-hidden text-right animate-in fade-in duration-500 transition-colors ${isDark ? 'bg-slate-900 shadow-none border border-slate-800' : 'bg-white shadow-2xl shadow-slate-200/50'
            }`}>
            <h2 className={`text-xl md:text-2xl font-black mb-6 md:mb-8 uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-800'
                }`}>
                {'מרצים בקורס'}

            </h2>

            {/* Table for Tablet/Desktop */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className={`border-b text-[10x] md:text-xs uppercase tracking-wider transition-colors ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
                            }`}>
                            <th className="py-4 px-4 font-black">מרצה</th>
                            <th className="py-4 px-4 font-black">אימייל</th>
                            <th className="py-4 px-4 font-black">משויך לבחינה</th>
                            <th className="py-4 px-4 font-black">פעולה</th>
                        </tr>
                    </thead>



                    <tbody className={`divide-y transition-colors ${isDark ? 'divide-slate-800' : 'divide-slate-50'}`}>
                        {isLoading ? (
                            <tr>
                                <td colSpan="4" className={`py-8 text-center font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    טוען מרצים...
                                </td>
                            </tr>
                        ) : rows.length > 0 ? rows.map((row) => (
                            <tr key={row.id} className={`group transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                                <td className={`py-4 px-4 font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{row.name}</td>
                                <td className={`py-4 px-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{row.email}</td>

                                <td className="py-4 px-4">
                                    <span className={`px-3 py-1.5 rounded-lg text-sm font-extrabold uppercase ${row.isAssigned
                                            ? (isDark
                                                ? 'bg-emerald-400/20 text-emerald-300'
                                                : 'bg-emerald-100 text-emerald-800')
                                            : (isDark
                                                ? 'bg-rose-500/20 text-rose-300'
                                                : 'bg-rose-100 text-rose-800')
                                        }`}>

                                        {row.isAssigned ? 'כן' : 'לא'}
                                    </span>
                                </td>

                                <td className="py-4 px-4">
                                    {!row.isAssigned ? (
                                        <button
                                            onClick={() => { onAddLecturer?.(row.id); }}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-[12px] uppercase tracking-widest
                                    hover:bg-indigo-500 active:scale-95 transition-all"
                                        >
                                            הוסף מרצה מחליף
                                        </button>
                                    ) : row.isSelf ? (
                                        <span className={`${isDark ? 'text-slate-300' : 'text-slate-500'} text-sm font-extrabold uppercase`}>
                                            אתה
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => { onRemoveLecturer?.(row.id); }}
                                            className="bg-rose-600 text-white px-4 py-2 rounded-xl font-black text-[12px] uppercase tracking-widest
                                    hover:bg-rose-500 active:scale-95 transition-all"
                                        >
                                            הסר מבחינה
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className={`py-8 text-center font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    אין מרצים רשומים כעת
                                </td>
                            </tr>
                        )
                        }
                    </tbody>
                </table>
            </div>




            {/* Stacked Cards for Mobile */}
            <div className="md:hidden space-y-4">
                {isLoading ? (
                    <div className={`py-12 text-center text-xs font-black uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        טוען מרצים...
                    </div>
                ) : rows.length > 0 ? rows.map((row) => (
                    <div key={row.id} className={`p-5 rounded-2xl border transition-all ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-100'
                        }`}>
                        <div className={`text-sm font-black mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {row.name}
                        </div>

                        <div className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {row.email}
                        </div>

                        <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${row.isAssigned
                                    ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700')
                                    : (isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600')
                                }`}>
                                {row.isAssigned ? 'משויך לבחינה' : 'לא משויך'}
                            </span>

                            {!row.isAssigned ? (
                                <button
                                    onClick={() => onAddLecturer?.(row.id)}
                                    className="bg-indigo-600 text-white px-3 py-2 rounded-xl font-black text-[9px] uppercase
                                hover:bg-indigo-500 active:scale-95 transition-all"
                                >
                                    הוסף מרצה מחליף
                                </button>
                            ) : !row.isSelf && (
                                <button
                                    onClick={() => onRemoveLecturer?.(row.id)}
                                    className="bg-rose-600 text-white px-3 py-2 rounded-xl font-black text-[9px] uppercase
                                hover:bg-rose-500 active:scale-95 transition-all"
                                >
                                    הסר מבחינה
                                </button>
                            )}
                        </div>
                    </div>
                )) : (
                    <div className={`py-12 text-center text-xs font-black uppercase ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        אין מרצים רשומים כעת
                    </div>
                )}
            </div>

        </div>
    );
}