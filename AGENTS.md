## Coordination

- Delete unused or obsolete files only when your changes make them irrelevant. If you are unsure how another agent’s work is affected, stop and coordinate instead of deleting.
- Coordinate with other agents before removing or reverting work you did not author; moving/renaming files is fine when agreed.
- **Before deleting a file to quiet lint/type errors, ask the user first.** Never delete someone else’s work just to silence an error.

## Environment Guardrails

- NEVER edit `.env` or other environment variable files; only the user may change them.

## Git Safety Rules

- Absolutely never run destructive git commands (`git reset --hard`, `rm`, `git checkout`/`git restore` to an older commit, etc.) without explicit written approval in this thread. If unsure, stop and ask.
- Never use `git restore` (or similar) to revert files you didn’t author without coordinating.
- Always check `git status` before committing.
- Keep commits atomic:
  - Stage only the files you touched and commit with `git commit -m "<message>" -- file1 file2`.
  - For new files, use `git restore --staged :/ && git add "file1" "file2" && git commit -m "<message>" -- file1 file2`.
- Use the provided `committer` helper for every commit to ensure guardrails are enforced.
- Quote any git paths containing brackets/parentheses (e.g., `"src/app/[candidate]/file.ts"`).
- When running `git rebase`, suppress editors via `GIT_EDITOR=:` and `GIT_SEQUENCE_EDITOR=:` or `--no-edit`.
- Never amend commits unless explicitly instructed in this conversation.
