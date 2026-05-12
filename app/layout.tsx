import type { Metadata } from 'next';
import './globals.css';
import { ImajinAuth } from '@/components/ImajinAuth';

export const metadata: Metadata = {
  title: 'Karaoke | Imajin',
  description: 'Imajin Karaoke',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-gray-950/90 backdrop-blur border-b border-gray-800/50">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="font-semibold text-white">🎤 Karaoke</span>
            <span className="text-gray-600">on</span>
            <span className="text-amber-500/80 font-medium">Imajin</span>
          </div>
          <ImajinAuth />
        </header>
        <div className="pt-14">
          {children}
        </div>
      </body>
    </html>
  );
}
