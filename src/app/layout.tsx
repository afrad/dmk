import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anmeldung zum Freitagsgebet',
  description: 'Anmeldung zum Freitagsgebet der Deuschsprachigen Muslimgemeinschaft e.V.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        {children}
      </body>
    </html>
  );
}