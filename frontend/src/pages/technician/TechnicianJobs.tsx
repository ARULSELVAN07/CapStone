import React, { useEffect, useState } from 'react';
import technicianService from '../../services/technicianService';
import { Briefcase, Wrench, CheckCircle2, Clock, Calendar, MapPin, AlertCircle, FileText, CheckSquare } from 'lucide-react';

export const TechnicianJobs: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Job for Status Update Modal
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState({
    vinVerified: true,
    partInspected: true,
    torquedToSpec: true,
    testDriveCompleted: false
  });

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await technicianService.getMyJobs({ size: 50 });
      setJobs(res.content || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleOpenModal = (job: any) => {
    setSelectedJob(job);
    setNewStatus(job.status === 'COMPLETED' ? 'COMPLETED' : job.status === 'IN_PROGRESS' ? 'COMPLETED' : 'IN_PROGRESS');
    setNotes(job.technicianNotes || '');
    setMsg(null);
  };

  const handleUpdateJobStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setSubmitting(true);
    setMsg(null);

    const completedChecklist = Object.entries(checklist)
      .filter(([_, val]) => val)
      .map(([key, _]) => key);

    try {
      await technicianService.updateJobStatus(selectedJob.id, {
        status: newStatus,
        technicianNotes: notes,
        checklistItemsCompleted: completedChecklist
      });
      setMsg({ type: 'success', text: 'Job status updated successfully!' });
      setTimeout(() => {
        setSelectedJob(null);
        fetchJobs();
      }, 1000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update job status' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimJob = async (jobId: string) => {
    try {
      await technicianService.claimJob(jobId);
      fetchJobs();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to claim installation job');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Briefcase className="w-7 h-7 text-amber-500" /> My Assigned Installation Jobs
        </h1>
        <p className="text-slate-400 text-sm">On-site and workshop BMW spare part replacement & installation workflow</p>
      </div>

      {/* Jobs Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500 mb-2" />
            <p>Loading assigned installation jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center text-slate-400">
            No installation jobs currently assigned.
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-700 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-amber-400 font-bold text-sm">Job #{job.id?.substring(0, 8)}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      job.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      job.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">Order #{job.order?.orderNumber || 'SP-ORD-01'}</h3>
                </div>

                <div className="flex items-center gap-2">
                  {(!job.technician || job.status === 'PENDING') && (
                    <button
                      onClick={() => handleClaimJob(job.id)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow"
                    >
                      Claim Job
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenModal(job)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all shadow"
                  >
                    Update Job Status & Checklist
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-300">
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
                  <p className="text-xs text-slate-400 font-semibold mb-1">Customer Details</p>
                  <p className="font-bold text-white">{job.order?.customer?.name || 'Customer'}</p>
                  <p className="text-xs text-slate-400">{job.order?.customer?.phone || '+91 9876543210'}</p>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
                  <p className="text-xs text-slate-400 font-semibold mb-1">BMW Vehicle Model</p>
                  <p className="font-bold text-white">{job.order?.vehicle?.vehicleModel?.modelName || 'BMW 3 Series G20'}</p>
                  <p className="text-xs text-amber-400 font-mono">VIN: {job.order?.vehicle?.vin || 'WBA330I0001928'}</p>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
                  <p className="text-xs text-slate-400 font-semibold mb-1">Schedule & Location</p>
                  <p className="font-bold text-white">{job.scheduledDate || 'Today'} ({job.scheduledTimeSlot || '10:00 AM - 01:00 PM'})</p>
                  <p className="text-xs text-slate-400 truncate">{job.order?.address?.city || 'Bengaluru Workshop'}</p>
                </div>
              </div>

              {job.technicianNotes && (
                <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-start gap-2">
                  <FileText className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Technician Notes:</span> {job.technicianNotes}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Update Installation Status</h2>
            <p className="text-xs text-slate-400 mb-4">Job #{selectedJob.id?.substring(0, 8)} • Order #{selectedJob.order?.orderNumber}</p>

            {msg && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
                msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}>
                {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {msg.text}
              </div>
            )}

            <form onSubmit={handleUpdateJobStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Installation Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="IN_PROGRESS">IN_PROGRESS (Currently Installing)</option>
                  <option value="COMPLETED">COMPLETED (Installation Verified & Passed)</option>
                </select>
              </div>

              <div className="space-y-2 border-t border-b border-slate-700 py-3">
                <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-amber-500" /> BMW Installation Safety Checklist
                </p>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.vinVerified}
                    onChange={(e) => setChecklist({ ...checklist, vinVerified: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-amber-600 focus:ring-amber-500"
                  />
                  Verified vehicle VIN and part compatibility
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.partInspected}
                    onChange={(e) => setChecklist({ ...checklist, partInspected: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-amber-600 focus:ring-amber-500"
                  />
                  Inspected OEM part for damage prior to mounting
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.torquedToSpec}
                    onChange={(e) => setChecklist({ ...checklist, torquedToSpec: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-amber-600 focus:ring-amber-500"
                  />
                  Torqued all bolts to BMW factory specifications
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.testDriveCompleted}
                    onChange={(e) => setChecklist({ ...checklist, testDriveCompleted: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-amber-600 focus:ring-amber-500"
                  />
                  Diagnostic scan & test drive verification passed
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Technician Work Notes</label>
                <textarea
                  rows={3}
                  placeholder="Notes on torque values, diagnostic codes cleared..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Save Job Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianJobs;
