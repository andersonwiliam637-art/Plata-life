import { NextRequest, NextResponse } from 'next/server';
import { getAppUserContext, getOrCreateCategory, isValidIsoDate } from '@/lib/db/user';
import { authenticatedUser, unauthorized } from '@/lib/db/auth';

const periods = new Set(['weekly', 'monthly', 'yearly']);

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return unauthorized();
  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const rows = await sql`
      SELECT
        b.id, b.name, b.amount_limit::text AS amount_limit,
        b.currency, b.period, b.starts_on::text AS starts_on,
        b.ends_on::text AS ends_on, b.category_id,
        c.name AS category,
        COALESCE(usage.spent, 0)::text AS spent,
        GREATEST(b.amount_limit - COALESCE(usage.spent, 0), 0)::text AS remaining
      FROM budgets b
      LEFT JOIN transaction_categories c ON c.id = b.category_id
      LEFT JOIN LATERAL (
        SELECT SUM(t.amount) AS spent
        FROM financial_transactions t
        WHERE t.user_id = b.user_id
          AND t.transaction_type = 'expense'
          AND t.transaction_date >= b.starts_on
          AND (b.ends_on IS NULL OR t.transaction_date <= b.ends_on)
          AND (b.category_id IS NULL OR t.category_id = b.category_id)
      ) usage ON true
      WHERE b.user_id = ${appUserId}
      ORDER BY b.starts_on DESC, b.created_at DESC
    `;
    return NextResponse.json({ budgets: rows });
  } catch (error) {
    console.error('budgets GET failed', error);
    return NextResponse.json({ error: 'No se pudieron cargar tus presupuestos.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticatedUser();
  if (!user) return unauthorized();
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
  }

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
    return NextResponse.json({ error: 'Revisa el nombre, límite, periodo y fechas.' }, { status: 400 });
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
      INSERT INTO budgets (user_id, category_id, name, amount_limit, currency, period, starts_on, ends_on)
      VALUES (${appUserId}, ${categoryId}, ${name},
        ${amount.toFixed(2)}, 'GTQ', ${period}, ${startsOn}, ${effectiveEndOn})
      RETURNING id, name, amount_limit::text AS amount_limit, currency, period,
        starts_on::text AS starts_on, ends_on::text AS ends_on, category_id
    `;
    return NextResponse.json({ budget: { ...rows[0], category, spent: '0', remaining: amount.toFixed(2) } }, { status: 201 });
  } catch (error) {
    console.error('budgets POST failed', error);
    return NextResponse.json({ error: 'No se pudo guardar el presupuesto.' }, { status: 503 });
  }
}
