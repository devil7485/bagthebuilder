import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'GitBags | Discover Underrated Crypto & AI Builders',
  description: 'Find talented individual developers building the future of crypto, AI, privacy, and infrastructure. Support their work through Bags.fm.',
  keywords: ['crypto', 'blockchain', 'AI', 'builders', 'developers', 'web3', 'bags.fm'],
  openGraph: {
    title: 'GitBags',
    description: 'Discover underrated builders creating amazing projects',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Navigation */}
        <nav className="sticky top-0 z-50 glass border-b border-white/10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                  🎒
                </div>
                <span className="text-xl font-black font-display group-hover:text-accent transition">
                  GitBags
                </span>
              </Link>

              {/* Nav Links */}
              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/"
                  className="text-sm font-semibold hover:text-accent transition"
                >
                  Discover
                </Link>
                <a
                  href="https://bags.fm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold hover:text-accent transition"
                >
                  $GitBags
                </a>
                <a
                  href="https://bags.fm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent to-accent/80 text-black font-bold text-sm hover:shadow-lg hover:shadow-accent/50 transition"
                >
                  Go to Bags.fm →
                </a>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <a
                  href="https://bags.fm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-accent text-black font-bold text-sm"
                >
                  Bags.fm
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="glass border-t border-white/10 mt-20">
          <div className="container mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* About */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center text-xl">
                    🎒
                  </div>
                  <span className="font-black font-display">GitBags</span>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">
                  Discovering and showcasing talented individual developers building
                  amazing projects in crypto, AI, privacy, and infrastructure.
                </p>
              </div>

              {/* Links */}
              <div>
                <h3 className="font-bold mb-4 font-display">Links</h3>
                <div className="space-y-3 text-sm">
                  <a
                    href="https://bags.fm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-white/60 hover:text-accent transition"
                  >
                    Bags.fm →
                  </a>
                  <a
                    href="https://github.com/yourusername/bagthebuilder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-white/60 hover:text-accent transition"
                  >
                    GitHub →
                  </a>
                  <Link
                    href="/"
                    className="block text-white/60 hover:text-accent transition"
                  >
                    Discover Builders
                  </Link>
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-bold mb-4 font-display">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {['crypto', 'ai', 'privacy', 'games', 'infra', 'tools'].map((cat) => (
                    <span
                      key={cat}
                      className="px-3 py-1 rounded-lg bg-white/5 text-xs font-semibold capitalize border border-white/10"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom */}
            <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-white/40">
              <p>
                Made with 💚 for the builder community •{' '}
                <a
                  href="https://bags.fm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition"
                >
                  Powered by Bags.fm
                </a>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}