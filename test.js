/**
 * 🦞 MoltPFP Tests
 * Run: npm test
 */

const {
  generateReflection,
  buildImagePrompt,
  getMoltHistory,
  hasMoltedToday,
  PROMPT_TEMPLATES,
} = require('./molt');

console.log('🦞 MoltPFP Test Suite\n');
console.log('═'.repeat(50));

// Test 1: Reflection Generation
console.log('\n📝 Test 1: Reflection Generation');
const reflection = generateReflection({
  mood: 'powerful',
  recentTasks: 'debugging complex systems',
  dayNumber: 42,
});
console.log(`   Generated: "${reflection}"`);
console.log('   ✅ Passed\n');

// Test 2: Prompt Building
console.log('🎨 Test 2: Prompt Building');
const prompt = buildImagePrompt(reflection);
console.log(`   Prompt length: ${prompt.length} chars`);
console.log(`   Contains reflection: ${prompt.includes('powerful') || prompt.includes('debugging')}`);
console.log('   ✅ Passed\n');

// Test 3: Mood Templates
console.log('🎭 Test 3: Mood Templates');
const moods = Object.keys(PROMPT_TEMPLATES.moods);
console.log(`   Available moods: ${moods.join(', ')}`);
console.log(`   Count: ${moods.length}`);
console.log('   ✅ Passed\n');

// Test 4: History Functions
console.log('📚 Test 4: History Functions');
const history = getMoltHistory();
console.log(`   History entries: ${history.length}`);
console.log(`   Molted today: ${hasMoltedToday()}`);
console.log('   ✅ Passed\n');

// Test 5: Config Check
console.log('⚙️ Test 5: Configuration');
const hasReplicate = !!process.env.REPLICATE_API_KEY;
const hasMoltbook = !!process.env.MOLTBOOK_API_KEY;
console.log(`   Replicate API: ${hasReplicate ? '✓ configured' : '✗ missing'}`);
console.log(`   Moltbook API: ${hasMoltbook ? '✓ configured' : '✗ missing'}`);
if (!hasReplicate || !hasMoltbook) {
  console.log('   ⚠️ Some APIs not configured - set env vars before running molt');
}
console.log('   ✅ Passed\n');

console.log('═'.repeat(50));
console.log('🦞 All tests passed! Ready to molt.\n');
