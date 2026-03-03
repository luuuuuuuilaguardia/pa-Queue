// ============================================
// QueueRoom – QueueList Component
// ============================================
// Displays a titled list of tracks with a header
// badge showing the count. Used for "Pending" and
// "Approved" sections in both Host and Guest views.
// ============================================

'use client';

import TrackCard from './TrackCard';

/**
 * QueueList – Renders a section of tracks with a title.
 *
 * @param {string} title - Section title (e.g., "Pending Suggestions")
 * @param {Array} tracks - Array of track objects
 * @param {string} mode - 'host' | 'guest'
 * @param {string} badgeType - 'pending' | 'approved'
 * @param {Function} onApprove - Host approve callback
 * @param {Function} onReject - Host reject callback
 * @param {Function} onVote - Guest vote callback
 * @param {Array} votedTrackIds - Array of track IDs the guest has voted on
 * @param {string} emptyMessage - Message when list is empty
 */
export default function QueueList({
    title,
    tracks = [],
    mode = 'guest',
    badgeType = 'pending',
    onApprove,
    onReject,
    onVote,
    votedTrackIds = [],
    emptyMessage = 'No tracks yet',
}) {
    return (
        <div style={{ marginBottom: '24px' }}>
            {/* Section Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-subtle)',
            }}>
                <h3 style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                }}>
                    {title}
                </h3>
                <span className={`badge badge-${badgeType}`}>
                    {tracks.length}
                </span>
            </div>

            {/* Track List */}
            {tracks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {tracks.map((track, index) => (
                        <div
                            key={track._id || track.spotifyTrackId || index}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <TrackCard
                                track={track}
                                mode={mode}
                                onApprove={onApprove}
                                onReject={onReject}
                                onVote={onVote}
                                hasVoted={votedTrackIds.includes(track._id)}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '32px 20px',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-subtle)',
                }}>
                    {emptyMessage}
                </div>
            )}
        </div>
    );
}
