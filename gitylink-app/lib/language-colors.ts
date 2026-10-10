// Warm-leaning language colors shared by the Skills setlist and the Rhythm Arcade stage
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

export const fallbackLanguageColor = "#c48757";

export function getLanguageColor(language: string | null | undefined) {
  return (language && languageColors[language]) || fallbackLanguageColor;
}
