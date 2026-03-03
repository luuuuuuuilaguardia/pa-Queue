// ============================================
// QueueRoom – QRCode Component
// ============================================
// Generates and displays a QR code for the room
// join URL. Uses a public QR code API for simplicity.
// ============================================

'use client';

/**
 * QRCode – Displays a QR code for the room join link.
 *
 * @param {string} roomCode - The room code to encode
 * @param {number} size - QR code size in pixels (default: 180)
 */
export default function QRCode({ roomCode, size = 180 }) {
    // Build the join URL
    const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/room/${roomCode}`;

    // Use QR Server API (free, no API key needed)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(joinUrl)}&bgcolor=1a1a2e&color=1DB954&format=png`;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
        }}>
            {/* QR Code Image */}
            <div style={{
                padding: '16px',
                background: '#1a1a2e',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-glow)',
            }}>
                <img
                    src={qrUrl}
                    alt={`QR code to join room ${roomCode}`}
                    width={size}
                    height={size}
                    style={{ display: 'block', borderRadius: 'var(--radius-sm)' }}
                />
            </div>

            {/* Join URL */}
            <p style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                margin: 0,
                textAlign: 'center',
                wordBreak: 'break-all',
            }}>
                {joinUrl}
            </p>
        </div>
    );
}
