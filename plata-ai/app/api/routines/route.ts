import { NextRequest, NextResponse } from 'next/server';
import { getAppUserContext } from '@/lib/db/user';
import { authenticatedUser, unauthorized } from '@/lib/db/auth';

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return unauthorized();
  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const rows = await sql`
      SELECT
        r.id, r.name, r.description, r.days_per_week, r.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', re.id,
              'exercise_id', re.exercise_id,
              'exercise_name', re.exercise_name,
              'sort_order', re.sort_order,
              'target_sets', re.target_sets,
              'target_reps', re.target_reps,
              'rest_seconds', re.rest_seconds,
              'notes', re.notes
            ) ORDER BY re.sort_order
          ) FILTER (WHERE re.id IS NOT NULL),
          '[]'::json
        ) AS exercises
      FROM workout_routines r
      LEFT JOIN routine_exercises re ON re.routine_id = r.id
      WHERE r.user_id = ${appUserId} AND r.is_archived = false
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `;
    return NextResponse.json({ routines: rows });
  } catch (error) {
    console.error('routines GET failed', error);
    return NextResponse.json({ error: 'No se pudieron cargar tus rutinas.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticatedUser();
  if (!user) return unauthorized();
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });

  const input = body as Record<string, unknown>;
  const name = String(input.name ?? '').trim().slice(0, 80);
  const description = String(input.description ?? '').trim().slice(0, 500);
  const days = input.days_per_week === undefined || input.days_per_week === '' ? null : Number(input.days_per_week);
  if (name.length < 2 || (days !== null && (!Number.isInteger(days) || days < 1 || days > 7))) {
    return NextResponse.json({ error: 'Añade un nombre y días por semana entre 1 y 7.' }, { status: 400 });
  }

  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const rows = await sql`
      INSERT INTO workout_routines (user_id, name, description, days_per_week)
      VALUES (${appUserId}, ${name}, ${description || null}, ${days})
      RETURNING id, name, description, days_per_week, created_at
    `;
    return NextResponse.json({ routine: { ...rows[0], exercises: [] } }, { status: 201 });
  } catch (error) {
    console.error('routines POST failed', error);
    return NextResponse.json({ error: 'No se pudo crear la rutina.' }, { status: 503 });
  }
}
