import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#18392B',
};

export const metadata: Metadata = {
  title: 'PCM — Philippine College of Ministry | Equipping Servants for Kingdom Impact',
  description: 'Philippine College of Ministry provides Christ-centered theological and ministry education designed to equip faithful servants, ministry leaders, and Christian workers for Kingdom impact in Lamtang, Benguet.',
  keywords: [
    'Philippine College of Ministry',
    'PCM Baguio',
    'PCM Benguet',
    'Theological Seminary Philippines',
    'Bible College Philippines',
    'Bachelor of Theology',
    'Master of Divinity',
    'Specialized Chaplaincy',
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
      <body suppressHydrationWarning className="bg-white text-[#18392B] font-sans antialiased selection:bg-[#588B76]/25 selection:text-[#18392B] overflow-x-hidden min-h-screen">
        {children}
      </body>
    </html>
  );
}
