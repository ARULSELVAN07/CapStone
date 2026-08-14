import React, { useEffect, useState } from 'react';
import technicianService from '../../services/technicianService';
import { useAuth } from '../../store/AuthContext';
import { Briefcase, CheckCircle2, Clock, Wrench, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TechnicianDashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTechnicianData = async () => {
      setLoading(true);
      try {
        const [profData, jobsRes] = await Promise.all([
          technicianService.getProfile(),
          technicianService.getMyJobs({ size: 10 })
        ]);
        setProfile(profData);
        setJobs(jobsRes.content || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadTechnicianData();
  }, []);

  const assignedCount = jobs.filter(j => j.status === 'ASSIGNED' || j.status === 'SCHEDULED' || j.status === 'PENDING').length;
  const inProgressCount = jobs.filter(j => j.status === 'IN_PROGRESS').length;
  const completedCount = jobs.filter(j => j.status === 'COMPLETED').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-900/60 via-slate-800 to-slate-800 border border-amber-500/30 rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1">
            <ShieldCheck className="w-4 h-4" /> Certified BMW Technician Portal
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name}!</h1>
          <p className="text-slate-400 text-sm mt-1">
            Employee ID: <span className="font-mono text-amber-400 font-bold">{user?.employeeId || profile?.employeeId || 'TECH-808'}</span> • Specialization: BMW Electrical & Mechanical Assemblies
          </p>
        </div>

        <Link
          to="/technician/jobs"
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-amber-600/20"
        >
          View Assigned Jobs <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Pending / Scheduled</p>
            <p className="text-2xl font-extrabold text-white">{assignedCount}</p>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">In Progress</p>
            <p className="text-2xl font-extrabold text-white">{inProgressCount}</p>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Completed Jobs</p>
            <p className="text-2xl font-extrabold text-white">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Recent Assigned Jobs */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-500" /> Recent Installation Assignments
          </h2>
          <Link to="/technician/jobs" className="text-xs text-amber-400 hover:underline font-semibold">
            View All Jobs
          </Link>
        </div>

        <div className="divide-y divide-slate-700/60">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading installation jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No installation jobs assigned yet.</div>
          ) : (
            jobs.slice(0, 5).map((job) => (
              <div key={job.id} className="p-6 hover:bg-slate-750/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-amber-400 font-bold text-sm">Job #{job.id?.substring(0, 8)}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      job.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      job.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Order #{job.order?.orderNumber || 'SP-ORD-01'} • Customer: {job.order?.customer?.name || 'Customer'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Scheduled: {job.scheduledDate || 'Today'} ({job.scheduledTimeSlot || 'Morning 10 AM - 1 PM'})
                  </p>
                </div>

                <Link
                  to="/technician/jobs"
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-amber-400 rounded-lg text-xs font-medium transition-all text-center"
                >
                  Manage Job & Checklist
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnicianDashboard;
