// ============================================
// QueueRoom – Host Dashboard Page
// ============================================
// The main control center for the Host:
//   - Display room code & QR code
//   - View pending suggestions (approve/reject)
//   - View approved queue
//   - Real-time updates via Socket.io
//   - Close room functionality
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, createRoom, pushToSpotifyQueue, closeRoom } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import QueueList from '@/components/QueueList';
import QRCode from '@/components/QRCode';

export default function HostDashboard() {
    const router = useRouter();

    // State
    const [user, setUser] = useState(null);
    const [room, setRoom] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [guestCount, setGuestCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState('');

    // Derived track lists
    const pendingTracks = tracks.filter((t) => t.status === 'pending');
    const approvedTracks = tracks.filter((t) => t.status === 'approved');

    // Show a temporary notification
    const showNotification = useCallback((msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(''), 3000);
    }, []);

    // Initialize: auth check + room creation + socket
    useEffect(() => {
        const init = async () => {
            try {
                // 1. Check authentication
                const userData = await getCurrentUser();
                setUser(userData.user);

                // 2. Create or get existing room
                const roomData = await createRoom();
                setRoom(roomData.room);

                // 3. Connect to Socket.io
                const socket = connectSocket();

                socket.on('connect', () => {
                    if (roomData?.room?.code) {
                        socket.emit('join-room', { roomCode: roomData.room.code });
                    }
                });

                socket.on('queue-update', ({ tracks: updatedTracks }) => {
                    setTracks(updatedTracks);
                });

                socket.on('guest-count', ({ count }) => {
                    setGuestCount(count);
                });

                socket.on('room-error', ({ message }) => {
                    setError(message);
                });

                setLoading(false);
            } catch (err) {
                console.error('Host init error:', err);
                // If not authenticated, redirect to login
                if (err.message.includes('Authentication') || err.message.includes('401')) {
                    router.push('/');
                    return;
                }
                setError(err.message);
                setLoading(false);
            }
        };

        init();

        return () => {
            disconnectSocket();
        };
    }, [router]);

    // Handle approving a track
    const handleApprove = useCallback(async (track) => {
        if (!room) return;
        try {
            const socket = connectSocket();

            // 1. Update status via Socket.io
            socket.emit('approve-track', {
                roomCode: room.code,
                trackId: track._id,
            });

            // 2. Push to Spotify queue via REST API
            await pushToSpotifyQueue(track.spotifyUri, room.code);

            showNotification(`✓ "${track.title}" added to Spotify queue!`);
        } catch (err) {
            setError(err.message);
        }
    }, [room, showNotification]);

    // Handle rejecting a track
    const handleReject = useCallback((track) => {
        if (!room) return;
        const socket = connectSocket();
        socket.emit('reject-track', {
            roomCode: room.code,
            trackId: track._id,
        });
        showNotification(`✕ "${track.title}" rejected`);
    }, [room, showNotification]);

    // Handle closing the room
    const handleCloseRoom = useCallback(async () => {
        if (!room) return;
        if (!window.confirm('Are you sure you want to close this room?')) return;

        try {
            await closeRoom(room.code);
            disconnectSocket();
            router.push('/');
        } catch (err) {
            setError(err.message);
        }
    }, [room, router]);

    // Loading state
    if (loading) {
        return (
            <main style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--gradient-hero)',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid var(--border-subtle)',
                        borderTopColor: 'var(--accent-primary)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 16px',
                    }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Setting up your room...</p>
                </div>
            </main>
        );
    }

    return (
        <main style={{
            minHeight: '100vh',
            background: 'var(--gradient-hero)',
            padding: '20px',
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {/* ---- Header ---- */}
                <header style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 0 24px',
                    borderBottom: '1px solid var(--border-subtle)',
                    marginBottom: '28px',
                    flexWrap: 'wrap',
                    gap: '12px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h1 style={{
                            fontSize: '1.6rem',
                            fontWeight: 800,
                            margin: 0,
                        }}>
                            <span style={{
                                background: 'var(--gradient-primary)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>Queue</span>Room
                        </h1>
                        <span className="badge badge-live" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}>
                            ● LIVE
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {user && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                            }}>
                                {user.profileImage && (
                                    <img
                                        src={user.profileImage}
                                        alt={user.displayName}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            border: '2px solid var(--accent-primary)',
                                        }}
                                    />
                                )}
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    {user.displayName}
                                </span>
                            </div>
                        )}
                        <button className="btn-danger" onClick={handleCloseRoom}>
                            Close Room
                        </button>
                    </div>
                </header>

                {/* ---- Notification Toast ---- */}
                {notification && (
                    <div className="animate-fade-in" style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        zIndex: 100,
                        background: 'rgba(29, 185, 84, 0.95)',
                        color: '#000',
                        padding: '14px 24px',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 600,
                        fontSize: '0.9rem',
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
                        padding: '14px 20px',
                        marginBottom: '20px',
                        color: '#ef4444',
                        fontSize: '0.9rem',
                    }}>
                        {error}
                        <button
                            onClick={() => setError('')}
                            style={{
                                float: 'right',
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                            }}
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* ---- Main Content Grid ---- */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '300px 1fr',
                    gap: '28px',
                    alignItems: 'start',
                }}>
                    {/* Left Sidebar – Room Info */}
                    <aside className="glass-card" style={{ padding: '28px', textAlign: 'center' }}>
                        {/* Room Code */}
                        <p style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontWeight: 600,
                            margin: '0 0 8px',
                        }}>
                            Room Code
                        </p>
                        <p style={{
                            fontSize: '2.5rem',
                            fontWeight: 900,
                            letterSpacing: '0.25em',
                            color: 'var(--accent-primary)',
                            margin: '0 0 24px',
                            textShadow: '0 0 20px rgba(29, 185, 84, 0.3)',
                        }}>
                            {room?.code}
                        </p>

                        {/* QR Code */}
                        {room?.code && <QRCode roomCode={room.code} size={160} />}

                        {/* Guest Count */}
                        <div style={{
                            marginTop: '24px',
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                        }}>
                            <p style={{
                                fontSize: '1.8rem',
                                fontWeight: 800,
                                color: 'var(--accent-blue)',
                                margin: '0',
                            }}>
                                {guestCount}
                            </p>
                            <p style={{
                                fontSize: '0.78rem',
                                color: 'var(--text-muted)',
                                margin: '4px 0 0',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}>
                                {guestCount === 1 ? 'Guest Connected' : 'Guests Connected'}
                            </p>
                        </div>
                    </aside>

                    {/* Right Content – Queues */}
                    <div>
                        {/* Pending Suggestions */}
                        <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
                            <QueueList
                                title="Pending Suggestions"
                                tracks={pendingTracks}
                                mode="host"
                                badgeType="pending"
                                onApprove={handleApprove}
                                onReject={handleReject}
                                emptyMessage="No pending suggestions. Share your room code to get started!"
                            />
                        </div>

                        {/* Approved Queue */}
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <QueueList
                                title="Approved Queue"
                                tracks={approvedTracks}
                                mode="host"
                                badgeType="approved"
                                emptyMessage="No approved tracks yet. Approve suggestions above!"
                            />
                        </div>
                    </div>
                </div>
            </div>

        </main>
    );
}
