export function capitalizeInitial(value: string): string {
  if (!value) return value;
  const [first, ...rest] = Array.from(value);
  return first.toLocaleUpperCase('es') + rest.join('');
}
