import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Maintenance | Georgio Bandera',
    description: 'We are currently performing scheduled maintenance. We will be back shortly.',
};

export default function MaintenancePage() {
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
                    justifyContent: 'center',
                }}
            >
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <img
                        src="/logo-white.png"
                        alt="Georgio Bandera"
                        style={{ height: 20, objectFit: 'contain' }}
                    />
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
                {/* Wrench icon */}
                <div style={{ marginBottom: 32, opacity: 0.4 }}>
                    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                </div>

                {/* Gold divider */}
                <div
                    style={{
                        width: 60,
                        height: 1,
                        background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)',
                        margin: '0 auto 40px',
                    }}
                />

                <h1
                    style={{
                        fontSize: 'clamp(24px, 5vw, 40px)',
                        fontWeight: 300,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        margin: '0 0 16px',
                    }}
                >
                    Under Maintenance
                </h1>

                <p
                    style={{
                        fontSize: 15,
                        color: 'rgba(255,255,255,0.45)',
                        maxWidth: 440,
                        lineHeight: 1.8,
                        margin: '0 0 12px',
                        fontWeight: 300,
                    }}
                >
                    We&apos;re making some improvements to bring you an even more refined
                    experience. We&apos;ll be back shortly.
                </p>

                <p
                    style={{
                        fontSize: 13,
                        color: 'rgba(251,191,36,0.6)',
                        letterSpacing: '0.05em',
                        margin: '0 0 48px',
                    }}
                >
                    Thank you for your patience.
                </p>

                {/* Contact link */}
                <Link
                    href="mailto:info@georgiobandera.se"
                    style={{
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.5)',
                        textDecoration: 'none',
                        padding: '12px 28px',
                        fontSize: 13,
                        fontWeight: 400,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        display: 'inline-block',
                    }}
                >
                    Get in Touch
                </Link>
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
