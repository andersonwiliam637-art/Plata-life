import { NextRequest, NextResponse } from 'next/server';
import { getAppUserContext, getOrCreateDefaultAccount } from '@/lib/db/user';
import { authenticatedUser, unauthorized } from '@/lib/db/auth';

const accountTypes = new Set(['cash', 'bank', 'credit', 'savings', 'other']);
const currencyPattern = /^[A-Z]{3}$/;

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return unauthorized();
  try {
    const { sql, appUserId } = await getAppUserContext(user);
    await getOrCreateDefaultAccount(sql, appUserId);
    const rows = await sql`
      SELECT
        a.id, a.name, a.account_type, a.currency,
        a.opening_balance::text AS opening_balance,
        (
          a.opening_balance +
          COALESCE(SUM(
            CASE
              WHEN t.transaction_type = 'income' THEN t.amount
              WHEN t.transaction_type = 'expense' THEN -t.amount
              ELSE 0
            END
          ), 0)
        )::text AS current_balance
      FROM financial_accounts a
      LEFT JOIN financial_transactions t ON t.account_id = a.id AND t.user_id = a.user_id
      WHERE a.user_id = ${appUserId} AND a.is_archived = false
      GROUP BY a.id
      ORDER BY a.created_at ASC
    `;
    return NextResponse.json({ accounts: rows });
  } catch (error) {
    console.error('accounts GET failed', error);
    return NextResponse.json({ error: 'No se pudieron cargar tus cuentas.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticatedUser();
  if (!user) return unauthorized();
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
    return NextResponse.json({ error: 'Revisa el nombre, tipo, moneda y saldo inicial.' }, { status: 400 });
  }

  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const rows = await sql`
      INSERT INTO financial_accounts (user_id, name, account_type, currency, opening_balance)
      VALUES (${appUserId}, ${name}, ${type}, ${currency}, ${openingBalance.toFixed(2)})
      RETURNING id, name, account_type, currency, opening_balance::text AS opening_balance,
        opening_balance::text AS current_balance
    `;
    return NextResponse.json({ account: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('accounts POST failed', error);
    return NextResponse.json({ error: 'No se pudo crear la cuenta.' }, { status: 503 });
  }
}
