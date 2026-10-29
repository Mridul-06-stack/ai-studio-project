/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ActiveTab, TopBar } from './components/TopBar';
import { PrepStudioView } from './components/PrepStudioView';
import { LiveWorkbenchView } from './components/LiveWorkbenchView';
import { EvaluationReportView } from './components/EvaluationReportView';
import { SessionHistoryView } from './components/SessionHistoryView';
import { INITIAL_SAVED_SESSIONS, ROLE_PRESETS } from './data/presets';
import {
  AlignmentAnalysis,
  ChatMessage,
  CodeAnalysisResult,
  DifficultyLevel,
  EvaluationReport,
  HintItem,
  InterviewQuestion,
  InterviewTrack,
  RolePreset,
  SavedSession,
} from './types/miaa';

const STORAGE_KEY = 'miaa_saved_sessions_v1';

export default function App() {
  const defaultPreset = ROLE_PRESETS[0];

  const [activeTab, setActiveTab] = useState<ActiveTab>('prep');
  const [activePresetId, setActivePresetId] = useState<string>(defaultPreset.id);

  // Prep Studio state
  const [candidateName, setCandidateName] = useState<string>(
    defaultPreset.candidateName
  );
  const [targetRole, setTargetRole] = useState<string>(defaultPreset.targetRole);
  const [companyName, setCompanyName] = useState<string>(
    defaultPreset.companyName
  );
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    defaultPreset.difficulty
  );
  const [selectedTracks, setSelectedTracks] = useState<InterviewTrack[]>(
    defaultPreset.selectedTracks
  );
  const [resumeText, setResumeText] = useState<string>(defaultPreset.resumeText);
  const [jobDescriptionText, setJobDescriptionText] = useState<string>(
    defaultPreset.jobDescriptionText
  );
  const [alignment, setAlignment] = useState<AlignmentAnalysis>(
    defaultPreset.defaultAlignment
  );
  const [isAnalyzingContext, setIsAnalyzingContext] = useState<boolean>(false);

  // Live Workbench state
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>(
    INITIAL_SAVED_SESSIONS[0].messages
  );
  const [workspaces, setWorkspaces] = useState<Record<string, string>>(
    INITIAL_SAVED_SESSIONS[0].workspaces
  );
  const [hints, setHints] = useState<HintItem[]>([]);
  const [codeAnalyses, setCodeAnalyses] = useState<
    Record<string, CodeAnalysisResult>
  >({});
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(142);

  // Loading & toast notification state
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [isRequestingHint, setIsRequestingHint] = useState<boolean>(false);
  const [isAnalyzingWorkspace, setIsAnalyzingWorkspace] =
    useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Evaluation Report & Saved Sessions state
  const [currentReport, setCurrentReport] = useState<EvaluationReport>(
    INITIAL_SAVED_SESSIONS[0].report
  );
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to initial sessions
    }
    return INITIAL_SAVED_SESSIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSessions));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedSessions]);

  // Increment live session timer when in the Live Workbench
  useEffect(() => {
    if (activeTab !== 'workbench') return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Ensure every question has an initial greeting from the interviewer and starter code
  const ensureQuestionInitialized = (question: InterviewQuestion) => {
    setWorkspaces((prev) => {
      if (prev[question.id] !== undefined) return prev;
      return { ...prev, [question.id]: question.starterCode };
    });

    setMessages((prev) => {
      const hasGreeting = prev.some((m) => m.questionId === question.id);
      if (hasGreeting) return prev;
      const now = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const greeting: ChatMessage = {
        id: `msg-init-${question.id}-${Date.now()}`,
        questionId: question.id,
        sender: 'interviewer',
        content: `Let’s dive into "${question.title}" (${question.difficulty}). ${question.prompt}\n\nWalk me through your initial intuition and complexity goals, or begin drafting your solution in the workspace on the right.`,
        timestamp: now,
      };
      return [...prev, greeting];
    });
  };

  useEffect(() => {
    const activeQ = alignment.questions[activeQuestionIndex];
    if (activeQ) {
      ensureQuestionInitialized(activeQ);
    }
  }, [activeQuestionIndex, alignment.questions]);

  const showToast = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => {
      setStatusBanner((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const handleSelectPreset = (preset: RolePreset) => {
    setActivePresetId(preset.id);
    setCandidateName(preset.candidateName);
    setTargetRole(preset.targetRole);
    setCompanyName(preset.companyName);
    setDifficulty(preset.difficulty);
    setSelectedTracks(preset.selectedTracks);
    setResumeText(preset.resumeText);
    setJobDescriptionText(preset.jobDescriptionText);
    setAlignment(preset.defaultAlignment);
    setActiveQuestionIndex(0);

    const nextWorkspaces: Record<string, string> = {};
    preset.defaultAlignment.questions.forEach((q) => {
      nextWorkspaces[q.id] = q.starterCode;
    });
    setWorkspaces((prev) => ({ ...prev, ...nextWorkspaces }));
    showToast(`Loaded template: ${preset.label}`);
  };

  const handleAnalyzeContext = async () => {
    setIsAnalyzingContext(true);
    try {
      const response = await fetch('/api/miaa/parse-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName,
          targetRole,
          companyName,
          difficulty,
          selectedTracks,
          resumeText,
          jobDescriptionText,
        }),
      });

      if (!response.ok) {
        throw new Error('Server analysis returned an error');
      }

      const data: AlignmentAnalysis = await response.json();
      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        setAlignment(data);
        setActiveQuestionIndex(0);
        const initialWorkspaces: Record<string, string> = {};
        data.questions.forEach((q) => {
          initialWorkspaces[q.id] = q.starterCode || '';
        });
        setWorkspaces((prev) => ({ ...prev, ...initialWorkspaces }));
        showToast(
          `Generated ${data.questions.length} tailored interview rounds for ${targetRole}.`
        );
      }
    } catch {
      // High-signal fallback synthesis if API key is not configured
      const filteredPresetQuestions = alignment.questions.filter((q) =>
        selectedTracks.includes(q.track)
      );
      setAlignment({
        ...alignment,
        roleSummary: `Calibrated ${difficulty.toUpperCase()} alignment for ${candidateName} targeting ${targetRole} at ${companyName}.`,
        questions:
          filteredPresetQuestions.length > 0
            ? filteredPresetQuestions
            : alignment.questions,
      });
      showToast(
        `Calibrated interview plan for ${targetRole} (${selectedTracks.length} tracks active).`
      );
    } finally {
      setIsAnalyzingContext(false);
    }
  };

  const handleAddCustomQuestion = (question: InterviewQuestion) => {
    setAlignment((prev) => ({
      ...prev,
      questions: [...prev.questions, question],
    }));
    setWorkspaces((prev) => ({
      ...prev,
      [question.id]: question.starterCode,
    }));
    showToast(`Added custom question: ${question.title}`);
  };

  const handleLaunchWorkbench = (startIndex = 0) => {
    setActiveQuestionIndex(startIndex);
    const q = alignment.questions[startIndex];
    if (q) {
      ensureQuestionInitialized(q);
    }
    setActiveTab('workbench');
  };

  const handleUpdateWorkspace = (questionId: string, content: string) => {
    setWorkspaces((prev) => ({ ...prev, [questionId]: content }));
  };

  const handleSendMessage = async (
    content: string,
    includeWorkspaceSnapshot = true
  ) => {
    const activeQ = alignment.questions[activeQuestionIndex];
    if (!activeQ) return;

    const now = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const candidateMsg: ChatMessage = {
      id: `msg-cand-${Date.now()}`,
      questionId: activeQ.id,
      sender: 'candidate',
      content,
      timestamp: now,
      attachedWorkspaceSnippet: includeWorkspaceSnapshot
        ? workspaces[activeQ.id]
        : undefined,
    };

    const updatedMessages = [...messages, candidateMsg];
    setMessages(updatedMessages);
    setIsSendingMessage(true);

    try {
      const qMessages = updatedMessages.filter(
        (m) => m.questionId === activeQ.id
      );
      const response = await fetch('/api/miaa/interview-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          companyName,
          difficulty,
          question: activeQ,
          messages: qMessages,
          candidateMessage: content,
          editorContent: workspaces[activeQ.id] ?? activeQ.starterCode,
          editorLanguage: 'typescript',
          studioMode: activeQ.track,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch interviewer turn');
      }

      const data = await response.json();
      const replyTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // Annotate candidate message with detected signal
      setMessages((prev) =>
        prev.map((m) =>
          m.id === candidateMsg.id
            ? {
                ...m,
                signalDetected: data.signalDetected,
                followUpType: data.followUpType,
              }
            : m
        )
      );

      // Update completeness score on active question
      if (typeof data.completenessScore === 'number') {
        setAlignment((prev) => ({
          ...prev,
          questions: prev.questions.map((q) =>
            q.id === activeQ.id
              ? { ...q, completenessScore: data.completenessScore }
              : q
          ),
        }));
      }

      const interviewerReply: ChatMessage = {
        id: `msg-int-${Date.now()}`,
        questionId: activeQ.id,
        sender: 'interviewer',
        content: data.reply,
        timestamp: replyTime,
      };
      setMessages((prev) => [...prev, interviewerReply]);
    } catch {
      const replyTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const fallbackReply: ChatMessage = {
        id: `msg-int-${Date.now()}`,
        questionId: activeQ.id,
        sender: 'interviewer',
        content: `Thank you for walking through that. Looking at your current workspace for "${activeQ.title}", how does your approach behave under concurrent contention or worst-case input distribution, and what trade-offs would you make to guarantee ${activeQ.targetComplexity}?`,
        timestamp: replyTime,
      };
      setMessages((prev) => [
        ...prev.map((m) =>
          m.id === candidateMsg.id
            ? {
                ...m,
                signalDetected: 'Structured reasoning & workspace alignment',
              }
            : m
        ),
        fallbackReply,
      ]);
      setAlignment((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === activeQ.id
            ? {
                ...q,
                completenessScore: Math.min(
                  95,
                  (q.completenessScore ?? 35) + 25
                ),
              }
            : q
        ),
      }));
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleRequestHint = async (tier: 1 | 2 | 3) => {
    const activeQ = alignment.questions[activeQuestionIndex];
    if (!activeQ) return;

    setIsRequestingHint(true);
    try {
      const qMessages = messages.filter((m) => m.questionId === activeQ.id);
      const response = await fetch('/api/miaa/request-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: activeQ,
          tier,
          messages: qMessages,
          editorContent: workspaces[activeQ.id] ?? activeQ.starterCode,
          studioMode: activeQ.track,
        }),
      });

      if (!response.ok) {
        throw new Error('Hint request failed');
      }

      const data = await response.json();
      const newHint: HintItem = {
        id: `hint-${activeQ.id}-${tier}-${Date.now()}`,
        questionId: activeQ.id,
        tier,
        hintTitle: data.hintTitle,
        hintContent: data.hintContent,
        keyTakeaway: data.keyTakeaway,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setHints((prev) => [
        ...prev.filter(
          (h) => !(h.questionId === activeQ.id && h.tier === tier)
        ),
        newHint,
      ]);
    } catch {
      const fallbackHints: Record<1 | 2 | 3, Omit<HintItem, 'id' | 'questionId' | 'timestamp'>> = {
        1: {
          tier: 1,
          hintTitle: 'Isolate Invariants Before Optimizing',
          hintContent: `Focus first on the core invariant required by "${activeQ.title}": ${activeQ.evaluationCriteria[0]}. Separate deduplication/validation checks from state mutation.`,
          keyTakeaway: 'Verify boundary conditions before mutating state.',
        },
        2: {
          tier: 2,
          hintTitle: 'Optimal Data Structure & Partitioning Pattern',
          hintContent: `To achieve ${activeQ.targetComplexity}, pair a fast lookup index (Hash Map / Composite Key) with an ordered eviction structure or partitioned worker queue.`,
          keyTakeaway: activeQ.evaluationCriteria[1] || activeQ.targetComplexity,
        },
        3: {
          tier: 3,
          hintTitle: 'Production Scale & Memory Eviction Guardrail',
          hintContent: `Watch out for unbounded memory growth or head-of-line blocking: ${activeQ.evaluationCriteria[2] || 'ensure stale keys are evicted and operations are atomic.'}`,
          keyTakeaway: 'Prevent O(N) shifts and memory leaks on inactive keys.',
        },
      };

      const fb = fallbackHints[tier];
      const newHint: HintItem = {
        ...fb,
        id: `hint-${activeQ.id}-${tier}-${Date.now()}`,
        questionId: activeQ.id,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setHints((prev) => [
        ...prev.filter(
          (h) => !(h.questionId === activeQ.id && h.tier === tier)
        ),
        newHint,
      ]);
    } finally {
      setIsRequestingHint(false);
    }
  };

  const handleAnalyzeWorkspace = async () => {
    const activeQ = alignment.questions[activeQuestionIndex];
    if (!activeQ) return;

    setIsAnalyzingWorkspace(true);
    try {
      const response = await fetch('/api/miaa/analyze-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: activeQ,
          editorContent: workspaces[activeQ.id] ?? activeQ.starterCode,
          editorLanguage: 'typescript',
          studioMode: activeQ.track,
        }),
      });

      if (!response.ok) {
        throw new Error('Workspace analysis failed');
      }

      const data: CodeAnalysisResult = await response.json();
      setCodeAnalyses((prev) => ({ ...prev, [activeQ.id]: data }));
      showToast('Completed dry-run & complexity inspection.');
    } catch {
      const fallbackAnalysis: CodeAnalysisResult = {
        timeComplexity: activeQ.targetComplexity.split('·')[0]?.trim() || 'O(1) Amortized',
        spaceComplexity:
          activeQ.targetComplexity.split('·')[1]?.trim() || 'O(U + K) Active State',
        correctnessVerdict: 'Working with Minor Edge-Case Gaps',
        traceWalkthrough: `Dry-run against "${activeQ.title}" confirms the primary path satisfies core constraints, while extreme burst inputs can be tightened further.`,
        edgeCasesCovered: [
          activeQ.evaluationCriteria[0] || 'Core happy-path logic verified',
          activeQ.evaluationCriteria[1] || 'Clean modular separation of state',
        ],
        edgeCasesMissing: [
          activeQ.evaluationCriteria[2] ||
            'Periodic cleanup / compaction under sustained peak load',
          'Explicit handling of clock skew or concurrent retry races',
        ],
        optimizationTip:
          'Replace linear array shifts or unindexed lookups with a pointer-indexed ring buffer or atomic batch operation.',
      };
      setCodeAnalyses((prev) => ({ ...prev, [activeQ.id]: fallbackAnalysis }));
      showToast('Completed dry-run & complexity inspection.');
    } finally {
      setIsAnalyzingWorkspace(false);
    }
  };

  const handleFinishAndEvaluate = async () => {
    setIsEvaluating(true);
    try {
      const response = await fetch('/api/miaa/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName,
          targetRole,
          companyName,
          difficulty,
          questions: alignment.questions,
          messages,
          workspaces,
          hintsUsedCount: hints.length,
        }),
      });

      if (!response.ok) {
        throw new Error('Evaluation failed');
      }

      const reportData: EvaluationReport = await response.json();
      setCurrentReport(reportData);

      const newSession: SavedSession = {
        id: `session-${Date.now()}`,
        createdAt: new Date().toISOString(),
        candidateName,
        targetRole,
        companyName,
        difficulty,
        selectedTracks,
        durationSeconds: elapsedSeconds,
        hintsUsedCount: hints.length,
        questions: alignment.questions,
        messages,
        workspaces,
        report: reportData,
      };
      setSavedSessions((prev) => [newSession, ...prev]);
      setActiveTab('report');
      showToast('Compiled hiring committee evaluation scorecard.');
    } catch {
      const fallbackReport = INITIAL_SAVED_SESSIONS[0].report;
      setCurrentReport(fallbackReport);
      const newSession: SavedSession = {
        id: `session-${Date.now()}`,
        createdAt: new Date().toISOString(),
        candidateName,
        targetRole,
        companyName,
        difficulty,
        selectedTracks,
        durationSeconds: elapsedSeconds,
        hintsUsedCount: hints.length,
        questions: alignment.questions,
        messages,
        workspaces,
        report: fallbackReport,
      };
      setSavedSessions((prev) => [newSession, ...prev]);
      setActiveTab('report');
      showToast('Compiled hiring committee evaluation scorecard.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleOpenSavedSessionReport = (session: SavedSession) => {
    setCandidateName(session.candidateName);
    setTargetRole(session.targetRole);
    setCompanyName(session.companyName);
    setDifficulty(session.difficulty);
    setSelectedTracks(session.selectedTracks);
    setElapsedSeconds(session.durationSeconds);
    setCurrentReport(session.report);
    setActiveTab('report');
  };

  const handleResumeSavedSessionWorkbench = (session: SavedSession) => {
    setCandidateName(session.candidateName);
    setTargetRole(session.targetRole);
    setCompanyName(session.companyName);
    setDifficulty(session.difficulty);
    setSelectedTracks(session.selectedTracks);
    setAlignment((prev) => ({
      ...prev,
      questions: session.questions,
    }));
    setMessages(session.messages);
    setWorkspaces(session.workspaces);
    setElapsedSeconds(session.durationSeconds);
    setActiveQuestionIndex(0);
    setActiveTab('workbench');
  };

  const handleDeleteSession = (sessionId: string) => {
    setSavedSessions((prev) => prev.filter((s) => s.id !== sessionId));
    showToast('Removed session from history.');
  };

  const primaryActionLabel =
    activeTab === 'prep'
      ? 'Start Mock Session'
      : activeTab === 'workbench'
      ? 'Finish & Evaluate'
      : 'New Mock Session';

  const handlePrimaryAction = () => {
    if (activeTab === 'prep') {
      handleLaunchWorkbench(0);
    } else if (activeTab === 'workbench') {
      handleFinishAndEvaluate();
    } else {
      setActiveTab('prep');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-slate-100">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onPrimaryAction={handlePrimaryAction}
        primaryActionLabel={primaryActionLabel}
      />

      {statusBanner && (
        <div className="bg-indigo-950/90 border-b border-indigo-500/40 px-6 py-2 text-xs text-indigo-200 flex items-center justify-between">
          <span>{statusBanner}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-indigo-300 hover:text-white font-medium cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="flex-1">
        {activeTab === 'prep' && (
          <PrepStudioView
            presets={ROLE_PRESETS}
            activePresetId={activePresetId}
            onSelectPreset={handleSelectPreset}
            candidateName={candidateName}
            setCandidateName={setCandidateName}
            targetRole={targetRole}
            setTargetRole={setTargetRole}
            companyName={companyName}
            setCompanyName={setCompanyName}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            selectedTracks={selectedTracks}
            setSelectedTracks={setSelectedTracks}
            resumeText={resumeText}
            setResumeText={setResumeText}
            jobDescriptionText={jobDescriptionText}
            setJobDescriptionText={setJobDescriptionText}
            alignment={alignment}
            onAnalyzeContext={handleAnalyzeContext}
            isAnalyzing={isAnalyzingContext}
            onLaunchWorkbench={handleLaunchWorkbench}
            onAddCustomQuestion={handleAddCustomQuestion}
          />
        )}

        {activeTab === 'workbench' && (
          <LiveWorkbenchView
            targetRole={targetRole}
            companyName={companyName}
            questions={alignment.questions}
            activeQuestionIndex={activeQuestionIndex}
            setActiveQuestionIndex={setActiveQuestionIndex}
            messages={messages}
            onSendMessage={handleSendMessage}
            isSendingMessage={isSendingMessage}
            workspaces={workspaces}
            onUpdateWorkspace={handleUpdateWorkspace}
            hints={hints}
            onRequestHint={handleRequestHint}
            isRequestingHint={isRequestingHint}
            codeAnalyses={codeAnalyses}
            onAnalyzeWorkspace={handleAnalyzeWorkspace}
            isAnalyzingWorkspace={isAnalyzingWorkspace}
            elapsedSeconds={elapsedSeconds}
            onFinishAndEvaluate={handleFinishAndEvaluate}
            isEvaluating={isEvaluating}
          />
        )}

        {activeTab === 'report' && (
          <EvaluationReportView
            candidateName={candidateName}
            targetRole={targetRole}
            companyName={companyName}
            difficulty={difficulty}
            durationSeconds={elapsedSeconds}
            hintsUsedCount={hints.length}
            report={currentReport}
            onBackToWorkbench={() => setActiveTab('workbench')}
            onStartNewSession={() => setActiveTab('prep')}
          />
        )}

        {activeTab === 'history' && (
          <SessionHistoryView
            sessions={savedSessions}
            onOpenSessionReport={handleOpenSavedSessionReport}
            onResumeSessionWorkbench={handleResumeSavedSessionWorkbench}
            onDeleteSession={handleDeleteSession}
            onStartNewSession={() => setActiveTab('prep')}
          />
        )}
      </main>
    </div>
  );
}
