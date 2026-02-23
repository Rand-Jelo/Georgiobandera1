import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '401 — Unauthorized | Georgio Bandera',
    description: 'You must be signed in to access this page.',
};

export default function UnauthorizedPage() {
    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#0a0a0a',
                color: '#ffffff',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Header */}
            <header
                style={{
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    padding: '16px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <img
                        src="/logo-white.png"
                        alt="Georgio Bandera"
                        style={{ height: 20, objectFit: 'contain' }}
                    />
                </Link>
                <Link
                    href="/"
                    style={{
                        color: 'rgba(255,255,255,0.5)',
                        textDecoration: 'none',
                        fontSize: 13,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                    }}
                >
                    Home
                </Link>
            </header>

            <main
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 24px',
                    textAlign: 'center',
                }}
            >
                {/* User icon */}
                <div style={{ marginBottom: 24, opacity: 0.3 }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M6 20v-1a6 6 0 0 1 12 0v1" />
                        <line x1="18" y1="3" x2="22" y2="7" />
                        <line x1="22" y1="3" x2="18" y2="7" />
                    </svg>
                </div>

                <div
                    style={{
                        fontSize: 'clamp(80px, 16vw, 150px)',
                        fontWeight: 700,
                        lineHeight: 1,
                        letterSpacing: '-0.04em',
                        background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(255,255,255,0.04) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        userSelect: 'none',
                        marginBottom: 8,
                    }}
                >
                    401
                </div>

                <div
                    style={{
                        width: 40,
                        height: 1,
                        background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)',
                        margin: '8px auto 32px',
                    }}
                />

                <h1
                    style={{
                        fontSize: 'clamp(22px, 4vw, 32px)',
                        fontWeight: 300,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        margin: '0 0 16px',
                    }}
                >
                    Sign In Required
                </h1>

                <p
                    style={{
                        fontSize: 15,
                        color: 'rgba(255,255,255,0.45)',
                        maxWidth: 400,
                        lineHeight: 1.7,
                        margin: '0 0 48px',
                        fontWeight: 300,
                    }}
                >
                    This page is reserved for members. Please sign in to your account to
                    continue your premium experience.
                </p>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Link
                        href="/login"
                        style={{
                            background: '#ffffff',
                            color: '#0a0a0a',
                            textDecoration: 'none',
                            padding: '12px 28px',
                            fontSize: 13,
                            fontWeight: 600,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            display: 'inline-block',
                        }}
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/"
                        style={{
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'rgba(255,255,255,0.7)',
                            textDecoration: 'none',
                            padding: '12px 28px',
                            fontSize: 13,
                            fontWeight: 400,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            display: 'inline-block',
                        }}
                    >
                        Back to Home
                    </Link>
                </div>
            </main>

            <footer
                style={{
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    padding: '20px 24px',
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.2)',
                    letterSpacing: '0.05em',
                }}
            >
                © {new Date().getFullYear()} Georgio Bandera. All rights reserved.
            </footer>
        </div>
    );
}
