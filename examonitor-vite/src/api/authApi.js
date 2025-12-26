export const authApi = {
    login: async (credentials) => {
        // סימולציה של קריאת API
        console.log("Calling API with:", credentials);
        return new Promise((resolve) => {
            setTimeout(() => resolve({ 
                success: true, 
                user: { name: "ישראל ישראלי", role: credentials.role } 
            }), 1000);
        });
    }
};