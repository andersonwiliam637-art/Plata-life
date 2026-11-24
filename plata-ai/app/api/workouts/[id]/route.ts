import { NextRequest, NextResponse } from 'next/server';
import { getAppUserContext, isValidIsoDate } from '@/lib/db/user';
import { authenticatedUser, unauthorized } from '@/lib/db/auth';

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: NextRequest, context: Context) {
  const user = await authenticatedUser();
  if (!user) return unauthorized();

  const { id } = await context.params;
  if (!uuidPattern.test(id)) return NextResponse.json({ error: 'Sesión no válida.' }, { status: 400 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const title = String(input.title ?? '').trim().slice(0, 80);
  const durationMinutes = Number(input.duration_minutes);
  const notes = String(input.notes ?? '').trim().slice(0, 500);
  const date = String(input.completed_on ?? '');
  if (title.length < 2 || !Number.isInteger(durationMinutes) ||
      durationMinutes < 1 || durationMinutes > 600 || !isValidIsoDate(date)) {
    return NextResponse.json({ error: 'Revisa el nombre, duración y fecha.' }, { status: 400 });
  }

  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const rows = await sql`
      WITH session_start AS (
        SELECT (${date}::date::timestamp AT TIME ZONE 'America/Guatemala') AS started_at
      )
      UPDATE workout_sessions AS session
      SET title = ${title},
          started_at = session_start.started_at,
          ended_at = session_start.started_at + make_interval(mins => ${durationMinutes}),
          duration_seconds = ${durationMinutes * 60},
          notes = ${notes || null}
      FROM session_start
      WHERE session.id = ${id} AND session.user_id = ${appUserId}
      RETURNING session.id, session.title, session.duration_seconds / 60 AS duration_minutes,
        session.notes,
        (session.started_at AT TIME ZONE 'America/Guatemala')::date::text AS completed_on,
        session.created_at
    `;
    if (!rows[0]) return NextResponse.json({ error: 'Entrenamiento no encontrado.' }, { status: 404 });
    return NextResponse.json({ workout: rows[0] });
  } catch (error) {
    console.error('workouts PATCH failed', error);
    return NextResponse.json({ error: 'No se pudo actualizar el entrenamiento.' }, { status: 503 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  const user = await authenticatedUser();
  if (!user) return unauthorized();

  const { id } = await context.params;
  if (!uuidPattern.test(id)) return NextResponse.json({ error: 'Sesión no válida.' }, { status: 400 });

  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const rows = await sql`
      DELETE FROM workout_sessions
      WHERE id = ${id} AND user_id = ${appUserId}
      RETURNING id
    `;
    if (!rows[0]) return NextResponse.json({ error: 'Entrenamiento no encontrado.' }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('workouts DELETE failed', error);
    return NextResponse.json({ error: 'No se pudo eliminar el entrenamiento.' }, { status: 503 });
  }
}
