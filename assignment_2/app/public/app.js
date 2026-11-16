// BookLeaf Publishing - Assignment 2 Interactive Application Logic
document.addEventListener('DOMContentLoaded', () => {
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
      const res = await fetch(`/api/authors/${authorId}`);
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
      const res = await fetch(`/api/authors?city=${encodeURIComponent(city)}&status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`);
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
      const res = await fetch('/api/notification-logs');
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
    const res = await fetch(`/api/authors/${authorId}`);
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
  };

  // Close modal
  document.getElementById('modal-close-btn').addEventListener('click', () => {
    document.getElementById('author-detail-modal').classList.remove('open');
  });
  document.getElementById('modal-cancel-btn').addEventListener('click', () => {
    document.getElementById('author-detail-modal').classList.remove('open');
  });

  // Trigger Royalty Summary via Webhook
  const triggerBtn = document.getElementById('modal-trigger-btn');
  triggerBtn.addEventListener('click', async () => {
    if (!selectedAuthorInModal) return;

    const author = selectedAuthorInModal;
    const simulateError = document.getElementById('simulate-error-toggle').checked;

    triggerBtn.classList.add('loading');
    triggerBtn.disabled = true;

    showToast(`Calling n8n Webhook for ${author.name}...`, 'info');

    try {
      const response = await fetch('/webhook/generate-royalty-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bookleaf-api-key': 'bk_live_7f8a9e2d4c1b'
        },
        body: JSON.stringify({
          author_id: author.author_id,
          trigger_type: 'Manual Single',
          idempotency_key: `${author.author_id}-${Date.now()}`,
          simulate_error: simulateError
        })
      });

      const resData = await response.json();

      if (resData.status === 'Duplicate Skipped') {
        showToast(`⚠️ Idempotency Notice: ${resData.message}`, 'error');
      } else if (resData.status === 'Success') {
        showToast(`✅ Royalty Summary Generated & Sent to ${author.email}!`, 'success');
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
      const res = await fetch('/api/admin/bulk-trigger', { method: 'POST' });
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
      const logsRes = await fetch('/api/notification-logs');
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
