import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'PLATA AI — Entiende tu dinero', description: 'Finanzas personales inteligentes, diseñadas para Guatemala.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
