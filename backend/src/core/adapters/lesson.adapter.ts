// normaliza cualquier esquema de lesson

import { Lesson, Step, StepType, AnswerType } from "../models/index";

export class LessonAdapter {
  static normalize(input: any): Lesson {
    // Mapear outcomes/competencies -> objectives
    const objectives = input.objectives || 
                     input.outcomes || 
                     input.competencies || 
                     [];

    // Mapear items[] -> steps[] {type, prompt, answerType, rubric?}
    const steps: Step[] = (input.steps || input.items || []).map((item: any, index: number) => ({
      id: item.id || `s${index + 1}`,
      type: this.mapStepType(item.type || item.stepType),
      prompt: item.prompt || item.question || item.instruction || "",
      answerType: this.mapAnswerType(item.answerType || item.responseType),
      rubric: item.rubric,
      content: item.content || item.explanation,
      data: item.data || item.options
    }));

    // Set defaults: language, level, thresholds
    return {
      id: input.id || input.lessonId || "unknown",
      title: input.title || input.name || "Sin título",
      objectives: Array.isArray(objectives) ? objectives : [objectives],
      steps,
      language: input.language || "es",
      level: input.level || "basic"
    };
  }

  private static mapStepType(type: string): StepType {
    const mapping: Record<string, StepType> = {
      "narration": "NARRATION",
      "content": "CONTENT", 
      "ask": "ASK",
      "exercise": "EXERCISE",
      "quiz": "QUIZ",
      "question": "ASK",
      "activity": "EXERCISE"
    };
    return mapping[type?.toLowerCase()] || "CONTENT";
  }

  private static mapAnswerType(type: string): AnswerType {
    const mapping: Record<string, AnswerType> = {
      "open": "open",
      "definition": "definition",
      "list": "list", 
      "procedure": "procedure",
      "mcq": "mcq",
      "multiple_choice": "mcq",
      "free_text": "open"
    };
    return mapping[type?.toLowerCase()] || "open";
  }
}
