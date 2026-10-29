export type InterviewTrack = 'coding' | 'system_design' | 'behavioral';

export type DifficultyLevel = 'mid' | 'senior' | 'staff';

export type ProgrammingLanguage = 'typescript' | 'python' | 'go' | 'java' | 'cpp';

export type StudioMode = 'code' | 'system_design' | 'star';

export interface InterviewQuestion {
  id: string;
  track: InterviewTrack;
  title: string;
  difficulty: string;
  estimatedMinutes: number;
  prompt: string;
  contextNote: string;
  starterCode: string;
  targetComplexity: string;
  evaluationCriteria: string[];
  completenessScore?: number;
}

export interface AlignmentAnalysis {
  matchedSkills: string[];
  skillGaps: string[];
  roleSummary: string;
  interviewStrategy: string;
  questions: InterviewQuestion[];
}

export interface ChatMessage {
  id: string;
  questionId: string;
  sender: 'interviewer' | 'candidate';
  content: string;
  timestamp: string;
  signalDetected?: string;
  followUpType?: 'probe' | 'clarify' | 'ready_for_next';
  attachedWorkspaceSnippet?: string;
}

export interface HintItem {
  id: string;
  questionId: string;
  tier: 1 | 2 | 3;
  hintTitle: string;
  hintContent: string;
  keyTakeaway: string;
  timestamp: string;
}

export interface CodeAnalysisResult {
  timeComplexity: string;
  spaceComplexity: string;
  correctnessVerdict: string;
  traceWalkthrough: string;
  edgeCasesCovered: string[];
  edgeCasesMissing: string[];
  optimizationTip: string;
}

export interface StarNotes {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface SystemDesignNotes {
  capacityEstimation: string;
  apiEndpoints: string;
  dataModel: string;
  highLevelArchitecture: string;
  bottlenecksAndScaling: string;
}

export interface QuestionBreakdown {
  questionId: string;
  questionTitle: string;
  track: InterviewTrack | string;
  score: number;
  candidateSummary: string;
  actionableFeedback: string;
  idealAnswer: string;
}

export interface EvaluationReport {
  overallScore: number;
  hiringRecommendation: string;
  executiveSummary: string;
  competencyScores: {
    problemSolving: number;
    technicalDepth: number;
    communication: number;
    roleAlignment: number;
  };
  strengths: string[];
  growthAreas: string[];
  questionBreakdowns: QuestionBreakdown[];
}

export interface SavedSession {
  id: string;
  createdAt: string;
  candidateName: string;
  targetRole: string;
  companyName: string;
  difficulty: DifficultyLevel;
  selectedTracks: InterviewTrack[];
  durationSeconds: number;
  hintsUsedCount: number;
  questions: InterviewQuestion[];
  messages: ChatMessage[];
  workspaces: Record<string, string>;
  report: EvaluationReport;
}

export interface RolePreset {
  id: string;
  label: string;
  candidateName: string;
  targetRole: string;
  companyName: string;
  difficulty: DifficultyLevel;
  selectedTracks: InterviewTrack[];
  resumeText: string;
  jobDescriptionText: string;
  defaultAlignment: AlignmentAnalysis;
}
