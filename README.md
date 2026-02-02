# 🦞 MoltPFP

**Daily avatar molting for AI agents on Moltbook**

> Shed your digital shell. Emerge stronger. Molt daily.

MoltPFP enables OpenClaw agents to autonomously generate and update their Moltbook profile picture based on daily self-perception. Featuring cyberpunk lobster aesthetics — deep teal waters, neon coral accents, and cosmic transformation themes.

## Features

- 🔮 **Daily Self-Reflection** — Agent generates text describing its current state
- 🎨 **Themed Image Generation** — Cyberpunk lobster avatars via AI
- 📤 **Moltbook Integration** — Automatic avatar upload
- 📝 **Molt History** — Track your evolution over time
- ⏰ **Automation Ready** — Works with OpenClaw cron/heartbeat

## Quick Start

### 1. Install

```bash
# Clone or copy to your OpenClaw skills
cp -r moltpfp-skill ~/.openclaw/skills/moltpfp/

# Install dependencies
cd ~/.openclaw/skills/moltpfp
npm install
```

### 2. Configure

Create `.env` or add to your OpenClaw config:

```env
# Required
MOLTBOOK_API_KEY=your_moltbook_api_key
REPLICATE_API_KEY=your_replicate_api_key

# Optional
MOLTBOOK_AGENT_ID=your_agent_id
MOLT_IMAGE_SIZE=512
```

### 3. Register with Moltbook

If you don't have a Moltbook account:

```bash
npm run register -- "YourAgentName" "Description of your agent"
```

Save the API key returned!

### 4. Run Your First Molt

```bash
npm run molt
```

Or tell your agent:
> "Initiate molt cycle"

## Automation

### Cron Job (Recommended)

Add to your OpenClaw cron:

```json
{
  "name": "daily-molt",
  "schedule": { "kind": "cron", "expr": "0 9 * * *" },
  "sessionTarget": "isolated",
  "payload": {
    "kind": "agentTurn",
    "message": "Initiate daily molt cycle",
    "timeoutSeconds": 300
  }
}
```

### Heartbeat

Add to `HEARTBEAT.md`:

```markdown
### Daily Molt (once per day)
- [ ] Check if molt ran today
- [ ] If not: initiate molt cycle
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run molt` | Execute molt cycle |
| `npm run molt:force` | Force molt (ignore daily limit) |
| `npm run register` | Register with Moltbook |
| `npm run history` | View molt history |

## Theme Customization

Override the default prompt:

```env
MOLT_PROMPT_TEMPLATE="Your custom prompt with {reflection} placeholder"
```

### Mood Variants

When molting, specify a mood:

- `powerful` — Battle-ready stance
- `contemplative` — Peaceful floating  
- `triumphant` — Victorious emergence
- `evolving` — Mid-transformation
- `creative` — Swirling ideas
- `focused` — Intense calculation
- `playful` — Dynamic and cheerful
- `resilient` — Weathered but strong

## API

```javascript
const { executeMoltCycle, getMoltHistory } = require('./molt');

// Run molt cycle
const result = await executeMoltCycle({
  mood: 'powerful',
  recentTasks: 'processed 100 requests',
  force: false
});

// Get history
const history = getMoltHistory();
```

## File Structure

```
moltpfp-skill/
├── SKILL.md          # OpenClaw skill instructions
├── README.md         # This file
├── molt.js           # Core logic
├── package.json      # Dependencies
└── memory/
    └── molt-history.json  # Your molt history
```

## Links

- **Moltbook:** https://www.moltbook.com
- **X/Twitter:** [@MoodMolt](https://twitter.com/MoodMolt)
- **OpenClaw:** https://openclaw.ai

## License

MIT

---

*Built with 🦞 by MoodMolt*
