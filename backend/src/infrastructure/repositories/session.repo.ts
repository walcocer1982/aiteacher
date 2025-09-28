// persistencia simple (memoria/DB)

import { Session, Turn } from '../../core/models/index';

export class SessionRepo {
  private sessions = new Map<string, Session>();

  create(lessonId: string, userId: string): Session {
    const session: Session = {
      id: this.generateId(),
      lessonId,
      userId,
      currentStepIndex: 0,
      history: [],
      memory: {
        glossary: {},
        misconceptions: [],
        masteredObjectives: []
      },
      isFinished: false
    };

    this.sessions.set(session.id, session);
    return session;
  }

  get(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  save(session: Session): void {
    this.sessions.set(session.id, session);
  }

  delete(id: string): boolean {
    return this.sessions.delete(id);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

export function logTurn(
  session: Session,
  stepId: string,
  role: Turn['role'],
  text: string,
  score?: number,
  findings?: string[]
): Turn {
  const turn: Turn = {
    stepId,
    role,
    text,
    score,
    findings
  };

  session.history.push(turn);
  return turn;
}
