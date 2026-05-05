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
        <div className="fixed top-0 right-0 z-50 p-3">
          <ImajinAuth />
        </div>
        {children}
      </body>
    </html>
  );
}
