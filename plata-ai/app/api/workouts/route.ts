import { NextRequest, NextResponse } from 'next/server';
import { getAppUserContext, isValidIsoDate } from '@/lib/db/user';
import { authenticatedUser, unauthorized } from '@/lib/db/auth';

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return unauthorized();

  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const rows = await sql`
      SELECT
        id,
        title,
        COALESCE(duration_seconds, 0) / 60 AS duration_minutes,
        notes,
        (started_at AT TIME ZONE 'America/Guatemala')::date::text AS completed_on,
        created_at
      FROM workout_sessions
      WHERE user_id = ${appUserId}
      ORDER BY started_at DESC, created_at DESC
      LIMIT 50
    `;
    return NextResponse.json({ workouts: rows });
  } catch (error) {
    console.error('workouts GET failed', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar los entrenamientos. Comprueba la conexión de Neon.' },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticatedUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const title = String(input.title ?? '').trim().slice(0, 80);
  const durationMinutes = Number(input.duration_minutes);
  const notes = String(input.notes ?? '').trim().slice(0, 500);
  const completedOn = String(input.completed_on ?? '');

  if (
    title.length < 2 ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > 600 ||
    !isValidIsoDate(completedOn)
  ) {
    return NextResponse.json(
      { error: 'Añade un nombre, duración de 1 a 600 minutos y una fecha válida.' },
      { status: 400 },
    );
  }

  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const rows = await sql`
      WITH session_start AS (
        SELECT (${completedOn}::date::timestamp AT TIME ZONE 'America/Guatemala') AS started_at
      )
      INSERT INTO workout_sessions
        (user_id, title, started_at, ended_at, duration_seconds, notes)
      SELECT
        ${appUserId},
        ${title},
        session_start.started_at,
        session_start.started_at + make_interval(mins => ${durationMinutes}),
        ${durationMinutes * 60},
        ${notes || null}
      FROM session_start
      RETURNING
        id,
        title,
        duration_seconds / 60 AS duration_minutes,
        notes,
        (started_at AT TIME ZONE 'America/Guatemala')::date::text AS completed_on,
        created_at
    `;

    return NextResponse.json({ workout: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('workouts POST failed', error);
    return NextResponse.json(
      { error: 'No se pudo guardar el entrenamiento. Inténtalo de nuevo.' },
      { status: 503 },
    );
  }
}
