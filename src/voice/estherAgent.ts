import { VoiceController } from './voiceController';

export interface EstherContext {
  projectName?: string;
  currentMaterial?: string;
  locale: string;
}

export class EstherAgent {
  private vc: VoiceController;
  private context: EstherContext;
  private onCommand: (intent: string, params: Record<string, string>) => void;

  constructor(
    onCommand: (intent: string, params: Record<string, string>) => void,
    locale = 'en-US'
  ) {
    this.context = { locale };
    this.onCommand = onCommand;
    this.vc = new VoiceController(this.parseTranscript.bind(this));
  }

  private parseTranscript(transcript: string) {
    const wallMatch = transcript.match(/(\d+)\s*feet?\s*long[,\s]+(\d+)\s*feet?\s*high/i);
    if (transcript.includes('retaining wall') && wallMatch) {
      this.onCommand('build_retaining_wall', { length: wallMatch[1], height: wallMatch[2] });
      return;
    }

    if (transcript.includes('show material') || transcript.includes('show price')) {
      this.onCommand('show_materials', {});
      return;
    }

    if (transcript.includes('export proposal') || transcript.includes('generate pdf')) {
      this.onCommand('export_proposal', {});
      return;
    }

    if (transcript.includes('compliance check') || transcript.includes('check code')) {
      this.onCommand('compliance_check', {});
      return;
    }

    if (transcript.includes('drone') && transcript.includes('survey')) {
      this.onCommand('drone_survey', {});
      return;
    }

    this.onCommand('unknown', { transcript });
  }

  speak(text: string) { this.vc.speak(text); }
  stop() { this.vc.stop(); }
  setContext(ctx: Partial<EstherContext>) { this.context = { ...this.context, ...ctx }; }
}
