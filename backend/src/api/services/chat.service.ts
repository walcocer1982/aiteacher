// orquestación por turno

import { LessonRepo } from '../../infrastructure/repositories/lesson.repo';
import { SessionRepo, logTurn } from '../../infrastructure/repositories/session.repo';
import { HelpDeskAgent } from '../../agents/helpdesk.agent';
import { TutorAgent } from '../../agents/tutor.agent';
import { VerifierAgent } from '../../agents/verifier.agent';
import { PlannerAgent } from '../../agents/planner.agent';
import { SocraticAgent } from '../../agents/socratic.agent';
import { Lesson, Session, Step, StudentEvent, Turn } from '../../core/models/index';

export class ChatService {
  private lessonRepo = new LessonRepo();
  private sessionRepo = new SessionRepo();

  async createSession(lessonId: string, userId: string): Promise<{
    sessionId: string;
    lesson: { id: string; title: string; totalSteps: number };
    currentStepIndex: number;
    initialTurns: Turn[];
  }> {
    const lesson = await this.lessonRepo.getById(lessonId);
    const session = this.sessionRepo.create(lessonId, userId);

    const initialTurns = await this.prepareCurrentStep(lesson, session, {
      forcePrompt: true
    });

    this.sessionRepo.save(session);

    return {
      sessionId: session.id,
      lesson: {
        id: lesson.id,
        title: lesson.title,
        totalSteps: lesson.steps.length
      },
      initialTurns,
      currentStepIndex: session.currentStepIndex
    };
  }

  async handleEvent(sessionId: string, event: StudentEvent): Promise<{
    reply: string;
    replyRole: Turn['role'];
    stepId: string;
    isFinished: boolean;
    score?: number;
    feedback?: string;
    nextTurns?: Turn[];
    currentStepIndex: number;
  }> {
    const session = this.sessionRepo.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const lesson = await this.lessonRepo.getById(session.lessonId);
    const currentStep = this.getCurrentStep(lesson, session);

    if (!currentStep) {
      session.isFinished = true;
      this.sessionRepo.save(session);
      return {
        reply: 'Sesión finalizada.',
        replyRole: 'system',
        stepId: '',
        isFinished: true,
        currentStepIndex: session.currentStepIndex
      };
    }

    if (session.isFinished) {
      return {
        reply: 'Sesión finalizada.',
        replyRole: 'system',
        stepId: '',
        isFinished: true,
        currentStepIndex: session.currentStepIndex
      };
    }

    // 1) Interrupciones (preguntas libres)
    if (event.type === 'question') {
      logTurn(session, currentStep.id, 'student', event.text);
      const help = await HelpDeskAgent.answer(lesson, session, event.text);
      logTurn(session, currentStep.id, 'help', help.reply);
      this.sessionRepo.save(session);

      return {
        reply: help.reply,
        replyRole: 'help',
        stepId: currentStep.id,
        isFinished: session.isFinished,
        currentStepIndex: session.currentStepIndex
      };
    }

    // 2) Paso actual → Tutor
    logTurn(session, currentStep.id, 'student', event.text);
    const tutor = await TutorAgent.handle(lesson, session, currentStep, event);
    const tutorTurn = logTurn(session, currentStep.id, 'tutor', tutor.reply);

    let score: number | undefined;
    let feedback: string | undefined;
    let findings: string[] | undefined;

    // 3) Verificación si aplica
    if (this.stepRequiresAnswer(currentStep)) {
      const verification = await VerifierAgent.check(lesson, session, currentStep, event.text);
      logTurn(
        session,
        currentStep.id,
        'verifier',
        verification.feedback,
        verification.score,
        verification.findings
      );

      score = verification.score;
      feedback = verification.feedback;
      findings = verification.findings;

      const threshold = currentStep.rubric?.threshold ?? 0.6;
      if (score !== undefined && score < threshold) {
        const coach = await SocraticAgent.remediate(lesson, session, currentStep, findings || []);
        logTurn(session, currentStep.id, 'socratic', coach.reply);

        this.sessionRepo.save(session);
        return {
          reply: coach.reply,
          replyRole: 'socratic',
          stepId: currentStep.id,
          isFinished: session.isFinished,
          score,
          feedback,
          currentStepIndex: session.currentStepIndex
        };
      }
    }

    // 4) Decisión de avance/remediación
    const decision = await PlannerAgent.decide(lesson, session);
    const nextStep = lesson.steps[decision.nextIndex];
    const plannerSummary = nextStep
      ? `${decision.rationale} → siguiente paso ${nextStep.id}`
      : `${decision.rationale} → finalizar lección`;
    logTurn(session, currentStep.id, 'planner', plannerSummary);

    const { advanced } = this.applyDecision(session, lesson, decision);
    const nextTurns = await this.prepareCurrentStep(lesson, session, {
      forcePrompt: advanced
    });

    this.sessionRepo.save(session);

    return {
      reply: tutorTurn.text,
      replyRole: tutorTurn.role,
      stepId: currentStep.id,
      isFinished: session.isFinished,
      score,
      feedback,
      nextTurns: nextTurns.length > 0 ? nextTurns : undefined,
      currentStepIndex: session.currentStepIndex
    };
  }

  async getSession(sessionId: string): Promise<Session | null> {
    return this.sessionRepo.get(sessionId) || null;
  }

  private getCurrentStep(lesson: Lesson, session: Session): Step | undefined {
    return lesson.steps[session.currentStepIndex];
  }

  private stepRequiresAnswer(step?: Step): boolean {
    if (!step) return false;
    return step.type === 'ASK' || step.type === 'EXERCISE' || step.type === 'QUIZ';
  }

  private hasTutorTurnForStep(session: Session, stepId: string): boolean {
    return session.history.some(turn => turn.stepId === stepId && turn.role === 'tutor');
  }

  private async prepareCurrentStep(
    lesson: Lesson,
    session: Session,
    options: { forcePrompt?: boolean } = {}
  ): Promise<Turn[]> {
    const emitted: Turn[] = [];
    let forcePrompt = options.forcePrompt ?? false;

    while (!session.isFinished) {
      const step = this.getCurrentStep(lesson, session);
      if (!step) {
        session.isFinished = true;
        break;
      }

      const shouldSendPrompt = forcePrompt || !this.hasTutorTurnForStep(session, step.id);

      if (shouldSendPrompt) {
        const tutor = await TutorAgent.handle(lesson, session, step);
        const tutorTurn = logTurn(session, step.id, 'tutor', tutor.reply);
        emitted.push(tutorTurn);
      }

      if (this.stepRequiresAnswer(step)) {
        break;
      }

      session.currentStepIndex += 1;

      if (session.currentStepIndex >= lesson.steps.length) {
        session.isFinished = true;
        break;
      }

      forcePrompt = true;
    }

    return emitted;
  }

  private applyDecision(
    session: Session,
    lesson: Lesson,
    decision: { nextIndex: number }
  ): { advanced: boolean } {
    const previousIndex = session.currentStepIndex;
    const { nextIndex } = decision;

    if (nextIndex >= lesson.steps.length) {
      session.isFinished = true;
      return { advanced: false };
    }

    const safeIndex = Math.max(0, nextIndex);
    session.currentStepIndex = safeIndex;

    return { advanced: safeIndex !== previousIndex };
  }
}
