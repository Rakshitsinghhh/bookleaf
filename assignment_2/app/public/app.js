// BookLeaf Publishing - Assignment 2 Interactive Application Logic
document.addEventListener('DOMContentLoaded', () => {
  const ROUTE_PREFIX = window.location.pathname.startsWith('/dashboard') ? '/dashboard' : '';
  let currentAuthorId = 'AUTH001';
  let activeAuthorData = null;
  let allAuthorsCache = [];

  // Tab navigation
  const tabs = document.querySelectorAll('.nav-tab');
  const views = document.querySelectorAll('.tab-view');

  function switchTab(tabId) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    views.forEach(v => v.classList.toggle('active', v.id === `view-${tabId}`));
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Role Switcher
  const roleSelect = document.getElementById('role-select');
  roleSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'admin') {
      switchTab('admin-portal');
      loadAdminData();
    } else {
      currentAuthorId = val;
      switchTab('author-portal');
      loadAuthorData(currentAuthorId);
    }
  });

  // ----------------- AUTHOR PORTAL -----------------
  async function loadAuthorData(authorId) {
    try {
      const res = await fetch(`${ROUTE_PREFIX}/api/authors/${authorId}`);
      const data = await res.json();
      if (!data.success) return;

      const author = data.author;
      activeAuthorData = author;

      // Update Profile Header
      document.getElementById('author-name').textContent = author.name;
      document.getElementById('author-avatar').textContent = author.name.split(' ').map(n => n[0]).join('');
      document.getElementById('author-id-pill').textContent = author.author_id;
      document.getElementById('author-city-pill').textContent = author.city;
      document.getElementById('author-meta').textContent = 
        `Author Member since ${new Date(author.joined_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • Email: ${author.email} • Phone: ${author.phone}`;

      // Update Metrics
      document.getElementById('author-total-earned').textContent = `₹${author.total_royalty_earned.toLocaleString('en-IN')}`;
      document.getElementById('author-total-paid').textContent = `₹${author.total_royalty_paid.toLocaleString('en-IN')}`;
      document.getElementById('author-total-pending').textContent = `₹${author.total_royalty_pending.toLocaleString('en-IN')}`;
      document.getElementById('author-total-books').textContent = author.total_books;
      document.getElementById('author-copies-sold').textContent = `${author.total_copies_sold.toLocaleString('en-IN')} total copies distributed`;

      if (author.total_royalty_pending === 0) {
        document.getElementById('author-pending-subtext').textContent = 'All accrued royalties settled';
      } else if (author.total_royalty_pending < 1000) {
        document.getElementById('author-pending-subtext').textContent = 'Under ₹1,000 threshold (Rolls over)';
      } else {
        document.getElementById('author-pending-subtext').textContent = 'Scheduled for upcoming 45-day cycle';
      }

      // Populate Books Table
      const tbody = document.getElementById('author-books-tbody');
      tbody.innerHTML = '';

      author.books.forEach(b => {
        const tr = document.createElement('tr');
        const badge = b.badge;

        tr.innerHTML = `
          <td>
            <span class="book-title-cell">${b.title}</span>
            <span class="book-meta-sub">${b.genre || 'General'} • Partner: ${b.print_partner || 'In-House'}</span>
          </td>
          <td>
            <code>${b.isbn || 'Pending ISBN'}</code>
            <span class="book-meta-sub">${b.available_on ? b.available_on.join(', ') : 'Direct Store'}</span>
          </td>
          <td>
            ${b.mrp ? `₹${b.mrp}` : '—'}
            <span class="book-meta-sub">${b.author_royalty_per_copy ? `₹${b.author_royalty_per_copy}/copy` : 'Pipeline'}</span>
          </td>
          <td><strong>${b.total_copies_sold || 0}</strong></td>
          <td>₹${(b.total_royalty_earned || 0).toLocaleString('en-IN')}</td>
          <td>
            <span class="text-success">₹${(b.royalty_paid || 0).toLocaleString('en-IN')}</span> /
            <span class="text-warning">₹${(b.royalty_pending || 0).toLocaleString('en-IN')}</span>
          </td>
          <td>
            ${b.last_royalty_payout_date ? new Date(b.last_royalty_payout_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '<span class="text-muted">None to date</span>'}
          </td>
          <td>
            <span class="badge ${badge.badgeClass}" title="${badge.reason || ''}">
              ${badge.label}
            </span>
          </td>
        `;
        tbody.appendChild(tr);
      });

    } catch (err) {
      console.error('Error loading author data:', err);
    }
  }

  // ----------------- ADMIN PORTAL -----------------
  async function loadAdminData() {
    const city = document.getElementById('admin-city-filter').value;
    const status = document.getElementById('admin-status-filter').value;
    const search = document.getElementById('admin-search-input').value;

    try {
      const res = await fetch(`${ROUTE_PREFIX}/api/authors?city=${encodeURIComponent(city)}&status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (!data.success) return;

      allAuthorsCache = data.authors;

      // Populate Table
      const tbody = document.getElementById('admin-authors-tbody');
      tbody.innerHTML = '';
      document.getElementById('admin-roster-count').textContent = `Showing ${data.authors.length} of 10 Authors`;

      let totalCatalogEarned = 0;
      let totalCatalogPaid = 0;
      let totalCatalogPending = 0;
      let overdueCount = 0;

      data.authors.forEach(a => {
        totalCatalogEarned += a.total_royalty_earned;
        totalCatalogPaid += a.total_royalty_paid;
        totalCatalogPending += a.total_royalty_pending;
        if (a.overall_payout_status === 'Overdue') overdueCount++;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <span class="book-title-cell">${a.name}</span>
            <span class="book-meta-sub">${a.author_id} • ${a.email}</span>
          </td>
          <td>${a.city}</td>
          <td><strong>${a.total_books}</strong></td>
          <td>₹${a.total_royalty_earned.toLocaleString('en-IN')}</td>
          <td class="text-success">₹${a.total_royalty_paid.toLocaleString('en-IN')}</td>
          <td class="text-warning">₹${a.total_royalty_pending.toLocaleString('en-IN')}</td>
          <td>
            <span class="badge ${a.overall_payout_status === 'Overdue' ? 'badge-red' : (a.overall_payout_status === 'Pending' ? 'badge-yellow' : 'badge-green')}">
              ${a.overall_payout_status}
            </span>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="openAuthorDetailModal('${a.author_id}')">
              Inspect & Trigger
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Update stat pills
      document.getElementById('admin-stat-authors').textContent = data.authors.length;
      document.getElementById('admin-stat-paid').textContent = `₹${totalCatalogPaid.toLocaleString('en-IN')}`;
      document.getElementById('admin-stat-pending').textContent = `₹${totalCatalogPending.toLocaleString('en-IN')}`;
      document.getElementById('admin-stat-overdue').textContent = overdueCount;

      loadNotificationLogs();

    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  }

  // Load Notification Logs
  async function loadNotificationLogs() {
    try {
      const res = await fetch(`${ROUTE_PREFIX}/api/notification-logs`);
      const data = await res.json();
      if (!data.success) return;

      const tbody = document.getElementById('admin-logs-tbody');
      tbody.innerHTML = '';

      data.logs.forEach(log => {
        const tr = document.createElement('tr');
        const isSuccess = log.status === 'Success';

        tr.innerHTML = `
          <td><code>${log.log_id}</code></td>
          <td><strong>${log.author_name}</strong> <span class="book-meta-sub">${log.author_id}</span></td>
          <td>${log.author_email}</td>
          <td><span class="badge badge-neutral">${log.trigger_type}</span></td>
          <td>
            <span class="badge ${isSuccess ? 'badge-success' : 'badge-failed'}">
              ${log.status}
            </span>
          </td>
          <td>${new Date(log.sent_timestamp).toLocaleString('en-IN')}</td>
          <td>
            ${isSuccess ? `
              <button class="btn btn-secondary btn-sm" onclick="previewEmail('${log.log_id}')">
                View Email
              </button>
            ` : `
              <span class="text-danger" style="font-size:0.75rem;">${log.error_message || 'Timeout'}</span>
            `}
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error('Error loading logs:', err);
    }
  }

  // ----------------- AUTHOR DETAIL MODAL & TRIGGER -----------------
  let selectedAuthorInModal = null;

  window.openAuthorDetailModal = async function(authorId) {
    const res = await fetch(`${ROUTE_PREFIX}/api/authors/${authorId}`);
    const data = await res.json();
    if (!data.success) return;

    selectedAuthorInModal = data.author;
    const author = selectedAuthorInModal;

    document.getElementById('modal-author-name').textContent = author.name;
    document.getElementById('modal-author-sub').textContent = `${author.author_id} • ${author.city} • ${author.email}`;
    document.getElementById('modal-total-books').textContent = author.total_books;
    document.getElementById('modal-total-sold').textContent = author.total_copies_sold;
    document.getElementById('modal-total-earned').textContent = `₹${author.total_royalty_earned.toLocaleString('en-IN')}`;
    document.getElementById('modal-total-paid').textContent = `₹${author.total_royalty_paid.toLocaleString('en-IN')}`;
    document.getElementById('modal-total-pending').textContent = `₹${author.total_royalty_pending.toLocaleString('en-IN')}`;

    const tbody = document.getElementById('modal-books-tbody');
    tbody.innerHTML = '';

    author.books.forEach(b => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${b.title}</strong><br><small class="text-muted">${b.isbn || 'No ISBN'}</small></td>
        <td>${b.status}</td>
        <td>${b.total_copies_sold || 0}</td>
        <td>₹${(b.total_royalty_earned || 0).toLocaleString('en-IN')}</td>
        <td class="text-success">₹${(b.royalty_paid || 0).toLocaleString('en-IN')}</td>
        <td class="text-warning">₹${(b.royalty_pending || 0).toLocaleString('en-IN')}</td>
        <td><span class="badge ${b.badge.badgeClass}">${b.badge.label}</span></td>
      `;
      tbody.appendChild(tr);
    });

    document.getElementById('author-detail-modal').classList.add('open');
    if (typeof checkN8nStatus === 'function') {
      checkN8nStatus(false);
    }
  };

  // Close modal
  document.getElementById('modal-close-btn').addEventListener('click', () => {
    document.getElementById('author-detail-modal').classList.remove('open');
  });
  document.getElementById('modal-cancel-btn').addEventListener('click', () => {
    document.getElementById('author-detail-modal').classList.remove('open');
  });

  // Save and load n8n configuration from localStorage
  const n8nUrlInput = document.getElementById('n8n-endpoint-url');
  const n8nModeSelect = document.getElementById('n8n-exec-mode');
  const n8nPill = document.getElementById('n8n-live-pill');
  const n8nStatusDetail = document.getElementById('n8n-status-detail');
  const pingBtn = document.getElementById('btn-ping-n8n');

  if (localStorage.getItem('bookleaf_n8n_url')) {
    n8nUrlInput.value = localStorage.getItem('bookleaf_n8n_url');
  }
  if (localStorage.getItem('bookleaf_n8n_mode')) {
    n8nModeSelect.value = localStorage.getItem('bookleaf_n8n_mode');
  }

  n8nUrlInput.addEventListener('change', () => {
    localStorage.setItem('bookleaf_n8n_url', n8nUrlInput.value.trim());
  });
  n8nModeSelect.addEventListener('change', () => {
    localStorage.setItem('bookleaf_n8n_mode', n8nModeSelect.value);
  });

  // Ping n8n Connection
  async function checkN8nStatus(showToastFeedback = false) {
    if (!pingBtn) return;
    const url = n8nUrlInput.value.trim() || 'http://localhost:5678';
    pingBtn.disabled = true;
    pingBtn.textContent = 'Pinging...';
    n8nStatusDetail.className = 'n8n-status-msg';
    n8nStatusDetail.textContent = 'Testing connection to n8n webhook...';

    try {
      const res = await fetch(`${ROUTE_PREFIX}/api/n8n/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n8n_url: url })
      });
      const data = await res.json();

      if (data.overall_status === 'production_active') {
        n8nPill.className = 'badge badge-green';
        n8nPill.textContent = '🟢 Production Active';
        n8nStatusDetail.className = 'n8n-status-msg status-success';
        n8nStatusDetail.innerHTML = `<strong>Connected!</strong> n8n is actively listening on production webhook. All executions will be logged in n8n.`;
        if (showToastFeedback) showToast('🟢 n8n is Connected and Active!', 'success');
      } else if (data.overall_status === 'test_mode_active') {
        n8nPill.className = 'badge badge-yellow';
        n8nPill.textContent = '🟡 Canvas Test Listening';
        n8nStatusDetail.className = 'n8n-status-msg status-warning';
        n8nStatusDetail.innerHTML = `<strong>Canvas Test Active!</strong> n8n is waiting for a test event. When triggered, nodes on canvas will turn green.`;
        if (showToastFeedback) showToast('🟡 n8n Canvas Test Mode is listening!', 'info');
      } else if (data.overall_status === 'workflow_inactive') {
        n8nPill.className = 'badge badge-red';
        n8nPill.textContent = '🔴 Workflow Inactive';
        n8nStatusDetail.className = 'n8n-status-msg status-error';
        n8nStatusDetail.innerHTML = `<strong>Workflow is Inactive (HTTP 404):</strong> In your n8n browser tab, flip the switch from <em>Inactive</em> to <strong>Active</strong> in the top-right, OR click <strong>Test workflow</strong> on the canvas!`;
        if (showToastFeedback) showToast('⚠️ n8n workflow is Inactive! Flip toggle to Active in n8n.', 'error');
      } else {
        n8nPill.className = 'badge badge-red';
        n8nPill.textContent = '🔴 Offline';
        n8nStatusDetail.className = 'n8n-status-msg status-error';
        n8nStatusDetail.innerHTML = `<strong>Cannot connect to ${url}:</strong> Ensure n8n is running. Start it with <code>npx n8n</code> in your terminal.`;
        if (showToastFeedback) showToast('🔴 n8n is Offline. Start with npx n8n', 'error');
      }
    } catch (err) {
      n8nPill.className = 'badge badge-red';
      n8nPill.textContent = '🔴 Error';
      n8nStatusDetail.className = 'n8n-status-msg status-error';
      n8nStatusDetail.textContent = `Error testing connection: ${err.message}`;
    } finally {
      pingBtn.disabled = false;
      pingBtn.textContent = '⚡ Ping n8n';
    }
  }

  pingBtn.addEventListener('click', () => checkN8nStatus(true));

  // Trigger Royalty Summary via Webhook
  const triggerBtn = document.getElementById('modal-trigger-btn');
  triggerBtn.addEventListener('click', async () => {
    if (!selectedAuthorInModal) return;

    const author = selectedAuthorInModal;
    const simulateError = document.getElementById('simulate-error-toggle').checked;
    const n8nUrl = n8nUrlInput.value.trim() || 'http://localhost:5678';
    const n8nMode = n8nModeSelect.value || 'auto';

    triggerBtn.classList.add('loading');
    triggerBtn.disabled = true;

    showToast(`Dispatching Webhook for ${author.name}...`, 'info');

    try {
      const response = await fetch(`${ROUTE_PREFIX}/webhook/generate-royalty-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bookleaf-api-key': 'bk_live_7f8a9e2d4c1b'
        },
        body: JSON.stringify({
          author_id: author.author_id,
          trigger_type: 'Manual Single',
          idempotency_key: `${author.author_id}-${Date.now()}`,
          simulate_error: simulateError,
          n8n_url: n8nUrl,
          n8n_mode: n8nMode
        })
      });

      const resData = await response.json();

      if (resData.status === 'Duplicate Skipped') {
        showToast(`⚠️ Idempotency Notice: ${resData.message}`, 'error');
      } else if (resData.status === 'Success') {
        if (resData.used_live_n8n) {
          const modeTag = resData.n8n_details?.successful_mode || 'Live';
          showToast(`⚡ Success! Executed via LIVE n8n (${modeTag}) & Dispatched to ${author.email}!`, 'success');
        } else {
          showToast(`ℹ️ Dispatched to ${author.email} (Local Mock Engine: n8n was inactive or offline).`, 'info');
        }
        document.getElementById('author-detail-modal').classList.remove('open');
        loadNotificationLogs();
        // Open preview
        window.previewEmail(resData.log_id || 'latest', resData.email_content, author);
      } else {
        showToast(`❌ Generation Failed: ${resData.error || 'Downstream timeout'}`, 'error');
        loadNotificationLogs();
      }

    } catch (err) {
      showToast(`❌ Webhook Error: ${err.message}`, 'error');
    } finally {
      triggerBtn.classList.remove('loading');
      triggerBtn.disabled = false;
    }
  });

  // Bulk Trigger
  const bulkBtn = document.getElementById('admin-bulk-trigger-btn');
  bulkBtn.addEventListener('click', async () => {
    bulkBtn.disabled = true;
    showToast('🚀 Initiating Bulk Royalty Summaries for all pending authors...', 'info');

    try {
      const res = await fetch(`${ROUTE_PREFIX}/api/admin/bulk-trigger`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Bulk Completed: ${data.processed} author summaries processed & logged!`, 'success');
        loadNotificationLogs();
        loadAdminData();
      }
    } catch (err) {
      showToast(`❌ Bulk trigger failed: ${err.message}`, 'error');
    } finally {
      bulkBtn.disabled = false;
    }
  });

  // Email Preview Modal
  window.previewEmail = async function(logId, directContent = null, author = null) {
    let content = directContent;
    let authorName = author ? author.name : 'Author';
    let authorEmail = author ? author.email : 'author@email.com';

    if (!content) {
      const logsRes = await fetch(`${ROUTE_PREFIX}/api/notification-logs`);
      const logsData = await logsRes.json();
      const match = logsData.logs.find(l => l.log_id === logId);
      if (match) {
        content = match.generated_email_content;
        authorName = match.author_name;
        authorEmail = match.author_email;
      }
    }

    document.getElementById('email-author-sub').textContent = `Recipient: ${authorName} (${authorEmail})`;
    document.getElementById('email-to').textContent = authorEmail;
    document.getElementById('email-subject').textContent = `Your BookLeaf Royalty Summary & Catalog Update — ${authorName}`;
    document.getElementById('email-body-text').textContent = content || 'Email content unavailable.';
    document.getElementById('email-time').textContent = new Date().toLocaleString('en-IN');

    document.getElementById('email-preview-modal').classList.add('open');
  };

  document.getElementById('email-close-btn').addEventListener('click', () => {
    document.getElementById('email-preview-modal').classList.remove('open');
  });
  document.getElementById('email-modal-done-btn').addEventListener('click', () => {
    document.getElementById('email-preview-modal').classList.remove('open');
  });

  // Toast System
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // Filter bindings
  document.getElementById('admin-city-filter').addEventListener('change', loadAdminData);
  document.getElementById('admin-status-filter').addEventListener('change', loadAdminData);
  document.getElementById('admin-search-input').addEventListener('input', () => {
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(loadAdminData, 200);
  });
  document.getElementById('admin-refresh-btn').addEventListener('click', loadAdminData);

  // Initial Load
  loadAuthorData(currentAuthorId);
  loadAdminData();
});
