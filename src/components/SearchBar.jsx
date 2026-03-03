// ============================================
// QueueRoom – SearchBar Component
// ============================================
// A search input with debounced querying.
// Used in the Guest view to search for tracks.
// ============================================

'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * SearchBar – Debounced search input with loading indicator.
 *
 * @param {Function} onSearch - Callback with the search query string
 * @param {boolean} isLoading - Whether a search is in progress
 * @param {string} placeholder - Input placeholder text
 */
export default function SearchBar({
    onSearch,
    isLoading = false,
    placeholder = 'Search for a song...',
    disabled = false,
}) {
    const [query, setQuery] = useState('');
    const debounceRef = useRef(null);

    // Debounce search by 400ms
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!disabled && query.trim().length >= 2) {
            debounceRef.current = setTimeout(() => {
                onSearch(query.trim());
            }, 400);
        }

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, onSearch]);

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {/* Search Icon */}
            <span
                style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.1rem',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                }}
            >

            </span>

            {/* Input */}
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="input-field"
                disabled={disabled}
                suppressHydrationWarning
                style={{
                    paddingLeft: '48px',
                    paddingRight: isLoading ? '48px' : '18px',
                    fontSize: '1rem',
                    height: '52px',
                    opacity: disabled ? 0.5 : 1,
                    cursor: disabled ? 'not-allowed' : undefined,
                }}
            />

            {/* Loading Spinner */}
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid var(--border-subtle)',
                        borderTopColor: 'var(--accent-primary)',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite',
                    }} />
                </div>
            )}
        </div>
    );
}
