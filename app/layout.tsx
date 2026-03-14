import type { Metadata } from 'next'
import { Libre_Baskerville, VT323, Oswald } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const libreBaskerville = Libre_Baskerville({ 
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body"
});
const vt323 = VT323({ 
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display"
});
const oswald = Oswald({ 
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-title"
});

export const metadata: Metadata = {
  title: 'DEMONET: Radar Hunt',
  description: 'DEMONET: Radar Hunt - Hawkins Laboratory Field Protocol',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${libreBaskerville.variable} ${vt323.variable} ${oswald.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
