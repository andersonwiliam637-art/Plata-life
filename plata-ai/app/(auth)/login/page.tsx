'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email,setEmail] = useState(''); const [password,setPassword] = useState(''); const [message,setMessage] = useState(''); const [busy,setBusy] = useState(false); const router = useRouter();
  async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); setMessage(''); try { const supabase=createClient(); const {error}=await supabase.auth.signInWithPassword({email,password}); if(error) throw error; router.replace('/dashboard'); router.refresh(); } catch(err) { setMessage(err instanceof Error ? err.message : 'No se pudo iniciar sesión.'); } finally { setBusy(false); } }
  return <main className="auth-page"><Link className="brand" href="/"><span className="brand-mark">P</span> plata<span className="brand-ai">AI</span></Link><form className="auth-card" onSubmit={submit}><span className="eyebrow">QUÉ BUENO VERTE</span><h1>Inicia sesión</h1><p>Vuelve a tu espacio financiero.</p><label>Correo electrónico<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com"/></label><label>Contraseña<input type="password" autoComplete="current-password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 8 caracteres"/></label><button className="button full" disabled={busy}>{busy?'Entrando…':'Iniciar sesión'}</button>{message&&<p className="form-message" role="alert">{message}</p>}<p className="auth-switch"><Link href="/forgot-password">¿Olvidaste tu contraseña?</Link></p><p className="auth-switch">¿Aún no tienes cuenta? <Link href="/register">Crear cuenta</Link></p><p className="auth-note">Necesita configuración de Supabase para autenticar usuarios reales.</p></form></main>
}
