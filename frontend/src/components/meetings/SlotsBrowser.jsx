import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Spinner, Modal, EmptyState, StatusBadge, Pagination, FormTextarea, FormInput } from '../shared/UI';

const typeIcon = { video: '📹', phone: '📞', 'in-person': '🏢' };

function SlotCard({ slot, onBook }) {
  const isFull = slot.bookedCount >= slot.capacity;
  const isPast = new Date(slot.date) < new Date();

  return (
    <div className={`card p-5 transition-all duration-200 group
      ${isFull || isPast ? 'opacity-60 cursor-not-allowed' : 'hover:border-brand-500/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/5'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-100 truncate group-hover:text-brand-300 transition-colors">{slot.title}</h3>
          {slot.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{slot.description}</p>}
        </div>
        <StatusBadge status={isFull ? 'booked' : slot.status} />
      </div>

      <div className="space-y-1.5 text-sm text-slate-400 mb-4">
        <div className="flex items-center gap-2">
          <span>📅</span>
          <span>{format(new Date(slot.date), 'EEEE, MMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>⏰</span>
          <span>{slot.startTime} – {slot.endTime} ({slot.duration} min)</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{typeIcon[slot.meetingType] || '🤝'}</span>
          <span className="capitalize">{slot.meetingType} · {slot.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>👥</span>
          <span>{slot.bookedCount}/{slot.capacity} booked</span>
        </div>
      </div>

      <button
        disabled={isFull || isPast}
        onClick={() => onBook(slot)}
        className="btn-primary w-full py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
        {isPast ? 'Past Slot' : isFull ? 'Fully Booked' : 'Book This Slot'}
      </button>
    </div>
  );
}

function BookingModal({ slot, onClose, onBooked }) {
  const [form, setForm] = useState({ title: slot?.title || '', description: '', agenda: '' });
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/meetings', { slotId: slot._id, ...form });
      toast.success('Meeting booked! Check your email for confirmation.');
      onBooked(data.meeting);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={!!slot} onClose={onClose} title="Confirm Booking" size="md">
      <div className="space-y-4">
        <div className="p-4 bg-brand-500/5 border border-brand-500/15 rounded-xl space-y-1.5 text-sm">
          <p className="font-medium text-brand-300">{slot?.title}</p>
          <p className="text-slate-400">📅 {slot?.date && format(new Date(slot.date), 'EEEE, MMM d, yyyy')}</p>
          <p className="text-slate-400">⏰ {slot?.startTime} – {slot?.endTime}</p>
          <p className="text-slate-400 capitalize">{typeIcon[slot?.meetingType]} {slot?.meetingType} · {slot?.location}</p>
        </div>

        <FormInput label="Meeting title" value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Project kickoff" />
        <FormTextarea label="Description (optional)" rows={2} value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What's this meeting about?" />
        <FormTextarea label="Agenda (optional)" rows={2} value={form.agenda}
          onChange={e => setForm(p => ({ ...p, agenda: e.target.value }))} placeholder="Topics to cover…" />

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleBook} disabled={loading || !form.title} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <><Spinner size="sm" /> Booking…</> : '✅ Confirm Booking'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function SlotsBrowser() {
  const [slots, setSlots]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [filterDate, setFilterDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 9 });
      if (filterDate) params.append('date', filterDate);
      const { data } = await api.get(`/slots?${params}`);
      setSlots(data.slots);
      setPages(data.pages);
    } catch (err) {
      toast.error('Failed to load slots');
    } finally {
      setLoading(false);
    }
  }, [page, filterDate]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const handleBooked = () => {
    setSelectedSlot(null);
    fetchSlots();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Available Slots</h1>
          <p className="text-slate-400 text-sm mt-0.5">Pick a slot and book your meeting.</p>
        </div>
        <input type="date" className="input w-auto"
          value={filterDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={e => { setFilterDate(e.target.value); setPage(1); }} />
      </div>

      {filterDate && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Filtering by: <span className="text-brand-400">{filterDate}</span></span>
          <button onClick={() => setFilterDate('')} className="text-xs text-slate-500 hover:text-red-400 transition-colors">✕ Clear</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
      ) : slots.length === 0 ? (
        <EmptyState icon="📅" title="No slots available" description="Check back later or clear the date filter." />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {slots.map(slot => (
              <SlotCard key={slot._id} slot={slot} onBook={setSelectedSlot} />
            ))}
          </div>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}

      {selectedSlot && (
        <BookingModal slot={selectedSlot} onClose={() => setSelectedSlot(null)} onBooked={handleBooked} />
      )}
    </div>
  );
}
