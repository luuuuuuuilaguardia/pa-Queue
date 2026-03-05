// ============================================
// QueueRoom – NowPlaying Component
// ============================================
// Displays the host's currently playing Spotify
// track with a live-synced progress bar.
// Polls the backend every 5 s and ticks the
// progress locally every second in between.
// ============================================

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getNowPlaying } from '@/lib/api';

const POLL_INTERVAL = 5000; // re-fetch from Spotify every 5 s
const TICK_INTERVAL = 1000; // move progress bar every 1 s

/** Format milliseconds → "m:ss" */
const fmt = (ms) => {
    if (!ms && ms !== 0) return '0:00';
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

/**
 * NowPlaying – live Spotify player widget.
 * @param {string} roomCode - Room code used to look up the host's token
 */
export default function NowPlaying({ roomCode }) {
    const [track, setTrack] = useState(null);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const progressRef = useRef(0);
    const isPlayingRef = useRef(false);
    const durationRef = useRef(0);

    const fetchNowPlaying = useCallback(async () => {
        try {
            const data = await getNowPlaying(roomCode);
            const t = data.track;
            setTrack(t);
            if (t) {
                progressRef.current = t.progress;
                durationRef.current = t.duration;
                setProgress(t.progress);
                isPlayingRef.current = t.isPlaying;
            } else {
                isPlayingRef.current = false;
            }
        } catch {
            // silently ignore – widget stays in last known state
        } finally {
            setLoading(false);
        }
    }, [roomCode]);

    // Poll every POLL_INTERVAL
    useEffect(() => {
        fetchNowPlaying();
        const poll = setInterval(fetchNowPlaying, POLL_INTERVAL);
        return () => clearInterval(poll);
    }, [fetchNowPlaying]);

    // Tick progress every second while playing
    useEffect(() => {
        const tick = setInterval(() => {
            if (!isPlayingRef.current) return;
            progressRef.current = Math.min(
                progressRef.current + TICK_INTERVAL,
                durationRef.current || progressRef.current
            );
            setProgress(progressRef.current);
        }, TICK_INTERVAL);
        return () => clearInterval(tick);
    }, []);

    const pct = track ? Math.min((progress / track.duration) * 100, 100) : 0;

    return (
        <div
            className="glass-card"
            style={{
                padding: '20px 24px',
                marginBottom: '20px',
                border: track?.isPlaying
                    ? '1px solid rgba(29, 185, 84, 0.25)'
                    : '1px solid var(--border-subtle)',
                transition: 'border-color 0.4s ease',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '14px' }}>
                    {[1, 2, 3].map((i) => (
                        <span
                            key={i}
                            style={{
                                display: 'block',
                                width: '3px',
                                borderRadius: '2px',
                                background: 'var(--accent-primary)',
                                height: track?.isPlaying ? `${6 + i * 3}px` : '4px',
                                animation: track?.isPlaying ? `eq-bar-${i} 0.${5 + i}s ease-in-out infinite alternate` : 'none',
                                transition: 'height 0.3s ease',
                            }}
                        />
                    ))}
                </div>
                <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: track?.isPlaying ? 'var(--accent-primary)' : 'var(--text-muted)',
                }}>
                    {loading
                        ? 'Loading...'
                        : track?.isPlaying
                        ? 'Now Playing'
                        : track
                        ? 'Paused'
                        : 'Nothing Playing'}
                </span>
            </div>

            {track ? (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Album art */}
                        <div style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            flexShrink: 0,
                            boxShadow: track.isPlaying
                                ? '0 0 20px rgba(29, 185, 84, 0.25)'
                                : '0 4px 16px rgba(0,0,0,0.4)',
                            transition: 'box-shadow 0.4s ease',
                        }}>
                            {track.albumArt ? (
                                <img
                                    src={track.albumArt}
                                    alt={track.album}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{
                                    width: '100%', height: '100%',
                                    background: 'var(--bg-surface)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.8rem',
                                }}>
                                    🎵
                                </div>
                            )}
                        </div>

                        {/* Title / artist / device */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                                fontWeight: 700,
                                fontSize: '1rem',
                                color: 'var(--text-primary)',
                                margin: 0,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}>
                                {track.title}
                            </p>
                            <p style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                margin: '3px 0 0',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}>
                                {track.artist}
                            </p>
                            {track.device && (
                                <p style={{
                                    fontSize: '0.72rem',
                                    color: 'var(--text-muted)',
                                    margin: '4px 0 0',
                                }}>
                                    🔊 {track.device}
                                </p>
                            )}
                        </div>

                        {/* Times */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '2px',
                            flexShrink: 0,
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            fontVariantNumeric: 'tabular-nums',
                        }}>
                            <span>{fmt(progress)}</span>
                            <span style={{ opacity: 0.5 }}>–{fmt(track.duration - progress)}</span>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{
                        marginTop: '14px',
                        height: '4px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(255,255,255,0.1)',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${pct}%`,
                            borderRadius: 'var(--radius-full)',
                            background: track.isPlaying ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.3)',
                            transition: 'width 1s linear',
                        }} />
                    </div>
                </>
            ) : !loading && (
                <p style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-muted)',
                    margin: 0,
                    textAlign: 'center',
                    padding: '12px 0',
                }}>
                    Open Spotify on the host&apos;s device to start playing.
                </p>
            )}

            <style>{`
                @keyframes eq-bar-1 { from { height: 4px } to { height: 10px } }
                @keyframes eq-bar-2 { from { height: 7px } to { height: 14px } }
                @keyframes eq-bar-3 { from { height: 5px } to { height: 11px } }
            `}</style>
        </div>
    );
}
