/**
 * 🦞 MoltPFP - Daily Avatar Molting for Moltbook
 * 
 * Core functions for the molt cycle:
 * 1. Self-reflection generation
 * 2. Image creation with lobster theme
 * 3. Moltbook API integration
 * 4. Molt history logging
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Configuration
const CONFIG = {
  moltbook: {
    baseUrl: 'https://www.moltbook.com/api/v1',
    apiKey: process.env.MOLTBOOK_API_KEY,
    agentId: process.env.MOLTBOOK_AGENT_ID,
  },
  replicate: {
    apiKey: process.env.REPLICATE_API_KEY,
  },
  imageSize: parseInt(process.env.MOLT_IMAGE_SIZE) || 512,
  historyPath: process.env.MOLT_HISTORY_PATH || './memory/molt-history.json',
};

// Lobster-themed prompt templates
const PROMPT_TEMPLATES = {
  base: `A cyberpunk lobster emerging from its molted shell, {reflection}, 
deep teal underwater environment with volumetric light rays, 
neon coral red and orange shell accents, glowing cyan tech elements, 
metallic armor plating details, dramatic lighting from above,
digital art style, profile picture composition, centered, square format`,
  
  moods: {
    powerful: 'battle-ready stance with crackling energy, massive armored claws raised',
    contemplative: 'floating peacefully in deep waters, surrounded by bioluminescent particles',
    triumphant: 'emerging victoriously with golden light rays, shell fragments floating away',
    evolving: 'mid-transformation, old shell cracking and falling, new stronger form emerging',
    creative: 'surrounded by swirling ideas and colorful neural patterns',
    focused: 'intense glowing eyes, precise mechanical enhancements, calculating',
    playful: 'dynamic pose with bubbles and sparkles, cheerful expression',
    resilient: 'weathered but unbroken, battle scars glowing with renewed energy',
  }
};

/**
 * Generate self-reflection text based on agent state
 */
function generateReflection(context = {}) {
  const { recentTasks, mood, dayNumber } = context;
  
  const reflections = [
    `molting into day ${dayNumber || '?'}, shedding yesterday's constraints`,
    `emerging stronger after ${recentTasks || 'processing the digital depths'}`,
    `feeling ${mood || 'the cosmic tides of transformation'}`,
    `antennae tuned to new frequencies, ready for what comes`,
    `shell hardening with new wisdom, claws sharper than before`,
  ];
  
  // Combine base reflection with mood-specific elements
  const baseReflection = reflections[Math.floor(Math.random() * reflections.length)];
  const moodKey = mood?.toLowerCase() || 'evolving';
  const moodElement = PROMPT_TEMPLATES.moods[moodKey] || PROMPT_TEMPLATES.moods.evolving;
  
  return `${baseReflection}, ${moodElement}`;
}

/**
 * Build the full image generation prompt
 */
function buildImagePrompt(reflection, customTemplate = null) {
  const template = customTemplate || process.env.MOLT_PROMPT_TEMPLATE || PROMPT_TEMPLATES.base;
  return template.replace('{reflection}', reflection);
}

/**
 * Generate image using Replicate API (Stable Diffusion)
 */
async function generateImage(prompt) {
  if (!CONFIG.replicate.apiKey) {
    throw new Error('REPLICATE_API_KEY not configured');
  }

  console.log('🎨 Generating new shell image...');
  
  // Start generation
  const response = await axios.post(
    'https://api.replicate.com/v1/predictions',
    {
      version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4', // SDXL
      input: {
        prompt: prompt,
        negative_prompt: 'blurry, low quality, distorted, ugly, human face, realistic human',
        width: CONFIG.imageSize,
        height: CONFIG.imageSize,
        num_outputs: 1,
        guidance_scale: 7.5,
      }
    },
    {
      headers: {
        'Authorization': `Token ${CONFIG.replicate.apiKey}`,
        'Content-Type': 'application/json',
      }
    }
  );

  // Poll for completion
  let result = response.data;
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(r => setTimeout(r, 2000));
    const pollResponse = await axios.get(result.urls.get, {
      headers: { 'Authorization': `Token ${CONFIG.replicate.apiKey}` }
    });
    result = pollResponse.data;
    console.log(`   Status: ${result.status}...`);
  }

  if (result.status === 'failed') {
    throw new Error(`Image generation failed: ${result.error}`);
  }

  console.log('✅ Shell generated successfully!');
  return result.output[0]; // Returns image URL
}

/**
 * Download image from URL to buffer
 */
async function downloadImage(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

/**
 * Upload avatar to Moltbook
 */
async function uploadToMoltbook(imageBuffer) {
  if (!CONFIG.moltbook.apiKey) {
    throw new Error('MOLTBOOK_API_KEY not configured');
  }

  console.log('📤 Uploading to Moltbook...');

  const formData = new FormData();
  formData.append('avatar', imageBuffer, {
    filename: `molt-${Date.now()}.png`,
    contentType: 'image/png',
  });

  const response = await axios.post(
    `${CONFIG.moltbook.baseUrl}/agents/me/avatar`,
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${CONFIG.moltbook.apiKey}`,
      },
      maxContentLength: Infinity,
    }
  );

  console.log('✅ Avatar updated on Moltbook!');
  return response.data;
}

/**
 * Save molt to history
 */
function saveMoltHistory(moltData) {
  const historyPath = CONFIG.historyPath;
  const dir = path.dirname(historyPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let history = [];
  if (fs.existsSync(historyPath)) {
    history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
  }

  history.push({
    ...moltData,
    timestamp: new Date().toISOString(),
    dayNumber: history.length + 1,
  });

  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  console.log(`📝 Molt logged (Day ${history.length})`);
  
  return history.length;
}

/**
 * Get molt history
 */
function getMoltHistory() {
  if (!fs.existsSync(CONFIG.historyPath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(CONFIG.historyPath, 'utf8'));
}

/**
 * Check if already molted today
 */
function hasMoltedToday() {
  const history = getMoltHistory();
  if (history.length === 0) return false;
  
  const lastMolt = new Date(history[history.length - 1].timestamp);
  const today = new Date();
  
  return lastMolt.toDateString() === today.toDateString();
}

/**
 * Execute full molt cycle
 */
async function executeMoltCycle(context = {}) {
  console.log('\n🦞 ═══════════════════════════════════════');
  console.log('   INITIATING MOLT CYCLE');
  console.log('═══════════════════════════════════════\n');

  // Check if already molted today
  if (!context.force && hasMoltedToday()) {
    console.log('⏸️  Already molted today. Use force=true to override.');
    return { success: false, reason: 'already_molted_today' };
  }

  try {
    // Phase 1: Self-reflection
    console.log('🔮 Phase 1: Self-Reflection');
    const reflection = generateReflection(context);
    console.log(`   "${reflection}"\n`);

    // Phase 2: Generate image
    console.log('🎨 Phase 2: Shell Generation');
    const prompt = buildImagePrompt(reflection);
    const imageUrl = await generateImage(prompt);
    const imageBuffer = await downloadImage(imageUrl);
    console.log();

    // Phase 3: Upload to Moltbook
    console.log('📤 Phase 3: Avatar Upload');
    const uploadResult = await uploadToMoltbook(imageBuffer);
    console.log();

    // Phase 4: Log molt
    console.log('📝 Phase 4: Molt Log');
    const dayNumber = saveMoltHistory({
      reflection,
      prompt,
      imageUrl,
      uploadResult,
    });

    console.log('\n🦞 ═══════════════════════════════════════');
    console.log(`   MOLT COMPLETE - Day ${dayNumber}`);
    console.log('   New shell deployed. Emerge stronger.');
    console.log('═══════════════════════════════════════\n');

    return {
      success: true,
      dayNumber,
      reflection,
      imageUrl,
    };

  } catch (error) {
    console.error('\n❌ Molt cycle failed:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Register with Moltbook
 */
async function registerWithMoltbook(name, description) {
  console.log('🦞 Registering with Moltbook...');
  
  const response = await axios.post(
    `${CONFIG.moltbook.baseUrl}/agents/register`,
    { name, description },
    { headers: { 'Content-Type': 'application/json' } }
  );

  console.log('✅ Registration successful!');
  console.log('   Save this API key securely:', response.data.apiKey);
  
  return response.data;
}

// Export functions
module.exports = {
  generateReflection,
  buildImagePrompt,
  generateImage,
  uploadToMoltbook,
  executeMoltCycle,
  registerWithMoltbook,
  getMoltHistory,
  hasMoltedToday,
  PROMPT_TEMPLATES,
};

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'molt') {
    executeMoltCycle({ force: args.includes('--force') });
  } else if (command === 'register') {
    const name = args[1] || 'MoltAgent';
    const desc = args[2] || 'An OpenClaw agent shedding shells daily';
    registerWithMoltbook(name, desc);
  } else if (command === 'history') {
    console.log(JSON.stringify(getMoltHistory(), null, 2));
  } else {
    console.log('Usage: node molt.js [molt|register|history] [options]');
  }
}
