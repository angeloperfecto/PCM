import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PCM — Philippine College of Ministry | Equipping Servants for Kingdom Impact',
  description: 'Philippine College of Ministry provides Christ-centered theological and ministry education designed to equip faithful servants, ministry leaders, and Christian workers for Kingdom impact.',
  keywords: [
    'Philippine College of Ministry',
    'Theological Seminary Philippines',
    'Bible College Manila',
    'Bachelor of Theology',
    'Master of Divinity',
    'Christian Ministry Training',
    'Pastoral Education Philippines',
    'Biblical Studies'
  ],
  authors: [{ name: 'Philippine College of Ministry' }],
  icons: {
    icon: [
      { url: '/pcm-logo.svg', type: 'image/svg+xml' },
      { url: '/images/pcm-logo.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/pcm-logo.svg',
    apple: '/pcm-logo.svg',
  },
  openGraph: {
    title: 'PCM — Philippine College of Ministry | Equipping Servants for Kingdom Impact',
    description: 'Philippine College of Ministry provides Christ-centered theological and ministry education designed to equip faithful servants, ministry leaders, and Christian workers for Kingdom impact.',
    type: 'website',
    siteName: 'Philippine College of Ministry',
    locale: 'en_PH',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PCM — Philippine College of Ministry | Equipping Servants for Kingdom Impact',
    description: 'Equipping Servants. Transforming Lives. Advancing God\'s Kingdom. Faithful Christ-centered theological education in the Philippines.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/pcm-logo.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/images/pcm-logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/pcm-logo.svg" />
      </head>
      <body suppressHydrationWarning className="bg-white text-[#18392B] font-sans antialiased selection:bg-[#588B76]/25 selection:text-[#18392B]">
        {children}
      </body>
    </html>
  );
}
