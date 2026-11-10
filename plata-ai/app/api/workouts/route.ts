import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db/neon';
import { authenticatedUser, unauthorized } from '@/lib/db/auth';
export async function GET() {
  const user = await authenticatedUser(); if (!user) return unauthorized();
  try { const sql = getSql(); const rows = await sql`SELECT id, title, duration_minutes, notes, completed_on::text AS completed_on, created_at FROM workouts WHERE user_id = ${user.id} ORDER BY completed_on DESC, created_at DESC LIMIT 50`; return NextResponse.json({ workouts: rows }); }
  catch (e) { console.error('workouts GET failed', e); return NextResponse.json({ error: 'No se pudieron cargar los entrenamientos. Revisa la configuración de Neon y ejecuta la migración.' }, { status: 503 }); }
}
export async function POST(req: NextRequest) {
  const user = await authenticatedUser(); if (!user) return unauthorized();
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }); }
  const title = String(body?.title ?? '').trim().slice(0, 80), duration = Number(body?.duration_minutes), notes = String(body?.notes ?? '').trim().slice(0, 500), date = String(body?.completed_on ?? '');
  if (title.length < 2 || !Number.isInteger(duration) || duration < 1 || duration > 600 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'Añade un nombre, duración de 1 a 600 minutos y fecha válida.' }, { status: 400 });
  try { const sql = getSql(); const rows = await sql`INSERT INTO workouts (user_id, title, duration_minutes, notes, completed_on) VALUES (${user.id}, ${title}, ${duration}, ${notes || null}, ${date}) RETURNING id, title, duration_minutes, notes, completed_on::text AS completed_on, created_at`; return NextResponse.json({ workout: rows[0] }, { status: 201 }); }
  catch (e) { console.error('workouts POST failed', e); return NextResponse.json({ error: 'No se pudo guardar el entrenamiento. Comprueba la migración de Neon.' }, { status: 503 }); }
}
