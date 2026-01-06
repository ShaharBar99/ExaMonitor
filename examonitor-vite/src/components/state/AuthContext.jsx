import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({
    user: null,
    token: null,
    login: () => {},
    logout: () => {},
    setUser: () => {},
    setToken: () => {}
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')) || null; } catch { return null; }
    });
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);

    useEffect(() => {
        if (user) localStorage.setItem('user', JSON.stringify(user));
        else localStorage.removeItem('user');
    }, [user]);

    useEffect(() => {
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
    }, [token]);

    const login = (newUser, newToken) => {
        setUser(newUser);
        setToken(newToken);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, setUser, setToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;