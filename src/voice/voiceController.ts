export class VoiceController {
  private recognition: SpeechRecognition;
  private synth: SpeechSynthesis;
  private callback: (transcript: string) => void;

  constructor(onCommand: (text: string) => void) {
    this.callback = onCommand;
    this.synth = window.speechSynthesis;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      if (last.isFinal) this.callback(last[0].transcript.trim().toLowerCase());
    };
    this.recognition.start();
  }

  speak(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    this.synth.speak(utterance);
  }

  stop() { this.recognition.stop(); }
}
