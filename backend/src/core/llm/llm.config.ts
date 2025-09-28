// Config por defecto del LLM y política de esfuerzo por agente/paso

export type AgentKind = "tutor" | "verifier" | "socratic" | "help" | "planner";
export type StepType = "NARRATION" | "CONTENT" | "ASK" | "EXERCISE" | "QUIZ";
export type Effort = "low" | "medium" | "high" | "minimal";

export const LLM_DEFAULTS = {
  model: "gpt-4o-mini", // recomendado por costo/latencia/calidad
  effortByAgent: {
    tutor: "medium" as Effort,
    verifier: "high" as Effort,
    socratic: "medium" as Effort,
    help: "low" as Effort,
    planner: "low" as Effort
  },
  // Overrides automáticos según tipo de paso
  effortByStepType: {
    QUIZ: "high" as Effort,
    EXERCISE: "medium" as Effort,
    CONTENT: "medium" as Effort,
    ASK: "medium" as Effort,
    NARRATION: "low" as Effort
  } as Partial<Record<StepType, Effort>>
} as const;

export function pickEffort(args: { agent: AgentKind; stepType?: StepType; override?: Effort }): Effort {
  if (args.override) return args.override;
  const stepEffort = args.stepType ? LLM_DEFAULTS.effortByStepType[args.stepType] : undefined;
  return stepEffort ?? LLM_DEFAULTS.effortByAgent[args.agent];
}
