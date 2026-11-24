import { NextRequest, NextResponse } from 'next/server';
import { getAppUserContext, getOrCreateCategory, getOrCreateDefaultAccount, isValidIsoDate } from '@/lib/db/user';
import { authenticatedUser, unauthorized } from '@/lib/db/auth';

const expenseCategories = new Set(['Comida', 'Transporte', 'Vivienda', 'Salud', 'Fitness', 'Compras', 'Servicios', 'Otros']);
const incomeCategories = new Set(['Ingreso', 'Salario', 'Trabajo', 'Ventas', 'Otros']);

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return unauthorized();

  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const rows = await sql`
      SELECT
        t.id,
        t.transaction_type AS kind,
        t.amount::text AS amount,
        COALESCE(c.name, 'Otros') AS category,
        t.description AS note,
        t.transaction_date::text AS occurred_on,
        a.name AS account_name,
        t.currency
      FROM financial_transactions t
      LEFT JOIN transaction_categories c ON c.id = t.category_id
      INNER JOIN financial_accounts a ON a.id = t.account_id
      WHERE t.user_id = ${appUserId}
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT 100
    `;
    return NextResponse.json({ transactions: rows });
  } catch (error) {
    console.error('transactions GET failed', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar los movimientos. Comprueba la conexión de Neon.' },
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
  const kind = input.kind;
  const amount = Number(input.amount);
  const category = String(input.category ?? '').trim();
  const note = String(input.note ?? '').trim().slice(0, 160);
  const date = String(input.occurred_on ?? '');

  if (kind !== 'income' && kind !== 'expense') {
    return NextResponse.json({ error: 'El tipo de movimiento no es válido.' }, { status: 400 });
  }
  const allowedCategories = kind === 'income' ? incomeCategories : expenseCategories;
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 100000000 ||
    !allowedCategories.has(category) ||
    !isValidIsoDate(date)
  ) {
    return NextResponse.json(
      { error: 'Revisa el tipo, monto, categoría y fecha del movimiento.' },
      { status: 400 },
    );
  }

  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const accountId = await getOrCreateDefaultAccount(sql, appUserId);
    const categoryId = await getOrCreateCategory(sql, appUserId, category, kind);
    const rows = await sql`
      INSERT INTO financial_transactions
        (user_id, account_id, category_id, transaction_type, amount, currency, description, transaction_date)
      VALUES
        (${appUserId}, ${accountId}, ${categoryId}, ${kind},
         ${amount.toFixed(2)}, 'GTQ', ${note || null}, ${date})
      RETURNING id, transaction_type AS kind, amount::text AS amount,
        description AS note, transaction_date::text AS occurred_on, currency
    `;

    return NextResponse.json({
      transaction: {
        ...rows[0],
        category,
        account_name: 'Efectivo',
      },
    }, { status: 201 });
  } catch (error) {
    console.error('transactions POST failed', error);
    return NextResponse.json(
      { error: 'No se pudo guardar el movimiento. Inténtalo de nuevo.' },
      { status: 503 },
    );
  }
}
