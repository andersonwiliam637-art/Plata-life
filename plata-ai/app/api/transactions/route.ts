import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db/neon';
import { authenticatedUser, unauthorized } from '@/lib/db/auth';

const categories = new Set(['Comida','Transporte','Vivienda','Salud','Fitness','Compras','Servicios','Ingreso','Otros']);
export async function GET() {
  const user = await authenticatedUser(); if (!user) return unauthorized();
  try {
    const sql = getSql();
    const rows = await sql`SELECT id, kind, amount::text, category, note, occurred_on::text AS occurred_on, created_at FROM transactions WHERE user_id = ${user.id} ORDER BY occurred_on DESC, created_at DESC LIMIT 100`;
    return NextResponse.json({ transactions: rows });
  } catch (e) { console.error('transactions GET failed', e); return NextResponse.json({ error: 'No se pudieron cargar los movimientos. Revisa la configuración de Neon y ejecuta la migración.' }, { status: 503 }); }
}
export async function POST(req: NextRequest) {
  const user = await authenticatedUser(); if (!user) return unauthorized();
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }); }
  const kind = body?.kind, amount = Number(body?.amount), category = String(body?.category ?? ''), note = String(body?.note ?? '').trim().slice(0, 160), date = String(body?.occurred_on ?? '');
  if (!['income','expense'].includes(kind) || !Number.isFinite(amount) || amount <= 0 || amount > 100000000 || !categories.has(category) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'Revisa tipo, monto, categoría y fecha.' }, { status: 400 });
  try {
    const sql = getSql();
    const rows = await sql`INSERT INTO transactions (user_id, kind, amount, category, note, occurred_on) VALUES (${user.id}, ${kind}, ${amount.toFixed(2)}, ${category}, ${note || null}, ${date}) RETURNING id, kind, amount::text, category, note, occurred_on::text AS occurred_on, created_at`;
    return NextResponse.json({ transaction: rows[0] }, { status: 201 });
  } catch (e) { console.error('transactions POST failed', e); return NextResponse.json({ error: 'No se pudo guardar. Comprueba la migración de Neon.' }, { status: 503 }); }
}
