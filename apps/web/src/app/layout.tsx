import type { Metadata } from 'next';
import LocalFont from 'next/font/local';
import './globals.css';
import StoreProvider from '@/utils/storeProvider';
import { Toaster } from 'sonner';

const Roboto = LocalFont({
  src: '../../fonts/Helvetica-Font/Helvetica.ttf',
  weight: '500',
});

export const metadata: Metadata = {
  title: 'PeytOtoria',
  description: 'PeytOtoria — messaging and channels platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" >
      <body className={Roboto.className}>
        <StoreProvider>
          <Toaster richColors theme="system" />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
