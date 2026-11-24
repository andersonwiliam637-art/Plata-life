import { NextResponse } from 'next/server';
import { getAppUserContext } from '@/lib/db/user';
import { authenticatedUser, unauthorized } from '@/lib/db/auth';

type Context = { params: Promise<{ id: string; exerciseId: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(_request: Request, context: Context) {
  const user = await authenticatedUser();
  if (!user) return unauthorized();
  const { id, exerciseId } = await context.params;
  if (!uuidPattern.test(id) || !uuidPattern.test(exerciseId)) {
    return NextResponse.json({ error: 'Ejercicio o rutina no válida.' }, { status: 400 });
  }
  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const rows = await sql`
      DELETE FROM routine_exercises re
      USING workout_routines r
      WHERE re.id = ${exerciseId}
        AND re.routine_id = ${id}
        AND r.id = re.routine_id
        AND r.user_id = ${appUserId}
        AND r.is_archived = false
      RETURNING re.id
    `;
    if (!rows[0]) return NextResponse.json({ error: 'Ejercicio no encontrado.' }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('routine exercise DELETE failed', error);
    return NextResponse.json({ error: 'No se pudo quitar el ejercicio.' }, { status: 503 });
  }
}
