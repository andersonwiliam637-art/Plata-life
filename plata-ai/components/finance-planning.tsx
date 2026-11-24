'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert, Flag, PiggyBank, Plus, Trash2 } from 'lucide-react';

type Goal = {
  id: string; name: string; target_amount: string; current_amount: string;
  currency: string; target_date: string | null;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
};
type Budget = {
  id: string; name: string; amount_limit: string; currency: string;
  period: 'weekly' | 'monthly' | 'yearly'; starts_on: string; ends_on: string | null;
  category: string | null; spent: string; remaining: string;
};

const money = (value: number) => new Intl.NumberFormat('es-GT', {
  style: 'currency', currency: 'GTQ', maximumFractionDigits: 2,
}).format(value);

function guatemalaToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala' }).format(new Date());
}

export default function FinancePlanning() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [budgetName, setBudgetName] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetStart, setBudgetStart] = useState(guatemalaToday());
  const [budgetEnd, setBudgetEnd] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [goalResponse, budgetResponse] = await Promise.all([
        fetch('/api/goals', { cache: 'no-store' }),
        fetch('/api/budgets', { cache: 'no-store' }),
      ]);
      const [goalData, budgetData] = await Promise.all([goalResponse.json(), budgetResponse.json()]);
      if (!goalResponse.ok) throw new Error(goalData.error || 'No se pudieron cargar las metas.');
      if (!budgetResponse.ok) throw new Error(budgetData.error || 'No se pudieron cargar los presupuestos.');
      setGoals(goalData.goals ?? []);
      setBudgets(budgetData.budgets ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar la planificación.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/goals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: goalName, target_amount: Number(goalTarget), target_date: goalDate || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar la meta.');
      setGoals(current => [data.goal, ...current]);
      setGoalName(''); setGoalTarget(''); setGoalDate('');
      setNotice('Meta financiera creada.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la meta.');
    } finally { setSaving(false); }
  }

  async function createBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/budgets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: budgetName, amount_limit: Number(budgetLimit), period: budgetPeriod,
          category: budgetCategory, starts_on: budgetStart, ends_on: budgetEnd || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar el presupuesto.');
      setBudgets(current => [data.budget, ...current]);
      setBudgetName(''); setBudgetLimit(''); setBudgetCategory(''); setBudgetEnd('');
      setNotice('Presupuesto creado.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el presupuesto.');
    } finally { setSaving(false); }
  }

  async function deleteGoal(goal: Goal) {
    if (!window.confirm('¿Eliminar esta meta financiera?')) return;
    setError(''); setNotice('');
    try {
      const response = await fetch('/api/goals/' + goal.id, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo eliminar la meta.');
      setGoals(current => current.filter(item => item.id !== goal.id));
      setNotice('Meta eliminada.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar la meta.');
    }
  }

  async function deleteBudget(budget: Budget) {
    if (!window.confirm('¿Eliminar este presupuesto?')) return;
    setError(''); setNotice('');
    try {
      const response = await fetch('/api/budgets/' + budget.id, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo eliminar el presupuesto.');
      setBudgets(current => current.filter(item => item.id !== budget.id));
      setNotice('Presupuesto eliminado.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar el presupuesto.');
    }
  }

  return (
    <section className="life-planning">
      <div className="life-section-title">
        <span className="eyebrow">PLANIFICACIÓN FINANCIERA</span>
        <h2>Organiza lo que viene.</h2>
        <p>Define límites de gasto y metas de ahorro a partir de tus propios registros.</p>
      </div>
      {error && <div className="life-alert error"><CircleAlert size={18}/><span>{error}</span><button type="button" onClick={() => void load()}>Reintentar</button></div>}
      {notice && <div className="life-alert success"><CheckCircle2 size={18}/>{notice}<button type="button" onClick={() => setNotice('')} aria-label="Cerrar aviso">×</button></div>}

      <div className="life-columns">
        <section className="life-card">
          <div className="life-card-heading">
            <div className="life-icon finance"><Flag size={20}/></div>
            <div><h3>Metas financieras</h3><p>Seguimiento de objetivos personales</p></div>
          </div>
          <form className="life-form" onSubmit={createGoal}>
            <label>Nombre de la meta<input required minLength={2} maxLength={100} value={goalName} onChange={event => setGoalName(event.target.value)} placeholder="Ej. Fondo de emergencia"/></label>
            <div className="form-two">
              <label>Monto objetivo (Q)<input type="number" min="0.01" max="1000000000" step="0.01" required value={goalTarget} onChange={event => setGoalTarget(event.target.value)} placeholder="0.00"/></label>
              <label>Fecha objetivo<input type="date" value={goalDate} onChange={event => setGoalDate(event.target.value)}/></label>
            </div>
            <button className="life-submit" disabled={saving || loading}><Plus size={17}/>{saving ? 'Guardando…' : 'Crear meta'}</button>
          </form>
          <div className="life-list-title">Tus metas</div>
          {loading ? <p className="life-muted">Cargando metas…</p> : goals.length === 0 ? <p className="life-empty">Aún no tienes metas. Crea una para comenzar a medir tu avance.</p> : (
            <div className="life-list">
              {goals.map(goal => {
                const target = Number(goal.target_amount);
                const current = Number(goal.current_amount);
                const progress = target > 0 ? Math.max(0, Math.min(100, current / target * 100)) : 0;
                return (
                  <div className="life-planning-item" key={goal.id}>
                    <div className="life-planning-top">
                      <div><b>{goal.name}</b><small>{goal.target_date ? 'Meta: ' + goal.target_date : 'Sin fecha definida'} · {goal.status}</small></div>
                      <button className="life-icon-button" type="button" onClick={() => void deleteGoal(goal)} aria-label={'Eliminar meta ' + goal.name}><Trash2 size={15}/></button>
                    </div>
                    <div className="life-planning-values"><strong>{money(current)}</strong><span>de {money(target)}</span></div>
                    <div className="life-progress-track"><div className="life-progress-fill" style={{ width: String(progress) + '%' }}/></div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="life-card">
          <div className="life-card-heading">
            <div className="life-icon finance"><PiggyBank size={20}/></div>
            <div><h3>Presupuestos</h3><p>Límites por periodo y categoría</p></div>
          </div>
          <form className="life-form" onSubmit={createBudget}>
            <label>Nombre del presupuesto<input required minLength={2} maxLength={100} value={budgetName} onChange={event => setBudgetName(event.target.value)} placeholder="Ej. Gastos de alimentación"/></label>
            <div className="form-two">
              <label>Límite (Q)<input type="number" min="0.01" max="1000000000" step="0.01" required value={budgetLimit} onChange={event => setBudgetLimit(event.target.value)} placeholder="0.00"/></label>
              <label>Periodo<select value={budgetPeriod} onChange={event => setBudgetPeriod(event.target.value as typeof budgetPeriod)}><option value="weekly">Semanal</option><option value="monthly">Mensual</option><option value="yearly">Anual</option></select></label>
            </div>
            <div className="form-two">
              <label>Categoría<select value={budgetCategory} onChange={event => setBudgetCategory(event.target.value)}><option value="">Todas las categorías</option><option>Comida</option><option>Transporte</option><option>Vivienda</option><option>Salud</option><option>Fitness</option><option>Compras</option><option>Servicios</option><option>Otros</option></select></label>
              <label>Inicia<input type="date" required value={budgetStart} onChange={event => setBudgetStart(event.target.value)}/></label>
            </div>
            <label>Finaliza (opcional)<input type="date" value={budgetEnd} onChange={event => setBudgetEnd(event.target.value)}/></label>
            <button className="life-submit" disabled={saving || loading}><Plus size={17}/>{saving ? 'Guardando…' : 'Crear presupuesto'}</button>
          </form>
          <div className="life-list-title">Tus presupuestos</div>
          {loading ? <p className="life-muted">Cargando presupuestos…</p> : budgets.length === 0 ? <p className="life-empty">Aún no tienes presupuestos. Define un límite para un periodo.</p> : (
            <div className="life-list">
              {budgets.map(budget => {
                const limit = Number(budget.amount_limit);
                const spent = Number(budget.spent);
                const progress = limit > 0 ? Math.max(0, Math.min(100, spent / limit * 100)) : 0;
                return (
                  <div className="life-planning-item" key={budget.id}>
                    <div className="life-planning-top">
                      <div><b>{budget.name}</b><small>{budget.category || 'Todas las categorías'} · {budget.period === 'weekly' ? 'Semanal' : budget.period === 'yearly' ? 'Anual' : 'Mensual'}</small></div>
                      <button className="life-icon-button" type="button" onClick={() => void deleteBudget(budget)} aria-label={'Eliminar presupuesto ' + budget.name}><Trash2 size={15}/></button>
                    </div>
                    <div className="life-planning-values"><strong>{money(spent)}</strong><span>de {money(limit)}</span></div>
                    <div className="life-progress-track"><div className={'life-progress-fill' + (spent > limit ? ' over' : '')} style={{ width: String(progress) + '%' }}/></div>
                    <small className="life-planning-hint">Disponible: {money(Number(budget.remaining))}</small>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
