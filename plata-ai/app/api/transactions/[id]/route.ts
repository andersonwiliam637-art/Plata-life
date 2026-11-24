import { NextRequest, NextResponse } from 'next/server';
import { getAppUserContext, getOrCreateCategory, isValidIsoDate } from '@/lib/db/user';
import { authenticatedUser, unauthorized } from '@/lib/db/auth';

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const expenseCategories = new Set(['Comida', 'Transporte', 'Vivienda', 'Salud', 'Fitness', 'Compras', 'Servicios', 'Otros']);
const incomeCategories = new Set(['Ingreso', 'Salario', 'Trabajo', 'Ventas', 'Otros']);

export async function PATCH(request: NextRequest, context: Context) {
  const user = await authenticatedUser();
  if (!user) return unauthorized();

  const { id } = await context.params;
  if (!uuidPattern.test(id)) return NextResponse.json({ error: 'Movimiento no válido.' }, { status: 400 });

  let body: unknown;
  try { body = await request.json(); } catch {
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
  const requestedAccountId = String(input.account_id ?? '').trim();

  if (requestedAccountId && !uuidPattern.test(requestedAccountId)) {
    return NextResponse.json({ error: 'La cuenta seleccionada no es válida.' }, { status: 400 });
  }
  if (kind !== 'income' && kind !== 'expense') {
    return NextResponse.json({ error: 'Tipo de movimiento no válido.' }, { status: 400 });
  }
  const categories = kind === 'income' ? incomeCategories : expenseCategories;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000 ||
      !categories.has(category) || !isValidIsoDate(date)) {
    return NextResponse.json({ error: 'Revisa el monto, categoría y fecha.' }, { status: 400 });
  }

  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const categoryId = await getOrCreateCategory(sql, appUserId, category, kind);
    let accountId: string | null = null;
    if (requestedAccountId) {
      const owned = await sql`
        SELECT id FROM financial_accounts
        WHERE id = ${requestedAccountId} AND user_id = ${appUserId} AND is_archived = false
        LIMIT 1
      `;
      if (!owned[0]?.id) return NextResponse.json({ error: 'La cuenta seleccionada no está disponible.' }, { status: 400 });
      accountId = String(owned[0].id);
    }
    const rows = await sql`
      UPDATE financial_transactions
      SET transaction_type = ${kind},
          amount = ${amount.toFixed(2)},
          category_id = ${categoryId},
          account_id = COALESCE(${accountId}, account_id),
          description = ${note || null},
          transaction_date = ${date},
          updated_at = now()
      WHERE id = ${id} AND user_id = ${appUserId}
      RETURNING id, account_id, transaction_type AS kind, amount::text AS amount,
        description AS note, transaction_date::text AS occurred_on, currency
    `;
    if (!rows[0]) return NextResponse.json({ error: 'Movimiento no encontrado.' }, { status: 404 });
    return NextResponse.json({ transaction: { ...rows[0], category } });
  } catch (error) {
    console.error('transactions PATCH failed', error);
    return NextResponse.json({ error: 'No se pudo actualizar el movimiento.' }, { status: 503 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  const user = await authenticatedUser();
  if (!user) return unauthorized();

  const { id } = await context.params;
  if (!uuidPattern.test(id)) return NextResponse.json({ error: 'Movimiento no válido.' }, { status: 400 });

  try {
    const { sql, appUserId } = await getAppUserContext(user);
    const rows = await sql`
      DELETE FROM financial_transactions
      WHERE id = ${id} AND user_id = ${appUserId}
      RETURNING id
    `;
    if (!rows[0]) return NextResponse.json({ error: 'Movimiento no encontrado.' }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('transactions DELETE failed', error);
    return NextResponse.json({ error: 'No se pudo eliminar el movimiento.' }, { status: 503 });
  }
}
