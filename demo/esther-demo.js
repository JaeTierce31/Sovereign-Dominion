// Esther voice synthesis with animated waveform feedback.
export function speakEsther(text) {
  const indicator = document.getElementById('esther-indicator');
  const wave = document.getElementById('esther-wave');
  const setSpeaking = (on) => {
    if (indicator) indicator.classList.toggle('speaking', on);
    if (wave) wave.classList.toggle('active', on);
  };

  setSpeaking(true);

  if ('speechSynthesis' in window) {
    try {
      // Cancel any in-flight utterance so repeated runs don't overlap.
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
      // Safety timeout in case onend never fires (some mobile browsers).
      setTimeout(() => setSpeaking(false), 8000);
      return;
    } catch (e) {
      console.warn('⚠️ Speech synthesis failed:', e.message);
    }
  }
  // Fallback: animate the waveform briefly even without audio.
  setTimeout(() => setSpeaking(false), 2200);
}
