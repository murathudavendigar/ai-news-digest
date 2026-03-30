export const REACTIONS = [
  { id: 'fire',      emoji: '🔥', label: 'İlginç'   },
  { id: 'think',     emoji: '🤔', label: 'Şüpheli'  },
  { id: 'heart',     emoji: '❤️', label: 'Önemli'   },
];

export function getReaction(slug) {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`reaction:${slug}`) || null;
}

export function setReaction(slug, reactionId) {
  if (typeof window === 'undefined') return;
  if (reactionId === null) {
    localStorage.removeItem(`reaction:${slug}`);
  } else {
    localStorage.setItem(`reaction:${slug}`, reactionId);
  }
}
