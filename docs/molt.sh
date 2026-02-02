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
PROMPT="futuristic cybernetic red lobster action hero cyborg with robotic armor and glowing blue accents, massive spiked claws, angry intense expression on humanoid face, red glowing eyes, metallic silver body parts with cracks and battle damage, lightning effects in stormy background, $VIBE, epic comic book style illustration, dramatic lighting, high detail, portrait centered composition for profile picture"

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
