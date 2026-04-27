#!/usr/bin/env bash
# Collects PR information: title, body, and diff.
# Outputs: pr_title, pr_body (via GITHUB_OUTPUT), and /tmp/pr_diff.txt
set -euo pipefail

echo "Fetching PR #$PR_NUMBER..."

# PR title
TITLE=$(gh pr view "$PR_NUMBER" --json title -q .title)
echo "pr_title=$TITLE" >> "$GITHUB_OUTPUT"

# PR body/description
BODY=$(gh pr view "$PR_NUMBER" --json body -q .body)
echo "pr_body<<EOF" >> "$GITHUB_OUTPUT"
echo "$BODY" >> "$GITHUB_OUTPUT"
echo "EOF" >> "$GITHUB_OUTPUT"

# Full diff (truncate to ~100K chars to stay within token limits)
gh pr diff "$PR_NUMBER" | head -c 100000 > /tmp/pr_diff.txt

echo "✅ PR info collected"
