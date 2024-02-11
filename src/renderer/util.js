export function convertMilliseconds(ms) {
  const milliseconds = ms % 1000;
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const paddedMs = String(milliseconds).padStart(3, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');
  const paddedMinutes = String(minutes).padStart(2, '0');

  return `${paddedMinutes}:${paddedSeconds}:${paddedMs}`;
}

export function convertToMilliseconds(ms_str) {
  
}