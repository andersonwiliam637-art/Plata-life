import { NextRequest, NextResponse } from 'next/server';
import { getAppUserContext } from '@/lib/db/user';
import { authenticatedUser, unauthorized } from '@/lib/db/auth';

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest, context: Context) {
  const user = await authenticatedUser();
  if (!user) return unauthorized();
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return NextResponse.json({ error: 'Rutina no válida.' }, { status: 400 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });

  const input = body as Record<string, unknown>;
  const exerciseId = input.exercise_id ? String(input.exercise_id) : null;
  const exerciseName = String(input.exercise_name ?? '').trim().slice(0, 100);
  const targetSets = input.target_sets === undefined || input.target_sets === '' ? null : Number(input.target_sets);
  const targetReps = String(input.target_reps ?? '').trim().slice(0, 40) || null;
  const restSeconds = input.rest_seconds === undefined || input.rest_seconds === '' ? null : Number(input.rest_seconds);
  const notes = String(input.notes ?? '').trim().slice(0, 250) || null;

  if ((exerciseId && !uuidPattern.test(exerciseId)) || exerciseName.length < 2 ||
      (targetSets !== null && (!Number.isInteger(targetSets) || targetSets < 1 || targetSets > 50)) ||
      (restSeconds !== null && (!Number.isInteger(restSeconds) || restSeconds < 0 || restSeconds > 3600))) {
    return NextResponse.json({ error: 'Revisa el ejercicio, series y descanso.' }, { status: 400 });
  }

  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const routine = await sql`
      SELECT id FROM workout_routines
      WHERE id = ${id} AND user_id = ${appUserId} AND is_archived = false
      LIMIT 1
    `;
    if (!routine[0]) return NextResponse.json({ error: 'Rutina no encontrada.' }, { status: 404 });

    if (exerciseId) {
      const catalog = await sql`
        SELECT id, name FROM exercises WHERE id = ${exerciseId} AND is_public = true LIMIT 1
      `;
      if (!catalog[0]) return NextResponse.json({ error: 'El ejercicio no existe en el catálogo.' }, { status: 400 });
    }

    const maxOrder = await sql`
      SELECT COALESCE(MAX(sort_order), -1)::int AS last_order
      FROM routine_exercises WHERE routine_id = ${id}
    `;
    const rows = await sql`
      INSERT INTO routine_exercises
        (routine_id, exercise_id, exercise_name, sort_order, target_sets, target_reps, rest_seconds, notes)
      VALUES
        (${id}, ${exerciseId}, ${exerciseName},
         ${Number(maxOrder[0]?.last_order ?? -1) + 1}, ${targetSets},
         ${targetReps}, ${restSeconds}, ${notes})
      RETURNING id, exercise_id, exercise_name, sort_order, target_sets, target_reps, rest_seconds, notes
    `;
    return NextResponse.json({ exercise: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('routine exercise POST failed', error);
    return NextResponse.json({ error: 'No se pudo añadir el ejercicio.' }, { status: 503 });
  }
}
