import React, { useState } from 'react';
import type { ConsultancySlot } from '../types/revenue';
import { bookSlot, cancelSlot, addSlot } from '../lib/slots';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Props {
  slots: ConsultancySlot[];
  onSlotsChange: (slots: ConsultancySlot[]) => void;
}

export function TicketBooking({ slots, onSlotsChange }: Props) {
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [tab, setTab] = useState<'available' | 'booked'>('available');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newPrice, setNewPrice] = useState('150');

  const available = slots.filter((s) => !s.booked);
  const booked = slots.filter((s) => s.booked);
  const shown = tab === 'available' ? available : booked;

  function handleBook(id: string) {
    if (!clientName.trim()) return alert('Please enter client name');
    const updated = bookSlot(id, clientName.trim());
    onSlotsChange(updated);
    setBookingId(null);
    setClientName('');
  }

  function handleCancel(id: string) {
    if (!confirm('Cancel this booking?')) return;
    onSlotsChange(cancelSlot(id));
  }

  function handleAddSlot() {
    if (!newDate || !newTime) return alert('Select date and time');
    onSlotsChange(addSlot(newDate, newTime, parseFloat(newPrice) || 150));
    setNewDate('');
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>📅 Consultancy Slots</h3>
        <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 8, padding: 4 }}>
          {(['available', 'booked'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '4px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
              background: tab === t ? '#fff' : 'transparent',
              fontWeight: tab === t ? 600 : 400,
              boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              color: tab === t ? '#111' : '#6b7280',
            }}>
              {t === 'available' ? `Available (${available.length})` : `Booked (${booked.length})`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
        {shown.length === 0 && (
          <div style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
            {tab === 'available' ? 'No available slots.' : 'No booked slots.'}
          </div>
        )}
        {shown.map((slot) => (
          <div key={slot.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: 8,
            background: slot.booked ? '#f0fdf4' : '#f9fafb',
            border: `1px solid ${slot.booked ? '#bbf7d0' : '#e5e7eb'}`,
            gap: 8,
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {format(parseISO(slot.date), 'EEE d MMM', { locale: nl })} @ {slot.time}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {slot.duration} min · €{slot.price}
                {slot.clientName && ` · ${slot.clientName}`}
              </div>
            </div>

            {bookingId === slot.id ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client name"
                  style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleBook(slot.id)}
                />
                <button onClick={() => handleBook(slot.id)} style={btnStyle('#059669')}>Confirm</button>
                <button onClick={() => setBookingId(null)} style={btnStyle('#6b7280')}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                {slot.booked ? (
                  <button onClick={() => handleCancel(slot.id)} style={btnStyle('#ef4444')}>Cancel</button>
                ) : (
                  <button onClick={() => { setBookingId(slot.id); setClientName(''); }} style={btnStyle('#3b82f6')}>Book</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new slot */}
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f3f4f6', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>+ Add slot:</span>
        <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }} />
        <select value={newTime} onChange={(e) => setNewTime(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}>
          {[9,10,11,12,13,14,15,16,17].map(h => (
            <option key={h} value={`${String(h).padStart(2,'0')}:00`}>{String(h).padStart(2,'0')}:00</option>
          ))}
        </select>
        <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
          placeholder="€/hr" style={{ width: 70, padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }} />
        <button onClick={handleAddSlot} style={btnStyle('#059669')}>Add</button>
      </div>
    </div>
  );
}

function btnStyle(bg: string) {
  return {
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '5px 12px',
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 600,
  } as React.CSSProperties;
}
