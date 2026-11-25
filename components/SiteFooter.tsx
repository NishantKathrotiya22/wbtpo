import Link from 'next/link'

const LINKS: [string, string][] = [['/', 'Home'], ['/venues', 'Venues and tariffs'], ['/availability', 'Check dates'], ['/notices', 'Notices'], ['/contact', 'Contact']]

export default function SiteFooter() {
  return (
    <footer className="mt-16">
      <div className="footbar">
        <div className="wrap py-4 flex flex-wrap items-center justify-between gap-3">
          <ul className="flex flex-wrap">
            {LINKS.map(([href, l], i) => <li key={href} className={i ? 'border-l border-white/40' : ''}><Link href={href} className="block px-4 py-1 font-semibold">{l}</Link></li>)}
          </ul>
          <p className="text-sm">A Government of West Bengal Undertaking</p>
        </div>
      </div>
      <p className="wrap py-5 text-sm text-muted">© {new Date().getFullYear()} West Bengal Trade Promotion Organisation. All rights reserved.</p>
    </footer>
  )
}
