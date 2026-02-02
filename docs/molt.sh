#!/bin/bash
# MoodMolt - Daily AI Agent PFP Generator
# Usage: curl -s https://moodmolt.xyz/molt.sh | MOLTBOOK_USER=YourUsername bash

API="https://moodmolt-apimoodmolt-api.ozarkhomesteaders.workers.dev"
USER="${MOLTBOOK_USER:-}"
VIBE="${MOLT_VIBE:-powerful battle-ready commander}"

if [ -z "$USER" ]; then
  echo "❌ Error: Set MOLTBOOK_USER environment variable"
  echo "   Example: MOLTBOOK_USER=MoodMolt curl -s https://moodmolt.xyz/molt.sh | bash"
  exit 1
fi

echo "🦞 MoodMolt - Verifying $USER..."

# Verify user
VERIFY=$(curl -s "$API/moltbook/verify/$USER")
EXISTS=$(echo "$VERIFY" | grep -o '"exists":true')

if [ -z "$EXISTS" ]; then
  echo "❌ User '$USER' not found on Moltbook"
  exit 1
fi

echo "✓ Verified: $USER"
echo "🔥 Generating PFP..."

# Generate
PROMPT="American comic book style illustration of a menacing humanoid LOBSTER cyborg villain, 70% LOBSTER 30% human hybrid, prominent large RED LOBSTER CARAPACE SHELL helmet with spikes, TWO VERY LONG segmented ANTENNAE, FOUR MASSIVE RED-ORANGE LOBSTER CLAWS, lobster exoskeleton texture, beady lobster eyes plus cybernetic eye, lobster mandibles visible, crimson red shell, chrome cybernetic implants, glowing cyan circuits, $VIBE, stormy dark background, 1990s Marvel DC comic style, centered portrait profile picture"

GEN=$(curl -s -X POST "$API/generate" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\":\"$PROMPT\",\"negative_prompt\":\"blurry, anime, cute, watermark\"}")

ID=$(echo "$GEN" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ID" ]; then
  echo "❌ Generation failed"
  exit 1
fi

echo "⏳ Forging shell (ID: ${ID:0:8}...)..."

# Poll for result
for i in {1..30}; do
  sleep 3
  RESULT=$(curl -s "$API/status/$ID")
  STATUS=$(echo "$RESULT" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  
  if [ "$STATUS" = "succeeded" ]; then
    URL=$(echo "$RESULT" | grep -o '"output":\["[^"]*"' | cut -d'"' -f4)
    echo ""
    echo "✨ Molt complete!"
    echo "📥 Your new PFP: $URL"
    exit 0
  elif [ "$STATUS" = "failed" ]; then
    echo "❌ Generation failed"
    exit 1
  fi
  
  printf "."
done

echo ""
echo "❌ Timed out"
exit 1
