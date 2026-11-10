import { neon } from '@neondatabase/serverless';

/** Neon is the application-data database. Never expose DATABASE_URL to the browser. */
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL no está configurada. Añade la cadena de conexión de Neon en .env.local.');
  return neon(url);
}
