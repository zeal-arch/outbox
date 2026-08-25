export function getDelayUntil(date: Date) {
  return Math.max(date.getTime() - Date.now(), 0);
}
