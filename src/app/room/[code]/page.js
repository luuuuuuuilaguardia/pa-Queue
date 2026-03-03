// ============================================
// QueueRoom – Guest Room View
// ============================================
// Mobile-first page for guests:
//   - Search for songs via Spotify
//   - Add suggestions to the room queue
//   - View pending & approved tracks
//   - Upvote pending suggestions
//   - Real-time updates via Socket.io
// ============================================

'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { searchTracks as apiSearchTracks } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import SearchBar from '@/components/SearchBar';
import TrackCard from '@/components/TrackCard';
import QueueList from '@/components/QueueList';

export default function GuestRoomPage({ params }) {
    const { code } = use(params);
    const router = useRouter();
    const roomCode = code.toUpperCase();

    // State
    const [connected, setConnected] = useState(false);
    const [roomJoined, setRoomJoined] = useState(false); // true only after successful room join
    const [roomNotFound, setRoomNotFound] = useState(false);
    const [tracks, setTracks] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [guestCount, setGuestCount] = useState(0);
    const [error, setError] = useState('');
    const [guestId] = useState(() => `guest_${Math.random().toString(36).substring(2, 10)}`);
    const [votedTrackIds, setVotedTrackIds] = useState([]);
    const [roomName, setRoomName] = useState('');
    const [notification, setNotification] = useState('');

    // Derived track lists
    const pendingTracks = tracks.filter((t) => t.status === 'pending');
    const approvedTracks = tracks.filter((t) => t.status === 'approved');

    // Connect to room via Socket.io
    useEffect(() => {
        const socket = connectSocket();

        socket.on('connect', () => {
            socket.emit('join-room', { roomCode });
            setConnected(true);
        });

        socket.on('queue-update', ({ tracks: updatedTracks }) => {
            setTracks(updatedTracks);
            setRoomJoined(true); // first queue-update confirms room join succeeded
        });

        socket.on('guest-count', ({ count }) => {
            setGuestCount(count);
        });

        socket.on('room-error', ({ message }) => {
            setError(message);
            setRoomJoined(false);
            if (message === 'Room not found or inactive.') {
                setRoomNotFound(true);
            }
        });

        socket.on('disconnect', () => {
            setConnected(false);
            setRoomJoined(false);
        });

        return () => {
            disconnectSocket();
        };
    }, [roomCode]);

    // Search for tracks
    const handleSearch = useCallback(async (query) => {
        try {
            setSearching(true);
            setError('');
            const data = await apiSearchTracks(query, roomCode);
            setSearchResults(data.tracks || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setSearching(false);
        }
    }, [roomCode]);

    // Suggest a track
    const handleAddTrack = useCallback((track) => {
        const socket = connectSocket();
        socket.emit('suggest-track', {
            roomCode,
            track,
            guestId,
        });
        setNotification(`"${track.title}" suggested!`);
        setTimeout(() => setNotification(''), 2500);
        // Remove from search results to avoid double-add
        setSearchResults((prev) => prev.filter((t) => t.spotifyTrackId !== track.spotifyTrackId));
    }, [roomCode, guestId]);

    // Upvote a track
    const handleVote = useCallback((trackId) => {
        const socket = connectSocket();
        socket.emit('vote-track', {
            roomCode,
            trackId,
            guestId,
        });
        setVotedTrackIds((prev) => [...prev, trackId]);
    }, [roomCode, guestId]);

    return (
        <main style={{
            minHeight: '100vh',
            background: 'var(--gradient-hero)',
            padding: '16px',
            paddingBottom: '40px',
        }}>
            <div style={{ maxWidth: '560px', margin: '0 auto' }}>
                {/* ---- Header ---- */}
                <header style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0 20px',
                    borderBottom: '1px solid var(--border-subtle)',
                    marginBottom: '20px',
                }}>
                    <div>
                        <h1 style={{
                            fontSize: '1.3rem',
                            fontWeight: 800,
                            margin: 0,
                        }}>
                            <span style={{
                                background: 'var(--gradient-primary)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>Queue</span>Room
                        </h1>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '4px',
                        }}>
                            <span style={{
                                fontSize: '0.82rem',
                                color: 'var(--text-muted)',
                            }}>
                                Room:
                            </span>
                            <span style={{
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                letterSpacing: '0.15em',
                                color: 'var(--accent-primary)',
                            }}>
                                {roomCode}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Connection status */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.78rem',
                            color: roomJoined
                                ? 'var(--accent-primary)'
                                : roomNotFound
                                ? '#ef4444'
                                : 'var(--text-muted)',
                        }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: roomJoined
                                    ? 'var(--accent-primary)'
                                    : roomNotFound
                                    ? '#ef4444'
                                    : 'var(--text-muted)',
                                display: 'inline-block',
                            }} />
                            {roomJoined ? 'In Room' : roomNotFound ? 'Not Found' : 'Connecting...'}
                        </div>

                        <span style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                            padding: '4px 10px',
                            background: 'var(--bg-glass)',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid var(--border-subtle)',
                        }}>
                            {guestCount}
                        </span>
                    </div>
                </header>

                {/* ---- Notification Toast ---- */}
                {notification && (
                    <div className="animate-fade-in" style={{
                        position: 'fixed',
                        top: '16px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 100,
                        background: 'rgba(29, 185, 84, 0.95)',
                        color: '#000',
                        padding: '12px 22px',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        boxShadow: '0 8px 30px rgba(29, 185, 84, 0.3)',
                    }}>
                        {notification}
                    </div>
                )}

                {/* ---- Error Message ---- */}
                {error && (
                    <div className="animate-fade-in" style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 16px',
                        marginBottom: '16px',
                        color: '#ef4444',
                        fontSize: '0.85rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        {error}
                        <button
                            onClick={() => setError('')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                padding: '0 0 0 12px',
                            }}
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* ---- Search Section ---- */}
                <section className="glass-card" style={{
                    padding: '20px',
                    marginBottom: '16px',
                }}>
                    <h2 style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        margin: '0 0 14px',
                        color: 'var(--text-primary)',
                    }}>
                        Search & Suggest
                    </h2>

                    <SearchBar onSearch={handleSearch} isLoading={searching} disabled={roomNotFound} />

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div style={{
                            marginTop: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                        }}>
                            <p style={{
                                fontSize: '0.78rem',
                                color: 'var(--text-muted)',
                                margin: '0 0 8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}>
                                Results ({searchResults.length})
                            </p>
                            {searchResults.map((track) => (
                                <TrackCard
                                    key={track.spotifyTrackId}
                                    track={track}
                                    mode="search"
                                    onAdd={handleAddTrack}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* ---- Current Queue ---- */}
                <section className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
                    <QueueList
                        title="Pending Suggestions"
                        tracks={pendingTracks}
                        mode="guest"
                        badgeType="pending"
                        onVote={handleVote}
                        votedTrackIds={votedTrackIds}
                        emptyMessage="No suggestions yet. Be the first!"
                    />
                </section>

                <section className="glass-card" style={{ padding: '20px' }}>
                    <QueueList
                        title="Up Next"
                        tracks={approvedTracks}
                        mode="guest"
                        badgeType="approved"
                        emptyMessage="No tracks approved yet."
                    />
                </section>

                {/* ---- Back Link ---- */}
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <button
                        onClick={() => router.push('/')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            textDecoration: 'underline',
                        }}
                    >
                        ← Leave Room
                    </button>
                </div>
            </div>
        </main>
    );
}
