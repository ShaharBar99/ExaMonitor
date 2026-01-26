import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    // 1. Remove the transports restriction to allow standard handshake
    const socket = useMemo(() => io(API_BASE, {
        withCredentials: true,
        autoConnect: true,
        // Using both ensures better stability on localhost
        transports: ['polling', 'websocket'] 
    }), [API_BASE]);

    useEffect(() => {
        socket.on('connect', () => {
            console.log('✅ Connected to Chat Server:', socket.id);
        });

        socket.on('connect_error', (err) => {
            console.error('❌ Connection Error:', err.message);
        });

        return () => {
            // Only disconnect if the component is truly being destroyed, 
            // not just re-rendered. 
            // In a global provider, we often don't even need to disconnect.
            if (process.env.NODE_ENV === 'production') {
                socket.disconnect();
            }
        };
    }, [socket]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};