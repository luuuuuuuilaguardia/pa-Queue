// ============================================
// QueueRoom – TrackCard Component
// ============================================
// Displays a single track with album art, title,
// artist, and action buttons (approve, reject, mark played).
// Used in both Host and Guest views.
// ============================================

'use client';

/**
 * TrackCard – Renders a single track suggestion.
 *
 * @param {Object} track - Track data from the database
 * @param {string} mode - 'host' | 'guest' | 'search' | 'history'
 * @param {Function} onApprove - Host: approve callback
 * @param {Function} onReject - Host: reject callback
 * @param {Function} onMarkPlayed - Host: mark as played callback
 * @param {Function} onAdd - Search: add to room callback
 */
export default function TrackCard({
    track,
    mode = 'guest',
    onApprove,
    onReject,
    onMarkPlayed,
    onAdd,
}) {
    // Format duration from ms to m:ss
    const formatDuration = (ms) => {
        if (!ms) return '';
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const isHistory = mode === 'history' || track.status === 'played';

    return (
        <div
            className="animate-fade-in"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 16px',
                background: isHistory
                    ? 'rgba(255, 255, 255, 0.015)'
                    : 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                transition: 'all 0.25s ease',
                cursor: 'default',
                opacity: isHistory ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = isHistory
                    ? 'rgba(255, 255, 255, 0.04)'
                    : 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = 'var(--border-hover)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = isHistory
                    ? 'rgba(255, 255, 255, 0.015)'
                    : 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
        >
            {/* Album Art */}
            <div style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                flexShrink: 0,
                background: 'var(--bg-surface)',
            }}>
                {track.albumArt ? (
                    <img
                        src={track.albumArt}
                        alt={track.title}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: isHistory ? 'grayscale(40%)' : 'none',
                        }}
                    />
                ) : (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                    }}>
                        🎵
                    </div>
                )}
            </div>

            {/* Track Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: isHistory ? 'var(--text-secondary)' : 'var(--text-primary)',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                    {track.title}
                </p>
                <p style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    margin: '2px 0 0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                    {track.artist}
                    {track.duration ? ` · ${formatDuration(track.duration)}` : ''}
                </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                {/* Search: Add to Room */}
                {mode === 'search' && onAdd && (
                    <button
                        className="btn-primary"
                        onClick={() => onAdd(track)}
                        style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                    >
                        + Add
                    </button>
                )}

                {/* Host: Approve */}
                {mode === 'host' && track.status === 'pending' && onApprove && (
                    <button className="btn-approve" onClick={() => onApprove(track)}>
                        ✓ Approve
                    </button>
                )}

                {/* Host: Reject */}
                {mode === 'host' && track.status === 'pending' && onReject && (
                    <button className="btn-reject" onClick={() => onReject(track)}>
                        ✕ Reject
                    </button>
                )}

                {/* Host: Mark Played (on approved tracks) */}
                {mode === 'host' && track.status === 'approved' && onMarkPlayed && (
                    <button
                        onClick={() => onMarkPlayed(track)}
                        style={{
                            background: 'rgba(124, 58, 237, 0.15)',
                            color: 'var(--accent-purple)',
                            border: '1px solid rgba(124, 58, 237, 0.3)',
                            borderRadius: 'var(--radius-full)',
                            padding: '6px 14px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(124, 58, 237, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(124, 58, 237, 0.15)';
                        }}
                    >
                        ♪ Played
                    </button>
                )}

                {/* Status badge for approved tracks in guest mode */}
                {track.status === 'approved' && (mode === 'guest') && (
                    <span className="badge badge-approved">✓ Queued</span>
                )}

                {/* Played indicator for history tracks in guest/history mode */}
                {isHistory && mode !== 'host' && (
                    <span style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        fontWeight: 500,
                        alignSelf: 'center',
                    }}>
                        ♪ Played
                    </span>
                )}
            </div>
        </div>
    );
}
