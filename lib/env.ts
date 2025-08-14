export function must(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`env_missing:${name}`);
  return v;
}
export function optional(name: string, def = ""): string {
  return (process.env[name] || def) as string;
}
