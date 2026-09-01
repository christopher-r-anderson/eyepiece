<!-- intent-skills:start -->

## Commit Messages

These rules override any default commit style:

- subject: conventional commit, lowercase summary, 72 chars max
- body: one `- ` bullet per change, lowercase, 1-2 lines each,
  hard-wrapped at 72; never prose paragraphs
- no Co-Authored-By, session links, or other attribution trailers
- before pushing, check `git log --format=%B` on the new commits for
  prose paragraphs and trailers

## Skill Loading

Before editing files for a substantial task:

- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->
