// The "Commit to the Beat" cat from public/logo-*.svg, drawn inline without its
// background square so it sits on any surface. Colors come from --cat-ink /
// --cat-paper (globals.css), so it follows the light/dark theme on its own.
//   listening: eyes closed, head bobbing (loading screens)
//   confused:  head tilted, one raised brow, a question mark (empty states)
//   excited:   sparkly eyes, open smile, bouncing with sparkles ("needle is ready")

type Props = {
  mood?: "listening" | "confused" | "excited";
  className?: string;
};

export default function BeatCat({ mood = "listening", className }: Props) {
  const confused = mood === "confused";
  const excited = mood === "excited";

  return (
    <svg
      className={["beat-cat", `beat-cat-${mood}`, className].filter(Boolean).join(" ")}
      viewBox="30 14 300 300"
      fill="none"
      aria-hidden="true"
    >
      {/* Turntable */}
      <rect className="c-ink" x="42" y="224" width="276" height="84" rx="19" />
      <rect className="c-paper" x="51" y="233" width="258" height="49" rx="11" />
      <ellipse className="c-ink" cx="138" cy="257" rx="66" ry="19" />
      <ellipse className="s-paper" cx="138" cy="257" rx="51.25" ry="13.25" strokeWidth="1.5" />
      <ellipse className="c-accent" cx="138" cy="256.5" rx="16" ry="8.5" />
      <ellipse className="c-ink" cx="138" cy="256.5" rx="4" ry="2.5" />
      <circle className="c-ink" cx="288" cy="246" r="6" />
      <path className="s-ink" d="M288 247L278 267H223L213 257" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect className="c-ink" x="205" y="252" width="15" height="8" rx="2" />
      <rect className="c-accent" x="64" y="291" width="25" height="5" rx="2" />
      <circle className="c-paper" cx="289.5" cy="293.5" r="4.5" />

      {/* Head, headphones and body: bobs or tilts as one piece */}
      <g className="beat-cat-head">
        <path className="s-accent" d="M94 127C94 39 266 39 266 127" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
        <path
          className="c-ink"
          d="M103 117L104 65C104.667 58.3333 108 57 114 61L147 86C169 77.3333 191 77.3333 213 86L246 61C252 57 255.333 58.3333 256 65L257 117C266 163 239 188 214 196L237 244H123L146 196C119 188 94 163 103 117Z"
        />
        <path className="c-paper" d="M116 78V105L137 94L116 78Z" />
        <path className="c-paper" d="M244 78L223 94L244 105V78Z" />
        <rect className="c-accent" x="87" y="112" width="22" height="51" rx="11" />
        <rect className="c-accent" x="251" y="112" width="22" height="51" rx="11" />

        {confused ? (
          <>
            {/* Mismatched open eyes, one raised brow, wobbly mouth */}
            <circle className="c-paper" cx="143" cy="134" r="8" />
            <circle className="c-paper" cx="217" cy="135" r="5.5" />
            <path className="s-paper" d="M206 117L229 110" strokeWidth="5" strokeLinecap="round" />
            <path className="s-paper" d="M134 120L152 121" strokeWidth="5" strokeLinecap="round" />
            <path className="s-paper" d="M167 163C171 158 175 167 180 162C185 157 189 166 193 161" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : excited ? (
          <>
            {/* Big sparkly eyes and an open grin */}
            <circle className="c-paper" cx="143" cy="132" r="10" />
            <circle className="c-paper" cx="217" cy="132" r="10" />
            <circle className="c-ink" cx="147" cy="128" r="3.5" />
            <circle className="c-ink" cx="221" cy="128" r="3.5" />
            <path className="s-paper" d="M131 113C137 108 145 107 152 110" strokeWidth="4.5" strokeLinecap="round" />
            <path className="s-paper" d="M208 110C215 107 223 108 229 113" strokeWidth="4.5" strokeLinecap="round" />
            <path className="c-paper" d="M164 158H196C194 171 188 177 180 177C172 177 166 171 164 158Z" />
            <path className="c-accent" d="M172 171C176 168 184 168 188 171C186 174 183 176 180 176C177 176 174 174 172 171Z" />
          </>
        ) : (
          <>
            {/* Happy closed eyes and smile, as in the logo */}
            <path className="s-paper" d="M131 134C139 126 147 126 155 134" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <path className="s-paper" d="M205 134C213 126 221 126 229 134" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <path className="s-paper" d="M165 159C169 165 174 165 180 159C186 165 191 165 195 159" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        <path className="c-paper" d="M173 146H187L180 154L173 146Z" />
        <path className="s-paper" d="M119 151L137 155M118 165L137 163" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path className="s-paper" d="M223 155L241 151M223 163L242 165" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Arms and paws on the turntable */}
      <path className="s-ink" d="M145 195C135 200 130 215 122 236" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse className="c-ink" cx="127.5" cy="237" rx="17.5" ry="11" />
      <path className="s-paper" d="M119 235L120 240M127 234L128 239" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path className="s-ink" d="M215 196C228 201 238 216 249 234" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse className="c-ink" cx="249.5" cy="237" rx="17.5" ry="11" />
      <path className="s-paper" d="M246 235L247 240M254 234L255 239" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {excited && (
        <g className="beat-cat-sparkles">
          <path className="beat-cat-sparkle c-accent" d="M302 40L307 56L323 61L307 66L302 82L297 66L281 61L297 56Z" />
          <path className="beat-cat-sparkle c-accent" d="M62 70L65.5 80.5L76 84L65.5 87.5L62 98L58.5 87.5L48 84L58.5 80.5Z" />
          <path className="beat-cat-sparkle c-accent" d="M286 102L288.5 109.5L296 112L288.5 114.5L286 122L283.5 114.5L276 112L283.5 109.5Z" />
        </g>
      )}

      {confused && (
        <text className="beat-cat-question c-accent" x="282" y="84">
          ?
        </text>
      )}
    </svg>
  );
}
