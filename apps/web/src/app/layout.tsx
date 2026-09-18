import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Emprende UNJBG · Catálogo de Emprendimientos Universitarios',
    template: '%s · Emprende UNJBG',
  },
  description:
    'Catálogo de emprendimientos de estudiantes de la Universidad Nacional Jorge Basadre Grohmann. Descubre y apoya negocios verificados de tu propia comunidad universitaria.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-neutral-50 text-neutral-900">{children}</body>
    </html>
  );
}
