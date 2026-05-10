# GSD Build Brief — preview/2026-05-10c

Create branch preview/2026-05-10c from main. Make the following changes, run `npx next build` to verify, then commit and push.

---

## Changes

### 1. Remove bold/italic from story output
- `app/api/generate/route.ts`: In the formatting instruction at the bottom of the prompt, remove the lines about using `**bold**` and `*italic*`. Keep only the title instruction and paragraph formatting. Stories should be plain paragraphs with no markdown emphasis.

### 2. Move story title to replace "Your Story" heading
- `app/components/StoryDisplay.tsx`:
  - Remove the existing "Your Story" header block (the div containing the book SVG icon and the `<h2>Your Story</h2>` text, plus the loading dots). 
  - The `<Markdown>` component already renders the `# Title` from the story. The h1 rendered by Markdown should now appear at the top of the story card in place of "Your Story". Make sure the h1 styling looks good as a card title (it already has font-heading text-2xl font-bold text-primary mb-2).
  - Keep the loading dots indicator but move it so it appears inline after the title (or below it) when isLoading is true and story has no title yet. If the story is loading and there's no content yet, show the "Once upon a time..." placeholder as before.

---

## Done
1. Add `.claude/` and `.gsd/runtime/` to `.gitignore` if not already there
2. `git add -A`
3. `git commit -m "fix: remove bold/italic from stories, move title to replace 'Your Story' heading"`
4. `git push origin preview/2026-05-10c`
