import { NextRequest, NextResponse } from 'next/server';
import { getAppUserContext, isValidIsoDate } from '@/lib/db/user';
import { authenticatedUser, unauthorized } from '@/lib/db/auth';

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return unauthorized();

  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const [rows, countRows] = await Promise.all([
      sql`
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
      `,
      sql`SELECT COUNT(*)::int AS total FROM workout_sessions WHERE user_id = ${appUserId}`,
    ]);
    return NextResponse.json({ workouts: rows, totalCount: Number(countRows[0]?.total ?? 0) });
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
  const routineId = input.routine_id ? String(input.routine_id) : null;

  if (
    title.length < 2 ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > 600 ||
    !isValidIsoDate(completedOn) ||
    (routineId !== null && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(routineId))
  ) {
    return NextResponse.json(
      { error: 'Añade un nombre, duración de 1 a 600 minutos y una fecha válida.' },
      { status: 400 },
    );
  }

  try {
    const { sql, appUserId } = await getAppUserContext(user);
    if (routineId) {
      const routine = await sql`
        SELECT id, name FROM workout_routines
        WHERE id = ${routineId} AND user_id = ${appUserId} AND is_archived = false
        LIMIT 1
      `;
      if (!routine[0]) return NextResponse.json({ error: 'Rutina no encontrada.' }, { status: 404 });

      const routineRows = await sql`
        WITH session_start AS (
          SELECT (${completedOn}::date::timestamp AT TIME ZONE 'America/Guatemala') AS started_at
        ),
        created_session AS (
          INSERT INTO workout_sessions
            (user_id, routine_id, title, started_at, ended_at, duration_seconds, notes)
          SELECT
            ${appUserId}, r.id, ${title || routine[0].name},
            session_start.started_at,
            session_start.started_at + make_interval(mins => ${durationMinutes}),
            ${durationMinutes * 60}, ${notes || null}
          FROM workout_routines r
          CROSS JOIN session_start
          WHERE r.id = ${routineId} AND r.user_id = ${appUserId} AND r.is_archived = false
          RETURNING id, title, duration_seconds, notes, started_at, created_at
        ),
        copied_exercises AS (
          INSERT INTO workout_session_exercises
            (session_id, exercise_id, exercise_name, sort_order, sets_completed, notes)
          SELECT
            created_session.id, routine_exercises.exercise_id,
            routine_exercises.exercise_name, routine_exercises.sort_order,
            '[]'::jsonb, routine_exercises.notes
          FROM created_session
          JOIN routine_exercises ON routine_exercises.routine_id = ${routineId}
          RETURNING id
        )
        SELECT id, title, duration_seconds / 60 AS duration_minutes, notes,
          (started_at AT TIME ZONE 'America/Guatemala')::date::text AS completed_on,
          created_at
        FROM created_session
      `;
      if (!routineRows[0]) return NextResponse.json({ error: 'No se pudo iniciar la sesión.' }, { status: 409 });
      return NextResponse.json({ workout: routineRows[0] }, { status: 201 });
    }

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
