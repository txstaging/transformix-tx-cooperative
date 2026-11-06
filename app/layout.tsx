import type { Metadata, Viewport } from 'next';
import original from '@/lib/original-document.json';
import './globals.css';
export const metadata: Metadata = { title: original.title, description: original.description };
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
