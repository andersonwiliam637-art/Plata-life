import { NextRequest, NextResponse } from 'next/server';
import { getAppUserContext } from '@/lib/db/user';
import { authenticatedUser, unauthorized } from '@/lib/db/auth';

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: NextRequest, context: Context) {
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
  const name = String(input.name ?? '').trim().slice(0, 80);
  const description = String(input.description ?? '').trim().slice(0, 500);
  const days = input.days_per_week === undefined || input.days_per_week === '' ? null : Number(input.days_per_week);
  if (name.length < 2 || (days !== null && (!Number.isInteger(days) || days < 1 || days > 7))) {
    return NextResponse.json({ error: 'Revisa el nombre y los días por semana.' }, { status: 400 });
  }

  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const rows = await sql`
      UPDATE workout_routines
      SET name = ${name}, description = ${description || null},
        days_per_week = ${days}, updated_at = now()
      WHERE id = ${id} AND user_id = ${appUserId} AND is_archived = false
      RETURNING id, name, description, days_per_week, created_at
    `;
    if (!rows[0]) return NextResponse.json({ error: 'Rutina no encontrada.' }, { status: 404 });
    return NextResponse.json({ routine: rows[0] });
  } catch (error) {
    console.error('routines PATCH failed', error);
    return NextResponse.json({ error: 'No se pudo actualizar la rutina.' }, { status: 503 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  const user = await authenticatedUser();
  if (!user) return unauthorized();
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return NextResponse.json({ error: 'Rutina no válida.' }, { status: 400 });
  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const rows = await sql`
      UPDATE workout_routines SET is_archived = true, updated_at = now()
      WHERE id = ${id} AND user_id = ${appUserId} AND is_archived = false
      RETURNING id
    `;
    if (!rows[0]) return NextResponse.json({ error: 'Rutina no encontrada.' }, { status: 404 });
    return NextResponse.json({ archived: true });
  } catch (error) {
    console.error('routines DELETE failed', error);
    return NextResponse.json({ error: 'No se pudo archivar la rutina.' }, { status: 503 });
  }
}
