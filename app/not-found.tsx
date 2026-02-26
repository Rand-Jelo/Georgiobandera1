import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '404 — Page Not Found | Georgio Bandera',
    description: 'The page you are looking for could not be found.',
};

// Translations embedded directly — next-intl is unavailable at the root not-found level
const messages = {
    en: {
        title: 'Page Not Found',
        description: "The page you're looking for seems to have wandered off. Perhaps it was moved, renamed, or simply never existed.",
        backHome: 'Back to Home',
        shopAll: 'Shop All',
        home: 'Home',
    },
    sv: {
        title: 'Sidan hittades inte',
        description: 'Sidan du letar efter verkar ha försvunnit. Den kan ha flyttats, bytt namn eller helt enkelt aldrig existerat.',
        backHome: 'Tillbaka till startsidan',
        shopAll: 'Se alla produkter',
        home: 'Hem',
    },
};

export default function NotFound() {
    return (
        <html lang="en">
            <head>
                <style>{`
          .btn-primary {
            background: #ffffff;
            color: #0a0a0a;
            text-decoration: none;
            padding: 12px 28px;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            display: inline-block;
            transition: background 0.3s ease;
          }
          .btn-primary:hover { background: #fbbf24; }
          .btn-secondary {
            border: 1px solid rgba(255,255,255,0.2);
            color: rgba(255,255,255,0.7);
            text-decoration: none;
            padding: 12px 28px;
            font-size: 13px;
            font-weight: 400;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            display: inline-block;
            transition: all 0.3s ease;
          }
          .btn-secondary:hover { border-color: #fbbf24; color: #fbbf24; }
          .nav-link:hover { color: rgba(255,255,255,0.8); }
          /* language toggle */
          .lang-btn {
            background: none;
            border: none;
            color: rgba(255,255,255,0.35);
            font-size: 11px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            cursor: pointer;
            padding: 0 6px;
            transition: color 0.2s;
          }
          .lang-btn:hover { color: rgba(255,255,255,0.8); }
          #content-sv { display: none; }
        `}</style>
                <script dangerouslySetInnerHTML={{
                    __html: `
            (function() {
              var lang = (navigator.language || '').toLowerCase();
              var isSv = lang.startsWith('sv');
              if (isSv) {
                document.documentElement.lang = 'sv';
                var en = document.getElementById('content-en');
                var sv = document.getElementById('content-sv');
                if (en) en.style.display = 'none';
                if (sv) sv.style.display = '';
              }
            })();
          `,
                }} />
            </head>
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
                            style={{ height: 40, objectFit: 'contain' }}
                        />
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Link
                            href="/"
                            className="nav-link"
                            style={{
                                color: 'rgba(255,255,255,0.5)',
                                textDecoration: 'none',
                                fontSize: 13,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                transition: 'color 0.3s ease',
                                marginRight: 16,
                            }}
                        >
                            <span id="nav-home-en">Home</span>
                            <span id="nav-home-sv" style={{ display: 'none' }}>Hem</span>
                        </Link>
                    </div>
                </header>

                {/* Main — English */}
                <main
                    id="content-en"
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}
                >
                    <div style={{ fontSize: 'clamp(100px, 20vw, 180px)', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.04em', background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(255,255,255,0.04) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', userSelect: 'none', marginBottom: 8 }}>404</div>
                    <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)', margin: '8px auto 32px' }} />
                    <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 300, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 16px', color: '#ffffff' }}>{messages.en.title}</h1>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', maxWidth: 400, lineHeight: 1.7, margin: '0 0 48px', fontWeight: 300 }}>{messages.en.description}</p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                        <Link href="/en" className="btn-primary">{messages.en.backHome}</Link>
                        <Link href="/en/shop" className="btn-secondary">{messages.en.shopAll}</Link>
                    </div>
                </main>

                {/* Main — Swedish */}
                <main
                    id="content-sv"
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}
                >
                    <div style={{ fontSize: 'clamp(100px, 20vw, 180px)', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.04em', background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(255,255,255,0.04) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', userSelect: 'none', marginBottom: 8 }}>404</div>
                    <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)', margin: '8px auto 32px' }} />
                    <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 300, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 16px', color: '#ffffff' }}>{messages.sv.title}</h1>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', maxWidth: 400, lineHeight: 1.7, margin: '0 0 48px', fontWeight: 300 }}>{messages.sv.description}</p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                        <Link href="/sv" className="btn-primary">{messages.sv.backHome}</Link>
                        <Link href="/sv/shop" className="btn-secondary">{messages.sv.shopAll}</Link>
                    </div>
                </main>

                {/* Footer */}
                <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
                    © {new Date().getFullYear()} Georgio Bandera. All rights reserved.
                </footer>
            </body>
        </html>
    );
}
