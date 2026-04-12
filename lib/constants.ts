/** Emoji lookup for known characters — custom/unknown entries get a fallback from the pool */
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
  tiger: '🐯',
  parrot: '🦜',
  crocodile: '🐊',
  octopus: '🐙',
  hedgehog: '🦔',
  otter: '🦦',
  sloth: '🦥',
  flamingo: '🦩',
  peacock: '🦚',
  swan: '🦢',
  vampire: '🧛',
  zombie: '🧟',
  elf: '🧝',
  genie: '🧞',
  villain: '🦹',
  ninja: '🥷',
  detective: '🕵️',
  cowboy: '🤠',
  chef: '👨‍🍳',
  teacher: '🧑‍🏫',
  doctor: '👨‍⚕️',
  angel: '👼',
  ghost: '👻',
  alien: '👾',
  giant: '👹',
  squirrel: '🐿️',
  deer: '🦌',
  giraffe: '🦒',
  zebra: '🦓',
  koala: '🐨',
  gorilla: '🦍',
  crab: '🦀',
  lobster: '🦞',
  snail: '🐌',
  ladybug: '🐞',
};
export const DEFAULT_CHARACTER_EMOJI = '⭐';

/**
 * Diverse fallback pool for characters — used when a computed emoji would
 * collide with one already shown in the same row of buttons.
 */
export const CHARACTER_FALLBACK_POOL = [
  '🌟', '🎠', '🎭', '🏰', '🌈', '🍄', '🎪', '🌊', '🔮', '🎲',
  '🪄', '🎯', '🧩', '🪁', '🏹', '🎋', '🌙', '☀️', '🪐', '🌋',
];

/** Emoji lookup for known themes — custom/unknown entries get a fallback from the pool */
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
  adventure: '🗺️',
  bravery: '⚔️',
  growth: '🌱',
  wisdom: '🦉',
  love: '❤️',
  hope: '🌅',
  justice: '⚖️',
  confidence: '🦅',
  forgiveness: '🕊️',
  leadership: '🏆',
  kindnessmatters: '🫶',
  mindfulness: '🍃',
  nature: '🌿',
  music: '🎵',
  art: '🖌️',
  dreams: '💭',
  fun: '🎉',
  family: '👨‍👩‍👧',
  helping: '🫴',
  science: '🔭',
  reading: '📖',
  health: '🍎',
  safety: '🛟',
  magic: '✨',
  community: '🏘️',
};
export const DEFAULT_THEME_EMOJI = '💡';

/**
 * Diverse fallback pool for themes — used when a computed emoji would
 * collide with one already shown in the same row of buttons.
 */
export const THEME_FALLBACK_POOL = [
  '🌸', '🌻', '🌺', '🍀', '🔥', '💧', '🌙', '🎯', '🌈', '💫',
  '🎓', '🧠', '💝', '🌍', '🎪', '🪷', '🫧', '🧬', '🪻', '🌠',
];

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
