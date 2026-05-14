export interface SafetyModule {
  id: string;
  title: string;
  duration: number;
  language: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface TrainingSession {
  moduleId: string;
  workerId: string;
  startedAt: number;
  completedAt?: number;
  score?: number;
  passed: boolean;
}

export class SafetyTrainingEngine {
  private session: TrainingSession | null = null;
  private answers: number[] = [];

  startSession(moduleId: string, workerId: string): TrainingSession {
    this.session = {
      moduleId,
      workerId,
      startedAt: Date.now(),
      passed: false,
    };
    this.answers = [];
    return this.session;
  }

  submitAnswer(questionIndex: number, answerIndex: number) {
    this.answers[questionIndex] = answerIndex;
  }

  completeSession(module: SafetyModule): TrainingSession {
    if (!this.session) throw new Error('No active session');

    let correct = 0;
    module.questions.forEach((q, i) => {
      if (this.answers[i] === q.correctIndex) correct++;
    });

    const score = (correct / module.questions.length) * 100;
    this.session.completedAt = Date.now();
    this.session.score = score;
    this.session.passed = score >= 80;

    return this.session;
  }
}
