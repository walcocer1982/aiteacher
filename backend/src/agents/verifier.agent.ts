// evalúa con rúbrica

import { llmJson } from "../core/llm/llm.client";
import { Lesson, Session, Step } from "../core/models/index";

export interface Verification {
  score: number;
  findings: string[];
  feedback: string;
  nextAction: "advance" | "retry";
}

export class VerifierAgent {
  static async check(
    lesson: Lesson,
    session: Session,
    step: Step,
    answer: string
  ): Promise<Verification> {
    
    const rubric = step.rubric || this.getDefaultRubric(step);
    
    const system = `Eres un verificador IA que evalúa respuestas de estudiantes con rúbricas.
    
    Criterios por defecto (si no viene rúbrica):
    - definition: precisión + claridad
    - list: cobertura (≥3 ítems) + relevancia  
    - procedure: orden + completitud
    - mcq: corrección + justificación
    
    reasoning.effort: high
    
    Evalúa de 0.0 a 1.0 y proporciona feedback constructivo.`;

    const user = `Lección: ${lesson.title}
    Paso: ${step.id} (${step.type})
    Tipo de respuesta: ${step.answerType}
    Rúbrica: ${JSON.stringify(rubric)}
    Respuesta del estudiante: "${answer}"
    
    Evalúa la respuesta según la rúbrica.`;

    const schema = {
      type: "object",
      properties: {
        score: { type: "number", minimum: 0, maximum: 1 },
        findings: { type: "array", items: { type: "string" } },
        feedback: { type: "string" },
        nextAction: { type: "string", enum: ["advance", "retry"] }
      },
      required: ["score", "findings", "feedback", "nextAction"],
      additionalProperties: false
    };

    return await llmJson<Verification>({
      system,
      user,
      schema,
      agent: "verifier",
      stepType: step.type
    });
  }

  private static getDefaultRubric(step: Step) {
    const defaultRubrics = {
      definition: {
        criteria: [
          { id: "precision", description: "Usa términos correctos", weight: 0.6 },
          { id: "clarity", description: "1-3 oraciones claras", weight: 0.4 }
        ],
        threshold: 0.6
      },
      list: {
        criteria: [
          { id: "coverage", description: "Mínimo 3 ítems relevantes", weight: 0.7 },
          { id: "relevance", description: "Ítems apropiados al contexto", weight: 0.3 }
        ],
        threshold: 0.6
      },
      procedure: {
        criteria: [
          { id: "order", description: "Secuencia lógica", weight: 0.5 },
          { id: "completeness", description: "Pasos completos", weight: 0.5 }
        ],
        threshold: 0.6
      },
      mcq: {
        criteria: [
          { id: "correctness", description: "Respuesta correcta", weight: 0.6 },
          { id: "justification", description: "Justificación válida", weight: 0.4 }
        ],
        threshold: 0.6
      }
    };

    return defaultRubrics[step.answerType as keyof typeof defaultRubrics] || defaultRubrics.definition;
  }
}
