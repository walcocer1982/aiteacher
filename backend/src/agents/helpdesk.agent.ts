// preguntas libres

import { llmJson } from "../core/llm/llm.client";
import { Lesson, Session } from "../core/models/index";

export interface HelpOutput {
  reply: string;
}

export class HelpDeskAgent {
  static async answer(
    lesson: Lesson,
    session: Session,
    question: string
  ): Promise<HelpOutput> {
    
    const system = `Eres un agente de ayuda que responde preguntas libres de estudiantes.
    
    Reglas:
    - Responde en 3–6 líneas con ejemplo del curso
    - Si detectas error conceptual → aclara y sugiere volver al step
    - reasoning.effort: low`;

    const user = `Lección: ${lesson.title}
    Paso actual: ${lesson.steps[session.currentStepIndex]?.id}
    Objetivos: ${lesson.objectives.join(", ")}
    Memoria del estudiante: ${JSON.stringify(session.memory)}
    Pregunta del estudiante: "${question}"
    
    Responde la pregunta manteniendo el contexto de la lección.`;

    const schema = {
      type: "object",
      properties: {
        reply: { type: "string" }
      },
      required: ["reply"],
      additionalProperties: false
    };

    return await llmJson<HelpOutput>({
      system,
      user,
      schema,
      agent: "help"
    });
  }
}
