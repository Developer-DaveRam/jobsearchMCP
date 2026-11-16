'use client';

import React, { useEffect, useState } from 'react';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  salary: string | null;
  url: string | null;
  source: string | null;
  sourcePortal: string | null;
  matchScore: number | null;
  probabilityStatus: string | null;
  whyIFit: string | null;
  missingSkills: string | null;
  recruiterResponseLikelihood: string | null;
  applicationStatus: string | null;
  notes: string | null;
}

interface Stats {
  total: number;
  highlyPossible: number;
  goodMatch: number;
  moderate: number;
  low: number;
  applied: number;
  interview: number;
  rejected: number;
  offer: number;
  pending: number;
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    highlyPossible: 0,
    goodMatch: 0,
    moderate: 0,
    low: 0,
    applied: 0,
    interview: 0,
    rejected: 0,
    offer: 0,
    pending: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [probabilityFilter, setProbabilityFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isErrorToast, setIsErrorToast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let result = jobs;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        j =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          (j.whyIFit && j.whyIFit.toLowerCase().includes(q)) ||
          (j.sourcePortal && j.sourcePortal.toLowerCase().includes(q))
      );
    }
    if (probabilityFilter) {
      result = result.filter(j => j.probabilityStatus === probabilityFilter);
    }
    if (locationFilter) {
      result = result.filter(
        j => j.location && j.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }
    if (statusFilter) {
      result = result.filter(j => j.applicationStatus === statusFilter);
    }
    setFilteredJobs(result);
  }, [searchQuery, probabilityFilter, locationFilter, statusFilter, jobs]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [jobsRes, statsRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/jobs/stats')
      ]);
      const jobsJson = await jobsRes.json();
      const statsJson = await statsRes.json();

      if (jobsJson.status === 1) {
        setJobs(jobsJson.data);
        setFilteredJobs(jobsJson.data);
      }
      if (statsJson.status === 1) {
        setStats(statsJson.data);
      }
    } catch (err) {
      showToast('Error loading dashboard data', true);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSyncPortals() {
    setIsSyncing(true);
    showToast('Fetching current eligible jobs from Remotive...');
    try {
      const res = await fetch('/api/jobs', { method: 'POST' });
      const json = await res.json();
      if (json.status === 1) {
        showToast(`Fetched and matched ${json.data.saved} eligible Remotive jobs!`);
        loadData();
      } else {
        showToast('Failed to sync portals', true);
      }
    } catch (err) {
      showToast('Error syncing portals', true);
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleStatusChange(id: number, newStatus: string) {
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationStatus: newStatus }),
      });
      const json = await res.json();
      if (json.status === 1) {
        setJobs(prev =>
          prev.map(j => (j.id === id ? { ...j, applicationStatus: newStatus } : j))
        );
        showToast(`Status updated to "${newStatus}"!`);
        const statsRes = await fetch('/api/jobs/stats');
        const statsJson = await statsRes.json();
        if (statsJson.status === 1) setStats(statsJson.data);
      } else {
        showToast('Failed to update status', true);
      }
    } catch (err) {
      showToast('Error updating status', true);
    }
  }

  async function handleNotesChange(id: number, newNotes: string) {
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: newNotes }),
      });
      const json = await res.json();
      if (json.status === 1) {
        setJobs(prev =>
          prev.map(j => (j.id === id ? { ...j, notes: newNotes } : j))
        );
        showToast('Notes saved successfully!');
      } else {
        showToast('Failed to save notes', true);
      }
    } catch (err) {
      showToast('Error saving notes', true);
    }
  }

  function showToast(msg: string, isErr = false) {
    setToastMessage(msg);
    setIsErrorToast(isErr);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Gradient Banner & Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-[#0f172a] to-slate-900 border-b border-slate-800 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none"></div>
        <div className="container mx-auto px-6 py-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-3">
              <span className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 shadow-glow">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  Job Search Intelligence Dashboard
                </h1>
                <p className="text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-white font-medium">Daveram A</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-xs text-blue-300 border border-slate-700">Full Stack Developer</span>
                  <span className="text-slate-500">•</span>
                  <span>2+ Yrs Exp</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-emerald-400 font-medium">₹5–12 LPA</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-amber-400">Notice: Dec 25, 2026</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full lg:w-auto justify-end">
            <button
              onClick={handleSyncPortals}
              disabled={isSyncing}
              className="flex-1 lg:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 text-sm font-semibold transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isSyncing ? 'Fetching Jobs...' : 'Refresh Remote Jobs'}</span>
            </button>
            <a
              href="/swagger"
              target="_blank"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center space-x-2 shadow"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span>API Docs</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="container mx-auto px-6 py-8 flex-grow">
        {/* Statistics Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-4 mb-8">
          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Jobs</span>
            <span className="text-2xl font-black text-white mt-2">{stats.total}</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur border border-emerald-900/50 p-4 rounded-2xl shadow-xl flex flex-col justify-between hover:border-emerald-700/50 transition">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Highly Possible</span>
            <span className="text-2xl font-black text-emerald-400 mt-2">{stats.highlyPossible}</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur border border-blue-900/50 p-4 rounded-2xl shadow-xl flex flex-col justify-between hover:border-blue-700/50 transition">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Good Match</span>
            <span className="text-2xl font-black text-blue-400 mt-2">{stats.goodMatch}</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur border border-amber-900/50 p-4 rounded-2xl shadow-xl flex flex-col justify-between hover:border-amber-700/50 transition">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Moderate</span>
            <span className="text-2xl font-black text-amber-400 mt-2">{stats.moderate}</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending</span>
            <span className="text-2xl font-black text-slate-200 mt-2">{stats.pending}</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur border border-indigo-900/50 p-4 rounded-2xl shadow-xl flex flex-col justify-between hover:border-indigo-700/50 transition">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Applied</span>
            <span className="text-2xl font-black text-indigo-400 mt-2">{stats.applied}</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur border border-purple-900/50 p-4 rounded-2xl shadow-xl flex flex-col justify-between hover:border-purple-700/50 transition">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Interviews</span>
            <span className="text-2xl font-black text-purple-400 mt-2">{stats.interview}</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur border border-rose-900/50 p-4 rounded-2xl shadow-xl flex flex-col justify-between hover:border-rose-700/50 transition">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Low Match</span>
            <span className="text-2xl font-black text-rose-400 mt-2">{stats.low}</span>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 p-5 rounded-2xl mb-6 shadow-xl flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center flex-grow">
            <div className="w-full sm:w-72 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search company, role, skills..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#05070a] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition shadow-inner"
              />
            </div>

            <div>
              <select
                value={probabilityFilter}
                onChange={e => setProbabilityFilter(e.target.value)}
                className="bg-[#05070a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition cursor-pointer"
              >
                <option value="">🎯 All Probabilities</option>
                <option value="HIGHLY POSSIBLE">🟢 Highly Possible</option>
                <option value="GOOD MATCH">🔵 Good Match</option>
                <option value="MODERATE">🟡 Moderate</option>
                <option value="LOW">🔴 Low</option>
              </select>
            </div>

            <div>
              <select
                value={locationFilter}
                onChange={e => setLocationFilter(e.target.value)}
                className="bg-[#05070a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition cursor-pointer"
              >
                <option value="">📍 All Locations</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Chennai">Chennai</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-[#05070a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition cursor-pointer"
              >
                <option value="">📋 All Statuses</option>
                <option value="Not Applied">Not Applied</option>
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Rejected">Rejected</option>
                <option value="Offer">Offer</option>
              </select>
            </div>
          </div>

          <div className="text-sm font-medium text-slate-400 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-800">
            Showing <span className="text-white font-bold">{filteredJobs.length}</span> of <span className="text-white font-bold">{jobs.length}</span> openings
          </div>
        </div>

        {/* Jobs Table Container */}
        <div className="bg-slate-900/90 backdrop-blur rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="p-4 font-semibold">Company & Role</th>
                  <th className="p-4 font-semibold">Location & Salary</th>
                  <th className="p-4 font-semibold text-center">Match</th>
                  <th className="p-4 font-semibold">Probability</th>
                  <th className="p-4 font-semibold">Why I Fit & Missing</th>
                  <th className="p-4 font-semibold">Response Potential</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Action & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-medium text-slate-300">Loading eligible remote job listings...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-base font-semibold text-slate-300">No matching openings found</p>
                        <p className="text-xs text-slate-500">Try adjusting your filters or click "Refresh & Sync Portals" above.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map(job => {
                    let probBadge = 'bg-slate-800 text-slate-300 border-slate-700';
                    if (job.probabilityStatus === 'HIGHLY POSSIBLE')
                      probBadge = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
                    else if (job.probabilityStatus === 'GOOD MATCH')
                      probBadge = 'bg-blue-950/80 text-blue-300 border-blue-800/60';
                    else if (job.probabilityStatus === 'MODERATE')
                      probBadge = 'bg-amber-950/80 text-amber-300 border-amber-800/60';
                    else if (job.probabilityStatus === 'LOW')
                      probBadge = 'bg-rose-950/80 text-rose-300 border-rose-800/60';

                    const score = job.matchScore || 0;
                    let scoreColor = 'text-slate-300 bg-slate-800 border-slate-700';
                    if (score >= 90) scoreColor = 'text-emerald-400 bg-emerald-950/50 border-emerald-800/60';
                    else if (score >= 75) scoreColor = 'text-blue-400 bg-blue-950/50 border-blue-800/60';
                    else if (score >= 60) scoreColor = 'text-amber-400 bg-amber-950/50 border-amber-800/60';

                    return (
                      <tr key={job.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="p-4 align-top">
                          <div className="font-bold text-white group-hover:text-blue-400 transition-colors">
                            {job.title}
                          </div>
                          <div className="text-xs font-semibold text-slate-300 mt-0.5">{job.company}</div>
                          <div className="mt-1.5 flex items-center space-x-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                              {job.sourcePortal || job.source || 'Portal'}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 align-top text-xs">
                          <div className="text-slate-300 flex items-center space-x-1.5">
                            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-medium">{job.location || 'Remote'}</span>
                          </div>
                          <div className="text-emerald-400 font-bold mt-1.5 flex items-center space-x-1">
                            <span>{job.salary || 'Competitive'}</span>
                          </div>
                        </td>

                        <td className="p-4 align-top text-center">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-xl font-black text-xs border ${scoreColor} shadow-inner`}>
                            {score}%
                          </span>
                        </td>

                        <td className="p-4 align-top">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${probBadge} tracking-wide shadow-sm`}>
                            {job.probabilityStatus}
                          </span>
                        </td>

                        <td className="p-4 align-top text-xs max-w-xs">
                          <div className="text-slate-300 leading-relaxed">
                            <span className="font-bold text-slate-200">Fit:</span> {job.whyIFit || 'Strong skill alignment.'}
                          </div>
                          <div className="text-rose-400/90 mt-1 leading-relaxed">
                            <span className="font-bold text-rose-300">Missing:</span> {job.missingSkills || 'None'}
                          </div>
                        </td>

                        <td className="p-4 align-top text-xs text-slate-300 font-medium">
                          <div className="inline-flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                            <span>{job.recruiterResponseLikelihood || 'Medium'}</span>
                          </div>
                        </td>

                        <td className="p-4 align-top">
                          <select
                            value={job.applicationStatus || 'Not Applied'}
                            onChange={e => handleStatusChange(job.id, e.target.value)}
                            className="bg-[#05070a] border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 p-2 focus:outline-none focus:border-blue-500 transition cursor-pointer shadow"
                          >
                            <option value="Not Applied">⏳ Not Applied</option>
                            <option value="Applied">🚀 Applied</option>
                            <option value="Interview">🎯 Interview</option>
                            <option value="Rejected">❌ Rejected</option>
                            <option value="Offer">🎉 Offer</option>
                          </select>
                        </td>

                        <td className="p-4 align-top text-right space-y-2">
                          <div>
                            <input
                              type="text"
                              defaultValue={job.notes || ''}
                              placeholder="Add custom notes..."
                              onBlur={e => handleNotesChange(job.id, e.target.value)}
                              className="w-full bg-[#05070a] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition shadow-inner"
                            />
                          </div>
                          <div>
                            {job.url ? (
                              <a
                                href={job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 transform hover:-translate-y-0.5"
                              >
                                <span>Apply Now</span>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-slate-600 italic text-xs">No link available</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 text-white px-5 py-3.5 rounded-2xl shadow-2xl z-50 flex items-center space-x-3 border backdrop-blur-md transition-all transform duration-300 animate-bounce ${
          isErrorToast ? 'bg-rose-950/90 border-rose-800 text-rose-200' : 'bg-slate-900/95 border-blue-500/40 text-slate-100 shadow-blue-500/10'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full ${isErrorToast ? 'bg-rose-400' : 'bg-blue-400 animate-ping'}`}></div>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
