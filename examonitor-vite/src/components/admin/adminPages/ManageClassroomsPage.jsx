import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTheme } from "../../state/ThemeContext";
import { useAuth } from "../../state/AuthContext";
import CreateClassroomModal from "../adminComponents/CreateClassroomModal";
import { 
  fetchClassrooms, 
  deleteClassroomHandler, 
  filterClassrooms, 
  importClassroomsFromExcel,
  fetchExamsForAssignment 
} from "../../../handlers/classroomHandlers";

export default function ManageClassroomsPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();

  // --- States ---
  const [classrooms, setClassrooms] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [rowBusyId, setRowBusyId] = useState("");

  // Modal Visibility States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);

  const classroomsFileInputRef = useRef(null);

  const loadClassrooms = async () => {
    setLoading(true);
    try {
      const res = await fetchClassrooms({ search, exam_id: selectedExam }, {});
      if (res.ok) setClassrooms(res.data.classrooms || []);
    } catch (err) {
      console.error(err);
      alert("שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  };

  const loadExams = async () => {
    try {
      const res = await fetchExamsForAssignment({});
      if (res.ok) setExams(res.data.exams || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    loadClassrooms();
  }, [search, selectedExam, user]);

  const handleDeleteClassroom = async (classroomId) => {
    if (!window.confirm("בטוח שברצונך למחוק חדר זה?")) return;
    setRowBusyId(classroomId);
    try {
      await deleteClassroomHandler(classroomId);
      setClassrooms((prev) => prev.filter((c) => c.id !== classroomId));
    } catch (err) {
      alert("שגיאה: " + err.message);
    } finally {
      setRowBusyId("");
    }
  };

  const handleImportClassrooms = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await importClassroomsFromExcel(formData);
      
      // Check if response is successful
      const importedCount = res?.data?.imported || 0;
      const updatedCount = res?.data?.updated || 0;
      const failedCount = res?.data?.failed || 0;
      const totalProcessed = importedCount + updatedCount;
      
      if (totalProcessed > 0) {
        loadClassrooms();
        let msg = '';
        if (importedCount > 0 && updatedCount > 0) {
          msg = `יובאו ${importedCount} חדרים חדשים, עודכנו ${updatedCount}`;
        } else if (importedCount > 0) {
          msg = `יובאו ${importedCount} חדרים בהצלחה`;
        } else if (updatedCount > 0) {
          msg = `עדכנו ${updatedCount} חדרים בהצלחה`;
        }
        if (failedCount > 0) {
          msg += ` (${failedCount} נכשלו)`;
        }
        alert(msg);
      } else {
        const errorMsg = res?.data?.errors?.[0]?.error || 'לא היו חדרים לעיבוד';
        alert("שגיאה בייבוא: " + errorMsg);
      }
    } catch (err) {
      console.error("Import error:", err);
      alert("שגיאה בייבוא: " + err.message);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const filtered = useMemo(() => filterClassrooms(classrooms, { search, exam_id: selectedExam }), [classrooms, search, selectedExam]);

  // Dashboard Stats
  const totalClassrooms = classrooms.length;
  const assignedClassrooms = classrooms.filter(c => c.supervisor_id || c.floor_supervisor_id).length;
  const unassignedClassrooms = totalClassrooms - assignedClassrooms;

  const selectedExamData = exams.find(e => e.id === selectedExam);

  return (
    <div className={`min-h-screen pb-16 sm:pb-20 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">ניהול חדרי בחינה</h1>
            <p className="text-xs md:text-sm mt-1 opacity-70">יצירה וניהול של חדרי בחינה והשמת משגיחים</p>
          </div>
          <div className="flex flex-col gap-2 md:gap-3">
            <div className="flex items-center gap-2 md:gap-3">
              <input 
                type="file" 
                hidden 
                ref={classroomsFileInputRef} 
                onChange={handleImportClassrooms} 
                accept=".xlsx,.xls,.csv" 
              />
              <button
                onClick={() => classroomsFileInputRef.current?.click()}
                className={`flex-1 sm:flex-none px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold border transition-all active:scale-95 ${
                  isDark ? "bg-slate-800 border-white/10 text-green-400" : "bg-white border-green-200 text-green-600"
                }`}
              >
                📥 <span>ייבוא</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 sm:flex-none px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-black shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
              >
                + <span className="hidden sm:inline">חדר חדש</span><span className="sm:hidden">חדר</span>
              </button>
            </div>
            <div className="text-[10px] md:text-[11px] text-slate-500 overflow-x-auto whitespace-nowrap">
              פורמט Excel:
              <span className="font-mono ml-1">room | course_code | date | supervisor | floor_sup</span>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        {selectedExam && selectedExamData && (
          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
            <div className={`rounded-lg md:rounded-2xl p-3 md:p-6 ${isDark ? "bg-slate-800/40 border border-white/5" : "bg-blue-50 border border-blue-200"}`}>
              <div className="text-[10px] md:text-sm opacity-70 mb-1 md:mb-2">סה"כ חדרים</div>
              <div className="text-xl md:text-3xl font-black text-blue-600">{totalClassrooms}</div>
            </div>
            <div className={`rounded-lg md:rounded-2xl p-3 md:p-6 ${isDark ? "bg-slate-800/40 border border-white/5" : "bg-green-50 border border-green-200"}`}>
              <div className="text-[10px] md:text-sm opacity-70 mb-1 md:mb-2">משומים</div>
              <div className="text-xl md:text-3xl font-black text-green-600">{assignedClassrooms}</div>
            </div>
            <div className={`rounded-lg md:rounded-2xl p-3 md:p-6 ${isDark ? "bg-slate-800/40 border border-white/5" : "bg-orange-50 border border-orange-200"}`}>
              <div className="text-[10px] md:text-sm opacity-70 mb-1 md:mb-2">ללא שיבוץ</div>
              <div className="text-xl md:text-3xl font-black text-orange-600">{unassignedClassrooms}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 mb-4 md:mb-6">
          <div className="relative group">
            <span className="absolute inset-y-0 right-4 flex items-center text-slate-400 text-sm md:text-base">🔍</span>
            <input
              type="text"
              placeholder="חיפוש חדר..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pr-10 md:pr-12 pl-3 md:pl-4 py-2 md:py-3.5 rounded-lg md:rounded-2xl border outline-none transition-all focus:ring-2 focus:ring-blue-500/50 text-sm md:text-base ${
                isDark ? "bg-slate-800/50 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />
          </div>
          <select
            value={selectedExam}
            onChange={(e) => {
              setSelectedExam(e.target.value);
              setSearch("");
            }}
            className={`px-3 md:px-4 py-2 md:py-3.5 rounded-lg md:rounded-2xl border outline-none transition-all focus:ring-2 focus:ring-blue-500/50 text-sm md:text-base ${
              isDark ? "bg-slate-800/50 border-white/10 text-white" : "bg-white border-slate-200"
            }`}
          >
            <option value="">בחר בחינה...</option>
            {exams.map(exam => (
              <option key={exam.id} value={exam.id}>
                {exam.course_code} - {new Date(exam.date).toLocaleDateString('he-IL')}
              </option>
            ))}
          </select>
        </div>

        {/* Table/Cards Container */}
        <div className={`rounded-2xl border overflow-hidden ${isDark ? "border-white/5 bg-slate-900/40" : "border-slate-200 bg-white shadow-sm"}`}>
          {loading ? (
            <div className="p-8 text-center opacity-50">טוען...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center opacity-50">לא נמצאו חדרים</div>
          ) : (
            <>
              {/* Desktop Table View - Hidden on lg and below */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className={`${isDark ? "bg-slate-800" : "bg-slate-50"}`}>
                    <tr>
                      <th className="px-4 md:px-6 py-4 text-right text-xs md:text-sm font-bold">מספר חדר</th>
                      <th className="px-4 md:px-6 py-4 text-right text-xs md:text-sm font-bold">בחינה</th>
                      <th className="px-4 md:px-6 py-4 text-right text-xs md:text-sm font-bold">משגיח</th>
                      <th className="hidden md:table-cell px-4 md:px-6 py-4 text-right text-xs md:text-sm font-bold">משגיח קומה</th>
                      <th className="px-4 md:px-6 py-4 text-right text-xs md:text-sm font-bold">מצב</th>
                      <th className="px-4 md:px-6 py-4 text-right text-xs md:text-sm font-bold">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((classroom) => {
                      const examData = exams.find(e => e.id === classroom.exam_id);
                      const isAssigned = classroom.supervisor_id || classroom.floor_supervisor_id;
                      return (
                        <tr 
                          key={classroom.id}
                          className={`border-t ${isDark ? "border-white/5 hover:bg-slate-800/50" : "border-slate-200 hover:bg-slate-50"} transition-colors`}
                        >
                          <td className="px-4 md:px-6 py-3 md:py-4 font-bold text-sm md:text-base">{classroom.room_number}</td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                            {examData?.course_code} <br className="md:hidden" />
                            <span className="text-[10px] md:text-xs opacity-70">
                              {new Date(examData?.date).toLocaleDateString('he-IL')}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm max-w-25 truncate">
                            {classroom.supervisor_name || "-"}
                          </td>
                          <td className="hidden md:table-cell px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm max-w-25 truncate">
                            {classroom.floor_supervisor_name || "-"}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                            <span className={`inline-block px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold ${
                              isAssigned 
                                ? isDark ? "bg-green-500/10 text-green-400" : "bg-green-100 text-green-700"
                                : isDark ? "bg-orange-500/10 text-orange-400" : "bg-orange-100 text-orange-700"
                            }`}>
                              {isAssigned ? "משוים ✓" : "ללא"}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 flex items-center gap-3">
                            <button
                              onClick={() => setEditingClassroom(classroom)}
                              className="text-blue-600 hover:text-blue-800 font-bold text-xs md:text-sm"
                            >
                              ערוך
                            </button>
                            <button
                              onClick={() => handleDeleteClassroom(classroom.id)}
                              disabled={rowBusyId === classroom.id}
                              className="text-red-500 hover:text-red-700 font-bold text-xs md:text-sm disabled:opacity-50"
                            >
                              {rowBusyId === classroom.id ? "..." : "מחק"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View - Visible on lg and below */}
              <div className="lg:hidden space-y-3 p-4">
                {filtered.map((classroom) => {
                  const examData = exams.find(e => e.id === classroom.exam_id);
                  const isAssigned = classroom.supervisor_id || classroom.floor_supervisor_id;
                  return (
                    <div 
                      key={classroom.id}
                      className={`rounded-xl p-4 border${isDark ? " bg-slate-800/50 border-white/5" : " bg-slate-50 border-slate-200"}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="font-black text-lg mb-1">{classroom.room_number}</div>
                          <div className="text-xs opacity-70">
                            {examData?.course_code} • {new Date(examData?.date).toLocaleDateString('he-IL')}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ml-2 ${
                          isAssigned 
                            ? isDark ? "bg-green-500/10 text-green-400" : "bg-green-100 text-green-700"
                            : isDark ? "bg-orange-500/10 text-orange-400" : "bg-orange-100 text-orange-700"
                        }`}>
                          {isAssigned ? "משוים ✓" : "ללא"}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm mb-3">
                        <div className="flex justify-between">
                          <span className="opacity-70">משגיח:</span>
                          <span className="font-bold">{classroom.supervisor_name || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="opacity-70">משגיח קומה:</span>
                          <span className="font-bold">{classroom.floor_supervisor_name || "-"}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setEditingClassroom(classroom)}
                          className="flex-1 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-600 font-bold text-xs hover:bg-blue-500/20 transition-all"
                        >
                          ערוך
                        </button>
                        <button
                          onClick={() => handleDeleteClassroom(classroom.id)}
                          disabled={rowBusyId === classroom.id}
                          className="flex-1 px-3 py-2 rounded-lg bg-red-500/10 text-red-600 font-bold text-xs hover:bg-red-500/20 transition-all disabled:opacity-50"
                        >
                          {rowBusyId === classroom.id ? "מוחק..." : "מחק"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Info Box */}
        <div className={`mt-4 md:mt-6 p-3 md:p-4 rounded-lg md:rounded-2xl text-xs md:text-sm ${isDark ? "bg-slate-800/40 border border-white/5" : "bg-blue-50 border border-blue-200"}`}>
          <p className="font-bold mb-2 text-sm md:text-base">💡 טיפים:</p>
          <ul className="space-y-1 text-[11px] md:text-xs opacity-75">
            <li>• בחר בחינה מהרשימה כדי להציג את חדריה</li>
            <li>• ניתן לייבא חדרים מרובים מקובץ Excel</li>
            <li>• חדרים יישמרו עם המשגיחים וקודי הבחינות שלהם</li>
            <li>• ניתן למחוק כל חדר שאינך זקוק לו</li>
          </ul>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateClassroomModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadClassrooms();
          }}
          isDark={isDark}
        />
      )}

      {editingClassroom && (
        <CreateClassroomModal
          onClose={() => setEditingClassroom(null)}
          onSuccess={() => {
            setEditingClassroom(null);
            loadClassrooms();
          }}
          isDark={isDark}
          initialData={editingClassroom}
        />
      )}
    </div>
  );
}
