'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { CalendarDays, CircleAlert, Dumbbell, Play, Plus, Trash2 } from 'lucide-react';

type RoutineExercise = {
  id: string; exercise_name: string; sort_order: number;
  target_sets: number | null; target_reps: string | null;
  rest_seconds: number | null; notes: string | null;
};
type Routine = {
  id: string; name: string; description: string | null;
  days_per_week: number | null; exercises: RoutineExercise[];
};

type Props = { onWorkoutCreated: () => void };
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala' }).format(new Date());

export default function RoutineManager({ onWorkoutCreated }: Props) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState('3');
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [rest, setRest] = useState('60');
  const [sessionDate, setSessionDate] = useState(today());
  const [duration, setDuration] = useState('45');

  const selectedRoutine = routines.find(routine => routine.id === selectedId) ?? null;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/routines', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar las rutinas.');
      const items = (data.routines ?? []) as Routine[];
      setRoutines(items);
      setSelectedId(current => current && items.some(item => item.id === current) ? current : (items[0]?.id ?? ''));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las rutinas.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createRoutine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/routines', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, days_per_week: days }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo crear la rutina.');
      setRoutines(current => [data.routine, ...current]);
      setSelectedId(data.routine.id);
      setName(''); setDescription('');
      setNotice('Rutina creada.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear la rutina.');
    } finally { setSaving(false); }
  }

  async function addExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRoutine) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/routines/' + selectedRoutine.id + '/exercises', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_name: exerciseName, target_sets: Number(sets),
          target_reps: reps, rest_seconds: Number(rest),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo añadir el ejercicio.');
      setRoutines(current => current.map(routine => routine.id === selectedRoutine.id
        ? { ...routine, exercises: [...(routine.exercises ?? []), data.exercise] }
        : routine));
      setExerciseName('');
      setNotice('Ejercicio añadido a la rutina.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo añadir el ejercicio.');
    } finally { setSaving(false); }
  }

  async function removeExercise(exercise: RoutineExercise) {
    if (!selectedRoutine) return;
    if (!window.confirm('¿Quitar "' + exercise.exercise_name + '" de la rutina?')) return;
    setError(''); setNotice('');
    try {
      const response = await fetch('/api/routines/' + selectedRoutine.id + '/exercises/' + exercise.id, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo quitar el ejercicio.');
      setRoutines(current => current.map(routine => routine.id === selectedRoutine.id
        ? { ...routine, exercises: routine.exercises.filter(item => item.id !== exercise.id) }
        : routine));
      setNotice('Ejercicio eliminado de la rutina.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo quitar el ejercicio.');
    }
  }

  async function archiveRoutine(routine: Routine) {
    if (!window.confirm('¿Archivar la rutina "' + routine.name + '"? Las sesiones ya registradas se conservarán.')) return;
    setError(''); setNotice('');
    try {
      const response = await fetch('/api/routines/' + routine.id, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo archivar la rutina.');
      const remaining = routines.filter(item => item.id !== routine.id);
      setRoutines(remaining);
      if (selectedId === routine.id) setSelectedId(remaining[0]?.id ?? '');
      setNotice('Rutina archivada.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo archivar la rutina.');
    }
  }

  async function startWorkout() {
    if (!selectedRoutine) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/workouts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedRoutine.name, routine_id: selectedRoutine.id,
          duration_minutes: Number(duration), completed_on: sessionDate,
          notes: 'Sesión iniciada desde la rutina.',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo registrar la sesión.');
      setNotice('Sesión registrada con los ejercicios de la rutina.');
      onWorkoutCreated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo registrar la sesión.');
    } finally { setSaving(false); }
  }

  return (
    <section className="life-card routine-manager" id="rutinas">
      <div className="life-card-heading">
        <div className="life-icon fitness"><Dumbbell size={20}/></div>
        <div><h3>Rutinas de entrenamiento</h3><p>Organiza ejercicios y registra sesiones a partir de una rutina</p></div>
      </div>
      {error && <div className="life-alert error"><CircleAlert size={17}/>{error}<button type="button" onClick={() => void load()}>Reintentar</button></div>}
      {notice && <p className="life-inline-notice">{notice}</p>}

      <div className="routine-layout">
        <div className="routine-create-panel">
          <h4>Crear rutina</h4>
          <form className="life-form" onSubmit={createRoutine}>
            <label>Nombre<input required minLength={2} maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="Ej. Fuerza tren superior"/></label>
            <label>Descripción<textarea maxLength={500} rows={2} value={description} onChange={event => setDescription(event.target.value)} placeholder="Objetivo de la rutina…"/></label>
            <label>Días por semana<select value={days} onChange={event => setDays(event.target.value)}><option value="1">1 día</option><option value="2">2 días</option><option value="3">3 días</option><option value="4">4 días</option><option value="5">5 días</option><option value="6">6 días</option><option value="7">7 días</option></select></label>
            <button className="life-submit" disabled={saving}><Plus size={16}/>{saving ? 'Guardando…' : 'Crear rutina'}</button>
          </form>
        </div>

        <div className="routine-detail-panel">
          {loading ? <p className="life-muted">Cargando rutinas…</p> : routines.length === 0 ? <p className="life-empty">Todavía no tienes rutinas. Crea la primera para organizar tus ejercicios.</p> : (
            <>
              <label className="routine-select-label">Selecciona una rutina
                <select value={selectedId} onChange={event => setSelectedId(event.target.value)}>
                  {routines.map(routine => <option key={routine.id} value={routine.id}>{routine.name}</option>)}
                </select>
              </label>
              {selectedRoutine && <>
                <div className="routine-head">
                  <div><h4>{selectedRoutine.name}</h4><small>{selectedRoutine.description || 'Sin descripción'} · {selectedRoutine.days_per_week ?? '—'} días/semana</small></div>
                  <button className="life-icon-button" type="button" onClick={() => void archiveRoutine(selectedRoutine)} aria-label="Archivar rutina"><Trash2 size={15}/></button>
                </div>
                <div className="routine-exercise-list">
                  {selectedRoutine.exercises?.length ? selectedRoutine.exercises.map(exercise => (
                    <div className="routine-exercise" key={exercise.id}>
                      <div><b>{exercise.exercise_name}</b><small>{exercise.target_sets ?? '—'} series · {exercise.target_reps ?? '—'} repeticiones · {exercise.rest_seconds ?? '—'} s descanso</small></div>
                      <button type="button" className="life-icon-button" onClick={() => void removeExercise(exercise)} aria-label={'Quitar ' + exercise.exercise_name}><Trash2 size={14}/></button>
                    </div>
                  )) : <p className="life-empty">Añade ejercicios para completar esta rutina.</p>}
                </div>
                <form className="life-form routine-add-exercise" onSubmit={addExercise}>
                  <h4>Añadir ejercicio</h4>
                  <label>Ejercicio<input required minLength={2} maxLength={100} value={exerciseName} onChange={event => setExerciseName(event.target.value)} placeholder="Ej. Sentadillas"/></label>
                  <div className="form-two">
                    <label>Series<input type="number" min="1" max="50" value={sets} onChange={event => setSets(event.target.value)}/></label>
                    <label>Repeticiones<input value={reps} maxLength={40} onChange={event => setReps(event.target.value)} placeholder="10–12"/></label>
                  </div>
                  <label>Descanso (segundos)<input type="number" min="0" max="3600" value={rest} onChange={event => setRest(event.target.value)}/></label>
                  <button className="life-submit fitness-submit" disabled={saving}><Plus size={16}/>{saving ? 'Añadiendo…' : 'Añadir ejercicio'}</button>
                </form>
                <div className="routine-start">
                  <div className="form-two">
                    <label><CalendarDays size={14}/> Fecha<input type="date" value={sessionDate} onChange={event => setSessionDate(event.target.value)}/></label>
                    <label>Duración (min)<input type="number" min="1" max="600" value={duration} onChange={event => setDuration(event.target.value)}/></label>
                  </div>
                  <button type="button" className="life-submit fitness-submit" disabled={saving} onClick={() => void startWorkout()}><Play size={16}/>{saving ? 'Registrando…' : 'Registrar sesión con esta rutina'}</button>
                </div>
              </>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
