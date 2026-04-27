#!/usr/bin/env bash
# Posts the AI-generated review as a comment on the PR.
# Expects: PR_NUMBER env var and review.md file in the working directory.
set -euo pipefail

if [ -f "review.md" ]; then
  gh pr comment "$PR_NUMBER" --body-file review.md
  echo "✅ Review posted on PR #$PR_NUMBER"
else
  echo "❌ review.md not found — AI generation may have failed"
  exit 1
fi
