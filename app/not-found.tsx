import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '404 — Page Not Found | Georgio Bandera',
    description: 'The page you are looking for could not be found.',
};

export default function NotFound() {
    return (
        <html lang="en">
            <body
                style={{
                    margin: 0,
                    padding: 0,
                    background: '#0a0a0a',
                    color: '#ffffff',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    minHeight: '100vh',
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

                {/* Main content */}
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
                    {/* Decorative number */}
                    <div
                        style={{
                            fontSize: 'clamp(100px, 20vw, 180px)',
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
                        404
                    </div>

                    {/* Gold divider */}
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
                            color: '#ffffff',
                        }}
                    >
                        Page Not Found
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
                        The page you&apos;re looking for seems to have wandered off. Perhaps it was
                        moved, renamed, or simply never existed.
                    </p>

                    {/* CTAs */}
                    <div
                        style={{
                            display: 'flex',
                            gap: 12,
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Link
                            href="/"
                            style={{
                                background: '#ffffff',
                                color: '#0a0a0a',
                                textDecoration: 'none',
                                padding: '12px 28px',
                                fontSize: 13,
                                fontWeight: 600,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                transition: 'all 0.3s ease',
                                display: 'inline-block',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLAnchorElement).style.background = '#fbbf24';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLAnchorElement).style.background = '#ffffff';
                            }}
                        >
                            Back to Home
                        </Link>
                        <Link
                            href="/shop"
                            style={{
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'rgba(255,255,255,0.7)',
                                textDecoration: 'none',
                                padding: '12px 28px',
                                fontSize: 13,
                                fontWeight: 400,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                transition: 'all 0.3s ease',
                                display: 'inline-block',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLAnchorElement).style.borderColor = '#fbbf24';
                                (e.currentTarget as HTMLAnchorElement).style.color = '#fbbf24';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.2)';
                                (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)';
                            }}
                        >
                            Shop All
                        </Link>
                    </div>
                </main>

                {/* Footer */}
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
            </body>
        </html>
    );
}
