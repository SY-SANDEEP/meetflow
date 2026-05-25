import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Spinner, Modal, EmptyState, StatusBadge, Pagination, FormSelect } from '../shared/UI';

function MeetingDetailModal({ meeting, onClose, onUpdated }) {
  const [status, setStatus] = useState(meeting?.status || '');
  const [notes, setNotes]   = useState(meeting?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/meetings/${meeting._id}/status`, { status, notes });
      toast.success('Meeting updated!');
      onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (!meeting) return null;

  return (
    <Modal isOpen={!!meeting} onClose={onClose} title="Meeting Details" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-surface rounded-xl border border-surface-border">
            <p className="text-slate-500 text-xs mb-1">Meeting</p>
            <p className="font-medium text-slate-200">{meeting.title}</p>
          </div>
          <div className="p-3 bg-surface rounded-xl border border-surface-border">
            <p className="text-slate-500 text-xs mb-1">Booked by</p>
            <p className="font-medium text-slate-200">{meeting.user?.name}</p>
            <p className="text-xs text-slate-500">{meeting.user?.email}</p>
          </div>
          <div className="p-3 bg-surface rounded-xl border border-surface-border">
            <p className="text-slate-500 text-xs mb-1">Date</p>
            <p className="font-medium text-slate-200">
              {meeting.slot?.date ? format(new Date(meeting.slot.date), 'MMM d, yyyy') : '—'}
            </p>
          </div>
          <div className="p-3 bg-surface rounded-xl border border-surface-border">
            <p className="text-slate-500 text-xs mb-1">Time</p>
            <p className="font-medium text-slate-200">{meeting.slot?.startTime} – {meeting.slot?.endTime}</p>
          </div>
        </div>

        {meeting.description && (
          <div className="p-3 bg-surface rounded-xl border border-surface-border text-sm">
            <p className="text-slate-500 text-xs mb-1">Description</p>
            <p className="text-slate-300">{meeting.description}</p>
          </div>
        )}

        {meeting.agenda && (
          <div className="p-3 bg-surface rounded-xl border border-surface-border text-sm">
            <p className="text-slate-500 text-xs mb-1">Agenda</p>
            <p className="text-slate-300">{meeting.agenda}</p>
          </div>
        )}

        <FormSelect label="Update Status" value={status} onChange={e => setStatus(e.target.value)}>
          {['pending','confirmed','completed','cancelled'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </FormSelect>

        <div>
          <label className="label">Admin Notes</label>
          <textarea className="input resize-none" rows={2} value={notes}
            onChange={e => setNotes(e.target.value)} placeholder="Internal notes…" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Close</button>
          <button onClick={handleUpdate} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : '💾 Update'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [statusFilter, setStatus] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/meetings/admin/all?${params}`);
      setMeetings(data.meetings);
      setPages(data.pages);
    } catch { toast.error('Failed to load meetings'); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">All Meetings</h1>
          <p className="text-slate-400 text-sm mt-0.5">View and manage every meeting on the platform.</p>
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {['confirmed','pending','cancelled','completed','rescheduled'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
      ) : meetings.length === 0 ? (
        <EmptyState icon="🤝" title="No meetings found" />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-hover">
                  <tr>
                    {['Meeting','User','Date & Time','Type','Status','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {meetings.map(m => (
                    <tr key={m._id} className="hover:bg-surface-hover/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-200 max-w-[150px] truncate">{m.title}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-300">{m.user?.name}</p>
                        <p className="text-xs text-slate-500">{m.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {m.slot?.date ? format(new Date(m.slot.date), 'MMM d, yyyy') : '—'}
                        <br />
                        <span className="text-xs">{m.slot?.startTime} – {m.slot?.endTime}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 capitalize">{m.slot?.meetingType || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelected(m)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}

      {selected && (
        <MeetingDetailModal
          meeting={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => { setSelected(null); fetchMeetings(); }}
        />
      )}
    </div>
  );
}
