// explica/pregunta

import { llmJson } from "../core/llm/llm.client";
import { Lesson, Session, Step, StudentEvent } from "../core/models/index";

export interface TutorOutput {
  reply: string;
  extracted?: {
    keyPoints: string[];
    facts: string[];
    steps: string[];
  };
  autoAnswer?: string;
}

export class TutorAgent {
  static async handle(
    lesson: Lesson, 
    session: Session, 
    step: Step, 
    event?: StudentEvent
  ): Promise<TutorOutput> {
    
    const system = `Eres un tutor IA especializado en ${lesson.title}.
    
    Comportamiento:
    - CONTENT: explica en 120–180 palabras + ejemplo del curso
    - ASK/EXERCISE: 1 consigna clara (evita sermones)
    - Si el step viene de un fallo anterior → llama a SocraticCoach
    - reasoning.effort: medium`;

    const user = `Lección: ${lesson.title}
    Paso: ${step.id} (${step.type})
    Prompt: ${step.prompt}
    Contenido: ${step.content || "N/A"}
    Memoria del estudiante: ${JSON.stringify(session.memory)}
    Evento del estudiante: ${event ? JSON.stringify(event) : "Ninguno"}
    
    Genera la respuesta del tutor para este paso.`;

    const schema = {
      type: "object",
      properties: {
        reply: { type: "string" },
        extracted: {
          type: "object",
          properties: {
            keyPoints: { type: "array", items: { type: "string" } },
            facts: { type: "array", items: { type: "string" } },
            steps: { type: "array", items: { type: "string" } }
          },
          additionalProperties: false
        },
        autoAnswer: { type: "string" }
      },
      required: ["reply"],
      additionalProperties: false
    };

    return await llmJson<TutorOutput>({
      system,
      user,
      schema,
      agent: "tutor",
      stepType: step.type
    });
  }
}
