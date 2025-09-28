// orquestación por turno

import { LessonRepo } from '../../infrastructure/repositories/lesson.repo';
import { SessionRepo, logTurn } from '../../infrastructure/repositories/session.repo';
import { HelpDeskAgent } from '../../agents/helpdesk.agent';
import { TutorAgent } from '../../agents/tutor.agent';
import { VerifierAgent } from '../../agents/verifier.agent';
import { PlannerAgent } from '../../agents/planner.agent';
import { SocraticAgent } from '../../agents/socratic.agent';
import { Session, StudentEvent, expectsAnswer, Lesson } from '../../core/models/index';

export class ChatService {
  private lessonRepo = new LessonRepo();
  private sessionRepo = new SessionRepo();

  async createSession(lessonId: string, userId: string): Promise<{ sessionId: string }> {
    const session = this.sessionRepo.create(lessonId, userId);
    return { sessionId: session.id };
  }

  async handleEvent(sessionId: string, event: StudentEvent): Promise<{
    reply: string;
    stepId: string;
    isFinished: boolean;
    score?: number;
    feedback?: string;
  }> {
    const session = this.sessionRepo.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const lesson = await this.lessonRepo.getById(session.lessonId);
    
    if (session.isFinished) {
      return {
        reply: "Sesión finalizada.",
        stepId: "",
        isFinished: true
      };
    }

    // 1) Interrupciones (preguntas libres)
    if (event.type === "question") {
      const help = await HelpDeskAgent.answer(lesson, session, event.text);
      logTurn(session, this.getCurrentStep(lesson, session).id, "help", help.reply);
      this.sessionRepo.save(session);
      
      return {
        reply: help.reply,
        stepId: this.getCurrentStep(lesson, session).id,
        isFinished: session.isFinished
      };
    }

    // 2) Paso actual → Tutor
    const step = this.getCurrentStep(lesson, session);
    const tutor = await TutorAgent.handle(lesson, session, step, event);
    logTurn(session, step.id, "tutor", tutor.reply);

    let score: number | undefined;
    let feedback: string | undefined;

    // 3) Verificación si aplica
    if (expectsAnswer(step, event)) {
      const verification = await VerifierAgent.check(lesson, session, step, event.text);
      logTurn(session, step.id, "verifier", verification.feedback, verification.score, verification.findings);
      
      score = verification.score;
      feedback = verification.feedback;
    }

    // 4) Decisión de avance/remediación
    const decision = await PlannerAgent.decide(lesson, session);
    
    // Si el score es bajo, usar Socratic Coach antes de aplicar decisión
    if (score !== undefined && score < (step.rubric?.threshold || 0.6)) {
      const coach = await SocraticAgent.remediate(lesson, session, step, []);
      logTurn(session, step.id, "socratic", coach.reply);
      
      this.sessionRepo.save(session);
      return {
        reply: coach.reply,
        stepId: step.id,
        isFinished: session.isFinished,
        score,
        feedback
      };
    }

    // Aplicar decisión del planner
    this.applyDecision(session, lesson, decision);
    this.sessionRepo.save(session);

    return {
      reply: tutor.reply,
      stepId: step.id,
      isFinished: session.isFinished,
      score,
      feedback
    };
  }

  async getSession(sessionId: string): Promise<Session | null> {
    return this.sessionRepo.get(sessionId) || null;
  }

  private getCurrentStep(lesson: Lesson, session: Session) {
    return lesson.steps[session.currentStepIndex];
  }

  private applyDecision(session: Session, lesson: Lesson, decision: any): void {
    const { nextIndex } = decision;
    
    if (nextIndex >= lesson.steps.length) {
      session.isFinished = true;
    } else {
      session.currentStepIndex = nextIndex;
    }
  }
}
