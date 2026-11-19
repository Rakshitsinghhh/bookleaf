#!/usr/bin/env node
// BookLeaf Publishing — n8n Webhook Diagnostic & Verification Tool
// Checks n8n connectivity, authentication header, production mode vs test mode

const target = (process.argv[2] || process.env.N8N_URL || 'http://localhost:5678')
  .replace(/\/webhook(-test)?(\/generate-royalty-summary)?\/?$/, '')
  .replace(/\/+$/, '');

const API_KEY = process.env.N8N_WEBHOOK_SECRET || 'bk_live_7f8a9e2d4c1b';

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
  idempotency_key: `CLI-TEST-${Date.now()}`
};

async function testEndpoint(url, label) {
  console.log(`\n🔍 Checking [${label}]`);
  console.log(`   URL: ${url}`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bookleaf-api-key': API_KEY,
        'Bypass-Tunnel-Reminder': 'true'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000)
    });

    const bodyText = await res.text();
    console.log(`   Response Code: HTTP ${res.status}`);

    if (res.ok) {
      try {
        const json = JSON.parse(bodyText);
        console.log('   ✅ Result: SUCCESS!');
        console.log('   Output Preview:', JSON.stringify(json, null, 2).slice(0, 300) + '...');
        return { success: true, status: res.status };
      } catch {
        console.log('   ✅ Result: HTTP 200 OK (Non-JSON response)');
        return { success: true, status: res.status };
      }
    } else {
      console.log(`   ⚠️ Failed with HTTP ${res.status}: ${bodyText.slice(0, 200)}`);
      return { success: false, status: res.status };
    }
  } catch (err) {
    console.log(`   ❌ Connection Failed: ${err.message}`);
    return { success: false, status: 0, error: err.message };
  }
}

async function main() {
  console.log('======================================================================');
  console.log('⚡ BookLeaf n8n Webhook Diagnostic Tool');
  console.log(`🎯 Target Base: ${target}`);
  console.log('======================================================================');

  const prodUrl = `${target}/webhook/generate-royalty-summary`;
  const prod = await testEndpoint(prodUrl, '1. Production Mode (/webhook/)');

  if (prod.success) {
    console.log('\n======================================================================');
    console.log('🎉 SUCCESS: Your n8n Workflow is ACTIVE and executed properly!');
    console.log('   Check the "Executions" tab in n8n to view this execution log.');
    console.log('======================================================================');
    return;
  }

  const testUrl = `${target}/webhook-test/generate-royalty-summary`;
  const test = await testEndpoint(testUrl, '2. Canvas Test Mode (/webhook-test/)');

  if (test.success) {
    console.log('\n======================================================================');
    console.log('🎉 SUCCESS: Received in Canvas Test Mode!');
    console.log('   Check your open n8n canvas tab: all nodes should now be green with checkmarks.');
    console.log('   Note: To record executions permanently in the "Executions" list,');
    console.log('   flip the switch in top-right of n8n from "Inactive" to "Active"!');
    console.log('======================================================================');
    return;
  }

  console.log('\n======================================================================');
  console.log('🚨 DIAGNOSTIC REPORT: Why n8n executions did not work:');
  console.log('======================================================================');
  if (prod.status === 0 && test.status === 0) {
    console.log('❌ Cause: n8n is NOT running or unreachable on', target);
    console.log('👉 Solution:');
    console.log('   1. Open a new terminal and run:');
    console.log('      npx n8n');
    console.log('   2. Open http://localhost:5678 in your browser.');
  } else if (prod.status === 404 && test.status === 404) {
    console.log('❌ Cause: n8n is running, but the workflow is INACTIVE (HTTP 404 on both URLs).');
    console.log('👉 Solution:');
    console.log('   1. In n8n, make sure you imported:');
    console.log('      assignment_2/n8n/bookleaf_royalty_notification_workflow.json');
    console.log('   2. Look at the top-right corner next to the "Save" button:');
    console.log('      Flip the toggle switch to ACTIVE: [ Inactive ◯────── ] ➔ [ Active ──────◯ ]');
    console.log('   3. (OR if testing on canvas: click "Test workflow" at the bottom first, then run this command again!)');
  } else if (prod.status === 401 || test.status === 401) {
    console.log('❌ Cause: Webhook rejected with HTTP 401 Unauthorized.');
    console.log('   Header x-bookleaf-api-key did not match bk_live_7f8a9e2d4c1b');
  }
  console.log('======================================================================');
}

main();
