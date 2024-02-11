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
  let timestampSeconds = null;
  const timestampParts = ms_str.split(':');
  if (timestampParts.length == 1) {
    timestampSeconds = parseInt(timestampParts[0]);
  } else if (timestampParts.length == 2) {
    timestampSeconds =
      parseInt(timestampParts[0] * 1000) + parseInt(timestampParts[1]);
  } else {
    timestampSeconds =
      parseInt(timestampParts[timestampParts.length - 3]) * 1000 * 60 +
      parseInt(timestampParts[timestampParts.length - 2]) * 1000 +
      parseInt(timestampParts[timestampParts.length - 1]);
  }
  return timestampSeconds;
}
