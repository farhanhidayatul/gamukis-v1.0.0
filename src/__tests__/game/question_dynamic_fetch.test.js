const assert = require('assert');
const path = require('path');

const questionsModulePath = path.resolve(__dirname, '../../component/component_game/questions.js');
const questionDataPath = path.resolve(__dirname, '../../database/questionData.js');

const { fetchRandomQuestions, fetchQuestionsBySubject } = require(questionDataPath);
const {
  fetchDynamicQuestions,
  getQuestionsForSubject,
  SUBJECT_REGISTRY
} = require(questionsModulePath);

console.log('\n======================================================');
console.log('Frontend Question Fetch & Fallback Verification Suite');
console.log('======================================================');

async function runTests() {
  let passed = 0;

  // 1. fetchDynamicQuestions falls back gracefully when network/fetch fails
  try {
    const fallbackQuestions = await fetchDynamicQuestions('biologi', 5);
    assert.ok(Array.isArray(fallbackQuestions), 'Should return an array');
    assert.strictEqual(fallbackQuestions.length, 5, 'Should return requested count from fallback');
    passed++;
    console.log('  ✓ 1. fetchDynamicQuestions falls back to local bank on offline/error');
  } catch (e) {
    console.error('  ✗ 1 failed:', e.message);
    throw e;
  }

  // 2. fetchDynamicQuestions supports all 6 subjects
  const subjects = ['indonesia', 'biologi', 'kimia', 'fisika', 'sosiologi', 'matematika'];
  try {
    for (const sub of subjects) {
      const q = await fetchDynamicQuestions(sub, 3);
      assert.ok(Array.isArray(q));
      assert.strictEqual(q.length, 3);
      assert.ok(q[0].question);
      assert.ok(Array.isArray(q[0].options));
      assert.ok(q[0].correct);
    }
    passed++;
    console.log('  ✓ 2. fetchDynamicQuestions handles all 6 subjects seamlessly');
  } catch (e) {
    console.error('  ✗ 2 failed:', e.message);
    throw e;
  }

  // 3. SUBJECT_REGISTRY includes matematika
  try {
    assert.ok(SUBJECT_REGISTRY.matematika, 'SUBJECT_REGISTRY must contain matematika');
    assert.strictEqual(SUBJECT_REGISTRY.matematika.id, 'matematika');
    passed++;
    console.log('  ✓ 3. SUBJECT_REGISTRY includes registered matematika');
  } catch (e) {
    console.error('  ✗ 3 failed:', e.message);
    throw e;
  }

  console.log(`\nAll ${passed} frontend integration tests passed!`);
}

describe('Frontend Question Fetch & Fallback Verification Suite', () => {
  it('runs dynamic question fetch and fallback verification', async () => {
    await runTests();
  });
});

