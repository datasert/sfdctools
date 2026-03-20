# AGENTS Instructions

## Build Execution Policy
- Do not run `npm run build` (or any equivalent full build command) on every prompt.
- Run build commands only when the user explicitly asks for a build, deploy validation, or release verification.
- If the user asks to commit and push changes, run the appropriate build first before committing and pushing, unless they explicitly say not to.
- For normal code edits, prefer targeted checks (lint/tests/type checks) only when needed and only when requested.

## Versioning Policy
- Increment the minor version when adding a new tool or adding a user-facing feature to an existing tool.
- Increment the patch version when fixing a bug or making a non-feature correction.

## UI Component Policy
- If a generic UI element is needed in more than one place, create a shared component and reuse it instead of duplicating markup.

## Release Policy
- When the user says `release`, update the changelog, bump the version by minor or patch as appropriate, run the build, then commit and push the release changes.
