import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard, StatusBadge, Spinner, EmptyState } from '../shared/UI';
import { format } from 'date-fns';

export default function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/meetings/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  );

  const s = stats?.stats || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="text-brand-400">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here's an overview of your meetings.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🤝" label="Total Meetings"     value={s.totalMeetings}     color="brand"   />
        <StatCard icon="✅" label="Confirmed"          value={s.confirmedMeetings} color="emerald" />
        <StatCard icon="❌" label="Cancelled"          value={s.cancelledMeetings} color="red"     />
        <StatCard icon="🏁" label="Completed"          value={s.completedMeetings} color="violet"  />
      </div>

      {/* CTA banner */}
      <div className="card p-6 bg-gradient-to-r from-brand-500/10 to-violet-500/10 border-brand-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-100 text-lg">Ready to schedule a meeting?</p>
          <p className="text-slate-400 text-sm mt-0.5">Browse available slots and book in seconds.</p>
        </div>
        <Link to="/dashboard/slots" className="btn-primary flex-shrink-0">Browse Slots →</Link>
      </div>

      {/* Recent meetings */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-100">Recent Meetings</h2>
          <Link to="/dashboard/meetings" className="text-brand-400 text-sm hover:text-brand-300 transition-colors">View all</Link>
        </div>

        {!stats?.recentMeetings?.length ? (
          <EmptyState icon="📅" title="No meetings yet" description="Book your first meeting to get started." />
        ) : (
          <div className="space-y-3">
            {stats.recentMeetings.map(m => (
              <div key={m._id} className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-surface-border hover:border-brand-500/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center text-brand-400 text-lg flex-shrink-0">
                  🤝
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-200 truncate">{m.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {m.slot?.date ? format(new Date(m.slot.date), 'MMM d, yyyy') : '—'} · {m.slot?.startTime} – {m.slot?.endTime}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
