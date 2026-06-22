// Esther voice synthesis — selects best available high-quality voice.
let estherVoice = null;

function selectEstherVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Priority order: high-quality natural female voices across platforms
  const PREFERRED = [
    /samantha/i,           // macOS/iOS — best natural female
    /zira/i,               // Windows 10+ female
    /aria/i,               // Edge neural voice
    /google us english/i,  // Chrome female
    /karen/i,              // macOS Australian
    /victoria/i,           // macOS
    /allison/i,            // macOS
    /susan/i,              // macOS
    /moira/i,              // macOS Irish
  ];

  for (const pattern of PREFERRED) {
    const v = voices.find(v => pattern.test(v.name) && v.lang.startsWith('en'));
    if (v) return v;
  }
  // Fallback: any English voice
  return voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en')) || null;
}

export function speakEsther(text, options = {}) {
  const { pitch = 1.05, rate = 0.88 } = options;
  const indicator = document.getElementById('esther-indicator');
  const wave = document.getElementById('esther-wave');

  const setSpeaking = (on) => {
    if (indicator) indicator.classList.toggle('speaking', on);
    if (wave) wave.classList.toggle('active', on);
  };

  setSpeaking(true);

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;

      // Lazy-initialize; voices load async in Chrome
      if (!estherVoice) estherVoice = selectEstherVoice();
      if (estherVoice) utterance.voice = estherVoice;

      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
      // Adaptive safety timeout based on text length
      setTimeout(() => setSpeaking(false), Math.max(5000, text.length * 55));
      return;
    } catch (e) {
      console.warn('⚠️ Speech synthesis failed:', e.message);
    }
  }
  setTimeout(() => setSpeaking(false), 2400);
}

// Chrome loads voices asynchronously — re-select when they arrive
if ('speechSynthesis' in window) {
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    estherVoice = selectEstherVoice();
  });
}
