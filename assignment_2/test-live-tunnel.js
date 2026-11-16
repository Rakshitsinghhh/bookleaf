// Test script to send sample author payload to the live n8n tunnel
// Supports both Production URL (/webhook/) and Test URL (/webhook-test/)

const BASE_TUNNEL = 'https://upset-zebras-sit.loca.lt';
const API_KEY = 'bk_live_7f8a9e2d4c1b';

const payload = {
  author_id: "AUTH001",
  author: {
    author_id: "AUTH001",
    name: "Priya Sharma",
    email: "priya.sharma@gmail.com",
    city: "Mumbai",
    books: [
      {
        book_id: "BK001",
        title: "Whispers of the Ganges",
        isbn: "978-93-5XXXX-01-1",
        genre: "Literary Fiction",
        status: "Published & Live",
        mrp: 399,
        author_royalty_per_copy: 35,
        total_copies_sold: 342,
        total_royalty_earned: 11970,
        royalty_paid: 8400,
        royalty_pending: 3570,
        last_royalty_payout_date: "2025-10-15"
      },
      {
        book_id: "BK002",
        title: "The Saffron Diaries",
        isbn: "978-93-5XXXX-02-8",
        genre: "Non-Fiction / Memoir",
        status: "Published & Live",
        mrp: 450,
        author_royalty_per_copy: 42,
        total_copies_sold: 189,
        total_royalty_earned: 7938,
        royalty_paid: 7938,
        royalty_pending: 0,
        last_royalty_payout_date: "2025-12-01"
      }
    ]
  },
  trigger_type: "Manual Single",
  idempotency_key: `TUNNEL-TEST-${Date.now()}`
};

async function sendRequest(url, modeName) {
  console.log(`\n📡 Testing [${modeName}] -> ${url}`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bookleaf-api-key': API_KEY,
        'Bypass-Tunnel-Reminder': 'true'
      },
      body: JSON.stringify(payload)
    });

    const bodyText = await res.text();
    console.log(`   Response Code: HTTP ${res.status}`);
    try {
      const json = JSON.parse(bodyText);
      console.log('   Response Body:', JSON.stringify(json, null, 2));
      return { status: res.status, success: res.status === 200 };
    } catch {
      console.log('   Response Body:', bodyText);
      return { status: res.status, success: false };
    }
  } catch (err) {
    console.error(`   ❌ Failed to connect:`, err.message);
    return { status: 0, success: false };
  }
}

async function run() {
  console.log('=================================================================');
  console.log('🚀 BookLeaf n8n Webhook Live Tunnel Verifier');
  console.log('=================================================================');

  // Try Production URL first
  const prodUrl = `${BASE_TUNNEL}/webhook/generate-royalty-summary`;
  const prodRes = await sendRequest(prodUrl, 'PRODUCTION MODE (Workflow Active)');

  if (prodRes.success) {
    console.log('\n🎉 SUCCESS! Your n8n Production Webhook is 100% active and working!');
    return;
  }

  // If 404, try Test URL
  if (prodRes.status === 404) {
    console.log('\nℹ️ Production webhook not active yet. Checking Test Mode webhook...');
    const testUrl = `${BASE_TUNNEL}/webhook-test/generate-royalty-summary`;
    const testRes = await sendRequest(testUrl, 'TEST MODE (Workflow Canvas)');

    if (testRes.success) {
      console.log('\n🎉 SUCCESS! Test webhook execution received and processed!');
    } else {
      console.log('\n💡 INSTRUCTION TO FIX:');
      console.log('   1. In n8n, look at the top-right corner next to the "Save" button.');
      console.log('   2. Flip the switch from "Inactive" to "Active".');
      console.log('   3. (Or if testing on canvas: click "Test workflow" at the bottom of the n8n screen first).');
    }
  }
}

run();
