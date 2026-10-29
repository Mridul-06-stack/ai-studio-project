import React, { useEffect, useRef, useState } from 'react';
import {
  ChatMessage,
  CodeAnalysisResult,
  HintItem,
  InterviewQuestion,
  ProgrammingLanguage,
  StarNotes,
  StudioMode,
  SystemDesignNotes,
} from '../types/miaa';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  HelpCircle,
  Layers,
  Lightbulb,
  Loader2,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Terminal,
  Users,
} from 'lucide-react';

interface LiveWorkbenchViewProps {
  targetRole: string;
  companyName: string;
  questions: InterviewQuestion[];
  activeQuestionIndex: number;
  setActiveQuestionIndex: (idx: number) => void;
  messages: ChatMessage[];
  onSendMessage: (content: string, includeWorkspaceSnapshot?: boolean) => Promise<void>;
  isSendingMessage: boolean;
  workspaces: Record<string, string>;
  onUpdateWorkspace: (questionId: string, content: string) => void;
  hints: HintItem[];
  onRequestHint: (tier: 1 | 2 | 3) => Promise<void>;
  isRequestingHint: boolean;
  codeAnalyses: Record<string, CodeAnalysisResult>;
  onAnalyzeWorkspace: () => Promise<void>;
  isAnalyzingWorkspace: boolean;
  elapsedSeconds: number;
  onFinishAndEvaluate: () => Promise<void>;
  isEvaluating: boolean;
}

const LANGUAGES: { id: ProgrammingLanguage; label: string }[] = [
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python 3' },
  { id: 'go', label: 'Go 1.23' },
  { id: 'java', label: 'Java 21' },
  { id: 'cpp', label: 'C++ 20' },
];

export const LiveWorkbenchView: React.FC<LiveWorkbenchViewProps> = ({
  targetRole,
  companyName,
  questions,
  activeQuestionIndex,
  setActiveQuestionIndex,
  messages,
  onSendMessage,
  isSendingMessage,
  workspaces,
  onUpdateWorkspace,
  hints,
  onRequestHint,
  isRequestingHint,
  codeAnalyses,
  onAnalyzeWorkspace,
  isAnalyzingWorkspace,
  elapsedSeconds,
  onFinishAndEvaluate,
  isEvaluating,
}) => {
  const activeQuestion = questions[activeQuestionIndex] || questions[0];
  const [draftMessage, setDraftMessage] = useState('');
  const [language, setLanguage] = useState<ProgrammingLanguage>('typescript');
  const [studioMode, setStudioMode] = useState<StudioMode>('code');
  const [showHintDrawer, setShowHintDrawer] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [showAnalysisDrawer, setShowAnalysisDrawer] = useState(true);

  // Guided STAR helper state for behavioral rounds
  const [starNotes, setStarNotes] = useState<StarNotes>({
    situation:
      'During Peak Black Friday checkout, a downstream banking partner increased webhook ACK latency from 80ms to 4.5s, saturating our worker pool.',
    task: 'Restore <500ms payment confirmation SLAs for 1,200 merchants without dropping any in-flight settlement events.',
    action:
      'Deployed a per-partner circuit breaker with Redis ZSET delayed retry lanes and isolated slow merchant endpoints into a separate consumer group.',
    result:
      'Restored p99 checkout latency to 190ms within 12 minutes, achieved 0 lost transactions, and reduced partner-induced alerts by 88%.',
  });

  // Guided System Design builder state
  const [sysNotes, setSysNotes] = useState<SystemDesignNotes>({
    capacityEstimation:
      '15,000 payment events/sec (~1.3B/day), 4KB signed JSON payload -> 60 MB/s ingress, up to 5x retry fan-out.',
    apiEndpoints:
      'POST /v1/webhooks/endpoints, POST /v1/webhooks/deliveries/{id}/retry, Header: X-Signature-HMAC-SHA256.',
    dataModel:
      'PostgreSQL Transactional Outbox (event_id, merchant_id, payload) + ClickHouse Delivery Log for real-time telemetry.',
    highLevelArchitecture:
      'Outbox CDC -> Kafka partitioned by event_id -> Fast-path Worker Pool (<250ms) + Redis ZSET Delayed Retry Scheduler.',
    bottlenecksAndScaling:
      'Per-merchant token bucket & concurrency limit (max 20 in-flight connections) + automatic circuit breaker after 50 timeouts.',
  });

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Sync studio mode automatically when switching questions
  useEffect(() => {
    if (!activeQuestion) return;
    if (activeQuestion.track === 'coding') {
      setStudioMode('code');
    } else if (activeQuestion.track === 'system_design') {
      setStudioMode('system_design');
    } else {
      setStudioMode('star');
    }
  }, [activeQuestion?.id, activeQuestion?.track]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeQuestion?.id]);

  if (!activeQuestion) {
    return null;
  }

  const currentWorkspace =
    workspaces[activeQuestion.id] ?? activeQuestion.starterCode ?? '';
  const questionMessages = messages.filter(
    (m) => m.questionId === activeQuestion.id
  );
  const questionHints = hints.filter((h) => h.questionId === activeQuestion.id);
  const currentAnalysis = codeAnalyses[activeQuestion.id];

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const handleSend = async (includeSnapshot = false) => {
    const text =
      draftMessage.trim() ||
      (includeSnapshot
        ? `I have updated my ${
            studioMode === 'system_design'
              ? 'system design architecture'
              : studioMode === 'star'
              ? 'STAR framework response'
              : `${language} implementation`
          } in the workspace. Please review my solution and let me know what edge cases or follow-ups we should cover.`
        : '');
    if (!text || isSendingMessage) return;
    setDraftMessage('');
    await onSendMessage(text, true);
  };

  const handleComposeStarToChat = () => {
    const formatted = `**Situation:** ${starNotes.situation}\n**Task:** ${starNotes.task}\n**Action:** ${starNotes.action}\n**Result:** ${starNotes.result}`;
    onUpdateWorkspace(activeQuestion.id, formatted);
    setDraftMessage(formatted);
  };

  const handleSyncSysDesignToEditor = () => {
    const formatted = `# System Design: ${activeQuestion.title}

## 1. Traffic & Capacity Estimation
${sysNotes.capacityEstimation}

## 2. API & Security Contract
${sysNotes.apiEndpoints}

## 3. Data Model & Storage Schema
${sysNotes.dataModel}

## 4. High-Level Architecture & Queue Isolation
${sysNotes.highLevelArchitecture}

## 5. Circuit Breaking & Bottleneck Mitigation
${sysNotes.bottlenecksAndScaling}`;
    onUpdateWorkspace(activeQuestion.id, formatted);
    setStudioMode('code');
  };

  const lineCount = Math.max(18, currentWorkspace.split('\n').length);

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-[#0B0F17] overflow-hidden">
      {/* Contextual Sub-Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 bg-[#111827] border-b border-slate-800/90 shrink-0">
        {/* Left: Breadcrumb & Question Selector Tabs */}
        <div className="flex items-center gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap shrink-0">
            <span className="font-medium text-slate-200">{companyName}</span>
            <span aria-hidden="true">/</span>
            <span className="truncate max-w-[220px]">{targetRole}</span>
          </div>

          <div className="h-4 w-px bg-slate-800 shrink-0" />

          {/* Interactive Round Switcher Buttons */}
          <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-lg">
            {questions.map((q, idx) => {
              const isSelected = idx === activeQuestionIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  Q{idx + 1} ·{' '}
                  {q.track === 'coding'
                    ? 'Coding'
                    : q.track === 'system_design'
                    ? 'SysDesign'
                    : 'Behavioral'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Session Timer, Hint Drawer Trigger & Complete Action */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 tabular-nums px-2.5 py-1 bg-[#0B0F17] border border-slate-800 rounded-md">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowHintDrawer(!showHintDrawer)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showHintDrawer
                ? 'bg-amber-950/60 border-amber-500/70 text-amber-200'
                : 'bg-slate-900 border-slate-700 text-amber-300 hover:bg-slate-800'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Real-Time Hints ({questionHints.length}/3)</span>
          </button>

          <button
            type="button"
            disabled={isEvaluating}
            onClick={onFinishAndEvaluate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Compiling Scorecard...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Complete & Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Split-Pane Workbench */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* LEFT PANE: Question Prompt, Real-Time Hint Drawer & Interviewer Thread */}
        <div className="lg:col-span-5 flex flex-col border-r border-slate-800/90 bg-[#0B0F17] min-h-0">
          {/* Active Question Prompt Header */}
          <div className="p-5 bg-[#111827]/90 border-b border-slate-800 space-y-3 shrink-0">
            <div className="flex items-center justify-between gap-2">
              {/* Quiet unboxed metadata with · separators */}
              <div className="flex items-center gap-2 text-xs text-slate-400 tabular-nums">
                <span className="font-mono text-indigo-400">
                  Question 0{activeQuestionIndex + 1} of 0{questions.length}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {activeQuestion.track === 'coding'
                    ? 'Technical Coding'
                    : activeQuestion.track === 'system_design'
                    ? 'System Design'
                    : 'Behavioral & Leadership'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeQuestion.difficulty}</span>
              </div>

              <button
                type="button"
                onClick={() => setShowCriteria(!showCriteria)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer whitespace-nowrap"
              >
                <span>Rubric Criteria</span>
                {showCriteria ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <h2 className="font-display text-base font-semibold text-slate-50">
              {activeQuestion.title}
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeQuestion.prompt}
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>
                Target Bar:{' '}
                <strong className="font-mono text-slate-200 font-normal">
                  {activeQuestion.targetComplexity}
                </strong>
              </span>
              <span className="font-mono tabular-nums text-emerald-400">
                Readiness: {activeQuestion.completenessScore ?? 35}%
              </span>
            </div>

            {showCriteria && (
              <div className="pt-3 border-t border-slate-800 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-300">
                  Interviewer Evaluation Signals:
                </div>
                <ul className="space-y-1 text-xs text-slate-400">
                  {activeQuestion.evaluationCriteria.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="font-mono text-indigo-400 tabular-nums">
                        0{i + 1}.
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Collapsible Real-Time Coaching Hint Drawer */}
          {showHintDrawer && (
            <div className="p-4 bg-amber-950/20 border-b border-amber-500/30 space-y-3 shrink-0 max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-200">
                    Progressive Coaching Hints (Non-Spoiling)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {([1, 2, 3] as (1 | 2 | 3)[]).map((tier) => {
                    const alreadyUnlocked = questionHints.some(
                      (h) => h.tier === tier
                    );
                    return (
                      <button
                        key={tier}
                        type="button"
                        disabled={isRequestingHint}
                        onClick={() => onRequestHint(tier)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          alreadyUnlocked
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-500/50 hover:text-amber-200'
                        }`}
                      >
                        {tier === 1
                          ? 'Tier 1: Intuition'
                          : tier === 2
                          ? 'Tier 2: Pattern'
                          : 'Tier 3: Edge Cases'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {isRequestingHint && (
                <div className="flex items-center gap-2 text-xs text-amber-300 py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing coaching hint from your current workspace...</span>
                </div>
              )}

              {questionHints.length === 0 && !isRequestingHint ? (
                <p className="text-xs text-slate-400">
                  Select a hint tier above if you want a conceptual nudge, data structure
                  pattern, or edge-case check based on your live code.
                </p>
              ) : (
                <div className="space-y-2">
                  {questionHints.map((h) => (
                    <div
                      key={h.id}
                      className="p-3 bg-[#0B0F17]/90 border border-amber-500/30 rounded-lg space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-amber-300">
                        <span className="font-semibold">
                          Tier {h.tier} · {h.hintTitle}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500">
                          {h.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {h.hintContent}
                      </p>
                      <div className="text-[11px] text-amber-400/90 pt-0.5">
                        Key Takeaway: {h.keyTakeaway}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Interviewer & Candidate Conversation Transcript */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {questionMessages.map((msg) => {
              const isInterviewer = msg.sender === 'interviewer';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col space-y-1.5 ${
                    isInterviewer ? 'items-start' : 'items-end'
                  }`}
                >
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 tabular-nums">
                    <span className="font-semibold text-slate-300">
                      {isInterviewer
                        ? `Principal Interviewer (${companyName})`
                        : 'Candidate Response'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[92%] p-3.5 rounded-xl text-xs leading-relaxed whitespace-pre-wrap border ${
                      isInterviewer
                        ? 'bg-[#111827] border-slate-800 text-slate-200'
                        : 'bg-indigo-950/40 border-indigo-500/40 text-slate-100'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {msg.signalDetected && (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                      <span>Signal noted: {msg.signalDetected}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {isSendingMessage && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-3 bg-[#111827] border border-slate-800 rounded-xl">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>
                  Interviewer is inspecting your workspace and formulating a follow-up...
                </span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Candidate Message Composer */}
          <div className="p-4 bg-[#111827] border-t border-slate-800 space-y-2.5 shrink-0">
            <textarea
              rows={3}
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleSend(false);
                }
              }}
              placeholder="Explain your approach, complexity trade-offs, or answer the interviewer's follow-up (Cmd/Ctrl + Enter to send)..."
              className="w-full p-3 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={isSendingMessage}
                onClick={() => handleSend(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/50 border border-indigo-500/40 rounded-lg hover:bg-indigo-900/60 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5" />
                Submit Editor Solution to Interviewer
              </button>

              <button
                type="button"
                disabled={isSendingMessage || !draftMessage.trim()}
                onClick={() => handleSend(false)}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Send Response
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Adaptive Code, System Design & STAR Studio */}
        <div className="lg:col-span-7 flex flex-col bg-[#0B0F17] min-h-0">
          {/* Studio Mode & Language Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-[#111827] border-b border-slate-800 shrink-0">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setStudioMode('code')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  studioMode === 'code'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                Code & Spec Editor
              </button>
              <button
                type="button"
                onClick={() => setStudioMode('system_design')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  studioMode === 'system_design'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                System Design Builder
              </button>
              <button
                type="button"
                onClick={() => setStudioMode('star')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  studioMode === 'star'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                STAR Story Pad
              </button>
            </div>

            {/* Right Studio Controls: Language Selector, Reset & Dry-Run Analyzer */}
            <div className="flex items-center gap-2.5">
              {studioMode === 'code' && (
                <select
                  value={language}
                  onChange={(e) =>
                    setLanguage(e.target.value as ProgrammingLanguage)
                  }
                  className="px-2.5 py-1.5 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() =>
                  onUpdateWorkspace(
                    activeQuestion.id,
                    activeQuestion.starterCode
                  )
                }
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-400 bg-[#0B0F17] border border-slate-800 rounded-lg hover:text-slate-200 hover:border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Starter
              </button>

              <button
                type="button"
                disabled={isAnalyzingWorkspace}
                onClick={onAnalyzeWorkspace}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isAnalyzingWorkspace ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Running Dry-Run...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Dry-Run & Analyze Complexity
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Main Studio Body */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
            {studioMode === 'code' && (
              <div className="flex-1 flex min-h-[320px] bg-[#0B0F17] font-mono text-xs">
                {/* Line Numbers Gutter */}
                <div className="py-4 px-3 bg-[#0B0F17] border-r border-slate-800/80 text-slate-600 select-none text-right tabular-nums leading-6">
                  {Array.from({ length: lineCount }).map((_, idx) => (
                    <div key={idx}>{idx + 1}</div>
                  ))}
                </div>

                {/* Code / Architecture Textarea */}
                <textarea
                  value={currentWorkspace}
                  onChange={(e) =>
                    onUpdateWorkspace(activeQuestion.id, e.target.value)
                  }
                  spellCheck={false}
                  className="flex-1 p-4 bg-[#0B0F17] text-slate-100 font-mono text-xs leading-6 focus:outline-none resize-none"
                  placeholder="Write your production code or system design specification here..."
                />
              </div>
            )}

            {studioMode === 'system_design' && (
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-display text-sm font-semibold text-slate-100">
                      Structured System Design Specification Pad
                    </h3>
                    <p className="text-xs text-slate-400">
                      Complete the 5 architecture pillars below and sync them to your live
                      spec buffer.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncSysDesignToEditor}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Sync to Spec Editor
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {(
                    [
                      {
                        key: 'capacityEstimation',
                        label: '01. Traffic, Throughput & Storage Capacity Estimation',
                      },
                      {
                        key: 'apiEndpoints',
                        label: '02. API Contract, Idempotency & Security Headers',
                      },
                      {
                        key: 'dataModel',
                        label: '03. Data Model, Partition Keys & Storage Engine Choice',
                      },
                      {
                        key: 'highLevelArchitecture',
                        label: '04. High-Level Components, Queues & Read/Write Paths',
                      },
                      {
                        key: 'bottlenecksAndScaling',
                        label:
                          '05. Fault Tolerance, Circuit Breakers & Hot-Shard Mitigation',
                      },
                    ] as { key: keyof SystemDesignNotes; label: string }[]
                  ).map((section) => (
                    <div key={section.key} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-200">
                        {section.label}
                      </label>
                      <textarea
                        rows={2}
                        value={sysNotes[section.key]}
                        onChange={(e) =>
                          setSysNotes({
                            ...sysNotes,
                            [section.key]: e.target.value,
                          })
                        }
                        className="w-full p-3 text-xs font-mono bg-[#111827] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {studioMode === 'star' && (
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-display text-sm font-semibold text-slate-100">
                      STAR Leadership & Behavioral Story Structurer
                    </h3>
                    <p className="text-xs text-slate-400">
                      Map out your Situation, Task, Action, and quantified Result before
                      sending to the interviewer.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleComposeStarToChat}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Compose into Chat Reply
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {(
                    [
                      {
                        key: 'situation',
                        title: 'S · Situation & Production Context',
                        hint: 'Set the stage with scale, system ownership, and why it mattered.',
                      },
                      {
                        key: 'task',
                        title: 'T · Specific Engineering Task & Constraint',
                        hint: 'Define the exact SLA, deadline, or trade-off you were responsible for.',
                      },
                      {
                        key: 'action',
                        title: 'A · Concrete Personal Technical Actions ("I" vs "We")',
                        hint: 'Detail the diagnosis, architecture decision, or conflict resolution steps you led.',
                      },
                      {
                        key: 'result',
                        title: 'R · Quantified Outcome & Systemic Guardrails',
                        hint: 'State concrete metrics (latency delta, 0 data loss, incident reduction %).',
                      },
                    ] as { key: keyof StarNotes; title: string; hint: string }[]
                  ).map((item) => (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-200">
                          {item.title}
                        </label>
                        <span className="text-[11px] text-slate-500">
                          {item.hint}
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={starNotes[item.key]}
                        onChange={(e) =>
                          setStarNotes({
                            ...starNotes,
                            [item.key]: e.target.value,
                          })
                        }
                        className="w-full p-3 text-xs bg-[#111827] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Dry-Run & Complexity Analysis Drawer */}
          {currentAnalysis && (
            <div className="border-t border-slate-800 bg-[#111827] shrink-0">
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800/80">
                <div className="flex items-center gap-3 text-xs tabular-nums">
                  <span className="font-semibold text-slate-100">
                    Dry-Run & Complexity Inspector
                  </span>
                  <span aria-hidden="true" className="text-slate-600">
                    ·
                  </span>
                  <span className="font-mono text-indigo-400">
                    Time: {currentAnalysis.timeComplexity}
                  </span>
                  <span aria-hidden="true" className="text-slate-600">
                    ·
                  </span>
                  <span className="font-mono text-indigo-400">
                    Space: {currentAnalysis.spaceComplexity}
                  </span>
                  <span aria-hidden="true" className="text-slate-600">
                    ·
                  </span>
                  <span className="text-emerald-400 font-medium">
                    {currentAnalysis.correctnessVerdict}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAnalysisDrawer(!showAnalysisDrawer)}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showAnalysisDrawer ? 'Collapse' : 'Expand'}
                </button>
              </div>

              {showAnalysisDrawer && (
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 max-h-56 overflow-y-auto text-xs">
                  <div className="space-y-1.5">
                    <div className="font-semibold text-slate-200">
                      Execution Trace Walkthrough
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      {currentAnalysis.traceWalkthrough}
                    </p>
                    <div className="pt-1 text-indigo-300">
                      <strong>Optimization Tip:</strong>{' '}
                      {currentAnalysis.optimizationTip}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-semibold text-emerald-400">
                      Covered Requirements ({currentAnalysis.edgeCasesCovered.length})
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      {currentAnalysis.edgeCasesCovered.map((ec, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="font-mono text-emerald-400">✓</span>
                          <span>{ec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-semibold text-amber-400">
                      Remaining Edge Cases ({currentAnalysis.edgeCasesMissing.length})
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      {currentAnalysis.edgeCasesMissing.map((ec, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="font-mono text-amber-400">!</span>
                          <span>{ec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
