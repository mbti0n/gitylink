// Language colors shared by the Skills setlist, Repo Insights and the Rhythm Arcade
const languageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#e2bd44",
  Python: "#5788b8",
  Rust: "#c77650",
  Go: "#54a9bd",
  Java: "#d77855",
  "C++": "#7593d5",
  Ruby: "#c95e65",
  Swift: "#e98758",
  HTML: "#df7654",
  CSS: "#6e83d2",
};

const fallbackColors = [
  "#c48757",
  "#8b78ba",
  "#4b9b82",
  "#bd687d",
  "#648cbd",
  "#b28b3d",
];

export function getLanguageColor(language: string | null | undefined): string {
  if (!language) return fallbackColors[0];
  const knownColor = languageColors[language];
  if (knownColor) return knownColor;

  // Unknown languages still get a stable color: the same name always picks the same swatch
  const hash = Array.from(language).reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );
  return fallbackColors[hash % fallbackColors.length];
}
