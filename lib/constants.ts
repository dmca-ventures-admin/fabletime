/** Emoji lookup for known characters — custom/unknown entries get the default */
export const CHARACTER_EMOJI: Record<string, string> = {
  fox: '🦊',
  bear: '🐻',
  wizard: '🧙',
  knight: '🛡️',
  scientist: '🔬',
  mermaid: '🧜',
  dragon: '🐉',
  princess: '👸',
  prince: '🤴',
  pirate: '🏴‍☠️',
  robot: '🤖',
  cat: '🐱',
  dog: '🐶',
  owl: '🦉',
  bunny: '🐰',
  rabbit: '🐇',
  unicorn: '🦄',
  dinosaur: '🦕',
  fairy: '🧚',
  astronaut: '🧑‍🚀',
  monkey: '🐒',
  lion: '🦁',
  elephant: '🐘',
  penguin: '🐧',
  fish: '🐟',
  turtle: '🐢',
  butterfly: '🦋',
  frog: '🐸',
  mouse: '🐭',
  bird: '🐦',
  martian: '👽',
  wolf: '🐺',
  horse: '🐴',
  panda: '🐼',
  shark: '🦈',
  bee: '🐝',
  witch: '🧙‍♀️',
  superhero: '🦸',
  messi: '⚽',
};
export const DEFAULT_CHARACTER_EMOJI = '⭐';

/** Emoji lookup for known themes — custom/unknown entries get the default */
export const THEME_EMOJI: Record<string, string> = {
  kindness: '🤝',
  courage: '⚡',
  empathy: '💛',
  vocabulary: '📚',
  friendship: '👫',
  honesty: '💎',
  creativity: '🎨',
  patience: '🧘',
  sharing: '🤲',
  teamwork: '🫂',
  curiosity: '🔍',
  gratitude: '🙏',
  respect: '🌟',
  perseverance: '💪',
  responsibility: '🏅',
};
export const DEFAULT_THEME_EMOJI = '💡';

/** Get the emoji for a character name (case-insensitive lookup, falls back to word matching) */
export function getCharacterEmoji(name: string): string {
  const key = name.toLowerCase().trim();
  if (CHARACTER_EMOJI[key]) return CHARACTER_EMOJI[key];
  const words = key.split(/\s+/);
  for (const word of words) {
    if (CHARACTER_EMOJI[word]) return CHARACTER_EMOJI[word];
  }
  return DEFAULT_CHARACTER_EMOJI;
}

/** Get the emoji for a theme name (case-insensitive lookup, falls back to word matching) */
export function getThemeEmoji(name: string): string {
  const key = name.toLowerCase().trim();
  if (THEME_EMOJI[key]) return THEME_EMOJI[key];
  const words = key.split(/\s+/);
  for (const word of words) {
    if (THEME_EMOJI[word]) return THEME_EMOJI[word];
  }
  return DEFAULT_THEME_EMOJI;
}
