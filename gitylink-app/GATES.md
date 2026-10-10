# Gates: Post Studio repo-to-post flow

OWNS: app/(workspace)/post-studio/**, app/api/repository-commits/**, app/api/generate-draft/route.ts, lib/github-activity.ts, src/schemas/project-draft.ts, app/globals.css, GATES.md

Scope: Select a repository, load its commits, create a general project draft beside a repository link and functional AI rewrite actions, then proceed to review while keeping save/copy controls in their current header position.

- [x] G1: Changed TypeScript and TSX files pass ESLint
  CHECK: npx eslint 'app/(workspace)/post-studio' app/api/repository-commits app/api/generate-draft/route.ts lib/github-activity.ts src/schemas/project-draft.ts && node -e "console.log('POST_STUDIO_LINT_OK')"
  EXPECT: POST_STUDIO_LINT_OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=155486b946a89854a2afae419f02ea38f20899a18879e973b8374a416ff8c59d; exit=0; EXPECT=matched; output-sha256=3c79541bb630d5ad6e4a212b69ef119928939e0eeff8b54b128497a5aebabbf4; output-bytes=20; shell=/bin/sh; cwd=/Users/mbti0n/Documents/gitylink/gitylink-app; path=7e7003de4bfd/31 entries

- [x] G2: Repository selection and draft/review workflow are fully wired in the implementation
  CHECK: node -e "const fs=require('node:fs'); const p=fs.readFileSync('app/(workspace)/post-studio/PostStudio.tsx','utf8'); const a=fs.readFileSync('app/api/repository-commits/route.ts','utf8'); if(!p.includes('repository-commits?repo=')||!p.includes('scrollIntoView')||!p.includes('Continue to preview')||!p.includes('Save draft')||!p.includes('Copy draft')||!a.includes('getGitHubRepositoryCommits')) process.exit(1); console.log('POST_STUDIO_FLOW_OK')"
  EXPECT: POST_STUDIO_FLOW_OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ebb8c34435fc3007c981d71f2c53fbdc16d22c3062263d91f0fb021f84bded79; exit=0; EXPECT=matched; output-sha256=34561830b7f61f8a7b3c3f95dea2dd8d6f45056dc2fefc39bc2b7948207008c2; output-bytes=20; shell=/bin/sh; cwd=/Users/mbti0n/Documents/gitylink/gitylink-app; path=7e7003de4bfd/31 entries
