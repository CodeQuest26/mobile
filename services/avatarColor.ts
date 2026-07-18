export const AVATAR_COLORS = [
  { bg: "#E0F2FE", text: "#0284C7" },
  { bg: "#FCE7F3", text: "#DB2777" },
  { bg: "#D1FAE5", text: "#059669" },
  { bg: "#FEF3C7", text: "#D97706" },
  { bg: "#E0E7FF", text: "#4F46E5" },
  { bg: "#FFE4E6", text: "#E11D48" },
];

export const getAvatarColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
