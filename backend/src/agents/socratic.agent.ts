// remediación breve

import { llmJson } from "../core/llm/llm.client";
import { Lesson, Session, Step } from "../core/models/index";

export interface CoachOutput {
  reply: string;
  extracted?: {
    keyPoints: string[];
  };
}

export class SocraticAgent {
  static async remediate(
    lesson: Lesson,
    session: Session,
    step: Step,
    findings: string[]
  ): Promise<CoachOutput> {
    
    const system = `Eres un coach socrático que ayuda a estudiantes que fallaron.
    
    Reglas:
    - Una sola consigna por turno
    - No reveles la respuesta completa; guía
    - reasoning.effort: medium`;

    const user = `Lección: ${lesson.title}
    Paso: ${step.id} (${step.type})
    Prompt original: ${step.prompt}
    Hallazgos del verificador: ${findings.join(", ")}
    Memoria del estudiante: ${JSON.stringify(session.memory)}
    
    Genera una pregunta socrática y una pista para ayudar al estudiante.`;

    const schema = {
      type: "object",
      properties: {
        reply: { type: "string" },
        extracted: {
          type: "object",
          properties: {
            keyPoints: { type: "array", items: { type: "string" } }
          },
          additionalProperties: false
        }
      },
      required: ["reply"],
      additionalProperties: false
    };

    return await llmJson<CoachOutput>({
      system,
      user,
      schema,
      agent: "socratic",
      stepType: step.type
    });
  }
}
