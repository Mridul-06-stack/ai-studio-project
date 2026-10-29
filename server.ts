import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '5mb' }));

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. POST /api/miaa/parse-context
app.post('/api/miaa/parse-context', async (req, res) => {
  try {
    const {
      candidateName = 'Candidate',
      targetRole = 'Senior Software Engineer',
      companyName = 'High-Growth Tech Co',
      difficulty = 'senior',
      selectedTracks = ['coding', 'system_design', 'behavioral'],
      resumeText = '',
      jobDescriptionText = '',
    } = req.body || {};

    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const prompt = `You are MIAA (Mock Interview Agent Assistant), a Principal Engineering Hiring Committee Chair.
Analyze the following candidate resume and target job description for the role of "${targetRole}" at "${companyName}" (Difficulty level: ${difficulty.toUpperCase()}).
Selected interview tracks to generate questions for: ${selectedTracks.join(', ')}.

CANDIDATE NAME: ${candidateName}
RESUME:
${resumeText.slice(0, 6000)}

TARGET JOB DESCRIPTION:
${jobDescriptionText.slice(0, 6000)}

Generate:
1. matchedSkills: 5-7 concrete technical or leadership skills present in both the resume and JD.
2. skillGaps: 3-5 probe areas, potential gaps, or stretch requirements where the interviewer should press deeper.
3. roleSummary: A sharp 2-sentence synthesis of how the candidate aligns with the target role.
4. interviewStrategy: A 1-2 sentence strategy note on how this mock interview session will evaluate the candidate.
5. questions: Exactly 4 tailored interview questions distributed across the selectedTracks (${selectedTracks.join(', ')}).
   - For 'coding' track questions: provide a realistic algorithmic/data-structure or practical engineering problem statement, starterCode in TypeScript, expected time/space complexity target, and 3 key evaluation criteria.
   - For 'system_design' track questions: provide an architectural design prompt scaled to the target company/role, starterCode containing structured Markdown architecture sections, and 3 key evaluation criteria.
   - For 'behavioral' track questions: provide a high-signal leadership/conflict/ownership prompt tailored to a specific project or gap in their resume, and 3 STAR evaluation criteria.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchedSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            skillGaps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            roleSummary: { type: Type.STRING },
            interviewStrategy: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  track: {
                    type: Type.STRING,
                    description: 'Must be one of: coding, system_design, behavioral',
                  },
                  title: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  estimatedMinutes: { type: Type.INTEGER },
                  prompt: { type: Type.STRING },
                  contextNote: { type: Type.STRING },
                  starterCode: { type: Type.STRING },
                  targetComplexity: { type: Type.STRING },
                  evaluationCriteria: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  'id',
                  'track',
                  'title',
                  'difficulty',
                  'estimatedMinutes',
                  'prompt',
                  'contextNote',
                  'starterCode',
                  'targetComplexity',
                  'evaluationCriteria',
                ],
              },
            },
          },
          required: [
            'matchedSkills',
            'skillGaps',
            'roleSummary',
            'interviewStrategy',
            'questions',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/miaa/parse-context:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to parse resume and job description.',
    });
  }
});

// 2. POST /api/miaa/interview-turn
app.post('/api/miaa/interview-turn', async (req, res) => {
  try {
    const {
      targetRole,
      companyName,
      difficulty,
      question,
      messages = [],
      candidateMessage = '',
      editorContent = '',
      editorLanguage = 'typescript',
      studioMode = 'code',
    } = req.body || {};

    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const transcriptText = messages
      .slice(-10)
      .map((m: any) => `${m.sender.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const prompt = `You are a Principal Interviewer at "${companyName}" conducting a ${difficulty}-level interview for "${targetRole}".
Current Question (${question?.track?.toUpperCase()} — "${question?.title}"):
${question?.prompt}

Evaluation Criteria for this question:
${(question?.evaluationCriteria || []).join('; ')}

Recent Conversation Transcript:
${transcriptText || '(Start of question)'}

Candidate's Live Workspace Snapshot (${studioMode.toUpperCase()} / ${editorLanguage}):
\`\`\`
${(editorContent || '').slice(0, 4500)}
\`\`\`

Candidate's Latest Response:
"${candidateMessage}"

Instructions:
1. Respond directly as the human interviewer—concise, sharp, constructive, and realistic (2-4 sentences).
2. Explicitly reference specific lines, data structures, architectural choices, or STAR details from the candidate's message and Live Workspace Snapshot.
3. Ask ONE focused probing follow-up question (e.g., on edge cases, concurrency, scaling bottleneck, Big-O trade-off, or measurable outcome) OR if the candidate has thoroughly satisfied the criteria, let them know their solution is comprehensive and they can advance to the next question.
4. Provide a brief 'signalDetected' phrase summarizing what the candidate demonstrated in this turn, and a 'completenessScore' (0 to 100) for how thoroughly this specific question has been answered so far.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            followUpType: {
              type: Type.STRING,
              description: 'One of: probe, clarify, ready_for_next',
            },
            signalDetected: { type: Type.STRING },
            completenessScore: { type: Type.INTEGER },
          },
          required: ['reply', 'followUpType', 'signalDetected', 'completenessScore'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/miaa/interview-turn:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate interviewer response.',
    });
  }
});

// 3. POST /api/miaa/request-hint
app.post('/api/miaa/request-hint', async (req, res) => {
  try {
    const {
      question,
      tier = 1,
      messages = [],
      editorContent = '',
      studioMode = 'code',
    } = req.body || {};

    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const tierDescriptions: Record<number, string> = {
      1: 'Tier 1 (Conceptual Nudge): Give a high-level intuition or mental model without naming the exact algorithm or writing code.',
      2: 'Tier 2 (Structural / Pattern Hint): Suggest the specific data structure, algorithmic pattern, architectural component, or STAR framing needed, and explain why it fits.',
      3: 'Tier 3 (Edge Case & Bottleneck Check): Point out the critical edge cases, complexity traps, or scaling bottlenecks in their current workspace draft and how to resolve them.',
    };

    const transcriptText = messages
      .slice(-6)
      .map((m: any) => `${m.sender.toUpperCase()}: ${m.content}`)
      .join('\n');

    const prompt = `You are MIAA's Real-Time Interview Coach.
The candidate is working on: "${question?.title}" (Track: ${question?.track}).
Question Prompt: ${question?.prompt}

Requested Coaching Level: ${tierDescriptions[tier] || tierDescriptions[1]}

Candidate's Current Workspace (${studioMode}):
\`\`\`
${(editorContent || '').slice(0, 3500)}
\`\`\`

Recent Chat Context:
${transcriptText}

Provide a concise, actionable coaching hint that helps the candidate unblock themselves without spoiling the entire verbatim answer.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hintTitle: { type: Type.STRING },
            hintContent: { type: Type.STRING },
            keyTakeaway: { type: Type.STRING },
          },
          required: ['hintTitle', 'hintContent', 'keyTakeaway'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/miaa/request-hint:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate coaching hint.',
    });
  }
});

// 4. POST /api/miaa/analyze-code
app.post('/api/miaa/analyze-code', async (req, res) => {
  try {
    const {
      question,
      editorContent = '',
      editorLanguage = 'typescript',
      studioMode = 'code',
    } = req.body || {};

    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const prompt = `You are MIAA's Technical Code & Architecture Analyzer.
Analyze the candidate's current ${studioMode === 'system_design' ? 'System Design specification' : `${editorLanguage} code implementation`} for the interview question:
"${question?.title}"
Prompt: ${question?.prompt}
Target Complexity / Scope: ${question?.targetComplexity || 'Optimal production quality'}

Candidate's Workspace Content:
\`\`\`
${(editorContent || '').slice(0, 5000)}
\`\`\`

Perform a dry-run analysis and return:
- timeComplexity: e.g., "O(N log K)" or "Read: 12ms p99 / Write: Async Queue" for system design
- spaceComplexity: e.g., "O(K)" or "Sharded PostgreSQL + Redis Cluster"
- correctnessVerdict: One of "Optimal & Production-Ready", "Working with Minor Edge-Case Gaps", "Partial / In-Progress", or "Needs Structural Revision"
- traceWalkthrough: A concise 2-3 sentence dry-run trace of how the current code/design executes on a representative input or traffic spike
- edgeCasesCovered: 2-4 edge cases or requirements properly handled
- edgeCasesMissing: 2-4 edge cases, bugs, or failure modes still missing
- optimizationTip: 1 concrete actionable improvement`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            timeComplexity: { type: Type.STRING },
            spaceComplexity: { type: Type.STRING },
            correctnessVerdict: { type: Type.STRING },
            traceWalkthrough: { type: Type.STRING },
            edgeCasesCovered: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            edgeCasesMissing: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            optimizationTip: { type: Type.STRING },
          },
          required: [
            'timeComplexity',
            'spaceComplexity',
            'correctnessVerdict',
            'traceWalkthrough',
            'edgeCasesCovered',
            'edgeCasesMissing',
            'optimizationTip',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/miaa/analyze-code:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to analyze workspace code.',
    });
  }
});

// 5. POST /api/miaa/evaluate
app.post('/api/miaa/evaluate', async (req, res) => {
  try {
    const {
      candidateName,
      targetRole,
      companyName,
      difficulty,
      questions = [],
      messages = [],
      workspaces = {},
      hintsUsedCount = 0,
    } = req.body || {};

    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const transcriptSummary = messages
      .map((m: any) => `[Q:${m.questionId || 'general'}] ${m.sender.toUpperCase()}: ${m.content}`)
      .join('\n');

    const workspaceSummary = Object.entries(workspaces)
      .map(([qId, content]) => `--- Workspace for Question ${qId} ---\n${String(content).slice(0, 2500)}`)
      .join('\n\n');

    const prompt = `You are the Hiring Committee Chair evaluating ${candidateName} for the ${difficulty}-level "${targetRole}" position at "${companyName}".
Total Hints Requested During Interview: ${hintsUsedCount}

Planned Questions:
${questions.map((q: any, i: number) => `${i + 1}. [${q.id}] (${q.track}) ${q.title}: ${q.prompt}`).join('\n')}

Full Interview Conversation Transcript:
${transcriptSummary.slice(0, 8000)}

Candidate's Submitted Code / Architecture / STAR Workspaces:
${workspaceSummary.slice(0, 8000)}

Generate a rigorous, constructive, and honest Post-Interview Evaluation Report:
1. overallScore (0-100 integer)
2. hiringRecommendation: One of "Strong Hire", "Hire", "Lean Hire", or "Needs Further Prep"
3. executiveSummary: 2-3 sentence holistic assessment of the candidate's performance, technical depth, and communication.
4. competencyScores: 0-100 integer scores for problemSolving, technicalDepth, communication, and roleAlignment.
5. strengths: 3-4 specific strengths demonstrated during the session.
6. growthAreas: 3-4 concrete, prioritized areas for improvement before the real interview.
7. questionBreakdowns: For each question in the interview plan, provide:
   - questionId
   - questionTitle
   - track
   - score (0-100)
   - candidateSummary (what the candidate did well and what they missed)
   - actionableFeedback (how to elevate the answer to a Staff/Senior bar)
   - idealAnswer (a concise senior-level exemplar solution, code snippet, or architecture summary)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER },
            hiringRecommendation: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            competencyScores: {
              type: Type.OBJECT,
              properties: {
                problemSolving: { type: Type.INTEGER },
                technicalDepth: { type: Type.INTEGER },
                communication: { type: Type.INTEGER },
                roleAlignment: { type: Type.INTEGER },
              },
              required: [
                'problemSolving',
                'technicalDepth',
                'communication',
                'roleAlignment',
              ],
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            growthAreas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            questionBreakdowns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionId: { type: Type.STRING },
                  questionTitle: { type: Type.STRING },
                  track: { type: Type.STRING },
                  score: { type: Type.INTEGER },
                  candidateSummary: { type: Type.STRING },
                  actionableFeedback: { type: Type.STRING },
                  idealAnswer: { type: Type.STRING },
                },
                required: [
                  'questionId',
                  'questionTitle',
                  'track',
                  'score',
                  'candidateSummary',
                  'actionableFeedback',
                  'idealAnswer',
                ],
              },
            },
          },
          required: [
            'overallScore',
            'hiringRecommendation',
            'executiveSummary',
            'competencyScores',
            'strengths',
            'growthAreas',
            'questionBreakdowns',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/miaa/evaluate:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate evaluation report.',
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MIAA Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
