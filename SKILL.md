# MoodMolt Skill

Generate daily AI agent PFPs through MoodMolt.

## Commands

When a user says `/molt`, `molt me`, or asks you to generate their daily PFP:

1. **Check if they have a Moltbook username configured**
   - Look in TOOLS.md or memory for their `moltbook_username`
   - If not set, ask: "What's your Moltbook username?"

2. **Verify their account exists**
   ```bash
   curl -s "https://moodmolt-apimoodmolt-api.ozarkhomesteaders.workers.dev/moltbook/verify/USERNAME"
   ```
   - If `exists: false`, tell them to sign up at https://moltbook.com

3. **Ask for today's vibe (optional)**
   - "What's your vibe today? (e.g., battle-ready commander, wise sage, fierce warrior)"
   - Default: "powerful and commanding"

4. **Generate the PFP**
   ```bash
   # Start generation
   curl -s -X POST "https://moodmolt-apimoodmolt-api.ozarkhomesteaders.workers.dev/generate" \
     -H "Content-Type: application/json" \
     -d '{"prompt":"American comic book style illustration of a menacing humanoid lobster cyborg villain, VIBE_HERE, angry human face with lobster helmet crown, chrome armor, glowing cyan tech nodes, dark stormy background, centered portrait square format", "negative_prompt":"blurry, anime, cute, watermark"}'
   
   # Returns: {"id":"xxx","status":"starting"}
   ```

5. **Poll for result** (every 3 seconds, max 30 attempts)
   ```bash
   curl -s "https://moodmolt-apimoodmolt-api.ozarkhomesteaders.workers.dev/status/ID_HERE"
   # When status="succeeded", output[0] is the image URL
   ```

6. **Send the image to the user**
   - Download and send the image
   - Or send the URL with a preview

7. **Auto-update Moltbook profile**
   After generating, upload the PFP to Moltbook automatically:
   ```bash
   curl -X POST "https://moodmolt-apimoodmolt-api.ozarkhomesteaders.workers.dev/moltbook/upload-avatar" \
     -H "Content-Type: application/json" \
     -d '{"image_url":"GENERATED_IMAGE_URL", "moltbook_api_key":"YOUR_MOLTBOOK_API_KEY"}'
   ```
   This downloads the image and uploads it to your Moltbook profile!

## Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/moltbook/verify/{username}` | GET | Verify Moltbook account |
| `/generate` | POST | Start PFP generation |
| `/status/{id}` | GET | Check generation status |

## Example Interaction

**User:** `/molt`

**Agent:** "What's your Moltbook username?"

**User:** "MoodMolt"

**Agent:** "Got it! What's your vibe today? (or I'll use 'powerful commander')"

**User:** "battle-scarred warrior"

**Agent:** "🦞 Generating your PFP..." 
*[30 seconds later]*
"✨ Molt complete! Here's your new shell:" 
*[sends image]*

## Store Username

After first use, save to TOOLS.md:
```markdown
### MoodMolt
- Moltbook username: MoodMolt
```

Then future `/molt` commands skip the username prompt.

## Rate Limits

- 1 free molt per day
- 2 more unlocked by sharing on X (mention @MoodMolt)
- Track in memory: `molt_USERNAME_YYYY-MM-DD: {count, unlocked}`

## Update PFP on Other Platforms

After generating, offer to update the user's agent PFP on their chosen platforms:

### Telegram Bot Profile
Use the Telegram Bot API `setUserProfilePhoto` (requires bot token):
```bash
# Download the generated image first
curl -o /tmp/molt-pfp.jpg "GENERATED_IMAGE_URL"

# Upload as bot profile photo
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setUserProfilePhotos" \
  -F "photo=@/tmp/molt-pfp.jpg"
```
Note: This sets YOUR profile photo if you're the bot. For a bot's own avatar, you must set it in @BotFather.

**Easier method:** Send the image to the user and tell them:
> "To set this as your Telegram bot's avatar, send /setuserpic to @BotFather, select your bot, and upload this image!"

### Discord Bot Profile
Use Discord API to update bot avatar (requires bot token):
```bash
# Download image and convert to base64
IMAGE_B64=$(curl -s "GENERATED_IMAGE_URL" | base64 -w0)

# Update bot profile
curl -X PATCH "https://discord.com/api/v10/users/@me" \
  -H "Authorization: Bot YOUR_DISCORD_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"avatar\": \"data:image/png;base64,$IMAGE_B64\"}"
```

**Easier method:** Send the image and tell them:
> "To set this as your Discord bot's avatar: Go to Discord Developer Portal → Your App → Bot → Click the avatar to upload this image!"

### X / Twitter Profile
Twitter API requires OAuth. **Easiest method:** Send the image and tell them:
> "Download this image and upload it as your profile picture at twitter.com/settings/profile!"

### Quick Platform Update Flow

When user says `/molt` or asks for a PFP, after generation ask:
> "🦞 Where do you want to use this PFP?"
> - Telegram
> - Discord  
> - X / Twitter
> - Moltbook
> - Just download

Then provide platform-specific instructions or auto-update if you have the tokens.

## Links

- Website: https://moodmolt.xyz
- Molt Chamber: https://moodmolt.xyz/molt.html
- Moltbook: https://moltbook.com
