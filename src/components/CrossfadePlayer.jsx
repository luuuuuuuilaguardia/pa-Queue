'use client';
// ============================================================
// CrossfadePlayer – Spotify Web Playback SDK + DJ Crossfade
// ============================================================
// Embeds a "QueueRoom DJ 🎧" Spotify Connect device in the
// host's browser tab.  When the current song is almost over
// it fades the volume to 0, advances to the next queued track,
// then fades back up – just like a DJ crossfade.
//
// Props
//   approvedTracks   – array of tracks in the host's queue
//   onMarkPlayed     – fn(track) called when a track finishes
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSpotifyAccessToken } from '@/lib/api';

// How many steps in a volume fade (smoother = more steps)
const FADE_STEPS = 30;

// Minimum time remaining (ms) that triggers the crossfade countdown
const TRIGGER_BUFFER_MS = 500; // small buffer so we don't fire twice

export default function CrossfadePlayer({ approvedTracks = [], onMarkPlayed }) {
    const [status, setStatus] = useState('loading'); // loading | ready | playing | paused | error
    const [deviceId, setDeviceId] = useState(null);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [progress, setProgress] = useState(0);          // 0-1
    const [duration, setDuration] = useState(0);
    const [crossfadeMs, setCrossfadeMs] = useState(6000); // 3 / 6 / 10 s
    const [isCrossfading, setIsCrossfading] = useState(false);
    const [volume, setVolume] = useState(1);
    const [transferred, setTransferred] = useState(false);

    const playerRef = useRef(null);
    const crossfadingRef = useRef(false);   // ref so interval callbacks see latest value
    const stateRef = useRef(null);          // latest SDK state
    const approvedRef = useRef(approvedTracks);
    approvedRef.current = approvedTracks;   // keep ref in sync without re-registering effects
    const onMarkPlayedRef = useRef(onMarkPlayed);
    onMarkPlayedRef.current = onMarkPlayed;

    // ------------------------------------------------------------------
    // Load Spotify Web Playback SDK once
    // ------------------------------------------------------------------
    useEffect(() => {
        if (window.Spotify) {
            initPlayer();
            return;
        }

        window.onSpotifyWebPlaybackSDKReady = initPlayer;

        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            // Cleanup only if we own the script
            if (playerRef.current) {
                playerRef.current.disconnect();
                playerRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ------------------------------------------------------------------
    // Initialize the SDK Player
    // ------------------------------------------------------------------
    const initPlayer = useCallback(async () => {
        const player = new window.Spotify.Player({
            name: 'QueueRoom DJ 🎧',
            getOAuthToken: async (cb) => {
                try {
                    const data = await getSpotifyAccessToken();
                    cb(data.accessToken);
                } catch {
                    cb('');
                }
            },
            volume: 1,
        });

        playerRef.current = player;

        player.addListener('ready', ({ device_id }) => {
            setDeviceId(device_id);
            setStatus('ready');
        });

        player.addListener('not_ready', () => {
            setStatus('error');
        });

        player.addListener('player_state_changed', (state) => {
            if (!state) return;
            stateRef.current = state;

            const t = state.track_window?.current_track;
            setCurrentTrack(t ? {
                id: t.id,
                title: t.name,
                artist: t.artists.map((a) => a.name).join(', '),
                albumArt: t.album?.images?.[0]?.url || '',
                duration: state.duration,
            } : null);
            setDuration(state.duration);
            setProgress(state.duration > 0 ? state.position / state.duration : 0);

            if (state.paused) {
                setStatus('paused');
            } else {
                setStatus('playing');
            }
        });

        player.addListener('initialization_error', ({ message }) => {
            console.error('SDK init error:', message);
            setStatus('error');
        });

        player.addListener('authentication_error', ({ message }) => {
            console.error('SDK auth error:', message);
            setStatus('error');
        });

        player.addListener('account_error', ({ message }) => {
            console.error('SDK account error:', message);
            setStatus('error');
        });

        await player.connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ------------------------------------------------------------------
    // Poll playback state every 500 ms → update progress & check crossfade
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!playerRef.current) return;

        const interval = setInterval(async () => {
            const state = await playerRef.current.getCurrentState();
            if (!state || state.paused) return;

            const { position, duration: dur } = state;
            const remaining = dur - position;

            // Update progress bar in real-time
            setProgress(dur > 0 ? position / dur : 0);
            setDuration(dur);

            // Trigger crossfade when remaining time hits the threshold
            if (
                remaining <= crossfadeMs + TRIGGER_BUFFER_MS &&
                remaining > 0 &&
                !crossfadingRef.current &&
                dur > 0
            ) {
                triggerCrossfade(state);
            }
        }, 500);

        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [crossfadeMs]);

    // ------------------------------------------------------------------
    // Crossfade logic
    // ------------------------------------------------------------------
    const fade = useCallback((fromVol, toVol, durationMs) => {
        return new Promise((resolve) => {
            const player = playerRef.current;
            if (!player) { resolve(); return; }

            const stepTime = durationMs / FADE_STEPS;
            const volStep = (toVol - fromVol) / FADE_STEPS;
            let step = 0;
            let currentVol = fromVol;

            const interval = setInterval(async () => {
                step++;
                currentVol = fromVol + volStep * step;
                const clamped = Math.max(0, Math.min(1, currentVol));
                await player.setVolume(clamped);
                setVolume(clamped);

                if (step >= FADE_STEPS) {
                    clearInterval(interval);
                    resolve();
                }
            }, stepTime);
        });
    }, []);

    const triggerCrossfade = useCallback(async (state) => {
        if (crossfadingRef.current) return;
        crossfadingRef.current = true;
        setIsCrossfading(true);

        const player = playerRef.current;
        if (!player) { crossfadingRef.current = false; return; }

        // Figure out what track is finishing
        const finishedTrack = stateRef.current?.track_window?.current_track;

        const halfMs = crossfadeMs / 2;

        // ① Fade out the current track
        await fade(1, 0, halfMs);

        // ② Advance to the next track in the Spotify queue
        await player.nextTrack();

        // ③ Mark the finished track as played (move to history)
        if (finishedTrack) {
            // Find the matching approvedTrack by Spotify track id
            const matched = approvedRef.current.find(
                (t) => t.spotifyTrackId === finishedTrack.id
            );
            if (matched) {
                onMarkPlayedRef.current?.(matched);
            }
        }

        // ④ Fade in the new track
        await fade(0, 1, halfMs);

        crossfadingRef.current = false;
        setIsCrossfading(false);
    }, [crossfadeMs, fade]);

    // ------------------------------------------------------------------
    // Transfer Spotify playback to this browser tab
    // ------------------------------------------------------------------
    const handleTransfer = useCallback(async () => {
        if (!deviceId) return;
        try {
            const { accessToken } = await getSpotifyAccessToken();
            await fetch(`https://api.spotify.com/v1/me/player`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ device_ids: [deviceId], play: true }),
            });
            setTransferred(true);
        } catch (err) {
            console.error('Transfer failed:', err);
        }
    }, [deviceId]);

    // ------------------------------------------------------------------
    // UI helpers
    // ------------------------------------------------------------------
    const formatTime = (ms) => {
        if (!ms || isNaN(ms)) return '0:00';
        const s = Math.floor(ms / 1000);
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    };

    const statusLabel = {
        loading: 'Connecting SDK…',
        ready: 'Ready – transfer playback to start',
        playing: 'Playing',
        paused: 'Paused',
        error: 'SDK unavailable (Spotify Premium required)',
    }[status] ?? status;

    const statusColor = {
        loading: 'var(--text-muted)',
        ready: 'var(--accent-blue)',
        playing: 'var(--accent-primary)',
        paused: 'var(--accent-orange, #f59e0b)',
        error: '#ef4444',
    }[status] ?? 'var(--text-muted)';

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------
    return (
        <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '20px',
        }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <span style={{ fontSize: '1.25rem' }}>🎧</span>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                    DJ Mode
                </h3>
                <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: statusColor,
                    background: `${statusColor}18`,
                    border: `1px solid ${statusColor}44`,
                    borderRadius: '999px',
                    padding: '2px 10px',
                    marginLeft: 'auto',
                }}>
                    {statusLabel}
                </span>
            </div>

            {/* Current Track */}
            {currentTrack ? (
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                    {currentTrack.albumArt && (
                        <img
                            src={currentTrack.albumArt}
                            alt="album"
                            style={{
                                width: '52px',
                                height: '52px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                flexShrink: 0,
                                opacity: isCrossfading ? 0.5 : 1,
                                transition: 'opacity 0.4s ease',
                            }}
                        />
                    )}
                    <div style={{ minWidth: 0 }}>
                        <p style={{
                            margin: 0,
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}>
                            {currentTrack.title}
                        </p>
                        <p style={{
                            margin: '2px 0 0',
                            color: 'var(--text-secondary)',
                            fontSize: '0.8rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}>
                            {currentTrack.artist}
                        </p>
                    </div>
                </div>
            ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                    {status === 'ready'
                        ? 'Transfer playback here, then start a song in Spotify.'
                        : 'No track playing.'}
                </p>
            )}

            {/* Progress Bar */}
            <div style={{
                height: '4px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '999px',
                marginBottom: '6px',
                overflow: 'hidden',
            }}>
                <div style={{
                    height: '100%',
                    width: `${Math.round(progress * 100)}%`,
                    background: isCrossfading
                        ? 'linear-gradient(90deg, #a855f7, var(--accent-primary))'
                        : 'var(--accent-primary)',
                    borderRadius: '999px',
                    transition: 'width 0.5s linear, background 0.3s ease',
                }} />
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                marginBottom: '16px',
            }}>
                <span>{formatTime(progress * duration)}</span>
                <span>{formatTime(duration)}</span>
            </div>

            {/* Volume bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
            }}>
                <span>🔊</span>
                <div style={{
                    flex: 1,
                    height: '3px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        height: '100%',
                        width: `${Math.round(volume * 100)}%`,
                        background: 'var(--accent-blue)',
                        borderRadius: '999px',
                        transition: 'width 0.1s linear',
                    }} />
                </div>
                <span style={{ width: '30px', textAlign: 'right' }}>{Math.round(volume * 100)}%</span>
            </div>

            {/* Crossfade duration selector */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '18px',
                flexWrap: 'wrap',
            }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: '4px' }}>
                    Crossfade:
                </span>
                {[3000, 6000, 10000].map((ms) => (
                    <button
                        key={ms}
                        onClick={() => setCrossfadeMs(ms)}
                        style={{
                            padding: '4px 12px',
                            borderRadius: '999px',
                            border: `1px solid ${crossfadeMs === ms ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                            background: crossfadeMs === ms ? 'rgba(29,185,84,0.15)' : 'transparent',
                            color: crossfadeMs === ms ? 'var(--accent-primary)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: crossfadeMs === ms ? 700 : 400,
                            transition: 'all 0.2s',
                        }}
                    >
                        {ms / 1000}s
                    </button>
                ))}
            </div>

            {/* Crossfade overlay badge */}
            {isCrossfading && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(29,185,84,0.15))',
                    border: '1px solid rgba(168,85,247,0.3)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#a855f7',
                    marginBottom: '14px',
                    animation: 'pulse-glow 1s ease-in-out infinite',
                }}>
                    <span style={{ fontSize: '1rem' }}>🎚️</span>
                    Crossfading…
                </div>
            )}

            {/* Transfer button */}
            {status !== 'error' && (
                <button
                    onClick={handleTransfer}
                    disabled={!deviceId || transferred}
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: transferred
                            ? 'rgba(29,185,84,0.15)'
                            : 'var(--accent-primary)',
                        color: transferred ? 'var(--accent-primary)' : '#000',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: deviceId && !transferred ? 'pointer' : 'default',
                        opacity: deviceId ? 1 : 0.5,
                        transition: 'all 0.2s',
                    }}
                >
                    {transferred ? '✓ Playing here' : '▶ Transfer Playback Here'}
                </button>
            )}

            {status === 'error' && (
                <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: 0, textAlign: 'center' }}>
                    Spotify Premium is required for the Web Playback SDK.
                </p>
            )}
        </div>
    );
}
