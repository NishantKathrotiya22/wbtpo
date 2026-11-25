import type { Metadata } from 'next'
import { Open_Sans } from 'next/font/google'
import './globals.css'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

const openSans = Open_Sans({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-open-sans' })

export const metadata: Metadata = {
  title: { default: 'West Bengal Trade Promotion Organisation', template: '%s | WBTPO' },
  description: 'Venue availability and booking at Milan Mela Prangan, Kolkata.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={openSans.variable}>
      <body className="min-h-screen flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3 focus:rounded">Skip to content</a>
        <SiteHeader />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
