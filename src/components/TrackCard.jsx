// ============================================
// QueueRoom – TrackCard Component
// ============================================
// Displays a single track with album art, title,
// artist, and action buttons (vote, approve, reject).
// Used in both Host and Guest views.
// ============================================

'use client';

/**
 * TrackCard – Renders a single track suggestion.
 *
 * @param {Object} track - Track data from the database
 * @param {string} mode - 'host' | 'guest' | 'search'
 * @param {Function} onApprove - Host: approve callback
 * @param {Function} onReject - Host: reject callback
 * @param {Function} onVote - Guest: upvote callback
 * @param {Function} onAdd - Search: add to room callback
 * @param {boolean} hasVoted - Whether the current guest has already voted
 */
export default function TrackCard({
    track,
    mode = 'guest',
    onApprove,
    onReject,
    onVote,
    onAdd,
    hasVoted = false,
}) {
    // Format duration from ms to m:ss
    const formatDuration = (ms) => {
        if (!ms) return '';
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div
            className="animate-fade-in"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                transition: 'all 0.25s ease',
                cursor: 'default',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = 'var(--border-hover)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
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
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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

                    </div>
                )}
            </div>

            {/* Track Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                    {track.title}
                </p>
                <p style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    margin: '2px 0 0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                    {track.artist}
                    {track.duration ? ` · ${formatDuration(track.duration)}` : ''}
                </p>
            </div>

            {/* Vote Count (shown in guest and host mode) */}
            {mode !== 'search' && track.votes !== undefined && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    minWidth: '40px',
                }}>
                    <span style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: track.votes > 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
                    }}>
                        {track.votes}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        votes
                    </span>
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                {/* Guest: Upvote */}
                {mode === 'guest' && onVote && (
                    <button
                        onClick={() => onVote(track._id)}
                        disabled={hasVoted}
                        style={{
                            background: hasVoted ? 'rgba(29, 185, 84, 0.15)' : 'rgba(29, 185, 84, 0.1)',
                            color: hasVoted ? 'var(--text-muted)' : 'var(--accent-primary)',
                            border: `1px solid ${hasVoted ? 'transparent' : 'rgba(29, 185, 84, 0.3)'}`,
                            borderRadius: 'var(--radius-full)',
                            padding: '6px 14px',
                            cursor: hasVoted ? 'default' : 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {hasVoted ? '✓ Voted' : '▲ Vote'}
                    </button>
                )}

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

                {/* Status badge for approved tracks */}
                {track.status === 'approved' && mode === 'host' && (
                    <span className="badge badge-approved">✓ Queued</span>
                )}
            </div>
        </div>
    );
}
