import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP, Zen_Kaku_Gothic_New } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import './globals.css'
import { QueryProvider } from '@/components/query-provider'

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-jp',
})

const zenKaku = Zen_Kaku_Gothic_New({
  subsets: ['latin'],
  weight: ['500', '700', '900'],
  variable: '--font-zen-kaku',
})

export const metadata: Metadata = {
  icons: { icon: { url: '/icon.svg', type: 'image/svg+xml' } },
  title: 'Estate Machare | 不動産売買・賃貸マッチング',
  description:
    'マンション・戸建て・土地・事業用物件の売買と賃貸。物件探しから内見・契約条件の相談までつなぐ Estate Machare。',
}

export const viewport: Viewport = {
  themeColor: '#203a43',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ja"
      data-scroll-behavior="smooth"
      className={`light ${notoSansJp.variable} ${zenKaku.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <SessionProvider>
          <QueryProvider>{children}</QueryProvider>
        </SessionProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
