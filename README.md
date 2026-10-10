<div align="center">
  <img style="width: 10%;" alt="CommittotheBeatLogo" src="https://github.com/user-attachments/assets/edabcad3-dca0-4bab-985d-71a1c03bb65a" />
  <img style="width: 10%" src="https://knight-hacks.notion.site/image/attachment%3Aad0a4528-55ea-4b61-9a9d-b1329d31f5a3%3AKnightHacksIX_KHIX_Dragon.svg?id=334e290c-cffe-80e3-9ec7-ee1e20a33bae&table=block&spaceId=e1d260a9-fdc3-4640-a0e6-8ec3baabb73e&userId=&cache=v2&imgBuildSrc=requestProxiedImageUrl">
  <h1>Repo Radio</h2>
  <strong>(formerly gitylink)</strong> <br>
  <em>A Knight Hacks IX project</em>
  <h4>Musicify your GitHub repository.<h4>

  <a href="https://sealresearchfacility.tail5a4848.ts.net:8443/"><img alt="🌐 Demo" src="https://img.shields.io/badge/%F0%9F%8C%90%20Demo-f59e0b?style=for-the-badge" /></a>
</div>

## The Challenge, The Journey, and The "Why"
*Repo Radio* was not our team's preferred idea. We were creating *gitylink*, a tool that syncs GitHub repos with LinkedIn projects and helps schedule the posts there using the API. However, the LinkedIn API is extremely limited to registered organizations. As a result, we had to turn everything around, building a brand new web app and keeping only GitHub integration, which eventually became a music-inspired GitHub browser web app. 

The shift happened 12 hours before the submission deadline of Knight Hacks IX, and, at that moment, we were all in on a web app with LinkedIn integration and resume checkup functionalities. We ran into a tense situation: we did not have a proper plan B to have a fully working project to demonstrate. Thankfully, the Skills feature saved us, and it was the foundation of the complete shift of our project. That was when *gitylink* was resurrected to become *Repo Radio*.

## What's In It?
- AI summary of a GitHub profile in a music context.
- Random playlists of songs based on the repository descriptions and programming languages.
- A skills explorer page that sorts the most-used programming languages.
- A mini rhythm game

## How It Was Built?
- Design: Figma
- Frameworks: Next.js, TailwindCSS, React, Express
- App deployment: Tailscale
- API Integration: GitHub (OAuth + API, GitHub user data), Gemini (API, music, summary), Spotify (API, music)
- AI assistant: Copilot on Visual Studio Code, Codex/GPT 6 Luna/GPT 6.1 Sol, Claude Opus 5.5
- Environment: node.js, npm, ESLint, TypeScript
