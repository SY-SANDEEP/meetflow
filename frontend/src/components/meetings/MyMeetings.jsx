import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Spinner, Modal, EmptyState, StatusBadge, Pagination, ConfirmDialog, FormTextarea } from '../shared/UI';

function RescheduleModal({ meeting, onClose, onRescheduled }) {
  const [slots, setSlots]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/slots?limit=20').then(r => setSlots(r.data.slots)).finally(() => setLoading(false));
  }, []);

  const handleReschedule = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.put(`/meetings/${meeting._id}/reschedule`, { newSlotId: selected });
      toast.success('Meeting rescheduled! A confirmation email has been sent.');
      onRescheduled();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reschedule failed');
    } finally {
      setSubmitting(false);
    }
  };

  const availableSlots = slots.filter(s => s._id !== meeting.slot?._id && s.bookedCount < s.capacity && new Date(s.date) > new Date());

  return (
    <Modal isOpen={!!meeting} onClose={onClose} title="Reschedule Meeting" size="lg">
      <div className="space-y-4">
        <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl text-sm">
          <p className="text-amber-300 font-medium">Current: {meeting?.title}</p>
          <p className="text-slate-400 mt-0.5">
            {meeting?.slot?.date && format(new Date(meeting.slot.date), 'MMM d')} · {meeting?.slot?.startTime}
          </p>
        </div>

        <p className="text-sm font-medium text-slate-300">Select a new slot:</p>

        {loading ? <div className="flex justify-center py-8"><Spinner /></div>
          : availableSlots.length === 0
            ? <EmptyState icon="📅" title="No other slots available" description="There are no alternative slots to reschedule to." />
            : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {availableSlots.map(s => (
                  <label key={s._id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                      ${selected === s._id ? 'border-brand-500 bg-brand-500/10' : 'border-surface-border hover:border-brand-500/30'}`}>
                    <input type="radio" name="newSlot" value={s._id} checked={selected === s._id}
                      onChange={() => setSelected(s._id)} className="accent-brand-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200">{s.title}</p>
                      <p className="text-xs text-slate-400">{format(new Date(s.date), 'MMM d, yyyy')} · {s.startTime} – {s.endTime}</p>
                    </div>
                    <StatusBadge status="available" />
                  </label>
                ))}
              </div>
            )
        }

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleReschedule} disabled={!selected || submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {submitting ? <><Spinner size="sm" /> Rescheduling…</> : '🔄 Reschedule'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function MeetingCard({ meeting, onCancel, onReschedule }) {
  const canAct = ['confirmed', 'pending'].includes(meeting.status);
  const isPast = meeting.slot?.date && new Date(meeting.slot.date) < new Date();

  return (
    <div className="card p-5 space-y-4 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-100 truncate">{meeting.title}</h3>
          {meeting.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{meeting.description}</p>}
        </div>
        <StatusBadge status={meeting.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <span>📅</span>
          <span>{meeting.slot?.date ? format(new Date(meeting.slot.date), 'MMM d, yyyy') : '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>⏰</span>
          <span>{meeting.slot?.startTime} – {meeting.slot?.endTime}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>📍</span>
          <span className="capitalize">{meeting.slot?.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🔗</span>
          <span className="capitalize">{meeting.slot?.meetingType}</span>
        </div>
      </div>

      {meeting.slot?.meetingLink && (
        <a href={meeting.slot.meetingLink} target="_blank" rel="noreferrer"
          className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors">
          <span>🌐</span> Join Meeting
        </a>
      )}

      {canAct && !isPast && (
        <div className="flex gap-2 pt-1">
          <button onClick={() => onReschedule(meeting)}
            className="btn-secondary flex-1 text-sm py-2">🔄 Reschedule</button>
          <button onClick={() => onCancel(meeting)}
            className="btn-danger flex-1 text-sm py-2">❌ Cancel</button>
        </div>
      )}
    </div>
  );
}

export default function MyMeetings() {
  const [meetings, setMeetings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [statusFilter, setStatus] = useState('');
  const [cancelTarget, setCancelTarget]       = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [cancelReason, setCancelReason]       = useState('');
  const [cancelling, setCancelling]           = useState(false);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 6 });
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/meetings/my?${params}`);
      setMeetings(data.meetings);
      setPages(data.pages);
    } catch (err) {
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const doCancel = async () => {
    setCancelling(true);
    try {
      await api.put(`/meetings/${cancelTarget._id}/cancel`, { reason: cancelReason });
      toast.success('Meeting cancelled.');
      setCancelTarget(null);
      setCancelReason('');
      fetchMeetings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  const statuses = ['', 'confirmed', 'cancelled', 'completed', 'rescheduled'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">My Meetings</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage all your booked meetings.</p>
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          {statuses.map(s => <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
      ) : meetings.length === 0 ? (
        <EmptyState icon="🤝" title="No meetings found" description="Book a meeting from the Slots page." />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.map(m => (
              <MeetingCard key={m._id} meeting={m} onCancel={setCancelTarget} onReschedule={setRescheduleTarget} />
            ))}
          </div>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}

      {/* Cancel confirmation */}
      <Modal isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} title="Cancel Meeting" size="sm">
        <div className="space-y-4">
          <p className="text-slate-300">Are you sure you want to cancel <strong className="text-slate-100">{cancelTarget?.title}</strong>?</p>
          <FormTextarea label="Reason (optional)" rows={2} value={cancelReason}
            onChange={e => setCancelReason(e.target.value)} placeholder="Why are you cancelling?" />
          <div className="flex gap-3">
            <button onClick={() => setCancelTarget(null)} className="btn-secondary flex-1">Keep it</button>
            <button onClick={doCancel} disabled={cancelling} className="btn-danger flex-1 flex items-center justify-center gap-2">
              {cancelling ? <Spinner size="sm" /> : '❌'} Cancel Meeting
            </button>
          </div>
        </div>
      </Modal>

      {/* Reschedule modal */}
      {rescheduleTarget && (
        <RescheduleModal meeting={rescheduleTarget} onClose={() => setRescheduleTarget(null)}
          onRescheduled={() => { setRescheduleTarget(null); fetchMeetings(); }} />
      )}
    </div>
  );
}
