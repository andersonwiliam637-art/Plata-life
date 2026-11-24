import { NextRequest, NextResponse } from 'next/server';
import { getAppUserContext, isValidIsoDate } from '@/lib/db/user';
import { authenticatedUser, unauthorized } from '@/lib/db/auth';

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return unauthorized();
  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const rows = await sql`
      SELECT id, name, target_amount::text AS target_amount,
        current_amount::text AS current_amount, currency,
        target_date::text AS target_date, status, created_at
      FROM financial_goals
      WHERE user_id = ${appUserId}
      ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'paused' THEN 1 ELSE 2 END,
        target_date ASC NULLS LAST, created_at DESC
    `;
    return NextResponse.json({ goals: rows });
  } catch (error) {
    console.error('goals GET failed', error);
    return NextResponse.json({ error: 'No se pudieron cargar tus metas.' }, { status: 503 });
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
  const target = Number(input.target_amount);
  const current = input.current_amount === undefined ? 0 : Number(input.current_amount);
  const date = input.target_date ? String(input.target_date) : null;
  if (name.length < 2 || !Number.isFinite(target) || target <= 0 ||
      target > 1000000000 || !Number.isFinite(current) || current < 0 ||
      (date !== null && !isValidIsoDate(date))) {
    return NextResponse.json({ error: 'Revisa el nombre, monto objetivo, progreso y fecha.' }, { status: 400 });
  }

  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const rows = await sql`
      INSERT INTO financial_goals (user_id, name, target_amount, current_amount, currency, target_date)
      VALUES (${appUserId}, ${name}, ${target.toFixed(2)},
        ${current.toFixed(2)}, 'GTQ', ${date})
      RETURNING id, name, target_amount::text AS target_amount,
        current_amount::text AS current_amount, currency,
        target_date::text AS target_date, status, created_at
    `;
    return NextResponse.json({ goal: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('goals POST failed', error);
    return NextResponse.json({ error: 'No se pudo guardar la meta.' }, { status: 503 });
  }
}
