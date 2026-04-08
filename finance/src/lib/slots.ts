/**
 * Consultancy slot management.
 * In production: sync with Google Calendar or Calendly.
 * For MVP: local state + localStorage persistence.
 */

import type { ConsultancySlot } from '../types/revenue';
import { addDays, format } from 'date-fns';

const STORAGE_KEY = 'hendrik_consultancy_slots';

export function getSlots(): ConsultancySlot[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fall through to generate defaults
    }
  }
  return generateDefaultSlots();
}

export function bookSlot(id: string, clientName: string): ConsultancySlot[] {
  const slots = getSlots();
  const updated = slots.map((s) =>
    s.id === id ? { ...s, booked: true, clientName } : s
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function cancelSlot(id: string): ConsultancySlot[] {
  const slots = getSlots();
  const updated = slots.map((s) =>
    s.id === id ? { ...s, booked: false, clientName: undefined } : s
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function addSlot(date: string, time: string, price: number): ConsultancySlot[] {
  const slots = getSlots();
  const newSlot: ConsultancySlot = {
    id: `slot_${Date.now()}`,
    date,
    time,
    duration: 60,
    booked: false,
    price,
  };
  const updated = [...slots, newSlot].sort((a, b) =>
    `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

function generateDefaultSlots(): ConsultancySlot[] {
  const slots: ConsultancySlot[] = [];
  const today = new Date();

  // Generate slots for next 14 days: Mon-Fri, 9am-4pm (hourly)
  for (let d = 0; d < 14; d++) {
    const day = addDays(today, d);
    const dow = day.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends

    const hours = [9, 10, 11, 14, 15, 16];
    for (const h of hours) {
      slots.push({
        id: `slot_${format(day, 'yyyyMMdd')}_${h}`,
        date: format(day, 'yyyy-MM-dd'),
        time: `${String(h).padStart(2, '0')}:00`,
        duration: 60,
        booked: false,
        price: 150, // €150/hr for consultancy
      });
    }
  }

  // Pre-book a few for realism
  if (slots.length > 3) {
    slots[0] = { ...slots[0], booked: true, clientName: 'Demo Client A' };
    slots[3] = { ...slots[3], booked: true, clientName: 'Demo Client B' };
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  return slots;
}
