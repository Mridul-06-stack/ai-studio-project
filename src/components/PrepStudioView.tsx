import React, { useRef, useState } from 'react';
import {
  AlignmentAnalysis,
  DifficultyLevel,
  InterviewQuestion,
  InterviewTrack,
  RolePreset,
} from '../types/miaa';
import {
  ArrowRight,
  Check,
  Code2,
  FileText,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Upload,
  Users,
} from 'lucide-react';

interface PrepStudioViewProps {
  presets: RolePreset[];
  activePresetId: string;
  onSelectPreset: (preset: RolePreset) => void;
  candidateName: string;
  setCandidateName: (val: string) => void;
  targetRole: string;
  setTargetRole: (val: string) => void;
  companyName: string;
  setCompanyName: (val: string) => void;
  difficulty: DifficultyLevel;
  setDifficulty: (val: DifficultyLevel) => void;
  selectedTracks: InterviewTrack[];
  setSelectedTracks: (val: InterviewTrack[]) => void;
  resumeText: string;
  setResumeText: (val: string) => void;
  jobDescriptionText: string;
  setJobDescriptionText: (val: string) => void;
  alignment: AlignmentAnalysis;
  onAnalyzeContext: () => Promise<void>;
  isAnalyzing: boolean;
  onLaunchWorkbench: (startQuestionIndex?: number) => void;
  onAddCustomQuestion: (question: InterviewQuestion) => void;
}

const TRACK_LABELS: Record<InterviewTrack, { label: string; desc: string }> = {
  coding: {
    label: 'Technical Coding',
    desc: 'Algorithms, data structures, concurrency & bug debugging',
  },
  system_design: {
    label: 'System Design',
    desc: 'Distributed architecture, storage schemas, SLAs & scaling',
  },
  behavioral: {
    label: 'Behavioral & Leadership',
    desc: 'STAR framework, conflict resolution & engineering ownership',
  },
};

export const PrepStudioView: React.FC<PrepStudioViewProps> = ({
  presets,
  activePresetId,
  onSelectPreset,
  candidateName,
  setCandidateName,
  targetRole,
  setTargetRole,
  companyName,
  setCompanyName,
  difficulty,
  setDifficulty,
  selectedTracks,
  setSelectedTracks,
  resumeText,
  setResumeText,
  jobDescriptionText,
  setJobDescriptionText,
  alignment,
  onAnalyzeContext,
  isAnalyzing,
  onLaunchWorkbench,
  onAddCustomQuestion,
}) => {
  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const jdInputRef = useRef<HTMLInputElement | null>(null);
  const [showNewQuestionForm, setShowNewQuestionForm] = useState(false);
  const [newQTitle, setNewQTitle] = useState('');
  const [newQTrack, setNewQTrack] = useState<InterviewTrack>('coding');
  const [newQPrompt, setNewQPrompt] = useState('');

  const toggleTrack = (track: InterviewTrack) => {
    if (selectedTracks.includes(track)) {
      if (selectedTracks.length > 1) {
        setSelectedTracks(selectedTracks.filter((t) => t !== track));
      }
    } else {
      setSelectedTracks([...selectedTracks, track]);
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      if (text.trim()) {
        setter(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCreateCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQTitle.trim() || !newQPrompt.trim()) return;
    const created: InterviewQuestion = {
      id: `q-custom-${Date.now()}`,
      track: newQTrack,
      title: newQTitle.trim(),
      difficulty:
        difficulty === 'staff'
          ? 'Staff (L6)'
          : difficulty === 'senior'
          ? 'Senior (L5)'
          : 'Mid-Level (L4)',
      estimatedMinutes: 20,
      prompt: newQPrompt.trim(),
      contextNote: 'Custom candidate focus question added in Prep Studio.',
      starterCode:
        newQTrack === 'coding'
          ? `export function solveCustomProblem(input: unknown) {\n  // Write your implementation here\n  return input;\n}`
          : newQTrack === 'system_design'
          ? `# System Design: ${newQTitle.trim()}\n\n## 1. Capacity & SLAs\n\n## 2. API Contract\n\n## 3. Core Architecture & Data Flow\n`
          : `Situation: \nTask: \nAction: \nResult: `,
      targetComplexity:
        newQTrack === 'coding'
          ? 'Optimal Time & Space'
          : newQTrack === 'system_design'
          ? 'Horizontally Scalable & Fault-Tolerant'
          : 'STAR Framework · Quantified Impact',
      evaluationCriteria: [
        'Addresses core problem constraints and edge cases',
        'Communicates trade-offs and complexity clearly',
        'Aligns solution with production engineering standards',
      ],
      completenessScore: 0,
    };
    onAddCustomQuestion(created);
    setNewQTitle('');
    setNewQPrompt('');
    setShowNewQuestionForm(false);
  };

  const resumeWordCount = resumeText.trim()
    ? resumeText.trim().split(/\s+/).length
    : 0;
  const jdWordCount = jobDescriptionText.trim()
    ? jobDescriptionText.trim().split(/\s+/).length
    : 0;

  return (
    <div className="max-w-[1380px] mx-auto px-6 py-8 space-y-10">
      {/* Section 1: Hero & Role Preset Selector */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-800/80">
        <div className="space-y-3 max-w-2xl">
          <p className="text-xs font-medium text-indigo-400 tracking-wide">
            01. Resume & Role Alignment Studio
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-50 tracking-tight">
            Calibrate your mock interview to the exact role and seniority bar.
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Paste or upload your resume and target job description. MIAA extracts skill overlaps,
            identifies high-signal probe areas, and builds a tailored multi-track interview plan
            across coding, system design, and behavioral rounds.
          </p>
        </div>

        {/* Role Preset Switcher */}
        <div className="flex flex-col gap-2 shrink-0">
          <span className="text-xs text-slate-400">
            Load Role Template Preset
          </span>
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            {presets.map((preset) => {
              const active = preset.id === activePresetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 2: Candidate Profile, Seniority & Track Configuration */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-100">
              Candidate & Target Position
            </h2>
            <span className="text-xs text-slate-400">
              Tailors interviewer persona & follow-up depth
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Candidate Name
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full px-3 py-2 text-sm bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Target Role Title
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                className="w-full px-3 py-2 text-sm bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Target Company
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Stripe"
                className="w-full px-3 py-2 text-sm bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="block text-xs font-medium text-slate-300">
              Target Seniority Calibration Bar
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  {
                    id: 'mid',
                    title: 'Mid-Level (L4)',
                    sub: 'Clean implementation & edge cases',
                  },
                  {
                    id: 'senior',
                    title: 'Senior (L5)',
                    sub: 'System trade-offs, scale & fault tolerance',
                  },
                  {
                    id: 'staff',
                    title: 'Staff / Principal (L6)',
                    sub: 'Multi-region architecture & org influence',
                  },
                ] as { id: DifficultyLevel; title: string; sub: string }[]
              ).map((level) => {
                const isSelected = difficulty === level.id;
                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setDifficulty(level.id)}
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 text-slate-50'
                        : 'bg-[#0B0F17] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-100 whitespace-nowrap">
                      {level.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {level.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Interview Tracks Selector */}
        <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-slate-100">
                Active Interview Tracks
              </h2>
              <span className="text-xs text-slate-400 tabular-nums">
                {selectedTracks.length} of 3 enabled
              </span>
            </div>

            <div className="space-y-2.5">
              {(['coding', 'system_design', 'behavioral'] as InterviewTrack[]).map(
                (track) => {
                  const enabled = selectedTracks.includes(track);
                  return (
                    <button
                      key={track}
                      type="button"
                      onClick={() => toggleTrack(track)}
                      className={`w-full flex items-center justify-between gap-4 p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                        enabled
                          ? 'bg-indigo-950/30 border-indigo-500/80 text-slate-100'
                          : 'bg-[#0B0F17] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-100">
                          {TRACK_LABELS[track].label}
                        </div>
                        <div className="text-xs text-slate-400 truncate mt-0.5">
                          {TRACK_LABELS[track].desc}
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                          enabled
                            ? 'bg-indigo-600 text-white'
                            : 'border border-slate-700 bg-slate-900'
                        }`}
                      >
                        {enabled && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Resume & Job Description Editors */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Candidate Resume */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 flex flex-col space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <h3 className="font-display text-sm font-semibold text-slate-100">
                Candidate Resume / CV
              </h3>
              <span className="text-xs text-slate-500 tabular-nums">
                · {resumeWordCount} words
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={resumeInputRef}
                type="file"
                accept=".txt,.md,.json"
                onChange={(e) => handleFileUpload(e, setResumeText)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => resumeInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload .txt / .md
              </button>
            </div>
          </div>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={9}
            placeholder="Paste your resume experience, projects, and technical stack here..."
            className="w-full p-3.5 text-xs font-mono leading-relaxed bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 resize-y"
          />
        </div>

        {/* Target Job Description */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 flex flex-col space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <h3 className="font-display text-sm font-semibold text-slate-100">
                Target Job Description
              </h3>
              <span className="text-xs text-slate-500 tabular-nums">
                · {jdWordCount} words
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={jdInputRef}
                type="file"
                accept=".txt,.md,.json"
                onChange={(e) => handleFileUpload(e, setJobDescriptionText)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => jdInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload .txt / .md
              </button>
            </div>
          </div>
          <textarea
            value={jobDescriptionText}
            onChange={(e) => setJobDescriptionText(e.target.value)}
            rows={9}
            placeholder="Paste the target job description, responsibilities, and technical requirements..."
            className="w-full p-3.5 text-xs font-mono leading-relaxed bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 resize-y"
          />
        </div>
      </section>

      {/* Action Bar to Re-Parse with Gemini */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111827] border border-slate-800 rounded-xl px-6 py-4">
        <div className="space-y-0.5">
          <div className="text-sm font-semibold text-slate-100">
            AI Resume-to-Role Alignment & Question Generator
          </div>
          <p className="text-xs text-slate-400">
            Synthesizes your resume against the target role to generate custom coding, architecture,
            and behavioral questions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={onAnalyzeContext}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-100 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                Analyzing Resume & Role...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Analyze & Regenerate Plan
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => onLaunchWorkbench(0)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Enter Live Workbench
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Section 4: Parsed Alignment Matrix & Tailored Interview Plan */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Alignment Summary Column */}
        <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <p className="text-xs font-medium text-indigo-400">
              02. Alignment Diagnostics
            </p>
            <h2 className="font-display text-lg font-semibold text-slate-100">
              Role Fit & Interviewer Probe Strategy
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {alignment.roleSummary}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-emerald-400">
              Matched Core Competencies ({alignment.matchedSkills.length})
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {alignment.matchedSkills.map((skill, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-mono tabular-nums">
                    0{idx + 1}.
                  </span>
                  <span>{skill}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold text-amber-400">
              High-Signal Probe Areas & Stretch Gaps ({alignment.skillGaps.length})
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {alignment.skillGaps.map((gap, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-mono tabular-nums">
                    0{idx + 1}.
                  </span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-1">
            <h3 className="text-xs font-semibold text-slate-200">
              Session Evaluation Strategy
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {alignment.interviewStrategy}
            </p>
          </div>
        </div>

        {/* Tailored Interview Question Queue */}
        <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <p className="text-xs font-medium text-indigo-400">
                03. Tailored Question Queue
              </p>
              <h2 className="font-display text-lg font-semibold text-slate-100">
                Planned Interview Rounds ({alignment.questions.length} Rounds)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowNewQuestionForm(!showNewQuestionForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Custom Question
            </button>
          </div>

          {showNewQuestionForm && (
            <form
              onSubmit={handleCreateCustomQuestion}
              className="p-4 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">
                  Add Custom Interview Question
                </span>
                <button
                  type="button"
                  onClick={() => setShowNewQuestionForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={newQTitle}
                  onChange={(e) => setNewQTitle(e.target.value)}
                  placeholder="Question title (e.g. LRU Cache with TTL)"
                  className="sm:col-span-2 px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={newQTrack}
                  onChange={(e) => setNewQTrack(e.target.value as InterviewTrack)}
                  className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="coding">Technical Coding</option>
                  <option value="system_design">System Design</option>
                  <option value="behavioral">Behavioral & Leadership</option>
                </select>
              </div>
              <textarea
                required
                rows={3}
                value={newQPrompt}
                onChange={(e) => setNewQPrompt(e.target.value)}
                placeholder="Describe the coding problem, system architecture prompt, or behavioral scenario..."
                className="w-full p-2.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 cursor-pointer"
                >
                  Save to Interview Queue
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-slate-800/80">
            {alignment.questions.map((q, idx) => {
              const TrackIcon =
                q.track === 'coding'
                  ? Code2
                  : q.track === 'system_design'
                  ? Layers
                  : Users;
              const trackName =
                q.track === 'coding'
                  ? 'Technical Coding'
                  : q.track === 'system_design'
                  ? 'System Design'
                  : 'Behavioral & Leadership';

              return (
                <div
                  key={q.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    {/* Zero-Pill Metadata Discipline: quiet unboxed text with · separators */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 tabular-nums">
                      <TrackIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="font-mono text-slate-300">
                        Round 0{idx + 1}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{trackName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{q.difficulty}</span>
                      <span aria-hidden="true">·</span>
                      <span>{q.estimatedMinutes} min</span>
                    </div>

                    <h3 className="font-display text-sm font-semibold text-slate-100">
                      {q.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {q.prompt}
                    </p>

                    <div className="text-[11px] text-slate-400 pt-0.5">
                      Target Bar: <span className="font-mono text-slate-300">{q.targetComplexity}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onLaunchWorkbench(idx)}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/50 border border-indigo-500/40 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors whitespace-nowrap shrink-0 self-start cursor-pointer"
                  >
                    Practice Round 0{idx + 1}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
