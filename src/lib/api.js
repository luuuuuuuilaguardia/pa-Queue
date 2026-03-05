// ============================================
// QueueRoom – API Client
// ============================================
// Fetch wrapper for communicating with the Express backend.
// All API calls go through this module.
// ============================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Generic fetch wrapper with error handling.
 * @param {string} endpoint - API endpoint (e.g., '/rooms/ABC12')
 * @param {Object} options - Fetch options
 * @returns {Object} Parsed JSON response
 */
const apiFetch = async (endpoint, options = {}) => {
    const url = `${API_URL}${endpoint}`;

    const config = {
        credentials: 'include',  // Send cookies for session auth
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }

    return data;
};

// ---- Auth Endpoints ----

/** Get the Spotify login URL (redirect) */
export const getSpotifyLoginUrl = () => `${API_URL}/auth/spotify`;

/** Get current authenticated user */
export const getCurrentUser = () => apiFetch('/auth/me');

/** Logout */
export const logout = () => apiFetch('/auth/logout', { method: 'POST' });

// ---- Room Endpoints ----

/** Create a new room */
export const createRoom = (settings = {}) =>
    apiFetch('/rooms', {
        method: 'POST',
        body: JSON.stringify({ settings }),
    });

/** Get room details by code */
export const getRoomByCode = (code) => apiFetch(`/rooms/${code}`);

/** Get room tracks grouped by status */
export const getRoomTracks = (code) => apiFetch(`/rooms/${code}/tracks`);

/** Close a room */
export const closeRoom = (code) =>
    apiFetch(`/rooms/${code}/close`, { method: 'PATCH' });

// ---- Spotify Endpoints ----

/** Search for tracks */
export const searchTracks = (query, roomCode) =>
    apiFetch(`/spotify/search?q=${encodeURIComponent(query)}&roomCode=${roomCode}`);

/** Push a track to Spotify queue */
export const pushToSpotifyQueue = (trackUri, roomCode) =>
    apiFetch('/spotify/queue', {
        method: 'POST',
        body: JSON.stringify({ trackUri, roomCode }),
    });

/** Get the currently playing track on the host's Spotify */
export const getNowPlaying = (roomCode) =>
    apiFetch(`/spotify/now-playing?roomCode=${roomCode}`);

export default apiFetch;
