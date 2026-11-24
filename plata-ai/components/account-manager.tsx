'use client';

import { FormEvent, useState } from 'react';
import { Archive, CheckCircle2, CircleAlert, Plus, Wallet } from 'lucide-react';

export type FinancialAccount = {
  id: string;
  name: string;
  account_type: 'cash' | 'bank' | 'credit' | 'savings' | 'other';
  currency: string;
  opening_balance: string;
  current_balance: string;
};

type Props = {
  accounts: FinancialAccount[];
  onCreated: (account: FinancialAccount) => void;
  onArchived: (accountId: string) => void;
};

const typeNames: Record<FinancialAccount['account_type'], string> = {
  cash: 'Efectivo', bank: 'Banco', credit: 'Crédito', savings: 'Ahorro', other: 'Otra',
};
const money = (value: number, currency: string) => new Intl.NumberFormat('es-GT', {
  style: 'currency', currency, maximumFractionDigits: 2,
}).format(value);

export default function AccountManager({ accounts, onCreated, onArchived }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<FinancialAccount['account_type']>('bank');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, account_type: type, currency: 'GTQ', opening_balance: Number(openingBalance) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo crear la cuenta.');
      onCreated(data.account);
      setName(''); setOpeningBalance('0');
      setMessage('Cuenta creada correctamente.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear la cuenta.');
    } finally { setSaving(false); }
  }

  async function archiveAccount(account: FinancialAccount) {
    if (!window.confirm('¿Archivar la cuenta "' + account.name + '"? Sus movimientos se conservarán.')) return;
    setError(''); setMessage('');
    try {
      const response = await fetch('/api/accounts/' + account.id, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo archivar la cuenta.');
      onArchived(account.id);
      setMessage('Cuenta archivada. Sus movimientos se conservaron.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo archivar la cuenta.');
    }
  }

  return (
    <section className="life-card account-manager" id="cuentas">
      <div className="life-card-heading">
        <div className="life-icon finance"><Wallet size={20}/></div>
        <div><h3>Mis cuentas</h3><p>Efectivo, bancos, ahorro y otras cuentas</p></div>
      </div>
      {error && <div className="life-alert error"><CircleAlert size={16}/>{error}</div>}
      {message && <div className="life-alert success"><CheckCircle2 size={16}/>{message}</div>}
      <div className="account-grid">
        {accounts.map(account => (
          <article className="account-tile" key={account.id}>
            <div className="account-tile-top">
              <span className="account-type">{typeNames[account.account_type]}</span>
              {accounts.length > 1 && <button type="button" className="life-icon-button" onClick={() => void archiveAccount(account)} aria-label={'Archivar ' + account.name}><Archive size={14}/></button>}
            </div>
            <b>{account.name}</b>
            <strong>{money(Number(account.current_balance), account.currency)}</strong>
            <small>Saldo calculado · {account.currency}</small>
          </article>
        ))}
      </div>
      <form className="account-create" onSubmit={createAccount}>
        <div className="account-create-title"><Plus size={16}/> Agregar cuenta</div>
        <div className="account-create-fields">
          <label>Nombre<input required minLength={2} maxLength={60} value={name} onChange={event => setName(event.target.value)} placeholder="Ej. Banco principal"/></label>
          <label>Tipo<select value={type} onChange={event => setType(event.target.value as FinancialAccount['account_type'])}>
            <option value="cash">Efectivo</option><option value="bank">Banco</option><option value="savings">Ahorro</option><option value="credit">Crédito</option><option value="other">Otra</option>
          </select></label>
          <label>Saldo inicial (Q)<input type="number" min="0" max="1000000000" step="0.01" required value={openingBalance} onChange={event => setOpeningBalance(event.target.value)}/></label>
          <button className="life-submit" disabled={saving}><Plus size={16}/>{saving ? 'Creando…' : 'Crear cuenta'}</button>
        </div>
      </form>
    </section>
  );
}
