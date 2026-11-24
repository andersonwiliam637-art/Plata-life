import type { User } from '@supabase/supabase-js';
import { getSql } from '@/lib/db/neon';

export async function getAppUserContext(user: User) {
  const sql = getSql();
  const rawName = user.user_metadata?.full_name;
  const displayName = typeof rawName === 'string'
    ? rawName.replace(/[$u0000-$u001f$u007f]/g, '').trim().slice(0, 80) || null
    : null;
  const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : null;

  const rows = await sql`
    INSERT INTO app_users (auth_provider, auth_subject, email, display_name)
    VALUES ('supabase', ${user.id}, ${email}, ${displayName})
    ON CONFLICT (auth_provider, auth_subject)
    DO UPDATE SET
      email = COALESCE(EXCLUDED.email, app_users.email),
      display_name = COALESCE(EXCLUDED.display_name, app_users.display_name),
      updated_at = now()
    RETURNING id
  `;

  if (!rows[0]?.id) throw new Error('No se pudo resolver la identidad interna de PLATA LIFE.');
  return { sql, appUserId: String(rows[0].id) };
}

export async function getOrCreateDefaultAccount(
  sql: ReturnType<typeof getSql>,
  appUserId: string,
) {
  const existing = await sql`
    SELECT id FROM financial_accounts
    WHERE user_id = ${appUserId} AND is_archived = false
    ORDER BY created_at ASC LIMIT 1
  `;
  if (existing[0]?.id) return String(existing[0].id);

  const created = await sql`
    INSERT INTO financial_accounts (user_id, name, account_type, currency, opening_balance)
    VALUES (${appUserId}, 'Efectivo', 'cash', 'GTQ', 0)
    RETURNING id
  `;
  if (!created[0]?.id) throw new Error('No se pudo crear la cuenta inicial.');
  return String(created[0].id);
}

export async function getOrCreateCategory(
  sql: ReturnType<typeof getSql>,
  appUserId: string,
  name: string,
  transactionType: 'income' | 'expense',
) {
  const existing = await sql`
    SELECT id FROM transaction_categories
    WHERE name = ${name} AND transaction_type = ${transactionType}
      AND (user_id = ${appUserId} OR user_id IS NULL)
    ORDER BY (user_id = ${appUserId}) DESC NULLS LAST LIMIT 1
  `;
  if (existing[0]?.id) return String(existing[0].id);

  const created = await sql`
    INSERT INTO transaction_categories (user_id, name, transaction_type, is_system)
    VALUES (${appUserId}, ${name}, ${transactionType}, false)
    RETURNING id
  `;
  if (!created[0]?.id) throw new Error('No se pudo crear la categoría.');
  return String(created[0].id);
}

export function isValidIsoDate(value: string): boolean {
  if (!/^$d{4}-$d{2}-$d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
}
