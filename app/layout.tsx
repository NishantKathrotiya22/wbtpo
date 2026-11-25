import type { Metadata } from 'next'
import { Source_Serif_4, Source_Sans_3 } from 'next/font/google'
import './globals.css'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif-src' })
const sans = Source_Sans_3({ subsets: ['latin'], variable: '--font-sans-src' })

export const metadata: Metadata = {
  title: { default: 'West Bengal Trade Promotion Organisation', template: '%s | WBTPO' },
  description: 'Venue availability and booking at Milan Mela Prangan, Kolkata.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-screen flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">Skip to content</a>
        <SiteHeader />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
