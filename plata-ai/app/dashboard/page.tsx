import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LogOut, ShieldCheck } from 'lucide-react';
import LifeWorkspace from '@/components/life-workspace';
export default async function DashboardPage(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect('/login');
 async function signOut(){'use server';const client=await createClient();await client.auth.signOut();redirect('/login');}
 const displayName=(user.user_metadata?.full_name as string|undefined)?.split(' ')[0]||'bienvenido';
 return <main className="dashboard-page"><aside className="sidebar"><Link className="brand" href="/"><span className="brand-mark">✦</span> PLATA<span className="brand-ai"> LIFE</span></Link><div className="side-label">TU ESPACIO</div><a className="side-item active" href="#overview">◫ <span>Resumen</span></a><a className="side-item" href="#finanzas">↔ <span>Finanzas</span></a><a className="side-item" href="#fitness">⌁ <span>Fitness</span></a><a className="side-item" href="#assistant">◉ <span>Asistente</span></a><div className="sidebar-bottom"><ShieldCheck size={16}/><span>Sesión autenticada</span><form action={signOut}><button className="logout"><LogOut size={16}/> Salir</button></form></div></aside><section className="dash-main" id="overview"><header className="dash-header"><div><span className="eyebrow">TU ESPACIO PERSONAL</span><h1>Hola, {displayName}.</h1><p>Cuida tu dinero. Construye hábitos. Avanza a tu ritmo.</p></div><div className="dash-avatar">{displayName.slice(0,1).toUpperCase()}</div></header><LifeWorkspace/></section></main>
}
