export const formatRp = (value: number) => {
  const num = Math.round(value);
  const s = String(num);
  const parts = [];
  let remain = s;
  while (remain.length > 3) {
    parts.unshift(remain.slice(-3));
    remain = remain.slice(0, -3);
  }
  parts.unshift(remain);
  return parts.join('.');
};