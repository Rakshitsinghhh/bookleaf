// BookLeaf Assignment 2 Automated Test Suite
// Validates Webhook Security, Idempotency, Knowledge Base Grounding & Edge Cases

import assert from 'assert';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5002';
const API_KEY = 'bk_live_7f8a9e2d4c1b';

async function runTests() {
  console.log('🧪 Starting BookLeaf Assignment 2 Test Suite against ' + BASE_URL);

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} ->`, err.message);
    }
  }

  // 1. Webhook Auth Test: Rejects Unauthorized
  await test('Reject Webhook without API Key (HTTP 401)', async () => {
    const res = await fetch(`${BASE_URL}/webhook/generate-royalty-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bookleaf-api-key': 'invalid_token_123'
      },
      body: JSON.stringify({ author_id: 'AUTH001' })
    });
    assert.strictEqual(res.status, 401, 'Should return HTTP 401 for invalid API key');
  });

  // 2. Author Calculation & Badges: Priya Sharma (Pending)
  await test('Author Calculation & Royalty Breakdown (AUTH001)', async () => {
    const res = await fetch(`${BASE_URL}/api/authors/AUTH001`);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.author.author_id, 'AUTH001');
    assert.strictEqual(data.author.total_royalty_earned, 19908);
    assert.strictEqual(data.author.total_royalty_paid, 16338);
    assert.strictEqual(data.author.total_royalty_pending, 3570);
  });

  // 3. Edge Case: Ananya Reddy (AUTH003 - Published >90 days ago, never paid -> OVERDUE RED)
  await test('Edge Case: Overdue Red Badge for Unpaid Published Author (AUTH003)', async () => {
    const res = await fetch(`${BASE_URL}/api/authors/AUTH003`);
    const data = await res.json();
    assert.strictEqual(data.author.overall_payout_status, 'Overdue');
    assert.strictEqual(data.author.books[0].badge.color, 'red');
  });

  // 4. Edge Case: Farhan Sheikh (AUTH008 - Fully Paid -> GREEN)
  await test('Edge Case: Fully Paid Green Badge (AUTH008)', async () => {
    const res = await fetch(`${BASE_URL}/api/authors/AUTH008`);
    const data = await res.json();
    assert.strictEqual(data.author.total_royalty_pending, 0);
    assert.strictEqual(data.author.overall_payout_status, 'Fully Paid');
    assert.strictEqual(data.author.books[0].badge.color, 'green');
  });

  // 5. Edge Case: Sneha Kulkarni (AUTH007 - In Production Book)
  await test('Edge Case: In Production Stage Tracking (AUTH007)', async () => {
    const res = await fetch(`${BASE_URL}/api/authors/AUTH007`);
    const data = await res.json();
    const inProdBook = data.author.books.find(b => b.book_id === 'BK013');
    assert.ok(inProdBook, 'Should find Midnight in Mysore');
    assert.strictEqual(inProdBook.badge.type, 'in_production');
    assert.strictEqual(inProdBook.badge.label, 'Cover Design');
  });

  // 6. Webhook Execution & AI Summary Generation
  await test('Generate AI Royalty Summary via Webhook (AUTH001)', async () => {
    const res = await fetch(`${BASE_URL}/webhook/generate-royalty-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bookleaf-api-key': API_KEY
      },
      body: JSON.stringify({
        author_id: 'AUTH001',
        trigger_type: 'Manual Single',
        idempotency_key: `TEST-${Date.now()}`
      })
    });
    const data = await res.json();
    assert.strictEqual(data.status, 'Success');
    assert.ok(data.email_content.includes('Priya Sharma'), 'Email should address Priya Sharma');
    assert.ok(data.email_content.includes('19,908'), 'Email should include total earned');
    assert.ok(data.email_content.includes('3,570'), 'Email should include pending balance');
  });

  // 7. Idempotency Test: Deduplication within sliding window
  await test('Idempotency & Duplicate Prevention', async () => {
    const uniqueKey = `IDEM-TEST-${Date.now()}`;
    // First call
    const res1 = await fetch(`${BASE_URL}/webhook/generate-royalty-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-bookleaf-api-key': API_KEY },
      body: JSON.stringify({ author_id: 'AUTH004', idempotency_key: uniqueKey })
    });
    const data1 = await res1.json();
    assert.strictEqual(data1.status, 'Success');

    // Immediate second call with same idempotency key
    const res2 = await fetch(`${BASE_URL}/webhook/generate-royalty-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-bookleaf-api-key': API_KEY },
      body: JSON.stringify({ author_id: 'AUTH004', idempotency_key: uniqueKey })
    });
    const data2 = await res2.json();
    assert.strictEqual(data2.status, 'Duplicate Skipped', 'Should gracefully skip duplicate call');
  });

  // 8. Bulk Trigger Test
  await test('Admin Bulk Trigger for All Pending Authors', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/bulk-trigger`, { method: 'POST' });
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.processed >= 7, 'Should process all eligible authors with pending royalties');
  });

  console.log(`\n========================================`);
  console.log(`🏁 Test Results: ${passed}/${total} passed (${Math.round((passed / total) * 100)}%)`);
  console.log(`========================================`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
