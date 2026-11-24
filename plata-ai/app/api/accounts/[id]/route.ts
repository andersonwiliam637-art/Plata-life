import { NextRequest, NextResponse } from 'next/server';
import { getAppUserContext } from '@/lib/db/user';
import { authenticatedUser, unauthorized } from '@/lib/db/auth';

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const accountTypes = new Set(['cash', 'bank', 'credit', 'savings', 'other']);
const currencyPattern = /^[A-Z]{3}$/;

export async function PATCH(request: NextRequest, context: Context) {
  const user = await authenticatedUser();
  if (!user) return unauthorized();
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return NextResponse.json({ error: 'Cuenta no válida.' }, { status: 400 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });

  const input = body as Record<string, unknown>;
  const name = String(input.name ?? '').trim().slice(0, 60);
  const type = String(input.account_type ?? 'cash');
  const currency = String(input.currency ?? 'GTQ').toUpperCase();
  const openingBalance = Number(input.opening_balance ?? 0);
  if (name.length < 2 || !accountTypes.has(type) || !currencyPattern.test(currency) ||
      !Number.isFinite(openingBalance) || openingBalance < 0 || openingBalance > 1000000000) {
    return NextResponse.json({ error: 'Revisa los datos de la cuenta.' }, { status: 400 });
  }

  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const rows = await sql`
      UPDATE financial_accounts
      SET name = ${name}, account_type = ${type},
        currency = ${currency}, opening_balance = ${openingBalance.toFixed(2)},
        updated_at = now()
      WHERE id = ${id} AND user_id = ${appUserId} AND is_archived = false
      RETURNING id, name, account_type, currency,
        opening_balance::text AS opening_balance, opening_balance::text AS current_balance
    `;
    if (!rows[0]) return NextResponse.json({ error: 'Cuenta no encontrada.' }, { status: 404 });
    return NextResponse.json({ account: rows[0] });
  } catch (error) {
    console.error('accounts PATCH failed', error);
    return NextResponse.json({ error: 'No se pudo actualizar la cuenta.' }, { status: 503 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  const user = await authenticatedUser();
  if (!user) return unauthorized();
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return NextResponse.json({ error: 'Cuenta no válida.' }, { status: 400 });

  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const activeAccounts = await sql`
      SELECT COUNT(*)::int AS total FROM financial_accounts
      WHERE user_id = ${appUserId} AND is_archived = false
    `;
    if (Number(activeAccounts[0]?.total ?? 0) <= 1) {
      return NextResponse.json({ error: 'Mantén al menos una cuenta activa.' }, { status: 409 });
    }
    const rows = await sql`
      UPDATE financial_accounts
      SET is_archived = true, updated_at = now()
      WHERE id = ${id} AND user_id = ${appUserId} AND is_archived = false
      RETURNING id
    `;
    if (!rows[0]) return NextResponse.json({ error: 'Cuenta no encontrada.' }, { status: 404 });
    return NextResponse.json({ archived: true });
  } catch (error) {
    console.error('accounts DELETE failed', error);
    return NextResponse.json({ error: 'No se pudo archivar la cuenta.' }, { status: 503 });
  }
}
