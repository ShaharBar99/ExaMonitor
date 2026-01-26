import React, { createContext, useContext, useState, useEffect } from 'react';
import { refresh as refreshApi } from '../../api/authApi';

const AuthContext = createContext({
    user: null,
    token: null,
    refreshToken: null,
    login: () => {},
    logout: () => {},
    setUser: () => {},
    setToken: () => {},
    setRefreshToken: () => {}
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')) || null; } catch { return null; }
    });
    const [token, setToken] = useState(() => localStorage.getItem('token') || sessionStorage.getItem('token') || null);
    const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken') || null);

    const login = (newUser, newToken, newRefreshToken) => {
        setUser(newUser);
        setToken(newToken);
        setRefreshToken(newRefreshToken);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setRefreshToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
    };

    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    }, [user]);

    useEffect(() => {
        if (!refreshToken) return;

        const interval = setInterval(async () => {
            try {
                const result = await refreshApi({ refreshToken });
                setToken(result.token);
                setRefreshToken(result.refreshToken);
                // Update storage
                if (localStorage.getItem('token')) {
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('refreshToken', result.refreshToken);
                } else {
                    sessionStorage.setItem('token', result.token);
                    sessionStorage.setItem('refreshToken', result.refreshToken);
                }
            } catch (error) {
                console.error('Token refresh failed:', error);
                // If refresh fails, logout
                logout();
            }
        }, 10 * 60 * 1000); // 10 minutes

        return () => clearInterval(interval);
    }, [refreshToken, logout]);

    return (
        <AuthContext.Provider value={{ user, token, refreshToken, login, logout, setUser, setToken, setRefreshToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;