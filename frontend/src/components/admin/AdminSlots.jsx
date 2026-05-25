import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Spinner, Modal, EmptyState, StatusBadge, Pagination, ConfirmDialog, FormInput, FormTextarea, FormSelect } from '../shared/UI';

const emptyForm = {
  title: '', description: '', date: '', startTime: '', endTime: '',
  duration: 30, capacity: 1, location: 'Online', meetingType: 'video', meetingLink: ''
};

function SlotForm({ initial = emptyForm, onSave, onClose, loading }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <FormInput label="Title *" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Discovery Call" />
        </div>
        <FormInput label="Date *" type="date" value={form.date} min={new Date().toISOString().split('T')[0]}
          onChange={e => set('date', e.target.value)} />
        <FormInput label="Duration (min)" type="number" value={form.duration} min={5} max={240}
          onChange={e => set('duration', +e.target.value)} />
        <FormInput label="Start Time *" type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
        <FormInput label="End Time *"   type="time" value={form.endTime}   onChange={e => set('endTime',   e.target.value)} />
        <FormInput label="Capacity" type="number" value={form.capacity} min={1} max={100}
          onChange={e => set('capacity', +e.target.value)} />
        <FormSelect label="Meeting Type" value={form.meetingType} onChange={e => set('meetingType', e.target.value)}>
          <option value="video">📹 Video</option>
          <option value="phone">📞 Phone</option>
          <option value="in-person">🏢 In-person</option>
        </FormSelect>
        <div className="sm:col-span-2">
          <FormInput label="Location" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Online / Office" />
        </div>
        <div className="sm:col-span-2">
          <FormInput label="Meeting Link (optional)" value={form.meetingLink} onChange={e => set('meetingLink', e.target.value)} placeholder="https://meet.google.com/..." />
        </div>
        <div className="sm:col-span-2">
          <FormTextarea label="Description (optional)" rows={2} value={form.description}
            onChange={e => set('description', e.target.value)} placeholder="Short description of the slot" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button onClick={() => onSave(form)} disabled={loading || !form.title || !form.date || !form.startTime || !form.endTime}
          className="btn-primary flex-1 flex items-center justify-center gap-2">
          {loading ? <><Spinner size="sm" /> Saving…</> : '💾 Save Slot'}
        </button>
      </div>
    </div>
  );
}

export default function AdminSlots() {
  const [slots, setSlots]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatus] = useState('');
  const [modal, setModal]     = useState(null); // null | 'create' | slotObj
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/slots/admin/all?${params}`);
      setSlots(data.slots);
      setPages(data.pages);
    } catch { toast.error('Failed to load slots'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (modal === 'create') {
        await api.post('/slots', form);
        toast.success('Slot created!');
      } else {
        await api.put(`/slots/${modal._id}`, form);
        toast.success('Slot updated!');
      }
      setModal(null);
      fetchSlots();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/slots/${deleteTarget._id}`);
      toast.success('Slot deleted');
      setDeleteTarget(null);
      fetchSlots();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Manage Slots</h1>
          <p className="text-slate-400 text-sm mt-0.5">Create and manage booking slots.</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary">+ Create Slot</button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input className="input flex-1" placeholder="Search slots…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select className="input w-auto" value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="booked">Booked</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
      ) : slots.length === 0 ? (
        <EmptyState icon="📅" title="No slots found" description="Create your first booking slot." action={
          <button onClick={() => setModal('create')} className="btn-primary">+ Create Slot</button>
        } />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-hover">
                  <tr>
                    {['Title','Date','Time','Type','Capacity','Status','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {slots.map(slot => (
                    <tr key={slot._id} className="hover:bg-surface-hover/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-200">{slot.title}</p>
                        {slot.description && <p className="text-xs text-slate-500 truncate max-w-[160px]">{slot.description}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{format(new Date(slot.date), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{slot.startTime} – {slot.endTime}</td>
                      <td className="px-4 py-3 text-slate-400 capitalize">{slot.meetingType}</td>
                      <td className="px-4 py-3 text-slate-400">{slot.bookedCount}/{slot.capacity}</td>
                      <td className="px-4 py-3"><StatusBadge status={slot.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setModal(slot)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => setDeleteTarget(slot)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                            Delete
                          </button>
                        </div>
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

      {/* Create / Edit modal */}
      <Modal isOpen={!!modal} onClose={() => setModal(null)}
        title={modal === 'create' ? 'Create New Slot' : 'Edit Slot'} size="lg">
        <SlotForm
          initial={modal && modal !== 'create'
            ? { ...modal, date: format(new Date(modal.date), 'yyyy-MM-dd') }
            : emptyForm}
          onSave={handleSave}
          onClose={() => setModal(null)}
          loading={saving}
        />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Slot"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        danger
      />
    </div>
  );
}
