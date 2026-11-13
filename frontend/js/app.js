/**
 * ShelfSense - Smart Library Management System
 * Core Application Controller
 * Pure Vanilla JavaScript (ES6+) for Phase 1 Prototype.
 * Handles client-side state, reactive DOM rendering, mathematical stock consistency,
 * role-based simulation, modal workflows, ShelfSense Smart Assistant,
 * and the Interactive Shelf Map locator.
 */

const app = {
  // Application State
  state: {
    books: [],
    members: [],
    transactions: [],
    categories: [],
    currentRole: 'ADMIN', // 'ADMIN' or 'STUDENT'
    activeStudentId: 'MEM-201', // Default student for demo (Aarav Sharma)
    currentCirculationFilter: 'all-issues',
    assistantOpen: false,
    assistantMessages: [],
    currentFloor: 'Ground Floor',
    selectedRackId: 'CS-01', // Default active rack
    selectedBookId: null,
    memberDetailsRequestId: 0
  },

  /**
   * Initialize application on DOM ready
   */
  init() {
    localStorage.removeItem('shelfsense_prototype_state');
    this.loadState();
    this.bindEvents();
  this.setRole('STUDENT', false);
    this.syncInventoryStock();
    this.refreshOverdueCalculations();
    this.initAssistant();
    this.renderAll();
    this.setupDateInputs();
    this.loadBackendData();
  },
  async loadBackendData() {
    try {
        console.log('Connecting to ShelfSense backend...');

      const booksData = await ShelfSenseAPI.getBooks();

const membersData = ShelfSenseAPI.librarianAuth ? await ShelfSenseAPI.getMembers() : [];
const loansData = ShelfSenseAPI.librarianAuth ? await ShelfSenseAPI.getLoans() : [];


        // Convert backend book records to the frontend format
        this.state.books = booksData.map(book => ({
            id: book.bookCode,
            dbId: book.id,
            title: book.title || '',
            author: book.author || '',
            isbn: book.isbn || '',
            category: book.category || 'General',
            publisher: book.publisher || '',
            year: book.publicationYear || '',
            totalCopies: Number(book.totalCopies || 0),
            availableCopies: Number(book.availableCopies || 0),
            floor: book.floor || null,
            section: book.section || '',
            rackId: book.rackId || null,
            shelfId: book.shelfId || '',
            location: book.location || 'Main Stacks'
        }));

        // Convert backend member records
        this.state.members = membersData.map(member => ({
            id: member.memberCode,
            dbId: member.id,
            name: member.name || '',
            rollNo: member.rollNo || '',
            role: member.role || 'STUDENT',
            department: member.department || '',
            email: member.email || '',
            phone: member.phone || '',
            status: member.status || 'ACTIVE',
            maxAllowedLoans: Number(member.maxAllowedLoans || 3)
        }));

        // Convert backend loan records
        this.state.transactions = loansData.map(loan => ({
            id: loan.loanCode,
            dbId: loan.id,
            bookId: loan.book?.bookCode || '',
            bookTitle: loan.book?.title || 'Unknown Book',
            memberId: loan.member?.memberCode || '',
            memberName: loan.member?.name || 'Unknown Member',
            memberRoll: loan.member?.rollNo || '',
            issueDate: loan.issueDate,
            dueDate: loan.dueDate,
            returnDate: loan.returnDate || null,
            status: loan.status,
            finePerDay: Number(loan.finePerDay || 5),
            calculatedFine: Number(loan.calculatedFine || 0),
            finePaid: Boolean(loan.finePaid)
        }));

        // Preserve existing UI categories and add backend categories
        this.state.categories = [
            ...new Set([
                ...(this.state.categories || []),
                ...this.state.books.map(book => book.category)
            ])
        ];

        // Mark backend as the source of truth
        this.backendConnected = true;

        this.saveState();
        this.renderAll();

        console.log('ShelfSense backend connected successfully!');
        this.showToast('Live database connected successfully!', 'success');

    } catch (error) {
        console.error('Backend connection failed:', error);
        this.showToast(
            'Backend connection failed. Showing saved demo data.',
            'error'
        );
    }
},

  /**
   * Load state from localStorage or initialize with initial mock dataset
   */
  loadState() {
    const saved = localStorage.getItem('shelfsense_prototype_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.state.books = parsed.books || [];
        this.state.members = [];
        this.state.transactions = [];
        this.state.categories = parsed.categories || [];
        this.state.currentRole = 'STUDENT';
        this.state.currentFloor = parsed.currentFloor || 'Ground Floor';
        this.state.selectedRackId = parsed.selectedRackId || 'CS-01';
        this.state.selectedBookId = parsed.selectedBookId || null;

        // Upgrade verification: Ensure books have spatial rackId and floor metadata
        if (this.state.books.length > 0 && !this.state.books[0].rackId) {
          this.resetStateToDefault();
        }
      } catch (e) {
        console.warn('Failed to parse saved state, resetting to initial mock data.');
        this.resetStateToDefault();
      }
    } else {
      this.resetStateToDefault();
    }
  },

  /**
   * Persist current state to localStorage
   */
  saveState() {
    localStorage.setItem('shelfsense_prototype_state', JSON.stringify({
      books: this.state.books,
      categories: this.state.categories,
      currentFloor: this.state.currentFloor,
      selectedRackId: this.state.selectedRackId,
      selectedBookId: this.state.selectedBookId
    }));
  },

  /**
   * Reset data to default mock records
   */
  resetStateToDefault() {
    this.state.books = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA.books));
    this.state.members = [];
    this.state.transactions = [];
    this.state.categories = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA.categories));
    this.state.currentRole = 'STUDENT';
    this.state.currentFloor = 'Ground Floor';
    this.state.selectedRackId = 'CS-01';
    this.state.selectedBookId = 'BK-101';
    this.syncInventoryStock();
    this.refreshOverdueCalculations();
    this.saveState();
  },

  /**
   * Synchronize available book copies with active unreturned loans to guarantee 100% mathematical consistency
   */
  syncInventoryStock() {
    if (this.backendConnected) return;
    const activeLoansByBook = {};
    this.state.transactions.forEach(t => {
      if (t.status !== 'RETURNED') {
        activeLoansByBook[t.bookId] = (activeLoansByBook[t.bookId] || 0) + 1;
      }
    });

    this.state.books.forEach(b => {
      const loaned = activeLoansByBook[b.id] || 0;
      b.availableCopies = Math.max(0, Number(b.totalCopies) - loaned);
    });
  },

  /**
   * Bind event listeners to UI components
   */
  bindEvents() {
    // Navigation items
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) this.switchTab(tab);
      });
    });

    // Mobile sidebar toggle and close button
    const toggleBtn = document.getElementById('btnSidebarToggle');
    const closeBtn = document.getElementById('btnSidebarClose');
    const backdrop = document.getElementById('sidebarBackdrop');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.openMobileSidebar());
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeMobileSidebar());
    }
    if (backdrop) {
      backdrop.addEventListener('click', () => this.closeMobileSidebar());
    }

    // Role switcher buttons
    const adminBtn = document.getElementById('roleAdminBtn');
    const studentBtn = document.getElementById('roleStudentBtn');

    if (adminBtn) adminBtn.addEventListener('click', () => this.loginLibrarian());
    if (studentBtn) studentBtn.addEventListener('click', () => this.logoutLibrarian());

    // Reset data button
    const resetBtn = document.getElementById('btnResetData');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset all library books, members, transactions, and shelf maps back to default demo data?')) {
          this.resetStateToDefault();
          this.setRole('STUDENT', false);
          this.renderAll();
          this.showToast('Demo dataset & Shelf Map refreshed successfully!', 'success');
        }
      });
    }

    // Catalogue search and filters
    const catSearch = document.getElementById('catalogueSearchInput');
    const catFilter = document.getElementById('catalogueCategoryFilter');
    const statusFilter = document.getElementById('catalogueStatusFilter');

    if (catSearch) catSearch.addEventListener('input', () => this.renderCatalogue());
    if (catFilter) catFilter.addEventListener('change', () => this.renderCatalogue());
    if (statusFilter) statusFilter.addEventListener('change', () => this.renderCatalogue());

    // Members search and filters
    const memSearch = document.getElementById('memberSearchInput');
    const memRoleFilter = document.getElementById('memberRoleFilter');

    if (memSearch) memSearch.addEventListener('input', () => this.renderMembers());
    if (memRoleFilter) memRoleFilter.addEventListener('change', () => this.renderMembers());

    // Circulation subtabs
    document.querySelectorAll('.sub-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.currentCirculationFilter = btn.getAttribute('data-subtab');
        this.renderCirculation();
      });
    });

    // Close map search dropdown if user clicks outside
    document.addEventListener('click', (e) => {
      const searchGroup = document.querySelector('.map-search-group');
      const dropdown = document.getElementById('mapSearchDropdown');
      if (searchGroup && dropdown && !searchGroup.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  },

  openMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('show');
  },

  closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('show');
  },

  /**
   * Setup default dates on issue and return modals
   */
  setupDateInputs() {
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const defaultDue = dueDate.toISOString().split('T')[0];

    const issueDateInput = document.getElementById('issueDateInput');
    const dueDateInput = document.getElementById('dueDateInput');
    const returnDateInput = document.getElementById('returnDateInput');

    if (issueDateInput) issueDateInput.value = today;
    if (dueDateInput) dueDateInput.value = defaultDue;
    if (returnDateInput) returnDateInput.value = today;
  },

  /**
   * Switch Active User Role (Admin vs Student)
   */
  async loginLibrarian() {
    if (ShelfSenseAPI.librarianAuth) {
      this.setRole('ADMIN');
      return;
    }

    const existing = document.getElementById('librarianLoginOverlay');
    if (existing) return;

    const overlay = document.createElement('div');
    overlay.id = 'librarianLoginOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.65);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px';

    const dialog = document.createElement('div');
    dialog.style.cssText = 'background:white;color:#172033;padding:30px;border-radius:16px;width:100%;max-width:390px;box-shadow:0 20px 60px rgba(0,0,0,.25)';

    dialog.innerHTML = `
      <h2 style="margin:0 0 8px;font-size:24px">Librarian Login</h2>
      <p style="color:#64748b;margin-bottom:24px">Sign in to manage ShelfServe</p>
      <form id="librarianLoginForm">
        <label for="librarianUsername">Username</label>
        <input id="librarianUsername" autocomplete="username" required
          style="width:100%;padding:12px;margin:8px 0 18px;border:1px solid #cbd5e1;border-radius:8px;box-sizing:border-box">
        <label for="librarianPassword">Password</label>
        <input id="librarianPassword" type="password" autocomplete="current-password" required
          style="width:100%;padding:12px;margin:8px 0 20px;border:1px solid #cbd5e1;border-radius:8px;box-sizing:border-box">
        <p id="librarianLoginError" role="alert" style="color:#dc2626;font-size:13px;display:none"></p>
        <button id="librarianSubmit" type="submit"
          style="width:100%;padding:12px;background:#2563eb;color:white;border:0;border-radius:8px;cursor:pointer">
          Sign In
        </button>
        <button id="librarianCancel" type="button"
          style="width:100%;padding:12px;margin-top:8px;background:transparent;border:0;cursor:pointer">
          Cancel
        </button>
      </form>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const close = () => overlay.remove();

    dialog.querySelector('#librarianCancel').addEventListener('click', close);

    dialog.querySelector('#librarianLoginForm').addEventListener('submit', async (event) => {
      event.preventDefault();

      const username = dialog.querySelector('#librarianUsername').value;
      const passwordInput = dialog.querySelector('#librarianPassword');
      const password = passwordInput.value;
      const submit = dialog.querySelector('#librarianSubmit');
      const errorBox = dialog.querySelector('#librarianLoginError');

      submit.disabled = true;
      submit.textContent = 'Signing in...';
      errorBox.style.display = 'none';

      try {
        ShelfSenseAPI.setLibrarianCredentials(username, password);
        await ShelfSenseAPI.getMembers();

        passwordInput.value = '';
        close();
        this.setRole('ADMIN');
        await this.loadBackendData();
        this.showToast('Librarian login successful', 'success');
      } catch (error) {
        ShelfSenseAPI.clearLibrarianCredentials();
        passwordInput.value = '';
        this.setRole('STUDENT', false);
        console.error("ShelfServe librarian login error:", error);
errorBox.textContent = error.status
  ? `Login failed (HTTP ${error.status}): ${error.message}`
  : `Login failed: ${error.message || "Network or browser error"}`;
        errorBox.style.display = 'block';
      } finally {
        submit.disabled = false;
        submit.textContent = 'Sign In';
      }
    });

    dialog.querySelector('#librarianUsername').focus();
  },
  logoutLibrarian() {
    ShelfSenseAPI.clearLibrarianCredentials();
    this.state.members = [];
    this.state.transactions = [];
    this.backendConnected = false;
    this.setRole('STUDENT', false);
    this.showToast('Switched to Student mode', 'info');
  },
  setRole(role, notify = true) {
    if (role === 'ADMIN' && !ShelfSenseAPI.librarianAuth) {
      this.showToast('Librarian login required', 'error');
      return;
    }
    this.state.currentRole = role;
    const body = document.body;
    const adminBtn = document.getElementById('roleAdminBtn');
    const studentBtn = document.getElementById('roleStudentBtn');
    const avatar = document.getElementById('userAvatar');
    const nameDisplay = document.getElementById('userNameDisplay');
    const roleDisplay = document.getElementById('userRoleDisplay');

    if (role === 'ADMIN') {
      body.classList.remove('role-student');
      body.classList.add('role-admin');
      if (adminBtn) adminBtn.classList.add('active');
      if (studentBtn) studentBtn.classList.remove('active');
      if (avatar) avatar.textContent = 'AD';
      if (nameDisplay) nameDisplay.textContent = 'Dr. Arvind Sharma';
      if (roleDisplay) roleDisplay.textContent = 'Head Librarian';
      this.switchTab('dashboard');
    } else {
      body.classList.remove('role-admin');
      body.classList.add('role-student');
      if (studentBtn) studentBtn.classList.add('active');
      if (adminBtn) adminBtn.classList.remove('active');
      if (avatar) avatar.textContent = 'AS';
      if (nameDisplay) nameDisplay.textContent = 'Aarav Sharma';
      if (roleDisplay) roleDisplay.textContent = 'B.Tech CSE (21BCSE042)';
      this.switchTab('dashboard');
    }

    this.saveState();
    if (notify) {
      this.showToast(`Switched view to ${role === 'ADMIN' ? 'Librarian (Admin)' : 'Student (Member)'}`, 'info');
    }
  },

  /**
   * Navigate between view tabs
   */
  switchTab(tabName, subtab = null) {
    // Hide all views
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

    // Activate selected view
    const targetView = document.getElementById(`view-${tabName}`);
    const navBtn = document.querySelector(`.nav-item[data-tab="${tabName}"]`);

    if (targetView) targetView.classList.add('active');
    if (navBtn) navBtn.classList.add('active');

    // Title mapping
    const isStudent = this.state.currentRole === 'STUDENT';
    const titles = {
      'dashboard': {
        title: isStudent ? 'Student Library Portal' : 'Dashboard Overview',
        sub: isStudent ? 'Personal loan summary, book limits and return deadlines' : 'Centralized control center for institutional library operations'
      },
      'catalogue': {
        title: 'Academic Book Catalogue',
        sub: 'Explore textbooks, reference material, syllabus stacks and real-time availability'
      },
      'shelf-map': {
        title: 'Library Shelf Map',
        sub: 'Interactive spatial floor plan and real-time physical book locator'
      },
      'circulation': {
        title: 'Circulation Desk & Loans',
        sub: 'Check out, return, renew books and track late return penalties'
      },
      'members': {
        title: 'Member Directory',
        sub: 'Manage registered students, faculty library cards and lending quotas'
      },
      'reports': {
        title: 'Audit Reports & Analytics',
        sub: 'Accreditation summaries, stock verification, and fine registers'
      },
      'my-books': {
        title: 'My Borrowed Books',
        sub: 'Personal lending status, return deadlines and penalty slips'
      }
    };

    if (titles[tabName]) {
      const titleElem = document.getElementById('currentPageTitle');
      const subElem = document.getElementById('currentPageSubtitle');
      if (titleElem) titleElem.textContent = titles[tabName].title;
      if (subElem) subElem.textContent = titles[tabName].sub;
    }

    // Handle Circulation subtabs
    if (tabName === 'circulation') {
      const overdueBtn = document.querySelector('.sub-tab[data-subtab="overdue-only"]');
      const allBtn = document.querySelector('.sub-tab[data-subtab="all-issues"]');

      if (subtab === 'overdue') {
        this.state.currentCirculationFilter = 'overdue-only';
        if (allBtn) allBtn.classList.remove('active');
        if (overdueBtn) overdueBtn.classList.add('active');
      } else {
        this.state.currentCirculationFilter = 'all-issues';
        if (overdueBtn) overdueBtn.classList.remove('active');
        if (allBtn) allBtn.classList.add('active');
      }
    }

    // Close mobile sidebar
    this.closeMobileSidebar();

    // Re-render the active view
    if (tabName === 'shelf-map') {
      this.renderShelfMap();
    } else {
      this.renderAll();
    }
  },

  /**
   * Recalculate fines and check for overdue books
   */
  refreshOverdueCalculations() {
    if (this.backendConnected) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.state.transactions.forEach(t => {
      if (t.status !== 'RETURNED') {
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        if (today > dueDate) {
          t.status = 'OVERDUE';
          const diffTime = today - dueDate;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          t.calculatedFine = diffDays * (t.finePerDay || 5);
        } else {
          t.status = 'ISSUED';
          t.calculatedFine = 0;
        }
      }
    });
  },

  /**
   * Render all UI sections
   */
  renderAll() {
    this.refreshOverdueCalculations();
    this.syncInventoryStock();
    this.renderDashboardStats();
    this.renderCatalogue();
    this.renderShelfMap();
    this.renderCirculation();
    this.renderMembers();
    this.renderReports();
    this.renderStudentLoans();
    this.populateSelectDropdowns();
  },

  /**
   * 1. Render Dashboard Statistics & Recent Activity
   */
  renderDashboardStats() {
    const totalTitles = this.state.books.length;
    const totalCopies = this.state.books.reduce((sum, b) => sum + Number(b.totalCopies), 0);
    const availableCopies = this.state.books.reduce((sum, b) => sum + Number(b.availableCopies), 0);
    const issuedCount = this.state.transactions.filter(t => t.status === 'ISSUED' || t.status === 'OVERDUE').length;
    const overdueList = this.state.transactions.filter(t => t.status === 'OVERDUE');
    const overdueCount = overdueList.length;

    // Sum all unpaid fines across all transactions (active overdue + returned unpaid)
    const totalPendingFine = this.state.transactions
      .filter(t => !t.finePaid && Number(t.calculatedFine) > 0)
      .reduce((sum, t) => sum + Number(t.calculatedFine), 0);

    // Update KPI stat elements (Admin)
    const elemTotalBooks = document.getElementById('statTotalBooks');
    const elemTotalCopies = document.getElementById('statTotalCopies');
    const elemAvailableBooks = document.getElementById('statAvailableBooks');
    const elemAvailRate = document.getElementById('statAvailabilityRate');
    const elemIssuedBooks = document.getElementById('statIssuedBooks');
    const elemOverdueBooks = document.getElementById('statOverdueBooks');
    const elemPendingFines = document.getElementById('statPendingFines');

    if (elemTotalBooks) elemTotalBooks.textContent = totalTitles;
    if (elemTotalCopies) elemTotalCopies.textContent = `${totalCopies} copies`;
    if (elemAvailableBooks) elemAvailableBooks.textContent = availableCopies;

    const availRate = totalCopies > 0 ? Math.round((availableCopies / totalCopies) * 100) : 0;
    if (elemAvailRate) elemAvailRate.textContent = `${availRate}% in stock`;
    if (elemIssuedBooks) elemIssuedBooks.textContent = issuedCount;
    if (elemOverdueBooks) elemOverdueBooks.textContent = overdueCount;
    if (elemPendingFines) elemPendingFines.textContent = `₹${totalPendingFine} fine pending`;

    // Overdue Alert Banner (Admin)
    const alertBanner = document.getElementById('overdueAlertBanner');
    const overdueText = document.getElementById('overdueCountText');
    const sidebarBadge = document.getElementById('overdueCountBadge');
    const circBadge = document.getElementById('circulationOverdueBadge');

    if (overdueCount > 0) {
      if (alertBanner) alertBanner.style.display = 'flex';
      if (overdueText) overdueText.textContent = overdueCount;
      if (sidebarBadge) {
        sidebarBadge.textContent = overdueCount;
        sidebarBadge.classList.add('show');
      }
      if (circBadge) circBadge.textContent = overdueCount;
    } else {
      if (alertBanner) alertBanner.style.display = 'none';
      if (sidebarBadge) sidebarBadge.classList.remove('show');
      if (circBadge) circBadge.textContent = '0';
    }

    // Student KPI Stats & Student Overdue Notice
    const studentId = this.state.activeStudentId;
    const student = this.state.members.find(m => m.id === studentId) || { maxAllowedLoans: 3 };
    const studentLoans = this.state.transactions.filter(t => t.memberId === studentId);
    const studentActiveLoans = studentLoans.filter(t => t.status !== 'RETURNED').length;
    const studentOverdueLoans = studentLoans.filter(t => t.status === 'OVERDUE');
    const studentOverdueCount = studentOverdueLoans.length;
    const studentFineDue = studentLoans
      .filter(t => !t.finePaid && Number(t.calculatedFine) > 0)
      .reduce((sum, t) => sum + Number(t.calculatedFine), 0);

    const elemStudentActive = document.getElementById('studentStatActiveLoans');
    const elemStudentQuota = document.getElementById('studentStatQuota');
    const elemStudentOverdue = document.getElementById('studentStatOverdueCount');
    const elemStudentFine = document.getElementById('studentStatPendingFine');
    const elemStudentTitles = document.getElementById('studentStatTotalTitles');
    const studentOverdueBanner = document.getElementById('studentOverdueAlertBanner');
    const studentOverdueText = document.getElementById('studentOverdueCountText');
    const studentBadge = document.getElementById('studentOverdueBadge');

    if (elemStudentActive) elemStudentActive.textContent = studentActiveLoans;
    if (elemStudentQuota) elemStudentQuota.textContent = `of ${student.maxAllowedLoans} allowed`;
    if (elemStudentOverdue) elemStudentOverdue.textContent = studentOverdueCount;
    if (elemStudentFine) elemStudentFine.textContent = `₹${studentFineDue}.00`;
    if (elemStudentTitles) elemStudentTitles.textContent = `${totalTitles} titles`;

    if (studentOverdueCount > 0) {
      if (studentOverdueBanner) studentOverdueBanner.style.display = 'flex';
      if (studentOverdueText) studentOverdueText.textContent = studentOverdueCount;
      if (studentBadge) {
        studentBadge.textContent = studentOverdueCount;
        studentBadge.classList.add('show');
      }
    } else {
      if (studentOverdueBanner) studentOverdueBanner.style.display = 'none';
      if (studentBadge) studentBadge.classList.remove('show');
    }

    // Recent Activity Table (Admin shows all; Student shows personal)
    const recentBody = document.getElementById('dashboardTransactionsBody');
    const isStudent = this.state.currentRole === 'STUDENT';
    const recentHeaderTitle = document.getElementById('recentCirculationHeaderTitle');
    const recentHeaderSub = document.getElementById('recentCirculationHeaderSub');

    if (recentHeaderTitle) {
      recentHeaderTitle.textContent = isStudent ? 'My Recent Borrowings' : 'Recent Circulation Activity';
    }
    if (recentHeaderSub) {
      recentHeaderSub.textContent = isStudent ? 'Log of your recent book borrowings and returns' : 'Real-time institutional circulation log';
    }

    if (recentBody) {
      let transactionsList = isStudent
        ? this.state.transactions.filter(t => t.memberId === studentId)
        : this.state.transactions;

      const recent = [...transactionsList].reverse().slice(0, 5);
      if (recent.length === 0) {
        recentBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No borrowing activity recorded yet.</td></tr>`;
      } else {
        recentBody.innerHTML = recent.map(t => {
          let badgeClass = 'badge-info';
          if (t.status === 'RETURNED') badgeClass = 'badge-success';
          if (t.status === 'OVERDUE') badgeClass = 'badge-danger';

          return `
            <tr>
              <td><strong>#${t.id}</strong></td>
              <td>${t.bookTitle}</td>
              <td>${t.memberName} <span style="font-size: 0.75rem; color: var(--text-muted);">(${t.memberRoll})</span></td>
              <td>${t.issueDate}</td>
              <td>${t.dueDate}</td>
              <td><span class="badge ${badgeClass}">${t.status}</span></td>
            </tr>
          `;
        }).join('');
      }
    }

    // Category Breakdown Bars
    const catList = document.getElementById('categoryBreakdownList');
    if (catList) {
      const catCounts = {};
      this.state.categories.forEach(cat => catCounts[cat] = 0);
      this.state.books.forEach(b => {
        catCounts[b.category] = (catCounts[b.category] || 0) + Number(b.totalCopies);
      });

      catList.innerHTML = this.state.categories.map(cat => {
        const count = catCounts[cat] || 0;
        const pct = totalCopies > 0 ? Math.round((count / totalCopies) * 100) : 0;
        return `
          <div class="cat-item">
            <div class="cat-header">
              <span>${cat}</span>
              <span style="color: var(--text-muted);">${count} copies (${pct}%)</span>
            </div>
            <div class="cat-progress-track">
              <div class="cat-progress-fill" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  },

  /**
   * 2. Render Book Catalogue View
   */
  renderCatalogue() {
    const grid = document.getElementById('catalogueGrid');
    if (!grid) return;

    const searchTerm = (document.getElementById('catalogueSearchInput')?.value || '').toLowerCase().trim();
    const normalizedSearch = searchTerm.replace(/[-\s]/g, '');
    const categoryFilter = document.getElementById('catalogueCategoryFilter')?.value || 'ALL';
    const statusFilter = document.getElementById('catalogueStatusFilter')?.value || 'ALL';

    // Populate category dropdown if needed
    const catSelect = document.getElementById('catalogueCategoryFilter');
    if (catSelect && catSelect.options.length <= 1) {
      this.state.categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        catSelect.appendChild(opt);
      });
    }

    // Filter books
    const filtered = this.state.books.filter(b => {
      const normalizedIsbn = (b.isbn || '').replace(/[-\s]/g, '').toLowerCase();
      const matchSearch = !searchTerm ||
        b.title.toLowerCase().includes(searchTerm) ||
        b.author.toLowerCase().includes(searchTerm) ||
        b.category.toLowerCase().includes(searchTerm) ||
        (b.location && b.location.toLowerCase().includes(searchTerm)) ||
        b.isbn.toLowerCase().includes(searchTerm) ||
        normalizedIsbn.includes(normalizedSearch);

      const matchCategory = categoryFilter === 'ALL' || b.category === categoryFilter;
      const matchStatus = statusFilter === 'ALL' ||
        (statusFilter === 'AVAILABLE' && b.availableCopies > 0) ||
        (statusFilter === 'OUT_OF_STOCK' && b.availableCopies === 0);

      return matchSearch && matchCategory && matchStatus;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: #fff; border-radius: 12px; border: 1px solid var(--border-color);">
          <h4 style="color: var(--text-muted); margin-bottom: 6px;">No books matching your criteria</h4>
          <p style="font-size: 0.85rem; color: var(--text-light);">Try adjusting search keywords or category filters.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(b => {
      const isAvailable = b.availableCopies > 0;
      const stockBadge = isAvailable
        ? `<span class="badge badge-success">${b.availableCopies} of ${b.totalCopies} Available</span>`
        : `<span class="badge badge-danger">Out of Stock</span>`;

      return `
        <div class="book-card">
          <div>
            <div class="book-card-top">
              <span class="book-category-pill">${b.category}</span>
              ${stockBadge}
            </div>
            <h4 class="book-title">${b.title}</h4>
            <p class="book-author">By ${b.author}</p>

            <div class="book-meta-grid">
              <div>
                <span class="meta-field-label">ISBN:</span>
                <span class="meta-field-value">${b.isbn}</span>
              </div>
              <div>
                <span class="meta-field-label">Edition/Year:</span>
                <span class="meta-field-value">${b.year}</span>
              </div>
              <div>
                <span class="meta-field-label">Shelf Location:</span>
                <span class="meta-field-value">${b.location || 'Main Stacks'}</span>
              </div>
              <div>
                <span class="meta-field-label">Total Volumes:</span>
                <span class="meta-field-value">${b.totalCopies} copies</span>
              </div>
            </div>
          </div>

          <div class="book-card-footer">
            <button class="btn-outline-teal" onclick="app.locateBookOnMap('${b.id}')" title="Locate on Floor Map">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
              Find on Shelf
            </button>
            <div class="admin-only">
              <button class="btn-icon-action" title="Edit Book" onclick="app.editBook('${b.id}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="btn-icon-action danger" title="Delete Book" onclick="app.deleteBook('${b.id}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
            <div class="student-only">
              ${isAvailable
                ? `<span style="font-size: 0.8rem; color: var(--success); font-weight: 600;">Available on Shelf</span>`
                : `<span style="font-size: 0.8rem; color: var(--danger); font-weight: 600;">All Copies Borrowed</span>`
              }
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // =========================================================================
  // Interactive Shelf Map Component
  // =========================================================================

  /**
   * Switch Active Floor on Shelf Map
   */
  switchFloor(floorName) {
    this.state.currentFloor = floorName;
    
    // Update floor buttons
    document.querySelectorAll('.floor-pill').forEach(btn => {
      if (btn.getAttribute('data-floor') === floorName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Check if current selected rack belongs to the newly selected floor
    const floorRacks = FLOOR_LAYOUT_DATA[floorName]?.racks || [];
    const rackExists = floorRacks.some(r => r.id === this.state.selectedRackId);
    if (!rackExists) {
      this.state.selectedRackId = floorRacks[0]?.id || null;
    }

    this.saveState();
    this.renderShelfMap();
  },

  /**
   * Render the complete Shelf Map interface
   */
  renderShelfMap() {
    const currentFloor = this.state.currentFloor;
    const floorData = FLOOR_LAYOUT_DATA[currentFloor];
    if (!floorData) return;

    // Titles & Subtitles
    const titleElem = document.getElementById('canvasFloorTitle');
    const subElem = document.getElementById('canvasFloorSubtitle');
    const entranceDisplay = document.getElementById('mapEntranceNameDisplay');

    if (titleElem) titleElem.textContent = `${currentFloor} Top-Down Plan`;
    if (subElem) subElem.textContent = floorData.name;
    if (entranceDisplay) entranceDisplay.textContent = floorData.entrance.name;

    // Render floor plan SVG and details panel
    this.renderFloorMapSvg();
    this.renderRackDetails();
  },

  /**
   * Top-Down Interactive SVG Floor Plan Generator
   */
  renderFloorMapSvg() {
    const wrapper = document.getElementById('floorPlanSvgWrapper');
    if (!wrapper) return;

    const floor = this.state.currentFloor;
    const floorData = FLOOR_LAYOUT_DATA[floor];
    if (!floorData) return;

    let svgHtml = `
      <svg viewBox="0 0 760 600" xmlns="http://www.w3.org/2000/svg" style="background: #FAFCFE; border-radius: 8px;">
        <defs>
          <!-- Subtle Grid Pattern -->
          <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F1F5F9" stroke-width="1"/>
          </pattern>
          <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Background & Building Shell -->
        <rect width="760" height="600" fill="url(#gridPattern)" />
        <rect x="15" y="15" width="730" height="570" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    `;

    // 1. Render Functional Zones
    floorData.zones.forEach(zone => {
      let zoneFill = "rgba(15, 118, 110, 0.03)";
      let zoneStroke = "#CCFBF1";
      if (zone.id.includes("READING") || zone.id.includes("DISCUSSION")) {
        zoneFill = "#FFFBEB";
        zoneStroke = "#FDE68A";
      } else if (zone.id.includes("ENTRANCE")) {
        zoneFill = "#EFF6FF";
        zoneStroke = "#BFDBFE";
      } else if (zone.id.includes("DIGITAL")) {
        zoneFill = "#F0FDF4";
        zoneStroke = "#BBF7D0";
      }

      svgHtml += `
        <g class="svg-map-zone" id="${zone.id}">
          <rect x="${zone.bounds.x}" y="${zone.bounds.y}" width="${zone.bounds.w}" height="${zone.bounds.h}" rx="8" fill="${zoneFill}" stroke="${zoneStroke}" stroke-width="1.5" stroke-dasharray="4 3"/>
          <text x="${zone.bounds.x + 12}" y="${zone.bounds.y + 20}" font-size="10" font-weight="700" fill="#64748B" letter-spacing="0.5">${zone.name.toUpperCase()}</text>
        </g>
      `;
    });

    // 2. Render Aisles & Walkways
    if (floor === "Ground Floor") {
      // Central Promenade
      svgHtml += `
        <g id="AISLES">
          <rect x="252" y="38" width="16" height="420" fill="#F1F5F9" stroke="#E2E8F0" stroke-dasharray="3 3"/>
          <text x="260" y="220" transform="rotate(-90 260 220)" font-size="9" font-weight="700" fill="#94A3B8" letter-spacing="3" text-anchor="middle">CENTRAL PROMENADE</text>
          
          <!-- Cross Aisles -->
          <line x1="30" y1="268" x2="490" y2="268" stroke="#E2E8F0" stroke-dasharray="4 4" stroke-width="1.5"/>
          <text x="240" y="264" font-size="8" fill="#94A3B8" text-anchor="end">WEST-EAST AISLE</text>
        </g>
      `;

      // Study Tables in Reading Zone
      svgHtml += `
        <g id="READING_TABLES" opacity="0.85">
          <rect x="540" y="80" width="75" height="35" rx="4" fill="#FEF3C7" stroke="#FDE68A"/>
          <text x="577" y="102" font-size="9" fill="#92400E" text-anchor="middle">Table 01</text>
          
          <rect x="635" y="80" width="75" height="35" rx="4" fill="#FEF3C7" stroke="#FDE68A"/>
          <text x="672" y="102" font-size="9" fill="#92400E" text-anchor="middle">Table 02</text>
          
          <rect x="540" y="140" width="75" height="35" rx="4" fill="#FEF3C7" stroke="#FDE68A"/>
          <text x="577" y="162" font-size="9" fill="#92400E" text-anchor="middle">Table 03</text>
          
          <rect x="635" y="140" width="75" height="35" rx="4" fill="#FEF3C7" stroke="#FDE68A"/>
          <text x="672" y="162" font-size="9" fill="#92400E" text-anchor="middle">Table 04</text>

          <rect x="540" y="200" width="75" height="35" rx="4" fill="#FEF3C7" stroke="#FDE68A"/>
          <text x="577" y="222" font-size="9" fill="#92400E" text-anchor="middle">Table 05</text>
          
          <rect x="635" y="200" width="75" height="35" rx="4" fill="#FEF3C7" stroke="#FDE68A"/>
          <text x="672" y="222" font-size="9" fill="#92400E" text-anchor="middle">Table 06</text>
        </g>
      `;

      // Circulation Desk
      svgHtml += `
        <g id="RECEPTION_DESK">
          <rect x="270" y="475" width="210" height="42" rx="6" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1.5"/>
          <text x="375" y="501" font-size="10" font-weight="700" fill="#1E40AF" text-anchor="middle">CIRCULATION DESK & CHECKOUT</text>
        </g>
      `;

      // South Entrance Gateway
      svgHtml += `
        <g id="SOUTH_ENTRANCE" class="map-entrance">
          <rect x="315" y="535" width="120" height="38" rx="6" fill="#ECFDF5" stroke="#6EE7B7" stroke-width="1.5"/>
          <circle cx="330" cy="554" r="5" fill="#10B981" />
          <path d="M 370 554 L 385 554 M 380 549 L 385 554 L 380 559" stroke="#065F46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <text x="390" y="557" font-size="10" font-weight="700" fill="#065F46">ENTRY GATE</text>
        </g>
      `;
    } else {
      // 1st Floor Central Access Point (Stairs & Elevator)
      svgHtml += `
        <g id="STAIRS_ELEVATOR">
          <rect x="310" y="480" width="130" height="50" rx="6" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5"/>
          <text x="375" y="504" font-size="10" font-weight="700" fill="#334155" text-anchor="middle">STAIRS & ELEVATOR</text>
          <text x="375" y="518" font-size="8" fill="#64748B" text-anchor="middle">Main Vertical Access</text>
        </g>
      `;

      // Digital Library Workstations
      svgHtml += `
        <g id="DIGITAL_WORKSTATIONS" opacity="0.9">
          <rect x="45" y="70" width="195" height="60" rx="4" fill="#F0FDF4" stroke="#BBF7D0"/>
          <text x="142" y="105" font-size="10" font-weight="600" fill="#166534" text-anchor="middle">15 E-Catalog Terminals (Row A)</text>
          
          <rect x="260" y="70" width="195" height="60" rx="4" fill="#F0FDF4" stroke="#BBF7D0"/>
          <text x="357" y="105" font-size="10" font-weight="600" fill="#166534" text-anchor="middle">15 Research Workstations (Row B)</text>
        </g>
      `;
    }

    // 3. Render Shelf Racks with Interactive Click, Hover & Highlight Pin
    floorData.racks.forEach(r => {
      const isSelected = r.id === this.state.selectedRackId;
      const rackBooks = this.state.books.filter(b => b.rackId === r.id);
      const bookCount = rackBooks.length;

      let rackFill = "#FFFFFF";
      let rackStroke = "#94A3B8";
      let textFill = "#0F172A";

      if (isSelected) {
        rackFill = "#CCFBF1";
        rackStroke = "#0F766E";
        textFill = "#0F766E";
      }

      svgHtml += `
        <g class="svg-map-rack ${isSelected ? 'active' : ''}" data-rack="${r.id}" onclick="app.selectRack('${r.id}')">
          <title>${r.id}: ${r.subject} (${bookCount} book titles)</title>
          
          <!-- Selected Highlight Halo -->
          ${isSelected ? `
            <rect x="${r.x - 4}" y="${r.y - 4}" width="${r.w + 8}" height="${r.h + 8}" rx="8" fill="none" stroke="#0F766E" stroke-width="2.5" stroke-dasharray="4 2" class="map-pin-indicator"/>
          ` : ''}

          <!-- Rack Body -->
          <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="5" fill="${rackFill}" stroke="${rackStroke}" stroke-width="${isSelected ? 2.5 : 1.5}"/>
          
          <!-- Rack Label & Subject count -->
          <text x="${r.x + r.w / 2}" y="${r.y + 19}" text-anchor="middle" font-size="11" font-weight="${isSelected ? '800' : '700'}" fill="${textFill}">${r.id}</text>
          <text x="${r.x + r.w / 2}" y="${r.y + 33}" text-anchor="middle" font-size="8.5" font-weight="500" fill="${isSelected ? '#0F766E' : '#64748B'}">${bookCount} title(s)</text>

          <!-- Animated Pin Drop over Selected Rack -->
          ${isSelected ? `
            <g transform="translate(${r.x + r.w / 2 - 12}, ${r.y - 28})" class="map-pin-indicator">
              <circle cx="12" cy="12" r="10" fill="#0F766E" />
              <path d="M12 4 C7.5 4 4 7.5 4 12 C4 17 12 23 12 23 C12 23 20 17 20 12 C20 7.5 16.5 4 12 4 Z" fill="#123B3A"/>
              <circle cx="12" cy="11" r="3" fill="#FFFFFF"/>
            </g>
          ` : ''}
        </g>
      `;
    });

    svgHtml += `</svg>`;
    wrapper.innerHTML = svgHtml;
  },

  /**
   * Select a rack on the map
   */
  selectRack(rackId) {
    this.state.selectedRackId = rackId;
    this.saveState();
    this.renderFloorMapSvg();
    this.renderRackDetails();
  },

  /**
   * Render Right-Hand Location & Turn-by-Turn Directions Panel
   */
  renderRackDetails() {
    const panel = document.getElementById('rackDetailsPanel');
    if (!panel) return;

    // Check if user is tracking an unassigned digital book
    const trackedBook = this.state.books.find(b => b.id === this.state.selectedBookId);
    if (trackedBook && !trackedBook.rackId) {
      panel.innerHTML = `
        <div class="unassigned-shelf-alert">
          <h5>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            No Physical Shelf Assigned
          </h5>
          <p><strong>"${trackedBook.title}"</strong> is catalogued as an Institutional Digital E-Book / Electronic Resource.</p>
          <p style="font-size: 0.75rem; color: #92400E;">This title has no physical shelf rack in the library stacks. You can access it via the 1st Floor Digital Lab terminals or the institutional web portal.</p>
          <button class="btn btn-sm btn-outline" style="margin-top: 6px; align-self: flex-start;" onclick="app.clearMapSearch()">Browse Stacks Instead</button>
        </div>
      `;
      return;
    }

    const currentFloor = this.state.currentFloor;
    const rackId = this.state.selectedRackId;
    const floorRacks = FLOOR_LAYOUT_DATA[currentFloor]?.racks || [];
    const rack = floorRacks.find(r => r.id === rackId);

    if (!rack) {
      panel.innerHTML = `
        <div class="rack-details-empty">
          <div class="rack-details-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
          </div>
          <h4>Select a Rack on the Floor Plan</h4>
          <p style="font-size: 0.8rem; line-height: 1.4;">Click any shelf rack on the floor plan or search for a title above to inspect shelf positions and walking directions.</p>
        </div>
      `;
      return;
    }

    // Books situated on this rack
    const booksOnRack = this.state.books.filter(b => b.rackId === rack.id);

    // Tracked book details if user came via "Find on Shelf" or search
    let trackedBookHtml = '';
    if (trackedBook && trackedBook.rackId === rack.id) {
      const isAvail = trackedBook.availableCopies > 0;
      trackedBookHtml = `
        <div class="tracked-book-card">
          <span class="tracked-book-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Target Book Located
          </span>
          <div class="tracked-book-title">${trackedBook.title}</div>
          <div class="tracked-book-meta">By ${trackedBook.author} &bull; ${trackedBook.category}</div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px;">
            <span style="font-size: 0.76rem; font-weight: 600; color: var(--primary);">Shelf: ${trackedBook.shelfId || 'Tier 1'}</span>
            ${isAvail
              ? `<span class="badge badge-success">${trackedBook.availableCopies} Copies Available</span>`
              : `<span class="badge badge-danger">Out of Stock</span>`
            }
          </div>
        </div>
      `;
    }

    // List of all books on this rack
    const booksListHtml = booksOnRack.length > 0 ? booksOnRack.map(b => {
      const isTarget = trackedBook && trackedBook.id === b.id;
      const isAvail = b.availableCopies > 0;
      return `
        <div class="rack-book-item ${isTarget ? 'active' : ''}" onclick="app.locateBookOnMap('${b.id}')">
          <div style="min-width: 0;">
            <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${b.title}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${b.shelfId || 'Tier 1'} &bull; ${b.author}</div>
          </div>
          <span class="badge ${isAvail ? 'badge-success' : 'badge-danger'}" style="font-size: 0.68rem; flex-shrink: 0;">
            ${isAvail ? `${b.availableCopies} on shelf` : 'Loaned'}
          </span>
        </div>
      `;
    }).join('') : `<div style="font-size: 0.8rem; color: var(--text-muted); padding: 8px;">No books currently registered to this rack.</div>`;

    panel.innerHTML = `
      <!-- Rack Header Banner -->
      <div class="rack-banner">
        <div>
          <div class="rack-banner-id">Rack ${rack.id}</div>
          <div style="font-size: 0.75rem; opacity: 0.85;">${currentFloor} &bull; ${rack.section}</div>
        </div>
        <span class="rack-banner-section">${booksOnRack.length} Titles</span>
      </div>

      <!-- Target Tracked Book Box -->
      ${trackedBookHtml}

      <!-- Subject & Classification -->
      <div style="font-size: 0.82rem; background: #F8FAFC; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--border-color);">
        <strong style="color: var(--text-main); display: block; font-size: 0.75rem; text-transform: uppercase; margin-bottom: 2px;">Subject Category:</strong>
        <span style="color: var(--text-muted);">${rack.subject}</span>
      </div>

      <!-- Turn-by-Turn Directions from Entrance -->
      <div class="directions-card">
        <div class="directions-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2">
            <path d="M3 12h18"></path>
            <path d="M15 6l6 6-6 6"></path>
          </svg>
          Directions from Library Entrance
        </div>
        <div class="directions-steps">
          ${rack.directions}
        </div>
        <div class="directions-disclaimer">
          * Route generated from institutional spatial layout grid. Not GPS-tracked.
        </div>
      </div>

      <!-- All Titles on this Shelf -->
      <div class="rack-books-container">
        <div class="rack-books-title">Titles on Rack ${rack.id} (${booksOnRack.length}):</div>
        ${booksListHtml}
      </div>
    `;
  },

  /**
   * Navigate directly to Shelf Map and highlight a specific book's rack
   */
  locateBookOnMap(bookId) {
    const book = this.state.books.find(b => b.id === bookId);
    if (!book) return;

    this.state.selectedBookId = book.id;

    // Handle digital/unassigned shelf book
    if (!book.rackId || !book.floor) {
      this.state.selectedRackId = null;
      this.switchTab('shelf-map');
      this.showToast(`"${book.title}" is a digital title without a physical rack.`, 'info');
      this.renderRackDetails();
      return;
    }

    // Switch floor if book is on a different floor
    if (book.floor !== this.state.currentFloor) {
      this.switchFloor(book.floor);
    }

    this.state.selectedRackId = book.rackId;
    this.switchTab('shelf-map');
    this.showToast(`Locating "${book.title}" &rarr; Rack ${book.rackId} (${book.floor})`, 'success');

    this.saveState();
    this.renderShelfMap();
  },

  /**
   * Handle real-time book search on Shelf Map
   */
  handleMapSearch(val) {
    const query = val.trim().toLowerCase();
    const dropdown = document.getElementById('mapSearchDropdown');
    const clearBtn = document.getElementById('btnMapClearSearch');

    if (!dropdown) return;

    if (!query) {
      dropdown.style.display = 'none';
      if (clearBtn) clearBtn.style.display = 'none';
      return;
    }

    if (clearBtn) clearBtn.style.display = 'block';

    const normalizedQuery = query.replace(/[-\s]/g, '');
    const matches = this.state.books.filter(b => {
      const normalizedIsbn = (b.isbn || '').replace(/[-\s]/g, '').toLowerCase();
      return b.title.toLowerCase().includes(query) ||
             b.author.toLowerCase().includes(query) ||
             (b.rackId && b.rackId.toLowerCase().includes(query)) ||
             (b.category && b.category.toLowerCase().includes(query)) ||
             b.isbn.toLowerCase().includes(query) ||
             normalizedIsbn.includes(normalizedQuery);
    });

    if (matches.length === 0) {
      dropdown.innerHTML = `<div class="map-search-empty">No books found matching "${val}".</div>`;
      dropdown.style.display = 'flex';
      return;
    }

    dropdown.innerHTML = matches.map(b => {
      const hasShelf = !!b.rackId;
      return `
        <div class="map-search-item" onclick="app.locateBookOnMap('${b.id}'); document.getElementById('mapSearchDropdown').style.display='none';">
          <div class="map-search-item-info">
            <div class="map-search-title">${b.title}</div>
            <div class="map-search-sub">${b.author} &bull; ${b.category}</div>
          </div>
          <span class="badge ${hasShelf ? 'badge-info' : 'badge-warning'}" style="font-size: 0.7rem; flex-shrink: 0;">
            ${hasShelf ? `Rack ${b.rackId}` : 'Digital / No Shelf'}
          </span>
        </div>
      `;
    }).join('');

    dropdown.style.display = 'flex';
  },

  /**
   * Clear map search input
   */
  clearMapSearch() {
    const input = document.getElementById('mapBookSearchInput');
    const dropdown = document.getElementById('mapSearchDropdown');
    const clearBtn = document.getElementById('btnMapClearSearch');

    if (input) input.value = '';
    if (dropdown) dropdown.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';

    this.state.selectedBookId = null;
    this.renderRackDetails();
  },

  /**
   * 3. Render Circulation Desk (Admin Only)
   */
  renderCirculation() {
    const tableBody = document.getElementById('circulationTableBody');
    if (!tableBody) return;

    const filter = this.state.currentCirculationFilter;
    let list = [...this.state.transactions].reverse();

    const titleElem = document.getElementById('circulationTableTitle');
    if (filter === 'overdue-only') {
      list = list.filter(t => t.status === 'OVERDUE');
      if (titleElem) titleElem.textContent = 'Overdue Book Loans & Defaulters';
    } else {
      if (titleElem) titleElem.textContent = 'Active Library Circulations';
    }

    if (list.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 32px;">
            No ${filter === 'overdue-only' ? 'overdue defaulter records found.' : 'circulation records found.'}
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = list.map(t => {
      let badgeClass = 'badge-info';
      if (t.status === 'RETURNED') badgeClass = 'badge-success';
      if (t.status === 'OVERDUE') badgeClass = 'badge-danger';

      const fineDisplay = Number(t.calculatedFine) > 0
        ? `<strong class="text-danger">₹${t.calculatedFine}</strong> ${t.finePaid ? '<span class="badge badge-success" style="font-size: 0.65rem;">Paid</span>' : '<span class="badge badge-danger" style="font-size: 0.65rem;">Unpaid</span>'}`
        : '<span style="color: var(--text-muted);">Nil</span>';

      const isCompleted = t.status === 'RETURNED';

      return `
        <tr>
          <td><strong>#${t.id}</strong></td>
          <td>
            <div style="font-weight: 600; color: var(--text-main);">${t.bookTitle}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Book ID: ${t.bookId}</div>
          </td>
          <td>
            <div style="font-weight: 600;">${t.memberName}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${t.memberRoll}</div>
          </td>
          <td>${t.issueDate}</td>
          <td>${t.dueDate}</td>
          <td>${t.returnDate || '<span style="color: var(--text-muted);">Pending</span>'}</td>
          <td>${fineDisplay}</td>
          <td><span class="badge ${badgeClass}">${t.status}</span></td>
          <td>
            ${!isCompleted ? `
              <button class="btn btn-sm btn-primary" onclick="app.openReturnModal('${t.id}')">Return</button>
              <button class="btn btn-sm btn-secondary" onclick="app.renewBook('${t.id}')">Renew</button>
            ` : `
              <span style="font-size: 0.75rem; color: var(--text-muted);">Returned & Archived</span>
            `}
          </td>
        </tr>
      `;
    }).join('');
  },

  /**
   * 4. Render Members Directory
   */
  renderMembers() {
    const tableBody = document.getElementById('membersTableBody');
    if (!tableBody) return;

    const searchTerm = (document.getElementById('memberSearchInput')?.value || '').toLowerCase().trim();
    const roleFilter = document.getElementById('memberRoleFilter')?.value || 'ALL';

    const filtered = this.state.members.filter(m => {
      const matchSearch = !searchTerm ||
        m.name.toLowerCase().includes(searchTerm) ||
        m.rollNo.toLowerCase().includes(searchTerm) ||
        m.email.toLowerCase().includes(searchTerm) ||
        m.department.toLowerCase().includes(searchTerm);

      const matchRole = roleFilter === 'ALL' || m.role === roleFilter;
      return matchSearch && matchRole;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">No members found matching your search.</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered.map(m => {
      // Calculate active borrowings count for member
      const activeLoans = this.state.transactions.filter(
        t => t.memberId === m.id && t.status !== 'RETURNED'
      ).length;

      return `
        <tr>
          <td><strong>${m.id}</strong></td>
          <td>
            <div style="font-weight: 600;">${m.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">ID: ${m.rollNo}</div>
          </td>
          <td>
            <div>${m.department}</div>
            <span class="badge badge-info" style="font-size: 0.7rem; margin-top: 2px;">${m.role}</span>
          </td>
          <td>
            <div>${m.email}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${m.phone || 'N/A'}</div>
          </td>
          <td>
            <strong>${activeLoans} / ${m.maxAllowedLoans}</strong>
            <span style="font-size: 0.75rem; color: var(--text-muted);"> borrowed</span>
          </td>
          <td><span class="badge ${m.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}">${m.status}</span></td>
          <td>
    <button class="btn btn-sm btn-secondary"
        onclick="app.viewMember('${m.id}')">
        View
    </button>

    <button class="btn btn-sm btn-primary"
        onclick="app.editMember('${m.id}')">
        Edit
    </button>

    <button class="btn btn-sm btn-secondary"
        onclick="app.changeMemberStatus('${m.id}')">
        ${m.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
    </button>

    <button class="btn btn-sm btn-danger"
        onclick="app.deleteMember('${m.id}')">
        Delete
    </button>
</td>
        </tr>
      `;
    }).join('');
  },

  async viewMember(memberCode) {
    const selectedMember = this.state.members.find(
      member => String(member.id) === String(memberCode)
    );
    if (!selectedMember) {
      this.showToast('Member not found.', 'error');
      return;
    }

    const requestId = ++this.state.memberDetailsRequestId;
    const modal = document.getElementById('modalViewMember');
    const message = document.getElementById('memberDetailsMessage');
    const content = document.getElementById('memberDetailsContent');
    if (!modal || !message || !content) {
      console.error('Member details modal elements are missing.');
      this.showToast('Member details could not be displayed.', 'error');
      return;
    }

    modal.classList.add('show');
    message.textContent = 'Loading member details...';
    message.hidden = false;
    content.hidden = true;

    if (!selectedMember.dbId) {
      message.textContent = 'This member is not linked to a database record. Reconnect to the library database and try again.';
      return;
    }

    try {
      const [member, loans] = await Promise.all([
        ShelfSenseAPI.getMember(selectedMember.dbId),
        ShelfSenseAPI.getMemberLoans(selectedMember.dbId)
      ]);

      if (requestId !== this.state.memberDetailsRequestId) return;
      if (
        String(member.id) !== String(selectedMember.dbId) ||
        String(member.memberCode) !== String(selectedMember.id)
      ) {
        throw new Error('The returned member record did not match the selected member.');
      }

      this.renderMemberDetails(member, Array.isArray(loans) ? loans : []);
      message.hidden = true;
      content.hidden = false;
    } catch (error) {
      if (requestId !== this.state.memberDetailsRequestId) return;
      console.error('Member details request failed:', error);
      message.textContent = `Could not load member details. ${error.message || 'Please try again.'}`;
      message.hidden = false;
      content.hidden = true;
    }
  },

  renderMemberDetails(member, loans) {
    const values = {
      viewMemberCode: member.memberCode,
      viewMemberName: member.name,
      viewMemberRollNo: member.rollNo,
      viewMemberRole: member.role,
      viewMemberDepartment: member.department,
      viewMemberEmail: member.email,
      viewMemberPhone: member.phone,
      viewMemberRegistrationDate: member.registrationDate,
      viewMemberStatus: member.status,
      viewMemberMaxLoans: member.maxAllowedLoans
    };

    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value == null || value === '' ? 'Not recorded' : value;
    });

    const memberLoans = loans.filter(
      loan => String(loan.member?.id) === String(member.id)
    );
    const activeLoans = memberLoans.filter(loan => loan.status !== 'RETURNED').length;
    const activeLoansElement = document.getElementById('viewMemberActiveLoans');
    if (activeLoansElement) activeLoansElement.textContent = String(activeLoans);

    const tableBody = document.getElementById('memberLoansTableBody');
    if (!tableBody) return;
    tableBody.replaceChildren();

    if (memberLoans.length === 0) {
      const row = tableBody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 6;
      cell.textContent = 'No borrowing records found.';
      return;
    }

    memberLoans.forEach(loan => {
      const row = tableBody.insertRow();
      [
        loan.book?.title || loan.book?.bookCode,
        loan.loanCode,
        loan.issueDate,
        loan.dueDate,
        loan.returnDate,
        loan.status
      ].forEach(value => {
        const cell = row.insertCell();
        cell.textContent = value == null || value === '' ? 'Not recorded' : String(value);
      });
    });
  },

  /**
   * 5. Render Institutional Reports
   */
  renderReports() {
    const totalTitles = this.state.books.length;
    const totalCopies = this.state.books.reduce((sum, b) => sum + Number(b.totalCopies), 0);
    const availableCopies = this.state.books.reduce((sum, b) => sum + Number(b.availableCopies), 0);
    const totalTransactions = this.state.transactions.length;
    const activeLoans = this.state.transactions.filter(t => t.status !== 'RETURNED').length;
    const returnedLoans = this.state.transactions.filter(t => t.status === 'RETURNED').length;
    const overdueLoans = this.state.transactions.filter(t => t.status === 'OVERDUE').length;

    const totalFinesAssessed = this.state.transactions.reduce((sum, t) => sum + Number(t.calculatedFine || 0), 0);
    const totalFinesPaid = this.state.transactions.reduce((sum, t) => sum + (t.finePaid ? Number(t.calculatedFine || 0) : 0), 0);
    const pendingFines = totalFinesAssessed - totalFinesPaid;

    const invElem = document.getElementById('reportInventorySummary');
    if (invElem) {
      invElem.innerHTML = `
        <div class="report-stat-row"><span>Total Unique Titles</span><strong>${totalTitles}</strong></div>
        <div class="report-stat-row"><span>Total Physical Volumes</span><strong>${totalCopies} copies</strong></div>
        <div class="report-stat-row"><span>Copies on Stacks</span><strong>${availableCopies} copies</strong></div>
        <div class="report-stat-row"><span>Stock Utilization</span><strong>${totalCopies > 0 ? Math.round(((totalCopies - availableCopies) / totalCopies) * 100) : 0}%</strong></div>
      `;
    }

    const circElem = document.getElementById('reportCirculationSummary');
    if (circElem) {
      circElem.innerHTML = `
        <div class="report-stat-row"><span>Lifetime Transactions</span><strong>${totalTransactions}</strong></div>
        <div class="report-stat-row"><span>Currently Active Loans</span><strong>${activeLoans}</strong></div>
        <div class="report-stat-row"><span>Successfully Returned</span><strong>${returnedLoans}</strong></div>
        <div class="report-stat-row"><span>Current Overdue Loans</span><strong class="text-danger">${overdueLoans}</strong></div>
      `;
    }

    const fineElem = document.getElementById('reportFineSummary');
    if (fineElem) {
      fineElem.innerHTML = `
        <div class="report-stat-row"><span>Total Penalty Assessed</span><strong>₹${totalFinesAssessed}.00</strong></div>
        <div class="report-stat-row"><span>Penalties Collected</span><strong class="text-success">₹${totalFinesPaid}.00</strong></div>
        <div class="report-stat-row"><span>Defaulter Dues Outstanding</span><strong class="text-danger">₹${pendingFines}.00</strong></div>
        <div class="report-stat-row"><span>Late Fine Rate</span><strong>₹5.00 / day</strong></div>
      `;
    }
  },

  /**
   * 6. Render Student Account View (My Borrowed Books)
   */
  renderStudentLoans() {
    const tableBody = document.getElementById('studentLoansTableBody');
    if (!tableBody) return;

    const studentId = this.state.activeStudentId;
    const studentLoans = this.state.transactions.filter(t => t.memberId === studentId);

    if (studentLoans.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">You currently have no active or previous book loans.</td></tr>`;
      return;
    }

    tableBody.innerHTML = studentLoans.map(t => {
      const book = this.state.books.find(b => b.id === t.bookId) || { author: 'Library Stack' };
      let badgeClass = 'badge-info';
      if (t.status === 'RETURNED') badgeClass = 'badge-success';
      if (t.status === 'OVERDUE') badgeClass = 'badge-danger';

      return `
        <tr>
          <td><strong>#${t.id}</strong></td>
          <td><strong>${t.bookTitle}</strong></td>
          <td>${book.author}</td>
          <td>${t.issueDate}</td>
          <td>${t.dueDate}</td>
          <td>
            ${Number(t.calculatedFine) > 0
              ? `<span class="badge badge-danger">Due ₹${t.calculatedFine}</span>`
              : `<span class="badge badge-success">No Fine</span>`
            }
          </td>
          <td><span class="badge ${badgeClass}">${t.status}</span></td>
        </tr>
      `;
    }).join('');
  },

  /**
   * Populate modal select dropdowns dynamically
   */
  populateSelectDropdowns() {
    // Populate Issue Book Modal Members
    const memSelect = document.getElementById('issueMemberSelect');
    if (memSelect) {
      memSelect.innerHTML = `<option value="">-- Choose Member --</option>` +
        this.state.members.filter(m => m.status === 'ACTIVE').map(m => `
          <option value="${m.id}">${m.name} (${m.rollNo} - ${m.role})</option>
        `).join('');
    }

    // Populate Issue Book Modal Available Books
    const bookSelect = document.getElementById('issueBookSelect');
    if (bookSelect) {
      const available = this.state.books.filter(b => b.availableCopies > 0);
      bookSelect.innerHTML = `<option value="">-- Choose Available Book --</option>` +
        available.map(b => `
          <option value="${b.id}">${b.title} [${b.availableCopies} available on shelf]</option>
        `).join('');
    }
  },

  /**
   * Modal Management Helpers
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);

    if (modal) {
        modal.classList.add('show');

        if (modalId === 'modalAddBook') {
            const titleElem = document.getElementById('modalBookTitle');
            const formElem = document.getElementById('formAddBook');
            const idElem = document.getElementById('bookFormId');

            if (titleElem) titleElem.textContent = 'Add New Book to Catalogue';
            if (formElem) formElem.reset();
            if (idElem) idElem.value = '';

        } else if (modalId === 'modalAddMember') {
            const form = document.getElementById('formAddMember');
            const title = document.getElementById('modalMemberTitle');
            const button = document.getElementById('memberSubmitBtn');
            const id = document.getElementById('memberFormId');

            if (form) form.reset();
            if (id) id.value = '';
            if (title) title.textContent = 'Register New Institutional Member';
            if (button) button.textContent = 'Register Member';

        } else if (modalId === 'modalIssueBook') {
            this.populateSelectDropdowns();
            this.setupDateInputs();
        }
    }
},
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
    if (modalId === 'modalViewMember') {
      this.state.memberDetailsRequestId++;
    }
  },

   /**
   * Save / Add New Book or Update Existing Book
   */
  async Book(e) {
    e.preventDefault();

    const id = document.getElementById('bookFormId').value;
    const title = document.getElementById('bookTitleInput').value.trim();
    const isbn = document.getElementById('bookIsbnInput').value.trim();
    const author = document.getElementById('bookAuthorInput').value.trim();
    const category = document.getElementById('bookCategoryInput').value;
    const publisher = document.getElementById('bookPublisherInput').value.trim();
    const year = Number(document.getElementById('bookYearInput').value) || 2024;
    const totalCopies = Number(document.getElementById('bookCopiesInput').value) || 1;
    const location = document.getElementById('bookLocationInput').value.trim()
      || 'Ground Floor - Main Stacks - Rack CS-01';

    if (!title || !author || !isbn || !category) {
      this.showToast('Please complete all required book fields.', 'error');
      return;
    }

    const existingBook = id
      ? this.state.books.find(b => b.id === id)
      : null;

    if (id && !existingBook) {
      this.showToast('Book not found.', 'error');
      return;
    }

    const currentlyIssued = existingBook
      ? Number(existingBook.totalCopies) - Number(existingBook.availableCopies)
      : 0;

    if (totalCopies < 1 || totalCopies < currentlyIssued) {
      this.showToast('Total copies cannot be less than copies currently issued.', 'error');
      return;
    }

    const maxIdNum = Math.max(
      100,
      ...this.state.books.map(b => parseInt(b.id.replace(/\D/g, '')) || 0)
    );

    const bookData = {
      bookCode: existingBook ? existingBook.id : `BK-${maxIdNum + 1}`,
      title,
      author,
      isbn,
      category,
      publisher,
      publicationYear: year,
      totalCopies,
      availableCopies: totalCopies - currentlyIssued,
      floor: existingBook?.floor || 'Ground Floor',
      section: existingBook?.section || category,
      rackId: existingBook?.rackId ||
        (category.includes('Math') ? 'MATH-01' :
         category.includes('Physics') ? 'PHY-01' : 'CS-01'),
      shelfId: existingBook?.shelfId || 'Tier 1, Shelf A',
      location
    };

    try {
      if (existingBook) {
        await ShelfSenseAPI.updateBook(existingBook.dbId, bookData);
      } else {
        await ShelfSenseAPI.createBook(bookData);
      }

      await this.loadBackendData();

      this.closeModal('modalAddBook');
      document.getElementById('formAddBook').reset();

      this.showToast(
        existingBook
          ? `Updated "${title}" successfully.`
          : `Added "${title}" successfully.`,
        'success'
      );

    } catch (error) {
      console.error('Book save failed:', error);
      this.showToast(error.message || 'Could not save book.', 'error');
    }
  },

  /**
   * Edit Book
   */
  editBook(bookId) {
    const book = this.state.books.find(b => b.id === bookId);
    if (!book) return;

    document.getElementById('bookFormId').value = book.id;
    document.getElementById('bookTitleInput').value = book.title;
    document.getElementById('bookIsbnInput').value = book.isbn;
    document.getElementById('bookAuthorInput').value = book.author;
    document.getElementById('bookCategoryInput').value = book.category;
    document.getElementById('bookPublisherInput').value = book.publisher || '';
    document.getElementById('bookYearInput').value = book.year;
    document.getElementById('bookCopiesInput').value = book.totalCopies;
    document.getElementById('bookLocationInput').value = book.location || '';

    const titleElem = document.getElementById('modalBookTitle');
    if (titleElem) titleElem.textContent = `Edit Book (${book.id})`;
    document.getElementById('modalAddBook').classList.add('show');
  },

   /**
   * Delete Book
   */
  async deleteBook(bookId) {
    const book = this.state.books.find(b => b.id === bookId);

    if (!book) {
      this.showToast('Book not found.', 'error');
      return;
    }

    if (Number(book.availableCopies) < Number(book.totalCopies)) {
      this.showToast(
        `Cannot delete "${book.title}" because copies are currently issued.`,
        'error'
      );
      return;
    }

    if (!confirm(`Are you sure you want to remove "${book.title}"?`)) {
      return;
    }

    try {
      await ShelfSenseAPI.deleteBook(book.dbId);
      await this.loadBackendData();

      this.showToast(
        `Removed "${book.title}" from the database.`,
        'success'
      );
    } catch (error) {
      console.error('Book deletion failed:', error);
      this.showToast(error.message || 'Could not delete book.', 'error');
    }
  },
 
  /**
   * Issue Book to Member
   */
  async handleIssueBook(e) {
      e.preventDefault();

      const memberId = document.getElementById('issueMemberSelect').value;
      const bookId = document.getElementById('issueBookSelect').value;
      const issueDate = document.getElementById('issueDateInput').value;
      const dueDate = document.getElementById('dueDateInput').value;

      const member = this.state.members.find(m => m.id === memberId);
      const book = this.state.books.find(b => b.id === bookId);

      if (!member || !book) {
          this.showToast('Please select both a valid member and a book.', 'error');
          return;
      }

      if (member.status !== 'ACTIVE') {
          this.showToast('This member is inactive. Reactivate them before issuing a book.', 'error');
          return;
      }

      if (book.availableCopies <= 0) {
          this.showToast('No copies available on shelf for this title.', 'error');
          return;
      }

      const currentMemberLoans = this.state.transactions.filter(
          t => t.memberId === memberId && t.status !== 'RETURNED'
      ).length;

      if (currentMemberLoans >= member.maxAllowedLoans) {
          this.showToast('Member borrowing limit reached.', 'error');
          return;
      }

      try {
          await ShelfSenseAPI.issueBook({
              bookId: book.dbId,
              memberId: member.dbId,
              issueDate,
              dueDate
          });

          await this.loadBackendData();

          this.closeModal('modalIssueBook');
          this.showToast(`Issued "${book.title}" to ${member.name}`, 'success');

      } catch (error) {
          console.error('Issue book failed:', error);
          this.showToast(error.message || 'Could not issue book.', 'error');
      }
  },

  /**
   * Open Return Book Modal
   */
  openReturnModal(txId) {
      const tx = this.state.transactions.find(t => t.id === txId);
      if (!tx) return;

      document.getElementById('returnTransactionId').value = tx.id;
      document.getElementById('returnDateInput').value =
          new Date().toISOString().split('T')[0];

      const summaryCard = document.getElementById('returnSummaryCard');

      if (summaryCard) {
          summaryCard.innerHTML = `
              <div><strong>Loan Reference:</strong> #${tx.id}</div>
              <div><strong>Book Title:</strong> ${tx.bookTitle}</div>
              <div><strong>Borrower:</strong> ${tx.memberName} (${tx.memberRoll})</div>
              <div><strong>Issue Date:</strong> ${tx.issueDate} | <strong>Due Date:</strong> ${tx.dueDate}</div>
          `;
      }

      this.recalculateReturnFine();
      document.getElementById('modalReturnBook').classList.add('show');
  },

  /**
   * Calculate Return Fine
   */
  recalculateReturnFine() {
      const txId = document.getElementById('returnTransactionId').value;
      const tx = this.state.transactions.find(t => t.id === txId);
      if (!tx) return;

      const returnDate = new Date(document.getElementById('returnDateInput').value);
      const dueDate = new Date(tx.dueDate);

      returnDate.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);

      let fine = 0;
      let diffDays = 0;

      if (returnDate > dueDate) {
          diffDays = Math.ceil((returnDate - dueDate) / 86400000);
          fine = diffDays * (tx.finePerDay || 5);
      }

      const fineBox = document.getElementById('returnFineBox');
      const fineAmount = document.getElementById('returnFineAmount');
      const fineSubtext = document.getElementById('returnFineSubtext');
      const settlementGroup = document.getElementById('fineSettlementGroup');

      if (fineBox) fineBox.classList.toggle('zero-fine', fine === 0);
      if (fineAmount) fineAmount.textContent = `₹${fine}.00`;

      if (fineSubtext) {
          fineSubtext.textContent = fine > 0
              ? `Overdue by ${diffDays} day(s) at ₹${tx.finePerDay || 5}/day`
              : 'On-time return. No overdue penalty assessed.';
      }

      if (settlementGroup) {
          settlementGroup.style.display = fine > 0 ? 'block' : 'none';
      }
  },

  /**
   * Confirm Book Return
   */
  async handleConfirmReturn(e) {
      e.preventDefault();

      const txId = document.getElementById('returnTransactionId').value;
      const tx = this.state.transactions.find(t => t.id === txId);
      if (!tx) return;

      const returnDateVal = document.getElementById('returnDateInput').value;
      const checkbox = document.getElementById('fineCollectedCheckbox');
      const fineCollected = checkbox ? checkbox.checked : true;

      try {
          await ShelfSenseAPI.returnBook(tx.dbId, {
              returnDate: returnDateVal,
              fineCollected
          });

          await this.loadBackendData();

          this.closeModal('modalReturnBook');
          this.showToast('Book return processed successfully.', 'success');

      } catch (error) {
          console.error('Return failed:', error);
          this.showToast(error.message || 'Could not process return.', 'error');
      }
  },

  /**
   * Renew Book Loan
   */
  async renewBook(txId) {
      const tx = this.state.transactions.find(t => t.id === txId);
      if (!tx) return;

      if (tx.status === 'OVERDUE') {
          this.showToast('Cannot renew an overdue loan.', 'error');
          return;
      }

      try {
          await ShelfSenseAPI.renewBook(tx.dbId);
          await this.loadBackendData();

          this.showToast('Loan renewed successfully.', 'success');

      } catch (error) {
          console.error('Renewal failed:', error);
          this.showToast(error.message || 'Could not renew loan.', 'error');
      }
  },


  /**
 * Add or Update Member
 */
async handleSaveMember(e) {
    e.preventDefault();

    const name = document.getElementById('memberNameInput').value.trim();
    const role = document.getElementById('memberRoleSelect').value;
    const rollNo = document.getElementById('memberRollInput').value.trim();
    const department = document.getElementById('memberDeptInput').value.trim();
    const email = document.getElementById('memberEmailInput').value.trim();
    const phone = document.getElementById('memberPhoneInput').value.trim();

    const formId = document.getElementById('memberFormId').value;
    const editingMember = formId
        ? this.state.members.find(m => String(m.dbId) === String(formId))
        : null;

    if (!name || !rollNo || !department || !email) {
        this.showToast('Please complete all required fields.', 'error');
        return;
    }

    const duplicate = this.state.members.some(m =>
        m.rollNo.toLowerCase() === rollNo.toLowerCase() &&
        (!editingMember || m.dbId !== editingMember.dbId)
    );

    if (duplicate) {
        this.showToast(`Roll/Staff ID "${rollNo}" already exists.`, 'error');
        return;
    }

    const duplicateEmail = this.state.members.some(m =>
        m.email.toLowerCase() === email.toLowerCase() &&
        (!editingMember || m.dbId !== editingMember.dbId)
    );

    if (duplicateEmail) {
        this.showToast('This email is already registered.', 'error');
        return;
    }

    const maxMemberNumber = Math.max(
        200,
        ...this.state.members.map(m =>
            parseInt(String(m.id).replace(/\D/g, '')) || 0
        )
    );

    const memberData = {
        memberCode: editingMember ? editingMember.id : `MEM-${maxMemberNumber + 1}`,
        name,
        rollNo,
        role,
        department,
        email,
        phone,
        status: editingMember ? editingMember.status : 'ACTIVE',
        maxAllowedLoans: editingMember
            ? editingMember.maxAllowedLoans
            : (role === 'FACULTY' ? 6 : 3)
    };

    try {
        if (editingMember) {
            await ShelfSenseAPI.updateMember(editingMember.dbId, memberData);
        } else {
            await ShelfSenseAPI.createMember(memberData);
        }

        await this.loadBackendData();

        this.closeModal('modalAddMember');
        document.getElementById('formAddMember').reset();

        this.showToast(
            editingMember
                ? `Updated member: ${name}`
                : `Registered new member: ${name}`,
            'success'
        );
    } catch (error) {
        console.error('Member save failed:', error);
        this.showToast(error.message || 'Could not save member.', 'error');
    }
},

/**
 * Toast Notification Dispatcher
 */
showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');

    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText =
            'position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText =
        `padding:12px 18px;border-radius:8px;color:white;background:${
            type === 'error' ? '#dc3545' :
            type === 'success' ? '#198754' : '#334155'
        };box-shadow:0 4px 12px rgba(0,0,0,.2);max-width:360px;`;

    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3500);
},
/**
 * Edit Existing Member
 */
editMember(memberCode) {
    const member = this.state.members.find(
        m => String(m.id) === String(memberCode)
    );

    if (!member) {
        this.showToast('Member not found.', 'error');
        return;
    }

    const fields = {
        memberFormId: member.dbId,
        memberNameInput: member.name,
        memberRoleSelect: member.role,
        memberRollInput: member.rollNo,
        memberDeptInput: member.department,
        memberEmailInput: member.email,
        memberPhoneInput: member.phone || ''
    };

    for (const [id, value] of Object.entries(fields)) {
        const element = document.getElementById(id);

        if (!element) {
            console.error(`ShelfSense: HTML element #${id} not found.`);
            this.showToast(`Missing HTML element: ${id}`, 'error');
            return;
        }

        element.value = value;
    }

    const title = document.getElementById('modalMemberTitle');
    const button = document.getElementById('memberSubmitBtn');
    const modal = document.getElementById('modalAddMember');

    if (!title || !button || !modal) {
        console.error('Member modal elements are missing.');
        this.showToast('Member edit modal could not open.', 'error');
        return;
    }

    title.textContent = 'Edit Member';
    button.textContent = 'Save Changes';
    modal.classList.add('show');
},

/**
 * Delete Existing Member
 */
async deleteMember(memberCode) {
    const member = this.state.members.find(m => m.id === memberCode);

    if (!member) {
        this.showToast('Member not found.', 'error');
        return;
    }

    if (!confirm(`Are you sure you want to delete ${member.name}?`)) {
        return;
    }

    try {
        await ShelfSenseAPI.deleteMember(member.dbId);
        await this.loadBackendData();

        this.showToast(`Deleted member: ${member.name}`, 'success');

    } catch (error) {
        if (error.status === 409) {
            this.showToast(
                error.message || 'This member has loan records and cannot be deleted.',
                'error'
            );
            return;
        }

        console.error('Member deletion failed:', error);
        this.showToast(error.message || 'Could not delete member.', 'error');
    }
},

async changeMemberStatus(memberCode) {
    const member = this.state.members.find(m => m.id === memberCode);
    if (!member) {
        this.showToast('Member not found.', 'error');
        return;
    }

    const isActive = member.status === 'ACTIVE';
    const action = isActive ? 'deactivate' : 'reactivate';
    const updatedStatus = isActive ? 'inactive' : 'active';
    if (!confirm(`Are you sure you want to ${action} ${member.name}?`)) {
        return;
    }

    try {
        const updateStatus = isActive
            ? ShelfSenseAPI.deactivateMember
            : ShelfSenseAPI.reactivateMember;
        await updateStatus.call(ShelfSenseAPI, member.dbId);
        await this.loadBackendData();
        this.showToast(`${member.name} is now ${updatedStatus}.`, 'success');
    } catch (error) {
        console.error(`Member ${action} failed:`, error);
        this.showToast(error.message || `Could not ${action} member.`, 'error');
    }
},

  // =========================================================================
  // ShelfSense Smart Assistant Engine
  // =========================================================================

  /**
   * Initialize Assistant with greeting
   */
  initAssistant() {
    this.state.assistantMessages = [
      {
        sender: 'bot',
        text: '👋 Hello! I am the **ShelfSense Assistant**, your smart academic library guide.\n\nI can help you locate textbooks on our **Shelf Map**, verify real-time availability, check borrowing quotas, or calculate overdue fines. What would you like to explore?',
        time: 'Just now'
      }
    ];
    this.renderAssistantMessages();
  },

  /**
   * Toggle Assistant Chat Window
   */
  toggleAssistant() {
    const card = document.getElementById('assistantCard');
    if (!card) return;

    this.state.assistantOpen = !this.state.assistantOpen;
    if (this.state.assistantOpen) {
      card.classList.add('show');
      const input = document.getElementById('assistantInput');
      if (input) setTimeout(() => input.focus(), 200);
    } else {
      card.classList.remove('show');
    }
  },

  /**
   * Render chat history in assistant drawer
   */
  renderAssistantMessages() {
    const body = document.getElementById('assistantMessages');
    if (!body) return;

    body.innerHTML = this.state.assistantMessages.map(m => {
      // Basic markdown bold/link parsing
      const formatted = m.text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>');

      return `
        <div class="assistant-msg ${m.sender}">
          <div class="assistant-bubble">${formatted}</div>
          <span class="assistant-time">${m.time}</span>
        </div>
      `;
    }).join('');

    body.scrollTop = body.scrollHeight;
  },

  /**
   * Handle user quick chip click
   */
  sendAssistantChip(chipText) {
    this.processAssistantQuery(chipText);
  },

  /**
   * Handle assistant form submit
   */
  handleAssistantSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('assistantInput');
    if (!input) return;

    const query = input.value.trim();
    if (!query) return;

    input.value = '';
    this.processAssistantQuery(query);
  },

  /**
   * Process query and generate smart contextual response from live library state
   */
  processAssistantQuery(query) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message
    this.state.assistantMessages.push({
      sender: 'user',
      text: query,
      time: timeStr
    });
    this.renderAssistantMessages();

    // Compute smart response based on live state
    setTimeout(() => {
      const response = this.computeAssistantResponse(query);
      this.state.assistantMessages.push({
        sender: 'bot',
        text: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      this.renderAssistantMessages();
    }, 350);
  },

  /**
   * Natural Language Intent Parser & Live Data Lookups
   */
  computeAssistantResponse(query) {
    const q = query.toLowerCase();

    // 1. Available Books / Catalogue overview
    if (q.includes('available') || q.includes('in stock') || q.includes('books available')) {
      const available = this.state.books.filter(b => b.availableCopies > 0);
      const highlights = available.slice(0, 3).map(b => 
        `• **${b.title}** (${b.availableCopies} in stock at *${b.rackId || 'Digital'}*)\n  <button class="btn-outline-teal" style="margin-top: 4px;" onclick="app.locateBookOnMap('${b.id}'); app.toggleAssistant();">📍 Locate on Shelf Map</button>`
      ).join('\n\n');

      return `📚 **Currently Available Titles:**\nThere are **${available.length}** titles ready on shelf. Here are recommendations:\n\n${highlights}\n\nYou can view all titles in the **Book Catalogue** or explore the **Shelf Map**!`;
    }

    // 2. Locate Specific Book (Algorithms, Operating System, Clean Code, AI, Math, Physics, etc.)
    const bookMatch = this.state.books.find(b =>
      q.includes(b.title.toLowerCase()) ||
      b.title.toLowerCase().split(' ').some(word => word.length > 4 && q.includes(word.toLowerCase()))
    );

    if (bookMatch) {
      const availStatus = bookMatch.availableCopies > 0
        ? `✅ **Available**: **${bookMatch.availableCopies} of ${bookMatch.totalCopies} copies** in stock.`
        : `⚠️ **All copies currently checked out**.`;

      const shelfAction = bookMatch.rackId
        ? `\n\n<button class="btn-outline-teal" onclick="app.locateBookOnMap('${bookMatch.id}'); app.toggleAssistant();">📍 Find on Shelf Map (${bookMatch.rackId})</button>`
        : `\n\n*(Digital E-Resource • No physical shelf location)*`;

      return `📖 **${bookMatch.title}**\n• Author: ${bookMatch.author}\n• Category: ${bookMatch.category}\n• Shelf Location: **${bookMatch.location || 'Main Stacks'}**\n• Status: ${availStatus}\n• ISBN: ${bookMatch.isbn}${shelfAction}`;
    }

    // 3. Fines & Penalties
    if (q.includes('fine') || q.includes('penalty') || q.includes('overdue') || q.includes('defaulter')) {
      if (this.state.currentRole === 'STUDENT') {
        const studentId = this.state.activeStudentId;
        const myOverdue = this.state.transactions.filter(t => t.memberId === studentId && t.status === 'OVERDUE');
        const myFine = myOverdue.reduce((sum, t) => sum + Number(t.calculatedFine || 0), 0);

        if (myOverdue.length > 0) {
          return `⚠️ **Your Overdue Fine Status:**\nYou have **${myOverdue.length} overdue title(s)** with an assessed fine of **₹${myFine}.00**.\n\n• Overdue title: **${myOverdue[0].bookTitle}** (Due on ${myOverdue[0].dueDate}).\nPlease return the book at the circulation counter to clear your dues.`;
        } else {
          return `🎉 **Clear Record:** You have zero overdue books and no pending penalties! Academic late fine rate is **₹5.00 / day** beyond the 14-day borrowing deadline.`;
        }
      } else {
        const totalOverdue = this.state.transactions.filter(t => t.status === 'OVERDUE').length;
        const totalFines = this.state.transactions
          .filter(t => !t.finePaid && Number(t.calculatedFine) > 0)
          .reduce((sum, t) => sum + Number(t.calculatedFine), 0);

        return `📊 **Institutional Penalty Status:**\n• Active Overdue Loans: **${totalOverdue} books**\n• Outstanding Uncollected Fines: **₹${totalFines}.00**\n• Standard Academic Late Rate: **₹5.00 / day**\n\nYou can review individual borrower defaulters in the **Circulation Desk** under the *Overdue & Defaulters* tab.`;
      }
    }

    // 4. Shelf Map or Location Queries
    if (q.includes('map') || q.includes('shelf') || q.includes('location') || q.includes('rack') || q.includes('where')) {
      return `🗺️ **Interactive Library Shelf Map:**\nYou can locate any book's exact physical shelf rack on our new **Shelf Map** tab!\n\nIt features:\n• Interactive top-down floor plan for Ground Floor & 1st Floor\n• Selected rack glowing highlights & pin drops\n• Turn-by-turn directions from the South Library Entrance\n\n<button class="btn-outline-teal" style="margin-top: 6px;" onclick="app.switchTab('shelf-map'); app.toggleAssistant();">🗺️ Open Shelf Map</button>`;
    }

    // 5. Borrowing Rules & Lending Quota
    if (q.includes('rule') || q.includes('limit') || q.includes('quota') || q.includes('borrow') || q.includes('policy')) {
      return `📋 **Institutional Lending Guidelines:**\n\n🎓 **B.Tech Students:**\n• Max simultaneous loans: **3 books**\n• Lending duration: **14 days**\n• Renewal: Up to 1 extension (+14 days) if no holds.\n\n👨‍🏫 **Faculty Members:**\n• Max simultaneous loans: **6 books**\n• Lending duration: **30 days**\n\nLate return penalty is calculated at **₹5.00 per day**.`;
    }

    // 6. Renewal procedure
    if (q.includes('renew') || q.includes('extension') || q.includes('extend')) {
      return `🔄 **Book Renewal Procedure:**\n• Books may be renewed for an additional **14 days** provided they are not already overdue.\n• In the **Circulation Desk** (for librarians) or your student card, click the **Renew** button next to your active borrowing.`;
    }

    // 7. Total Library Stats / Collection
    if (q.includes('stat') || q.includes('total') || q.includes('count') || q.includes('collection')) {
      const titles = this.state.books.length;
      const copies = this.state.books.reduce((s, b) => s + Number(b.totalCopies), 0);
      const avail = this.state.books.reduce((s, b) => s + Number(b.availableCopies), 0);
      const active = this.state.transactions.filter(t => t.status !== 'RETURNED').length;

      return `📊 **ShelfSense Live Inventory:**\n• Unique Titles: **${titles}**\n• Physical Volumes: **${copies} copies**\n• Available on Shelf: **${avail} copies** (${Math.round((avail / copies) * 100)}%)\n• Active Borrowings: **${active} loans**`;
    }

    // 8. General Greetings & Help
    if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q.includes('help')) {
      return `Hello! How can I assist you with ShelfSense today?\n\nYou can ask me:\n• *"Where is Introduction to Algorithms?"*\n• *"Locate books on the Shelf Map"*\n• *"What are the borrowing rules?"*\n• *"Show me books in Computer Science"*\n• *"Check overdue fines"*`;
    }

    // 9. Default fallback
    return `I searched ShelfSense records for "${query}". You can browse the full collection in the **Book Catalogue** tab or locate physical shelves in the **Shelf Map** tab!`;
  }
};

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
