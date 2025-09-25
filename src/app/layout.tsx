import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Friday Prayer Registration',
  description: 'Register for Friday prayers in your community',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}