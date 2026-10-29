import React, { useState } from 'react';
import { InterviewTrack, SavedSession } from '../types/miaa';
import { ArrowUpRight, Plus, Search, Trash2 } from 'lucide-react';

interface SessionHistoryViewProps {
  sessions: SavedSession[];
  onOpenSessionReport: (session: SavedSession) => void;
  onResumeSessionWorkbench: (session: SavedSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onStartNewSession: () => void;
}

export const SessionHistoryView: React.FC<SessionHistoryViewProps> = ({
  sessions,
  onOpenSessionReport,
  onResumeSessionWorkbench,
  onDeleteSession,
  onStartNewSession,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState<'all' | InterviewTrack>('all');

  const filteredSessions = sessions.filter((s) => {
    const matchesTrack =
      trackFilter === 'all' || s.selectedTracks.includes(trackFilter);
    const matchesQuery =
      !searchQuery.trim() ||
      s.targetRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.candidateName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTrack && matchesQuery;
  });

  const avgScore =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((acc, s) => acc + (s.report?.overallScore || 0), 0) /
            sessions.length
        )
      : 0;

  const totalQuestions = sessions.reduce(
    (acc, s) => acc + (s.questions?.length || 0),
    0
  );

  return (
    <div className="max-w-[1380px] mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-indigo-400">
            Archive & Readiness Telemetry
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-50">
            Mock Interview Session History
          </h1>
          <p className="text-xs text-slate-400">
            Review past scorecards, track readiness trends across roles, or resume any
            saved workbench.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartNewSession}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          New Mock Interview
        </button>
      </section>

      {/* KPI Summary Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-1">
          <div className="text-xs text-slate-400">Completed Sessions</div>
          <div className="font-mono text-2xl font-bold text-slate-50 tabular-nums">
            {sessions.length}
          </div>
        </div>
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-1">
          <div className="text-xs text-slate-400">Mean Readiness Score</div>
          <div className="font-mono text-2xl font-bold text-emerald-400 tabular-nums">
            {avgScore} / 100
          </div>
        </div>
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-1">
          <div className="text-xs text-slate-400">Rounds Practiced</div>
          <div className="font-mono text-2xl font-bold text-slate-50 tabular-nums">
            {totalQuestions}
          </div>
        </div>
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-1">
          <div className="text-xs text-slate-400">Latest Verdict</div>
          <div className="font-display text-lg font-semibold text-indigo-400 truncate">
            {sessions[0]?.report?.hiringRecommendation || 'No Sessions Yet'}
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by role, company, or candidate..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#111827] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#111827] border border-slate-800 rounded-lg">
          {(
            [
              { id: 'all', label: 'All Tracks' },
              { id: 'coding', label: 'Technical Coding' },
              { id: 'system_design', label: 'System Design' },
              { id: 'behavioral', label: 'Behavioral' },
            ] as { id: 'all' | InterviewTrack; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTrackFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                trackFilter === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* High-Density Data Table */}
      {filteredSessions.length === 0 ? (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-12 text-center space-y-3">
          <div className="font-display text-base font-semibold text-slate-200">
            No matching interview sessions found
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Complete a mock interview session in the Live Workbench to persist your
            scorecard and transcript here.
          </p>
          <button
            type="button"
            onClick={onStartNewSession}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 cursor-pointer"
          >
            Configure First Mock Session
          </button>
        </div>
      ) : (
        <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 bg-[#0B0F17]/60">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Target Role & Company</th>
                  <th className="py-3 px-4">Tracks Covered</th>
                  <th className="py-3 px-4 text-right">Duration</th>
                  <th className="py-3 px-4 text-right">Overall Score</th>
                  <th className="py-3 px-4">Committee Verdict</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {filteredSessions.map((session) => {
                  const dateLabel = new Date(
                    session.createdAt
                  ).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  const mins = Math.floor(session.durationSeconds / 60);
                  return (
                    <tr
                      key={session.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-slate-400 tabular-nums whitespace-nowrap">
                        {dateLabel}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100">
                          {session.targetRole}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {session.companyName} · {session.candidateName} ·{' '}
                          {session.difficulty.toUpperCase()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {session.selectedTracks
                          .map((t) =>
                            t === 'coding'
                              ? 'Coding'
                              : t === 'system_design'
                              ? 'System Design'
                              : 'Behavioral'
                          )
                          .join(' · ')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300 tabular-nums whitespace-nowrap">
                        {mins}m
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 tabular-nums whitespace-nowrap">
                        {session.report.overallScore} / 100
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200 whitespace-nowrap">
                        {session.report.hiringRecommendation}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onResumeSessionWorkbench(session)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 rounded hover:bg-slate-800 cursor-pointer"
                          >
                            Workbench
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenSessionReport(session)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-300 bg-indigo-950/50 border border-indigo-500/40 rounded hover:bg-indigo-600 hover:text-white cursor-pointer"
                          >
                            Report
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSession(session.id)}
                            aria-label="Delete session"
                            className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
