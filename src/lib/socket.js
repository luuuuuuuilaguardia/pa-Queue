// ============================================
// QueueRoom – Socket.io Client Singleton
// ============================================
// Creates a single Socket.io connection to the backend.
// Reuses the same instance across all components.
// ============================================

import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket = null;

/**
 * Get the Socket.io client instance.
 * Creates a new connection if one doesn't exist.
 * @returns {Socket} Socket.io client instance
 */
export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            autoConnect: false,
            transports: ['websocket', 'polling'],
        });
    }
    return socket;
};

/**
 * Connect to the Socket.io server.
 */
export const connectSocket = () => {
    const s = getSocket();
    if (!s.connected) {
        s.connect();
    }
    return s;
};

/**
 * Disconnect from the Socket.io server.
 */
export const disconnectSocket = () => {
    if (socket && socket.connected) {
        socket.disconnect();
    }
};

export default getSocket;
