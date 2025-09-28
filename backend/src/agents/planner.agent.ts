// dueño del flujo

import { llmJson } from "../core/llm/llm.client";
import { Lesson, Session } from "../core/models/index";

export interface PlannerDecision {
  nextIndex: number;
  rationale: string;
}

export class PlannerAgent {
  static async decide(lesson: Lesson, session: Session): Promise<PlannerDecision> {
    const lastTurn = session.history[session.history.length - 1];
    const currentStep = lesson.steps[session.currentStepIndex];
    const lastScore = lastTurn?.score || 0;
    const threshold = currentStep?.rubric?.threshold || 0.6;

    const system = `Eres un agente planificador que decide si avanzar o remediar en una lección.
    
    Reglas mínimas:
    - Si último score < ${threshold} → quedarse (remediación)
    - Si no hay más pasos → isFinished = true
    - (Opcional) Saltar pasos si masteredObjectives lo permite`;

    const user = `Lección: ${lesson.title}
    Paso actual: ${currentStep?.id} (${currentStep?.type})
    Score último: ${lastScore}
    Índice actual: ${session.currentStepIndex}
    Total pasos: ${lesson.steps.length}
    ¿Debo avanzar o remediar?`;

    const schema = {
      type: "object",
      properties: {
        nextIndex: { type: "number" },
        rationale: { type: "string" }
      },
      required: ["nextIndex", "rationale"],
      additionalProperties: false
    };

    return await llmJson<PlannerDecision>({
      system,
      user,
      schema,
      agent: "planner",
      stepType: currentStep?.type
    });
  }
}
