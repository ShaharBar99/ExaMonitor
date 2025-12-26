export const authHandlers = {
    handleLogin: async (loginData, navigate) => {
        console.log("משתמש מנסה להתחבר כ:", loginData.role);
        
        // כאן בעתיד תהיה בדיקת סיסמה מול השרת
        
        if (loginData.role === "invigilator" || loginData.role === "lecturer") {
            // שים לב: הכתובת חייבת להיות זהה ל-Route
            navigate("/exam/select"); 
        } else if (loginData.role === "admin") {
            navigate("/admin/users");
        } else {
            navigate("/login"); // או דף סטודנט
        }
    }
};