const caches = {};
let currentaudio = null;
const getAudio = (fn) => {
  const cache = caches[fn];
  if (cache) return cache;
  const audio = new Audio();
  audio.src = fn;
  caches[fn] = audio;
  return audio;
};
const waitForAudioEnd = async (audioElement) => {
  return new Promise((resolve, reject) => {
    if (audioElement.ended) {
      resolve();
      return;
    }
    audioElement.addEventListener("ended", resolve, { once: true });
    audioElement.addEventListener("error", reject, { once: true });
  });
};
export const playBGM = async (fn) => {
  const audio = getAudio(fn);
  const stop = currentaudio == audio;
  stopBGM();
  if (stop) return;
  audio.currentTime = 0;
  audio.play();
  currentaudio = audio;
  await waitForAudioEnd(audio);
  currentaudio = null;
};
export const stopBGM = () => {
  if (currentaudio) {
    currentaudio.pause();
    currentaudio = null;
  }
};
