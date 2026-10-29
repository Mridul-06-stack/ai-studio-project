import React from 'react';
import { EvaluationReport } from '../types/miaa';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileCheck2,
  RotateCcw,
  TriangleAlert,
} from 'lucide-react';

interface EvaluationReportViewProps {
  candidateName: string;
  targetRole: string;
  companyName: string;
  difficulty: string;
  durationSeconds: number;
  hintsUsedCount: number;
  report: EvaluationReport;
  onBackToWorkbench: () => void;
  onStartNewSession: () => void;
}

export const EvaluationReportView: React.FC<EvaluationReportViewProps> = ({
  candidateName,
  targetRole,
  companyName,
  difficulty,
  durationSeconds,
  hintsUsedCount,
  report,
  onBackToWorkbench,
  onStartNewSession,
}) => {
  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}m ${rem}s`;
  };

  const handleDownloadMarkdown = () => {
    const md = `# MIAA Mock Interview Evaluation Report
- **Candidate:** ${candidateName}
- **Target Role:** ${targetRole} (${companyName})
- **Calibration Bar:** ${difficulty.toUpperCase()}
- **Overall Score:** ${report.overallScore} / 100
- **Hiring Committee Verdict:** ${report.hiringRecommendation}
- **Session Duration:** ${formatDuration(durationSeconds)} · **Coaching Hints Used:** ${hintsUsedCount}

## Executive Summary
${report.executiveSummary}

## Competency Breakdown
- Problem Solving: ${report.competencyScores.problemSolving}/100
- Technical Depth: ${report.competencyScores.technicalDepth}/100
- Communication & Structure: ${report.competencyScores.communication}/100
- Role Alignment: ${report.competencyScores.roleAlignment}/100

## Demonstrated Strengths
${report.strengths.map((s) => `- ${s}`).join('\n')}

## Priority Growth Areas
${report.growthAreas.map((g) => `- ${g}`).join('\n')}

## Question-by-Question Review
${report.questionBreakdowns
  .map(
    (qb, i) => `### Round 0${i + 1}: ${qb.questionTitle} (${qb.score}/100)
**Performance Summary:** ${qb.candidateSummary}

**Actionable Coaching:** ${qb.actionableFeedback}

**Senior Exemplar Solution:**
\`\`\`
${qb.idealAnswer}
\`\`\`
`
  )
  .join('\n')}`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MIAA-Evaluation-${candidateName.replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pillars = [
    {
      label: 'Problem Solving & Algorithmic Rigor',
      score: report.competencyScores.problemSolving,
    },
    {
      label: 'Technical & Architectural Depth',
      score: report.competencyScores.technicalDepth,
    },
    {
      label: 'Communication & Structured Thinking',
      score: report.competencyScores.communication,
    },
    {
      label: 'Resume-to-Role Alignment',
      score: report.competencyScores.roleAlignment,
    },
  ];

  return (
    <div className="max-w-[1380px] mx-auto px-6 py-8 space-y-10">
      {/* Header & Action Bar */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-800">
        <div className="space-y-2.5 max-w-3xl">
          <div className="flex items-center gap-2 text-xs text-slate-400 tabular-nums">
            <span className="text-indigo-400 font-medium">
              Hiring Committee Scorecard
            </span>
            <span aria-hidden="true">·</span>
            <span>{candidateName}</span>
            <span aria-hidden="true">·</span>
            <span>{companyName}</span>
            <span aria-hidden="true">·</span>
            <span>Duration {formatDuration(durationSeconds)}</span>
            <span aria-hidden="true">·</span>
            <span>{hintsUsedCount} Hints Used</span>
          </div>

          <h1 className="font-display text-3xl font-bold text-slate-50 tracking-tight">
            {targetRole}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            {report.executiveSummary}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onBackToWorkbench}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Workbench
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Report (.md)
          </button>

          <button
            type="button"
            onClick={onStartNewSession}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Start New Session
          </button>
        </div>
      </section>

      {/* Top KPI & 4-Pillar Rubric Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Overall Readiness Score Panel */}
        <div className="lg:col-span-4 bg-[#111827] border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">
              Composite Readiness Score
            </span>
            <div className="flex items-baseline gap-3 pt-1">
              <span className="font-mono text-5xl font-bold text-slate-50 tabular-nums">
                {report.overallScore}
              </span>
              <span className="font-mono text-sm text-slate-400 tabular-nums">
                / 100
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Committee Calibration Verdict
            </div>
            <div className="flex items-center gap-2 text-base font-display font-semibold text-emerald-400">
              <FileCheck2 className="w-5 h-5 shrink-0" />
              <span>{report.hiringRecommendation}</span>
            </div>
            <p className="text-xs text-slate-400">
              Calibrated against {difficulty.toUpperCase()} engineering expectations for{' '}
              {companyName}.
            </p>
          </div>
        </div>

        {/* 4-Pillar Competency Breakdown */}
        <div className="lg:col-span-8 bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-100">
              4-Pillar Competency Rubric
            </h2>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              Target Senior Benchmark: 80 / 100
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {pillars.map((pillar) => (
              <div
                key={pillar.label}
                className="p-4 bg-[#0B0F17] border border-slate-800/90 rounded-lg space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-200">
                    {pillar.label}
                  </span>
                  <span className="font-mono font-semibold text-slate-100 tabular-nums">
                    {pillar.score} / 100
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      pillar.score >= 80
                        ? 'bg-emerald-500'
                        : pillar.score >= 65
                        ? 'bg-indigo-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(10, pillar.score))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strengths vs Priority Growth Areas */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h2 className="font-display text-base font-semibold text-slate-100">
              Demonstrated High-Signal Strengths
            </h2>
          </div>
          <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
            {report.strengths.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="font-mono text-emerald-400 tabular-nums">
                  0{idx + 1}.
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TriangleAlert className="w-4 h-4 text-amber-400" />
            <h2 className="font-display text-base font-semibold text-slate-100">
              Priority Coaching & Growth Areas
            </h2>
          </div>
          <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
            {report.growthAreas.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="font-mono text-amber-400 tabular-nums">
                  0{idx + 1}.
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Question-by-Question Deep Dive & Exemplar Solutions */}
      <section className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-indigo-400">
            Round-by-Round Debrief
          </p>
          <h2 className="font-display text-xl font-semibold text-slate-50">
            Question Breakdown & Senior Exemplar Comparison
          </h2>
        </div>

        <div className="space-y-4">
          {report.questionBreakdowns.map((qb, idx) => (
            <div
              key={qb.questionId || idx}
              className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400 tabular-nums">
                    <span className="font-mono text-indigo-400">
                      Round 0{idx + 1}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">
                      {String(qb.track).replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-semibold text-slate-100">
                    {qb.questionTitle}
                  </h3>
                </div>

                <div className="text-right font-mono tabular-nums">
                  <span className="text-xs text-slate-400">Round Score: </span>
                  <span
                    className={`text-base font-bold ${
                      qb.score >= 80
                        ? 'text-emerald-400'
                        : qb.score >= 65
                        ? 'text-indigo-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {qb.score} / 100
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold text-slate-200 mb-1">
                      Candidate Performance Summary
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {qb.candidateSummary}
                    </p>
                  </div>

                  <div>
                    <div className="font-semibold text-amber-300 mb-1">
                      How to Elevate to Staff / Senior Bar
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {qb.actionableFeedback}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="font-semibold text-indigo-300">
                    Senior Exemplar Reference Solution
                  </div>
                  <pre className="p-4 bg-[#0B0F17] border border-slate-800 rounded-lg font-mono text-[11px] text-slate-200 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    {qb.idealAnswer}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
