// Lesson, Step, Session, Rubric, Events

export type StepType = "NARRATION" | "CONTENT" | "ASK" | "EXERCISE" | "QUIZ";
export type AnswerType = "open" | "definition" | "list" | "procedure" | "mcq";

export interface Step {
  id: string;
  type: StepType;
  prompt: string;
  answerType?: AnswerType;
  rubric?: Rubric;
  content?: string;
  data?: Record<string, any>;
}

export interface Lesson {
  id: string;
  title: string;
  objectives: string[];
  steps: Step[];
  language?: "es" | "en";
  level?: "basic" | "intermediate" | "advanced";
}

export interface Rubric {
  criteria: { id: string; description: string; weight: number }[];
  threshold: number;
}

export interface Session {
  id: string;
  lessonId: string;
  userId: string;
  currentStepIndex: number;
  history: Turn[];
  memory: {
    glossary: Record<string, string>;
    misconceptions: string[];
    masteredObjectives: string[];
  };
  isFinished: boolean;
}

export interface Turn {
  stepId: string;
  role: "tutor" | "student" | "verifier" | "help" | "system" | "socratic" | "planner";
  text: string;
  score?: number;
  findings?: string[];
}

export type StudentEvent = { type: "answer"; text: string } | { type: "question"; text: string };

export function expectsAnswer(step: Step, event: StudentEvent): boolean {
  if (event.type === "question") return false;
  return step.type === "ASK" || step.type === "EXERCISE" || step.type === "QUIZ";
}
