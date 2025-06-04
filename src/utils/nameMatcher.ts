import { distance } from 'fastest-levenshtein';

export function getCloseMatches(input: string, names: string[], limit = 5): string[] {
  if (!input) return [];
  const lowerInput = input.toLowerCase();
  const threshold = Math.ceil(lowerInput.length * 0.6);
  return names
    .map(name => ({ name, dist: distance(name.toLowerCase(), lowerInput) }))
    .filter(item => item.dist <= threshold || item.name.toLowerCase().includes(lowerInput))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)
    .map(item => item.name);
}
