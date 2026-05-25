import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { StatCard, StatusBadge, Spinner, EmptyState } from '../shared/UI';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/analytics'),
      api.get('/meetings/stats')
    ]).then(([ana, st]) => {
      setAnalytics(ana.data.analytics);
      setStats(st.data.stats);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  const a = analytics || {};
  const s = stats || {};

  // Build meeting-by-status map
  const meetingsByStatus = {};
  (a.meetingsByStatus || []).forEach(x => { meetingsByStatus[x._id] = x.count; });

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Platform overview and management centre.</p>
        </div>
        <Link to="/admin/slots" className="btn-primary text-sm">+ New Slot</Link>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Total Users"      value={a.totalUsers}          color="brand"   />
        <StatCard icon="📅" label="Total Slots"      value={a.totalSlots}          color="cyan"    />
        <StatCard icon="🤝" label="Total Meetings"   value={a.totalMeetings}       color="violet"  />
        <StatCard icon="📆" label="This Month"       value={a.meetingsThisMonth}   color="emerald" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🟢" label="Available Slots"  value={s.availableSlots}      color="emerald" />
        <StatCard icon="🔴" label="Booked Slots"     value={s.bookedSlots}         color="red"     />
        <StatCard icon="✅" label="Confirmed Mtgs"   value={meetingsByStatus.confirmed || 0} color="brand" />
        <StatCard icon="🏁" label="This Week"        value={a.meetingsThisWeek}    color="amber"   />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly trend */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-100 mb-5">Monthly Trend</h2>
          {(a.monthlyTrend || []).length === 0
            ? <EmptyState icon="📊" title="No data yet" />
            : (
              <div className="space-y-3">
                {a.monthlyTrend.map((m, i) => {
                  const max = Math.max(...a.monthlyTrend.map(x => x.count), 1);
                  const pct = Math.round((m.count / max) * 100);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-8 text-right font-mono">{monthNames[(m._id.month - 1)]}</span>
                      <div className="flex-1 bg-surface rounded-full h-2">
                        <div className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-500"
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 font-mono w-6">{m.count}</span>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>

        {/* Recent users */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-100">Recent Users</h2>
            <Link to="/admin/users" className="text-brand-400 text-sm hover:text-brand-300">View all</Link>
          </div>
          {(a.recentUsers || []).length === 0
            ? <EmptyState icon="👥" title="No users yet" />
            : (
              <div className="space-y-3">
                {a.recentUsers.map(u => (
                  <div key={u._id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-surface-border">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{u.name}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                    <span className="text-xs text-slate-500">{format(new Date(u.createdAt), 'MMM d')}</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>

      {/* Recent meetings */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-100">Recent Meetings</h2>
          <Link to="/admin/meetings" className="text-brand-400 text-sm hover:text-brand-300">View all</Link>
        </div>
        {(stats?.recentMeetings || []).length === 0
          ? <EmptyState icon="🤝" title="No meetings yet" />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border">
                    {['Meeting', 'User', 'Date', 'Status'].map(h => (
                      <th key={h} className="text-left pb-3 text-slate-400 font-medium pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {stats.recentMeetings.map(m => (
                    <tr key={m._id} className="hover:bg-surface-hover/30 transition-colors">
                      <td className="py-3 pr-4"><span className="font-medium text-slate-200">{m.title}</span></td>
                      <td className="py-3 pr-4 text-slate-400">{m.user?.name}</td>
                      <td className="py-3 pr-4 text-slate-400">
                        {m.slot?.date ? format(new Date(m.slot.date), 'MMM d') : '—'}
                      </td>
                      <td className="py-3"><StatusBadge status={m.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  );
}
