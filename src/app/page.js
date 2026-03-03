// ============================================
// QueueRoom – Landing Page
// ============================================
// Hero section with two CTAs:
//   1. "Login with Spotify" → Host flow
//   2. "Join a Room" input → Guest flow
// ============================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSpotifyLoginUrl } from '@/lib/api';

export default function LandingPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  // Handle guest joining a room
  const handleJoinRoom = (e) => {
    e.preventDefault();
    const code = roomCode.trim().toUpperCase();

    if (!code || code.length < 4) {
      setError('Please enter a valid room code (4-6 characters)');
      return;
    }

    setError('');
    router.push(`/room/${code}`);
  };

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--gradient-hero)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative background elements */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(29, 185, 84, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.06) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div className="animate-slide-up" style={{
        textAlign: 'center',
        maxWidth: '520px',
        width: '100%',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo / Title */}
        <div style={{ marginBottom: '12px' }}>
          <span style={{
            fontSize: '3rem',
            display: 'block',
            marginBottom: '8px',
            animation: 'float 3s ease-in-out infinite',
          }}>
          </span>
          <h1 style={{
            fontSize: 'clamp(2.2rem, 6vw, 3.5rem)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            margin: 0,
            lineHeight: 1.1,
          }}>
            <span style={{
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Queue
            </span>
            <span style={{ color: 'var(--text-primary)' }}>Room</span>
          </h1>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          margin: '0 0 40px',
          fontWeight: 300,
        }}>
          Let your crowd pick the music.
          <br />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>
            Collaborative Spotify queue for events & parties.
          </span>
        </p>

        {/* Host CTA – Login with Spotify */}
        <a
          href={getSpotifyLoginUrl()}
          className="btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '1.05rem',
            padding: '16px 36px',
            textDecoration: 'none',
            marginBottom: '32px',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          Host with Spotify
        </a>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          margin: '0 0 28px',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500 }}>
            OR JOIN AS GUEST
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {/* Guest CTA – Join Room */}
        <form onSubmit={handleJoinRoom} style={{
          display: 'flex',
          gap: '12px',
          maxWidth: '400px',
          margin: '0 auto',
        }}>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => {
              setRoomCode(e.target.value.toUpperCase());
              setError('');
            }}
            placeholder="ROOM CODE"
            maxLength={6}
            className="input-field"
            style={{
              flex: 1,
              textAlign: 'center',
              letterSpacing: '0.3em',
              fontWeight: 700,
              fontSize: '1.1rem',
              textTransform: 'uppercase',
            }}
          />
          <button type="submit" className="btn-secondary" style={{ flexShrink: 0 }}>
            Join →
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <p style={{
            color: '#ef4444',
            fontSize: '0.85rem',
            marginTop: '12px',
          }}>
            {error}
          </p>
        )}

        {/* Footer note */}
        <p style={{
          marginTop: '48px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}>
          Guests don't need a Spotify account · Free to use
        </p>
      </div>
    </main>
  );
}
