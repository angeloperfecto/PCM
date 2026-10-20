// Display and text faces for the redesigned Home page (self-hosted by next/font; no layout shift).
import { Fraunces, Inter } from 'next/font/google';

export const displayFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['SOFT', 'opsz'],
});

export const textFont = Inter({
  subsets: ['latin'],
  variable: '--font-text',
  display: 'swap',
});
