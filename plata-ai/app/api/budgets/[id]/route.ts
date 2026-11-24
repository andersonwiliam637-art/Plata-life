import { NextRequest, NextResponse } from 'next/server';
import { getAppUserContext, getOrCreateCategory, isValidIsoDate } from '@/lib/db/user';
import { authenticatedUser, unauthorized } from '@/lib/db/auth';

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const periods = new Set(['weekly', 'monthly', 'yearly']);

export async function PATCH(request: NextRequest, context: Context) {
  const user = await authenticatedUser();
  if (!user) return unauthorized();
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return NextResponse.json({ error: 'Presupuesto no válido.' }, { status: 400 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });

  const input = body as Record<string, unknown>;
  const name = String(input.name ?? '').trim().slice(0, 100);
  const amount = Number(input.amount_limit);
  const period = String(input.period ?? '');
  const startsOn = String(input.starts_on ?? '');
  const endsOn = input.ends_on ? String(input.ends_on) : null;
  const category = String(input.category ?? '').trim();
  if (name.length < 2 || !Number.isFinite(amount) || amount <= 0 || amount > 1000000000 ||
      !periods.has(period) || !isValidIsoDate(startsOn) ||
      (endsOn !== null && (!isValidIsoDate(endsOn) || endsOn < startsOn))) {
    return NextResponse.json({ error: 'Revisa los valores del presupuesto.' }, { status: 400 });
  }

  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const categoryId = category ? await getOrCreateCategory(sql, appUserId, category, 'expense') : null;
    const endRows = endsOn ? [] : await sql`
      SELECT CASE
        WHEN ${period} = 'weekly' THEN (${startsOn}::date + interval '6 days')::date::text
        WHEN ${period} = 'monthly' THEN ((${startsOn}::date + interval '1 month') - interval '1 day')::date::text
        ELSE ((${startsOn}::date + interval '1 year') - interval '1 day')::date::text
      END AS period_end
    `;
    const effectiveEndOn = endsOn ?? String(endRows[0]?.period_end ?? startsOn);
    const rows = await sql`
      UPDATE budgets
      SET name = ${name}, amount_limit = ${amount.toFixed(2)},
        period = ${period}, starts_on = ${startsOn},
        ends_on = ${effectiveEndOn}, category_id = ${categoryId}
      WHERE id = ${id} AND user_id = ${appUserId}
      RETURNING id, name, amount_limit::text AS amount_limit, currency,
        period, starts_on::text AS starts_on, ends_on::text AS ends_on, category_id
    `;
    if (!rows[0]) return NextResponse.json({ error: 'Presupuesto no encontrado.' }, { status: 404 });
    return NextResponse.json({ budget: { ...rows[0], category } });
  } catch (error) {
    console.error('budgets PATCH failed', error);
    return NextResponse.json({ error: 'No se pudo actualizar el presupuesto.' }, { status: 503 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  const user = await authenticatedUser();
  if (!user) return unauthorized();
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return NextResponse.json({ error: 'Presupuesto no válido.' }, { status: 400 });
  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const rows = await sql`
      DELETE FROM budgets WHERE id = ${id} AND user_id = ${appUserId}
      RETURNING id
    `;
    if (!rows[0]) return NextResponse.json({ error: 'Presupuesto no encontrado.' }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('budgets DELETE failed', error);
    return NextResponse.json({ error: 'No se pudo eliminar el presupuesto.' }, { status: 503 });
  }
}
