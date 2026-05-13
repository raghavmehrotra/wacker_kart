export const KART_COLORS = [
  { key: "red",    hex: 0xc24b3f, css: "#c24b3f", label: "Chi-Town Red"  },
  { key: "navy",   hex: 0x1b3a6b, css: "#1b3a6b", label: "Lake Navy"     },
  { key: "green",  hex: 0x3a7d44, css: "#3a7d44", label: "Grant Park"    },
  { key: "gold",   hex: 0xd4a017, css: "#d4a017", label: "Malort Gold"   },
  { key: "purple", hex: 0x6b3fa0, css: "#6b3fa0", label: "Wicker Purple" },
  { key: "orange", hex: 0xd4621a, css: "#d4621a", label: "Deep Dish"     },
];

export const AVATARS = [
  { key: "bear",      label: "The Bear"      },
  { key: "deepdish",  label: "Deep Dish"     },
  { key: "lrider",    label: "L Rider"       },
  { key: "bluesman",  label: "Blues Man"     },
  { key: "architect", label: "The Architect" },
];

export const customization = {
  kartColorKey: "red",
  avatarKey: "bear",
  playerName: "Player 1",
};

export function getKartColor() {
  return KART_COLORS.find((c) => c.key === customization.kartColorKey) ?? KART_COLORS[0];
}
