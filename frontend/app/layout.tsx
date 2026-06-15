import type { Metadata } from 'next';
import { Providers } from './providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'EIPR-Agent | Entrepreneurship & IP Rights Analysis',
  description: 'Multi-Agent AI System for Entrepreneurship Opportunity Discovery and IP Strategy',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
