import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function authenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}
export function unauthorized() {
  return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 });
}
