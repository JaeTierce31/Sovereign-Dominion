export function speakEsther(text) {
  const indicator = document.getElementById('esther-indicator');
  if (indicator) indicator.classList.add('speaking');
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.onend = () => {
      if (indicator) indicator.classList.remove('speaking');
    };
    speechSynthesis.speak(utterance);
  } else {
    setTimeout(() => {
      if (indicator) indicator.classList.remove('speaking');
    }, 2000);
  }
}
