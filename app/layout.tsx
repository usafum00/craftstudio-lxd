import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LearnByCraft Authoring Tool — Your brand. Learning by design.',
  description: 'Thoughtfully built. Human by design. Modern corporate learning authoring studio.',
  icons: {
    icon: '/brand/learnbycraft-mark.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
