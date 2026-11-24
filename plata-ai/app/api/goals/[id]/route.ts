import { NextRequest, NextResponse } from 'next/server';
import { getAppUserContext, isValidIsoDate } from '@/lib/db/user';
import { authenticatedUser, unauthorized } from '@/lib/db/auth';

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const statuses = new Set(['active', 'completed', 'paused', 'cancelled']);

export async function PATCH(request: NextRequest, context: Context) {
  const user = await authenticatedUser();
  if (!user) return unauthorized();
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return NextResponse.json({ error: 'Meta no válida.' }, { status: 400 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });

  const input = body as Record<string, unknown>;
  const name = String(input.name ?? '').trim().slice(0, 100);
  const target = Number(input.target_amount);
  const current = Number(input.current_amount);
  const date = input.target_date ? String(input.target_date) : null;
  const status = String(input.status ?? 'active');
  if (name.length < 2 || !Number.isFinite(target) || target <= 0 || target > 1000000000 ||
      !Number.isFinite(current) || current < 0 || !statuses.has(status) ||
      (date !== null && !isValidIsoDate(date))) {
    return NextResponse.json({ error: 'Revisa los valores de la meta.' }, { status: 400 });
  }

  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const rows = await sql`
      UPDATE financial_goals
      SET name = ${name}, target_amount = ${target.toFixed(2)},
        current_amount = ${current.toFixed(2)}, target_date = ${date},
        status = ${status}, updated_at = now()
      WHERE id = ${id} AND user_id = ${appUserId}
      RETURNING id, name, target_amount::text AS target_amount,
        current_amount::text AS current_amount, currency,
        target_date::text AS target_date, status, created_at
    `;
    if (!rows[0]) return NextResponse.json({ error: 'Meta no encontrada.' }, { status: 404 });
    return NextResponse.json({ goal: rows[0] });
  } catch (error) {
    console.error('goals PATCH failed', error);
    return NextResponse.json({ error: 'No se pudo actualizar la meta.' }, { status: 503 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  const user = await authenticatedUser();
  if (!user) return unauthorized();
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return NextResponse.json({ error: 'Meta no válida.' }, { status: 400 });
  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const rows = await sql`
      DELETE FROM financial_goals WHERE id = ${id} AND user_id = ${appUserId}
      RETURNING id
    `;
    if (!rows[0]) return NextResponse.json({ error: 'Meta no encontrada.' }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('goals DELETE failed', error);
    return NextResponse.json({ error: 'No se pudo eliminar la meta.' }, { status: 503 });
  }
}
