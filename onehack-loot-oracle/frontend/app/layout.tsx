import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Loot Oracle — AI GameFi Advisor',
  description: 'AI-powered loot recommendation engine for GameFi players',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
