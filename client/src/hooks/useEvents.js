import { useState, useEffect, useMemo } from 'react';
import { eventsApi } from '@/api/events';

export function useEvents() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    eventsApi.list().then(setEvents).catch(console.error);
  }, []);

  // Map accountId (string) → events array, sorted by date asc
  const byAccount = useMemo(() => {
    const map = {};
    for (const ev of events) {
      const key = String(ev.accountId);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    return map;
  }, [events]);

  async function createEvent(data) {
    const ev = await eventsApi.create(data);
    setEvents(prev => [...prev, ev].sort((a, b) => new Date(a.date) - new Date(b.date)));
    return ev;
  }

  async function updateEvent(id, data) {
    const ev = await eventsApi.update(id, data);
    setEvents(prev => prev.map(e => e._id === id ? ev : e));
    return ev;
  }

  async function removeEvent(id) {
    await eventsApi.remove(id);
    setEvents(prev => prev.filter(e => e._id !== id));
  }

  async function reload() {
    const data = await eventsApi.list();
    setEvents(data);
  }

  return { events, byAccount, createEvent, updateEvent, removeEvent, reload };
}
