#!/usr/bin/env python3
"""
Builds the AI review prompt from the template, calls the Gemini API,
and writes the review output to review.md.

Required environment variables:
  - GEMINI_API_KEY: Google AI Studio API key
  - PR_NUMBER, PR_TITLE, PR_BODY: PR metadata
  - PROJECT_CONTEXT: project rules content
  - PR_DIFF: PR diff content
  - TSC_RESULT, BUILD_RESULT: CI check outcomes
"""

import os
import json
import sys
import urllib.request
import urllib.error
import time


def load_prompt_template(template_path: str) -> str:
    """Read the prompt template and substitute placeholders with env values."""
    with open(template_path, "r") as f:
        template = f.read()

    replacements = {
        "{{PROJECT_CONTEXT}}": os.environ.get("PROJECT_CONTEXT", "Not available"),
        "{{TSC_RESULT}}":      os.environ.get("TSC_RESULT", "Unknown"),
        "{{BUILD_RESULT}}":    os.environ.get("BUILD_RESULT", "Unknown"),
        "{{PR_NUMBER}}":       os.environ.get("PR_NUMBER", ""),
        "{{PR_TITLE}}":        os.environ.get("PR_TITLE", ""),
        "{{PR_BODY}}":         os.environ.get("PR_BODY", ""),
        "{{PR_DIFF}}":         os.environ.get("PR_DIFF", ""),
    }

    for placeholder, value in replacements.items():
        template = template.replace(placeholder, value)

    return template


def call_gemini(api_key: str, prompt: str) -> str:
    """Send the prompt to Gemini 2.5 Flash and return the generated text with exponential backoff."""
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={api_key}"
    )

    payload = json.dumps({
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 4096,
        },
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    max_retries = 5
    base_delay = 2

    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read().decode("utf-8"))
            
            # If success, break the retry loop and return the text
            try:
                return result["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError) as e:
                print(f"❌ Unexpected API response structure: {e}")
                print(json.dumps(result, indent=2)[:2000])
                sys.exit(1)

        except urllib.error.HTTPError as e:
            # Retry on 429 (Rate Limit) and 503 (Service Unavailable)
            if e.code in [429, 503] and attempt < max_retries - 1:
                delay = min(base_delay * (2 ** attempt), 15)
                print(f"⚠️ Gemini API busy ({e.code}). Retrying in {delay}s (Attempt {attempt + 1}/{max_retries})...")
                time.sleep(delay)
                continue
            
            body = e.read().decode("utf-8")
            print(f"❌ Gemini API error ({e.code}): {body}")
            sys.exit(1)
        except Exception as e:
            print(f"❌ Request failed: {e}")
            sys.exit(1)

    return "" # Should not be reached


def main():
    # Validate API key
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        print("❌ GEMINI_API_KEY not set. Add it as a repository secret.")
        sys.exit(1)

    # Build prompt from template
    template_path = ".github/workflows/templates/ai-review-prompt.md"
    prompt = load_prompt_template(template_path)

    # Call Gemini API
    review_text = call_gemini(api_key, prompt)

    # Wrap review with header and write to file
    final_review = (
        "## 🤖 Revisão de Código por IA\n\n"
        "> Gerado automaticamente via Google Gemini 2.5 Flash\n\n"
        "---\n\n"
        f"{review_text}"
    )

    with open("review.md", "w") as f:
        f.write(final_review)

    print(f"✅ AI review generated ({len(review_text)} chars)")


if __name__ == "__main__":
    main()
