// Sessions Module for LACS
// Contains the enhanced sessions functionality
// Intended to be loaded after main-features.js

// ==============================
// SESSIONS MODULE - ENHANCED VERSION
// ==============================
window.renderSessionsEnhanced = async function () {
    const user = getCurrentUser();
    const role = user ? (user.role || user.user_role || 'User') : 'User';
    const isStaffOrAdmin = isStaffOrAdminRole(user);
    window.isSubView = false;

    // Guard: Only render if sessions is the active section
    if (window.activeSection && window.activeSection !== 'sessions') {
        console.log('Skipping sessions render: active section is ' + window.activeSection);
        return;
    }
    try {
        const response = await fetch('../api/api_sessions.php');
        const data = await response.json();
        const sessions = data.sessions || [];

        // Cache sessions for later use
        window.cachedSessions = sessions;

        const upcoming = sessions.filter(s => s.status === 'Scheduled').length;
        const completed = sessions.filter(s => s.status === 'Completed').length;
        const ongoing = sessions.filter(s => s.status === 'Ongoing').length;
        const cancelled = sessions.filter(s => s.status === 'Cancelled').length;

        const html = `
        <div class="space-y-8 animate-fade-in-up">
            <!-- Directory Breadcrumb for "Directory Mode" -->
            <div class="flex items-center gap-2 text-sm text-gray-500 mb-2"></div>

            <!-- Premium Header - Red Palette -->
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-8 shadow-xl">
                <div class="absolute inset-0 bg-black opacity-10"></div>
                <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                <div class="relative z-10">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div class="text-white">
                            <h1 class="text-3xl font-black mb-2 tracking-tight">Legislative Sessions</h1>
                            <p class="text-red-100 text-sm font-medium">Manage and track all legislative sessions</p>
                        </div>
                        <div class="flex gap-2">
                             ${isStaffOrAdmin ? `
                            <button onclick="openCreateSessionModal()" class="px-5 py-2.5 bg-white text-red-600 rounded-xl hover:bg-red-50 text-sm font-bold flex items-center gap-2 shadow-lg transition-all hover:-translate-y-0.5">
                                <i class="bi bi-plus-lg"></i> New Session
                            </button>
                             ` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Grid - Pro Style -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <!-- Total Sessions -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center text-xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                            <i class="bi bi-calendar-event"></i>
                        </div>
                    </div>
                    <div>
                        <p class="text-3xl font-black text-red-950 dark:text-white tracking-tight mb-1">${sessions.length}</p>
                        <p class="text-sm text-red-900/60 dark:text-gray-400 font-bold uppercase tracking-wider">Total Sessions</p>
                    </div>
                </div>

                <!-- Completed -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center text-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <i class="bi bi-check-circle"></i>
                        </div>
                    </div>
                    <div>
                        <p class="text-3xl font-black text-gray-800 dark:text-white tracking-tight mb-1">${completed}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Completed</p>
                    </div>
                </div>

                <!-- Scheduled -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <i class="bi bi-clock-history"></i>
                        </div>
                    </div>
                    <div>
                        <p class="text-3xl font-black text-gray-800 dark:text-white tracking-tight mb-1">${upcoming}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Scheduled</p>
                    </div>
                </div>

                <!-- Ongoing -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center text-xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            <i class="bi bi-activity"></i>
                        </div>
                        <span class="animate-pulse w-2 h-2 rounded-full bg-orange-500"></span>
                    </div>
                    <div>
                        <p class="text-3xl font-black text-gray-800 dark:text-white tracking-tight mb-1">${ongoing}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Ongoing</p>
                    </div>
                </div>
            </div>



            <!-- Sessions List -->
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors duration-300">
                <div class="px-6 md:px-8 py-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-800/50">
                    <!-- Dynamic Header Container -->
                    <div class="relative h-10">
                        <!-- Default Header View -->
                        <div id="defaultHeader" class="flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300 transform scale-100 opacity-100">
                            <div class="flex items-center gap-4 w-full md:w-auto">
                                ${isAdminRole(role) ? `
                                    <div class="flex items-center">
                                        <input type="checkbox" id="selectAllSessions" onchange="window.toggleSelectAll(this)" class="w-5 h-5 rounded border-gray-300 dark:border-slate-600 text-red-600 focus:ring-red-500 transition-all cursor-pointer">
                                    </div>
                                ` : ''}
                                <h3 class="text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                                    All Sessions
                                    <span class="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs uppercase font-bold tracking-wider leading-none">Directory</span>
                                </h3>
                            </div>
                            <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                <select id="sessionStatusFilter" onchange="filterSessions()" class="px-4 py-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors">
                                    <option value="all">All Status</option>
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="Ongoing">Ongoing</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                                ${isAdminRole(role) ? `
                                <select id="sessionVisibilityFilter" onchange="filterSessions()" class="px-4 py-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors">
                                    <option value="all">Everywhere</option>
                                    <option value="Active">Active Only</option>
                                    <option value="Inactive">Inactive Only</option>
                                </select>
                                ` : ''}
                                <select id="sessionTypeFilter" onchange="filterSessions()" class="px-4 py-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors">
                                    <option value="all">All Types</option>
                                    <option value="Regular Session">Regular Session</option>
                                    <option value="Special Session">Special Session</option>
                                    <option value="Emergency Session">Emergency Session</option>
                                </select>
                                <select id="sessionSortOrder" onchange="filterSessions()" class="px-4 py-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors">
                                    <option value="desc">Most Recent</option>
                                    <option value="asc">Oldest</option>
                                </select>
                                <div class="relative flex-1 md:w-64">
                                    <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs"></i>
                                    <input type="text" id="sessionSearchInput" oninput="filterSessions()" placeholder="Search sessions..." class="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors">
                                </div>
                            </div>
                        </div>

                         ${isAdminRole(role) ? `
                        <div id="bulkHeader" class="hidden absolute inset-0 flex items-center justify-between gap-4 transition-all duration-300 transform scale-95 opacity-0">
                            <div class="flex items-center gap-4">
                                <div class="flex items-center">
                                    <input type="checkbox" id="selectAllSessionsBulk" onchange="window.toggleSelectAll(this)" class="w-5 h-5 rounded border-gray-300 dark:border-slate-600 text-red-600 focus:ring-red-500 transition-all cursor-pointer">
                                </div>
                                <h4 class="font-bold text-gray-900 dark:text-white text-sm leading-none">
                                    <span id="selectedCount" class="font-black">0</span> Sessions Selected
                                </h4>
                            </div>
                            <div class="flex items-center gap-3">
                                <button onclick="window.bulkDeleteSessions()" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-lg shadow-red-500/20 flex items-center gap-2 transition-all active:scale-95">
                                    <i class="bi bi-trash3-fill"></i>
                                    Delete Selected
                                </button>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div id="sessions-list-container" class="divide-y divide-gray-100 dark:divide-slate-700">
                    ${renderSessionListHtml(sessions)}
                </div>
            </div>
        </div>
        `;
        document.getElementById('content-area').innerHTML = html;

        // Update Global UI elements for "Directory Mode"
        const pageTitle = document.getElementById('page-title');
        const breadcrumbCurrent = document.getElementById('breadcrumb-current');
        if (pageTitle) pageTitle.textContent = 'Legislative Sessions';
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'Sessions';

    } catch (e) {
        console.error('Error loading sessions:', e);
        showNotification('Error loading sessions', 'error');
    }
};

// Fixed viewSessionDetails to use cached data
window.viewSessionDetails = async function (sessionId) {
    try {
        window.isSubView = true;
        window.activeSection = 'sessions';
        const user = getCurrentUser();
        const role = user ? (user.role || user.user_role || 'User') : 'User';
        const isStaffOrAdmin = isStaffOrAdminRole(user);

        // Convert sessionId to number for comparison
        const targetSessionId = parseInt(sessionId);

        // Find session in cached data - check multiple cache sources
        let session = null;

        if (window.cachedSessions && window.cachedSessions.length > 0) {
            session = window.cachedSessions.find(s => parseInt(s.session_id || s.id) === targetSessionId);
        }

        // If not found, check agenda sessions cache
        if (!session && window.cachedAgendasSessions && window.cachedAgendasSessions.length > 0) {
            session = window.cachedAgendasSessions.find(s => parseInt(s.session_id || s.id) === targetSessionId);
        }

        // Check if cached session has details (documents, minutes, attendance_list)
        if (session && (!session.documents || !session.attendance_list)) {
            console.log('Cached session is summary only, fetching full details...');
            session = null; // Force fetch
        }

        // If still not found or forced to fetch
        if (!session) {
            const response = await fetch(`../api/api_sessions.php?id=${targetSessionId}`);
            const data = await response.json();

            if (data.success && data.session) {
                session = data.session;
                // Update cache if exists
                if (window.cachedSessions) {
                    const index = window.cachedSessions.findIndex(s => parseInt(s.session_id || s.id) === targetSessionId);
                    if (index !== -1) {
                        window.cachedSessions[index] = session;
                    } else {
                        window.cachedSessions.push(session);
                    }
                }
            }
        }

        if (!session) {
            showNotification('Session not found', 'error');
            return;
        }

        const sessionDateSafe = session.session_date ? new Date(session.session_date) : null;
        const scheduledDateLabel = sessionDateSafe && !isNaN(sessionDateSafe)
            ? sessionDateSafe.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
            : 'TBD';

        // Update Title and Breadcrumb for "Directory Mode"
        const pageTitle = document.getElementById('page-title');
        const breadcrumbCurrent = document.getElementById('breadcrumb-current');
        if (pageTitle) pageTitle.textContent = 'Sessions';
        if (breadcrumbCurrent) {
            breadcrumbCurrent.innerHTML = `
                <a href="#" onclick="showSection('sessions')" class="hover:text-red-600 dark:text-dark-muted dark:hover:text-red-400 transition-colors">Sessions</a>
                <i class="bi bi-chevron-right mx-2 text-xs"></i>
                <span class="text-gray-800 dark:text-white font-medium">${session.title}</span>
            `;
        }

        const execStatus = (session.status || '').toLowerCase();
        const lockedStatuses = ['missed', 'completed', 'cancelled', 'canceled', 'postponed'];
        const isLockedForEditing = lockedStatuses.includes(execStatus);
        const canReschedule = ['missed', 'postponed'].includes(execStatus);

        const detailHtml = `
            <div class="space-y-6 animate-fade-in-up">
                <!-- Directory Navigation / Status Bar -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border mb-6 transition-colors duration-300">
                    <div class="flex items-center gap-4">
                        <button onclick="showSection('sessions')" class="w-10 h-10 rounded-lg bg-gray-50 dark:bg-dark-bg/50 flex items-center justify-center text-gray-600 dark:text-dark-muted hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all border border-gray-200 dark:border-dark-border">
                            <i class="bi bi-arrow-left"></i>
                        </button>
                        <div>
                            <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-muted">
                                <span class="hover:text-red-600 dark:hover:text-red-400 cursor-pointer" onclick="showSection('sessions')">Sessions</span>
                                <i class="bi bi-chevron-right text-[10px]"></i>
                                <span class="text-gray-900 dark:text-dark-text font-medium truncate max-w-[200px]">${session.title}</span>
                            </div>
                            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Session Details</h2>
                        </div>
                    </div>
                    <div class="flex gap-2">
                         ${isStaffOrAdmin ? `
                            ${(session.session_status || 'Active') === 'Inactive' ? `
                                <button onclick="window.restoreSession(${sessionId})" class="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 text-sm font-medium flex items-center gap-2 transition-all">
                                    <i class="bi bi-arrow-counterclockwise"></i> Restore Session
                                </button>
                            ` : !isLockedForEditing ? `
                                <button onclick="window.editSession(${sessionId})" class="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 text-sm font-medium flex items-center gap-2 transition-all">
                                    <i class="bi bi-pencil"></i> Edit Session
                                </button>
                            ` : ''}
                            ${canReschedule ? `
                                <button onclick="window.rescheduleSession(${sessionId})" class="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center gap-2 transition-all">
                                    <i class="bi bi-arrow-repeat"></i> Reschedule
                                </button>
                            ` : ''}
                        ` : ''}
                        
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Left Column: Primary Information -->
                    <div class="lg:col-span-2 space-y-6">
                        <div class="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden transition-colors duration-300">
                            <div class="bg-gradient-to-r from-red-600 to-red-800 p-8 text-white relative">
                                <div class="absolute top-0 right-0 p-8 opacity-10">
                                    <i class="bi bi-calendar-event text-9xl"></i>
                                </div>
                                <div class="relative z-10">
                                    <span class="px-3 py-1 ${session.session_type === 'Emergency Session' ? 'bg-red-500/90 text-white border-red-400' : session.session_type === 'Special Session' ? 'bg-yellow-400/90 text-yellow-950 border-yellow-300' : 'bg-blue-500/90 text-white border-blue-400'} backdrop-blur-md rounded-full text-[10px] uppercase font-bold mb-4 inline-block border shadow-sm">
                                        ${session.session_type}
                                    </span>
                                    <h1 class="text-3xl font-bold mb-2">${session.title}</h1>
                                    <div class="flex flex-wrap items-center gap-4 text-red-50 text-sm">
                                        <div class="flex items-center gap-1">
                                            <i class="bi bi-geo-alt"></i>
                                            ${session.venue || 'No venue assigned'}
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <i class="bi bi-person-badge"></i>
                                            Presiding: ${session.presiding_officer || 'None'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="p-8">
                                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <i class="bi bi-info-circle text-red-600"></i>
                                    General Information
                                </h3>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div class="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-dark-bg/50 border border-gray-100 dark:border-dark-border transition-colors duration-300">
                                        <div class="w-12 h-12 rounded-xl bg-white dark:bg-dark-card shadow-sm flex items-center justify-center text-red-600 dark:text-red-400">
                                            <i class="bi bi-calendar3 text-xl"></i>
                                        </div>
                                        <div>
                                            <p class="text-xs text-gray-500 dark:text-dark-muted font-semibold uppercase tracking-wider">Scheduled Date</p>
                                            <p class="text-lg font-bold text-gray-900 dark:text-dark-text">${scheduledDateLabel}</p>
                                        </div>
                                    </div>

                                    <div class="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-dark-bg/50 border border-gray-100 dark:border-dark-border transition-colors duration-300">
                                        <div class="w-12 h-12 rounded-xl bg-white dark:bg-dark-card shadow-sm flex items-center justify-center text-red-600 dark:text-red-400">
                                            <i class="bi bi-clock text-xl"></i>
                                        </div>
                                        <div>
                                            <p class="text-xs text-gray-500 dark:text-dark-muted font-semibold uppercase tracking-wider">Time Duration</p>
                                            <p class="text-lg font-bold text-gray-900 dark:text-dark-text">${session.time || 'TBD'}</p>
                                        </div>
                                    </div>

                                    <div class="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-dark-bg/50 border border-gray-100 dark:border-dark-border transition-colors duration-300">
                                        <div class="w-12 h-12 rounded-xl bg-white dark:bg-dark-card shadow-sm flex items-center justify-center text-red-600 dark:text-red-400">
                                            <i class="bi bi-tag text-xl"></i>
                                        </div>
                                        <div>
                                            <p class="text-xs text-gray-500 dark:text-dark-muted font-semibold uppercase tracking-wider">Session Type</p>
                                            <p class="text-lg font-bold text-gray-900 dark:text-dark-text">${session.session_type}</p>
                                        </div>
                                    </div>

                                    <div class="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-dark-bg/50 border border-gray-100 dark:border-dark-border transition-colors duration-300">
                                        <div class="w-12 h-12 rounded-xl bg-white dark:bg-dark-card shadow-sm flex items-center justify-center text-red-600 dark:text-red-400">
                                            <i class="bi bi-activity text-xl"></i>
                                        </div>
                                        <div>
                                            <p class="text-xs text-gray-500 dark:text-dark-muted font-semibold uppercase tracking-wider">Execution Status</p>
                                            <div class="flex items-center gap-2 mt-1">
                                                <span class="w-2 h-2 rounded-full bg-red-600"></span>
                                                <p class="text-lg font-bold text-gray-900 dark:text-dark-text">${session.status}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-dark-bg/50 border border-gray-100 dark:border-dark-border transition-colors duration-300">
                                        <div class="w-12 h-12 rounded-xl bg-white dark:bg-dark-card shadow-sm flex items-center justify-center text-red-600 dark:text-red-400">
                                            <i class="bi bi-person-plus text-xl"></i>
                                        </div>
                                        <div>
                                            <p class="text-xs text-gray-500 dark:text-dark-muted font-semibold uppercase tracking-wider">Created By</p>
                                            <p class="text-lg font-bold text-gray-900 dark:text-dark-text">${session.creator_name || 'System Administrator'}</p>
                                        </div>
                                    </div>

                                    <div class="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-dark-bg/50 border border-gray-100 dark:border-dark-border transition-colors duration-300">
                                        <div class="w-12 h-12 rounded-xl bg-white dark:bg-dark-card shadow-sm flex items-center justify-center ${session.session_status === 'Active' ? 'text-emerald-600' : 'text-red-600'}">
                                            <i class="bi bi-eye text-xl"></i>
                                        </div>
                                        <div>
                                            <p class="text-xs text-gray-500 dark:text-dark-muted font-semibold uppercase tracking-wider">Visibility</p>
                                            <div class="flex items-center gap-2 mt-1">
                                                <span class="w-2 h-2 rounded-full ${session.session_status === 'Active' ? 'bg-emerald-600' : 'bg-red-600'}"></span>
                                                <p class="text-lg font-bold text-gray-900 dark:text-dark-text">${session.session_status}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-dark-bg/50 border border-gray-100 dark:border-dark-border transition-colors duration-300 md:col-span-2">
                                        <div class="w-12 h-12 rounded-xl bg-white dark:bg-dark-card shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <i class="bi bi-people text-xl"></i>
                                        </div>
                                        <div class="flex-1">
                                            <p class="text-xs text-gray-500 dark:text-dark-muted font-semibold uppercase tracking-wider">Assigned Users</p>
                                            <div class="flex flex-wrap gap-2 mt-2">
                                                ${session.assigned_staff && session.assigned_staff.length > 0
                ? session.assigned_staff.map(staff => `
                                                        <span class="px-3 py-1 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-full text-sm font-medium text-gray-700 dark:text-dark-text shadow-sm flex items-center gap-2 transition-colors">
                                                            <div class="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                                                                ${(staff.user_name || 'U').charAt(0).toUpperCase()}
                                                            </div>
                                                            ${staff.user_name || 'Unknown User'}
                                                        </span>
                                                    `).join('')
                : '<p class="text-sm text-gray-400 dark:text-dark-muted italic">No users assigned to this session</p>'
            }
                                                ${isStaffOrAdmin && (session.session_status || 'Active') !== 'Inactive' && !isLockedForEditing ? `
                                                <button onclick="assignSessionStaff(${sessionId})" class="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-dark-border flex items-center justify-center text-gray-400 dark:text-dark-muted hover:border-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-bold" title="Assign Users">
                                                    <i class="bi bi-plus-lg"></i>
                                                </button>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Attendance Section -->
                        <div class="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden mb-6 transition-colors duration-300">
                            <div class="p-6 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-gray-50/50 dark:bg-dark-bg/20">
                                <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <i class="bi bi-person-check text-red-600"></i>
                                    Attendance Record
                                </h3>
                                ${isStaffOrAdmin && (session.session_status || 'Active') !== 'Inactive' && !isLockedForEditing ? `
                                <div class="flex items-center gap-2">
                                    <button onclick="recordSessionAttendance(${sessionId})" class="text-sm text-red-600 dark:text-red-400 font-medium hover:underline">Update</button>
                                    ${(isAdminRole(role) || session.created_by == (user.id || user.user_id)) ? `
                                    <button onclick="deleteSessionAttendance(${sessionId})" class="text-sm text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 font-medium transition ml-3" title="Clear Attendance">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                    ` : ''}
                                </div>
                                ` : ''}
                            </div>
                            <div class="p-6">
                                ${session.attendance && session.attendance.length > 0 ? `
                                    <div class="overflow-x-auto">
                                        <table class="w-full text-sm text-left">
                                            <thead class="text-xs text-gray-500 dark:text-dark-muted uppercase bg-gray-50/50 dark:bg-dark-bg/50">
                                                <tr>
                                                    <th class="px-4 py-3 rounded-l-lg">User</th>
                                                    <th class="px-4 py-3">Status</th>
                                                    <th class="px-4 py-3">Time In</th>
                                                    <th class="px-4 py-3 rounded-r-lg">Time Out</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-gray-100 dark:divide-dark-border">
                                                ${session.attendance.map(record => `
                                                    <tr class="hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                                                        <td class="px-4 py-3 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                            <div class="w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-dark-muted">
                                                                ${(record.name || 'U').charAt(0).toUpperCase()}
                                                            </div>
                                                            ${record.name}
                                                        </td>
                                                        <td class="px-4 py-3">
                                                            ${record.status ? `
                                                                <span class="px-2 py-1 rounded-full text-xs font-semibold ${record.status?.toLowerCase() === 'present' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        record.status?.toLowerCase() === 'absent' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                            record.status?.toLowerCase() === 'late' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    }">${record.status.toUpperCase()}</span>
                                                            ` : `
                                                                <span class="text-xs text-gray-400 dark:text-dark-muted">—</span>
                                                            `}
                                                        </td>
                                                        <td class="px-4 py-3 text-gray-500 dark:text-dark-muted">${record.time_in || '--:--'}</td>
                                                        <td class="px-4 py-3 text-gray-500 dark:text-dark-muted">${record.time_out || '--:--'}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                ` : `
                                    <div class="text-center py-8">
                                        <div class="w-12 h-12 bg-gray-50 dark:bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-3">
                                            <i class="bi bi-person-x text-gray-400 dark:text-dark-muted text-xl"></i>
                                        </div>
                                        <p class="text-gray-500 dark:text-dark-muted text-sm">No attendance records found.</p>
                                    </div>
                                `}
                            </div>
                        </div>

                        <!-- Meeting Minutes Section -->
                        <div class="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden mb-6 transition-colors duration-300">
                            <div class="p-6 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-gray-50/50 dark:bg-dark-bg/20">
                                <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <i class="bi bi-file-text text-red-600"></i>
                                    Meeting Minutes
                                </h3>
                                ${isStaffOrAdmin && (session.session_status || 'Active') !== 'Inactive' && !isLockedForEditing ? `
                                <div class="flex items-center gap-2">
                                    <button onclick="addMeetingMinutes(${sessionId})" class="text-sm text-red-600 dark:text-red-400 font-medium hover:underline">Edit</button>
                                    ${(isAdminRole(role) || session.created_by == (user.id || user.user_id)) ? `
                                    <button onclick="deleteSessionMinutes(${sessionId})" class="text-sm text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 font-medium transition ml-3" title="Delete Minutes">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                    ` : ''}
                                </div>
                                ` : ''}
                            </div>
                            <div class="p-6">
                                ${session.minutes ? `
                                    <div class="prose prose-sm max-w-none">
                                        <div class="mb-4">
                                            <h4 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Summary</h4>
                                            <p class="text-gray-600 dark:text-dark-text bg-gray-50 dark:bg-dark-bg/50 p-4 rounded-lg border border-gray-100 dark:border-dark-border">${session.minutes.summary || 'No summary available.'}</p>
                                        </div>
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Topics Discussed</h4>
                                                <div class="text-gray-600 dark:text-dark-text bg-gray-50 dark:bg-dark-bg/50 p-4 rounded-lg border border-gray-100 dark:border-dark-border whitespace-pre-line">${session.minutes.topics || 'No topics recorded.'}</div>
                                            </div>
                                            <div>
                                                <h4 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Decisions Made</h4>
                                                <div class="text-gray-600 dark:text-dark-text bg-gray-50 dark:bg-dark-bg/50 p-4 rounded-lg border border-gray-100 dark:border-dark-border whitespace-pre-line">${session.minutes.decisions || 'No decisions recorded.'}</div>
                                            </div>
                                        </div>
                                    </div>
                                ` : `
                                    <div class="text-center py-8">
                                        <div class="w-12 h-12 bg-gray-50 dark:bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-3">
                                            <i class="bi bi-journal-x text-gray-400 dark:text-dark-muted text-xl"></i>
                                        </div>
                                        <p class="text-gray-500 dark:text-dark-muted text-sm">No meeting minutes recorded yet.</p>
                                    </div>
                                `}
                            </div>
                        </div>

                        <!-- Documents Section -->
                        <div class="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden mb-6 transition-colors duration-300">
                            <div class="p-6 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-gray-50/50 dark:bg-dark-bg/20">
                                <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <i class="bi bi-paperclip text-red-600"></i>
                                    Session Documents
                                </h3>
                                ${isStaffOrAdmin && (session.session_status || 'Active') !== 'Inactive' && !isLockedForEditing ? `<button onclick="uploadSessionAttachments(${sessionId})" class="text-sm text-red-600 dark:text-red-400 font-medium hover:underline">Upload</button>` : ''}
                            </div>
                            <div class="p-6">
                                ${session.documents && session.documents.length > 0 ? `
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        ${session.documents.map(doc => `
                                            <div class="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 transition group hover:border-red-100 dark:hover:border-red-900/30">
                                                <div class="flex items-center gap-3 overflow-hidden">
                                                    <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                                                        <i class="bi bi-file-earmark-text text-lg"></i>
                                                    </div>
                                                    <div class="min-w-0 flex-1">
                                                        <div class="flex items-center gap-2">
                                                            <a href="${doc.file_path.startsWith('../') ? doc.file_path : '../' + doc.file_path}" target="_blank" class="text-sm font-bold text-gray-900 dark:text-white truncate hover:text-red-600 dark:hover:text-red-400 transition-colors ${doc.permission_state === 'Blur' ? 'blur-sm select-none' : ''} ${doc.permission_state === 'Lock' && (role !== 'Admin' && role !== 'Super Admin') ? 'pointer-events-none opacity-50' : ''}">${doc.file_name}</a>
                                                            ${doc.permission_state ? `<span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                                                doc.permission_state === 'Private' ? 'bg-gray-100 text-gray-600' :
                                                                doc.permission_state === 'Lock' ? 'bg-red-100 text-red-600' :
                                                                doc.permission_state === 'Blur' ? 'bg-yellow-100 text-yellow-600' :
                                                                'bg-green-100 text-green-600'
                                                            }">${doc.permission_state}</span>` : `<span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-green-100 text-green-600">Public view</span>`}
                                                        </div>
                                                        <p class="text-xs text-gray-500 dark:text-dark-muted">${doc.size || '0 KB'} • ${doc.uploaded_at || 'Just now'}</p>
                                                    </div>
                                                </div>
                                                <div class="flex items-center gap-2">
                                                    <a href="${doc.file_path.startsWith('../') ? doc.file_path : '../' + doc.file_path}" target="_blank" class="p-1.5 text-gray-400 dark:text-dark-muted hover:text-red-600 dark:hover:text-red-400 transition-colors" title="View Document">
                                                        <i class="bi bi-eye"></i>
                                                    </a>
                                                    <button class="p-1.5 text-gray-400 dark:text-dark-muted hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Download">
                                                        <i class="bi bi-download"></i>
                                                    </button>
                                                    ${(role === 'Super Admin' || role === 'Admin' || session.created_by == (user.id || user.user_id)) ? `
                                                    <button onclick="changeDocumentPermission(${doc.document_id}, ${sessionId}, '${doc.permission_state || 'Public view'}')" class="p-1.5 text-gray-400 dark:text-dark-muted hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Change Permission">
                                                        <i class="bi bi-shield-lock"></i>
                                                    </button>
                                                    <button onclick="deleteSessionDocument(${doc.document_id}, ${sessionId})" class="p-1.5 text-gray-400 dark:text-dark-muted hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete">
                                                        <i class="bi bi-trash"></i>
                                                    </button>
                                                    ` : ''}
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : `
                                    <div class="text-center py-8">
                                        <div class="w-12 h-12 bg-gray-50 dark:bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-3">
                                            <i class="bi bi-folder-x text-gray-400 dark:text-dark-muted text-xl"></i>
                                        </div>
                                        <p class="text-gray-500 dark:text-dark-muted text-sm">No documents attached to this session.</p>
                                    </div>
                                `}
                            </div>
                        </div>

                        <!-- Session Agenda Section -->
        <div class="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border p-8 transition-colors duration-300">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <i class="bi bi-journal-text text-red-600"></i>
                    Session Agenda
                </h3>
                ${(session.session_status || 'Active') !== 'Inactive' && !isLockedForEditing
                ? `<button onclick="viewSessionAgenda(${sessionId})" class="text-sm text-red-600 dark:text-red-400 font-medium hover:underline">Manage Agenda</button>`
                : ''
            }
            </div>

            <div id="session-agenda-list" class="space-y-4">
                <div class="flex justify-center p-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
            </div>
        </div>
                    </div>

                    <!-- Right Column: Secondary Info & Actions -->
        <div class="space-y-6">
            <!-- Status Card -->
            <div class="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border p-6 transition-colors duration-300">
                <h4 class="font-bold text-gray-900 dark:text-white mb-4 uppercase text-xs tracking-widest">Attendance Status</h4>
                <div class="space-y-4">
                    <div class="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                        <span class="text-sm font-medium text-red-800 dark:text-red-300">Quorum Requirement</span>
                        <span class="text-xs font-bold text-red-600 dark:text-red-400 bg-white dark:bg-dark-bg px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">REQUIRED</span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-dark-muted leading-relaxed">
                        Attendance will be recorded once the session begins. The presiding officer is responsible for verifying the quorum.
                    </p>
                </div>
            </div>

            <!-- Quick Actions -->
                ${isStaffOrAdmin && (session.session_status || 'Active') !== 'Inactive' && !isLockedForEditing ? `
                        <div class="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border p-6 relative overflow-hidden transition-colors duration-300">
                            <h4 class="font-bold mb-4 uppercase text-xs tracking-widest text-gray-500 dark:text-dark-muted">Session Actions</h4>
                            <div class="space-y-2">
                                <button onclick="sendSessionReminder(${sessionId})" class="w-full flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-left group border border-red-100 dark:border-red-900/30">
                                    <span class="text-sm font-medium text-red-700 dark:text-red-300 group-hover:text-red-600 font-semibold">Send Reminder</span>
                                    <i class="bi bi-bell text-red-600 dark:text-red-400 group-hover:text-red-700 transition-colors"></i>
                                </button>
                                <button onclick="recordSessionAttendance(${sessionId})" class="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left group border-t border-gray-50 dark:border-dark-border pt-4">
                                    <span class="text-sm font-medium text-gray-700 dark:text-dark-text group-hover:text-red-600 dark:group-hover:text-red-400">${(session.attendance && session.attendance.length > 0) ? 'Update Attendance' : 'Record Attendance'}</span>
                                    <i class="bi bi-person-check text-gray-400 dark:text-dark-muted group-hover:text-red-600 transition-colors"></i>
                                </button>
                                <button onclick="addMeetingMinutes(${sessionId})" class="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left group border-t border-gray-50 dark:border-dark-border pt-4">
                                    <span class="text-sm font-medium text-gray-700 dark:text-dark-text group-hover:text-red-600 dark:group-hover:text-red-400">Add Meeting Minutes</span>
                                    <i class="bi bi-file-earmark-text text-gray-400 dark:text-dark-muted group-hover:text-red-600 transition-colors"></i>
                                </button>
                                <button onclick="uploadSessionAttachments(${sessionId})" class="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left group border-t border-gray-50 dark:border-dark-border pt-4">
                                    <span class="text-sm font-medium text-gray-700 dark:text-dark-text group-hover:text-red-600 dark:group-hover:text-red-400">Upload Attachments</span>
                                    <i class="bi bi-paperclip text-gray-400 dark:text-dark-muted group-hover:text-red-600 transition-colors"></i>
                                </button>
                                <button onclick="cancelSession(${sessionId})" class="w-full flex items-center justify-between p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 hover:bg-yellow-500 text-yellow-700 dark:text-yellow-300 hover:text-white font-bold transition-all text-left group border-t border-gray-50 dark:border-dark-border pt-4 mt-2">
                                    <span>Cancel Session</span>
                                    <i class="bi bi-x-circle group-hover:scale-110 transition-transform"></i>
                                </button>
                                ${(isAdminRole(role) || session.created_by == (user.id || user.user_id)) ? `
                                <button onclick="window.deleteSession(${sessionId})" class="w-full flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/10 hover:bg-red-600 text-red-600 hover:text-white font-bold transition-all text-left group border-t border-gray-50 dark:border-dark-border pt-4">
                                    <span>Delete Session</span>
                                    <i class="bi bi-trash3 group-hover:scale-110 transition-transform"></i>
                                </button>
                                ` : ''}
                            </div>
                        </div>
                        ` : ''}

            <!-- Session History Section -->
            <div class="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border p-6 transition-colors duration-300">
                <h4 class="font-bold text-gray-900 dark:text-white mb-4 uppercase text-xs tracking-widest">Session History</h4>
                <div id="session-history-list" class="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar text-gray-800 dark:text-dark-text">
                    <div class="flex justify-center p-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    </div>
                </div>
            </div>
            </div>
        </div>
            </div>
        `;
        document.getElementById('content-area').innerHTML = detailHtml;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Fetch Live Agendas for this session
        try {
            const response = await fetch(`../api/api_agendas.php?session_id=${sessionId}`);
            const data = await response.json();
            const agendaListContainer = document.getElementById('session-agenda-list');

            // Fetch Session History
            loadSessionHistory(sessionId);

            if (data.success && data.agendas && data.agendas.length > 0) {
                let agendasHtml = `<div class="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden shadow-sm">`;
                data.agendas.forEach((agenda, index) => {
                    agendasHtml += `
                        <div class="p-4 hover:bg-gray-50 transition-all flex items-start gap-4 group">
                            <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 font-bold text-sm border border-red-100 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                ${index + 1}
                            </div>
                            <div class="flex-1">
                                <h4 class="font-bold text-gray-900 mb-1 group-hover:text-red-600 transition-colors">${agenda.agenda_title}</h4>
                                <div class="flex items-center gap-3 text-xs text-gray-500">
                                    <span><i class="bi bi-clock mr-1"></i>${agenda.created_at ? new Date(agenda.created_at).toLocaleDateString() : 'No date'}</span>
                                    <span class="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-medium uppercase tracking-wider">${agenda.status || 'Published'}</span>
                                </div>
                            </div>
                            <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onclick="viewAgendaSpecificDetails(${agenda.id}, ${sessionId}, true)" class="text-sm text-red-600 hover:underline">View Details</button>
                            </div>
                        </div>
                    `;
                });
                agendasHtml += `</div>`;
                agendaListContainer.innerHTML = agendasHtml;
            } else {
                agendaListContainer.innerHTML = `
                    <div class="p-12 border-2 border-dashed border-gray-200 rounded-xl text-center">
                        <h4 class="font-bold text-gray-800 mb-2">No Agenda Linked</h4>
                        <p class="text-gray-500 mb-6 max-w-sm mx-auto">This session doesn't have an agenda linked yet. You can create one to start adding legislative items.</p>
                        ${isStaffOrAdmin && !isLockedForEditing ? `
                        <button onclick="openCreateAgendaModal(${sessionId})" class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition inline-flex items-center gap-2 shadow-lg shadow-red-500/20">
                            <i class="bi bi-plus-lg"></i> Add Agenda Item
                        </button>
                        ` : ''}
                    </div>
                `;
            }
        } catch (fetchError) {
            console.error('Error fetching session agendas:', fetchError);
            document.getElementById('session-agenda-list').innerHTML = `
                    <div class="p-4 text-center text-red-500 text-sm">
                        Failed to load agenda items.
                    </div>
        `;
        }
    } catch (e) {
        console.error('Error displaying session details:', e);
        showNotification('Error displaying session details', 'error');
    }
};

/**
 * Load and display session history/logs
 * @param {number} sessionId 
 */
async function loadSessionHistory(sessionId) {
    try {
        const response = await fetch(`../api/api_logs.php?entity_type=Session&entity_id=${sessionId}&limit=50`);
        const data = await response.json();
        const historyContainer = document.getElementById('session-history-list');

        if (!historyContainer) return;

        if (data.success && data.data && data.data.length > 0) {
            let historyHtml = `<div class="space-y-3">`;

            data.data.forEach((log, index) => {
                const logDate = new Date(log.created_at);
                const isFirst = index === 0;

                // Determine icon and color based on action
                let icon = 'bi-circle-fill';
                let iconColor = 'text-gray-400';
                let bgColor = 'bg-gray-50';

                if (log.action.includes('Create') || log.action.includes('Agenda')) {
                    icon = 'bi-plus-circle-fill';
                    iconColor = 'text-green-500';
                    bgColor = 'bg-green-50';
                    if (log.action.includes('Agenda')) {
                        icon = 'bi-list-task';
                        iconColor = 'text-indigo-600';
                        bgColor = 'bg-indigo-50';
                    }
                } else if (log.action.includes('Item')) {
                    icon = 'bi-file-earmark-plus';
                    iconColor = 'text-blue-600';
                    bgColor = 'bg-blue-50';
                    if (log.action.includes('Update')) {
                        icon = 'bi-file-earmark-medical';
                        iconColor = 'text-blue-500';
                    } else if (log.action.includes('Delete')) {
                        icon = 'bi-file-earmark-x';
                        iconColor = 'text-red-500';
                    }
                } else if (log.action.includes('Assignments')) {
                    icon = 'bi-people-fill';
                    iconColor = 'text-purple-500';
                    bgColor = 'bg-purple-50';
                } else if (log.action.includes('Update')) {
                    icon = 'bi-pencil-circle-fill';
                    iconColor = 'text-blue-500';
                    bgColor = 'bg-blue-50';
                } else if (log.action.includes('Delete')) {
                    icon = 'bi-trash-circle-fill';
                    iconColor = 'text-red-500';
                    bgColor = 'bg-red-50';
                } else if (log.action.includes('Restore')) {
                    icon = 'bi-arrow-counterclockwise';
                    iconColor = 'text-green-600';
                    bgColor = 'bg-green-50';
                } else if (log.action.includes('Status')) {
                    icon = 'bi-arrow-repeat';
                    iconColor = 'text-orange-500';
                    bgColor = 'bg-orange-50';
                }

                historyHtml += `
                    <div class="flex gap-3 p-3 rounded-xl border border-gray-100 ${bgColor} hover:shadow-sm transition-all text-xs">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 rounded-full ${bgColor} border-2 border-white flex items-center justify-center ${iconColor} shadow-sm">
                                <i class="bi ${icon} text-sm"></i>
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between gap-2 mb-1">
                                <h4 class="font-bold text-gray-900 truncate">${log.action}</h4>
                                <span class="text-[10px] text-gray-400 whitespace-nowrap">
                                    ${logDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div class="flex items-center gap-1.5 mb-1">
                                <span class="text-[10px] text-gray-400">${logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                <span class="text-[10px] text-gray-300">•</span>
                                <span class="text-[10px] text-gray-500 font-medium">${log.user_name || 'System'}</span>
                            </div>
                            ${log.description ? `<p class="text-[10px] text-gray-600 leading-relaxed italic border-t border-gray-100/50 pt-1 mt-1">${log.description}</p>` : ''}
                        </div>
                    </div>
                `;
            });

            historyHtml += `</div>`;
            historyContainer.innerHTML = historyHtml;
        } else {
            historyContainer.innerHTML = `
                <div class="p-12 border-2 border-dashed border-gray-200 rounded-xl text-center">
                    <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="bi bi-clock-history text-2xl text-gray-400"></i>
                    </div>
                    <h4 class="font-bold text-gray-800 mb-2">No History Available</h4>
                    <p class="text-gray-500 text-sm">No activity logs found for this session.</p>
                </div>
        `;
        }
    } catch (error) {
        console.error('Error loading session history:', error);
        const historyContainer = document.getElementById('session-history-list');
        if (historyContainer) {
            historyContainer.innerHTML = `
                    <div class="p-4 text-center text-red-500 text-sm">
                        Failed to load session history.
                    </div>
        `;
        }
    }
}



function renderSessionListHtml(sessions) {
    const user = getCurrentUser();
    const role = user ? (user.role || user.user_role || 'User') : 'User';
    const isStaffOrAdmin = isStaffOrAdminRole(user);

    if (!sessions || sessions.length === 0) {
        return `
            <div class="p-12 text-center">
                <div class="w-20 h-20 rounded-full bg-gray-50 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-slate-700">
                    <i class="bi bi-calendar-x text-4xl text-gray-400 dark:text-gray-500"></i>
                </div>
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2">No Sessions Found</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-4 text-sm">Try adjusting your search or filters.</p>
            </div>
        `;
    }

    return `
        <div class="divide-y divide-gray-100 dark:divide-slate-700">
            ${sessions.map(s => {
        const sessionDate = new Date(s.session_date);
        const execStatus = (s.status || '').toLowerCase();
        const lockedStatuses = ['missed', 'completed', 'cancelled', 'canceled', 'postponed'];
        const isLocked = lockedStatuses.includes(execStatus);
        const canReschedule = ['missed', 'postponed'].includes(execStatus);

        // Refined Status Colors
        const statusColors = {
            'Completed': { bg: 'green-50', darkBg: 'green-900/20', text: 'green-700', darkText: 'green-400', border: 'green-200', darkBorder: 'green-900/30', icon: 'green-600' },
            'Scheduled': { bg: 'blue-50', darkBg: 'blue-900/20', text: 'blue-700', darkText: 'blue-400', border: 'blue-200', darkBorder: 'blue-900/30', icon: 'blue-600' },
            'Cancelled': { bg: 'gray-100', darkBg: 'gray-800/50', text: 'gray-700', darkText: 'gray-400', border: 'gray-200', darkBorder: 'gray-700', icon: 'gray-600' },
            'Ongoing': { bg: 'orange-50', darkBg: 'orange-900/20', text: 'orange-700', darkText: 'orange-400', border: 'orange-200', darkBorder: 'orange-900/30', icon: 'orange-600' },
            'Inactive': { bg: 'red-50', darkBg: 'red-900/20', text: 'red-700', darkText: 'red-400', border: 'red-200', darkBorder: 'red-900/30', icon: 'red-600' }
        };
        const colors = statusColors[s.status] || statusColors['Scheduled'];

        // Session Type Color Mapping
        const typeColors = {
            'Regular Session': { bg: 'blue-50', darkBg: 'blue-900/20', text: 'blue-700', darkText: 'blue-400', border: 'blue-200', darkBorder: 'blue-900/30' },
            'Special Session': { bg: 'yellow-50', darkBg: 'yellow-900/20', text: 'yellow-700', darkText: 'yellow-400', border: 'yellow-200', darkBorder: 'yellow-900/30' },
            'Emergency Session': { bg: 'red-50', darkBg: 'red-900/20', text: 'red-700', darkText: 'red-400', border: 'red-200', darkBorder: 'red-900/30' }
        };
        const tColors = typeColors[s.session_type] || typeColors['Regular Session'];

        return `
                    <div class="p-6 md:px-8 hover:bg-gray-50/80 dark:hover:bg-slate-700/30 transition-all group cursor-pointer relative" onclick="viewSessionDetails(${s.session_id})">
                        <div class="flex items-start justify-between gap-6">
                            <div class="flex-1">
                                <div class="flex items-start gap-5">
                                    ${isAdminRole(role) ? `
                                        <div class="flex items-center pt-5" onclick="event.stopPropagation()">
                                            <input type="checkbox" name="sessionSelect" value="${s.session_id}" onchange="window.updateSelectionState()" class="session-checkbox w-5 h-5 rounded border-gray-300 dark:border-slate-600 text-red-600 focus:ring-red-500 transition-all cursor-pointer">
                                        </div>
                                    ` : ''}
                                    <!-- Date Box -->
                                    <div class="hidden md:flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 shadow-sm flex-shrink-0 group-hover:border-red-200 dark:group-hover:border-red-900/50 transition-colors">
                                        <span class="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">${sessionDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                                        <span class="text-2xl font-black text-gray-900 dark:text-white leading-none mt-0.5">${sessionDate.getDate()}</span>
                                    </div>

                                    <div class="flex-1">
                                        <div class="flex flex-wrap items-center gap-3 mb-2">
                                            <h4 class="font-black text-gray-900 dark:text-white text-lg group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors tracking-tight">${s.title}</h4>
                                            
                                            <div class="flex gap-2">
                                                <span class="px-2.5 py-0.5 bg-${colors.bg} dark:bg-${colors.darkBg} text-${colors.text} dark:text-${colors.darkText} rounded-lg text-[10px] uppercase font-bold tracking-wider border border-${colors.border} dark:border-${colors.darkBorder} shadow-sm">
                                                    ${s.status}
                                                </span>
                                                <span class="px-2.5 py-0.5 bg-${tColors.bg} dark:bg-${tColors.darkBg} text-${tColors.text} dark:text-${tColors.darkText} rounded-lg text-[10px] uppercase font-bold tracking-wider border border-${tColors.border} dark:border-${tColors.darkBorder} shadow-sm">
                                                    ${s.session_type}
                                                </span>
                                                <span class="px-2.5 py-0.5 ${s.session_status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30'} rounded-lg text-[10px] uppercase font-bold tracking-wider border shadow-sm">
                                                    ${s.session_status}
                                                </span>
                                            </div>
                                        </div>

                                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-6 text-sm text-gray-500 dark:text-gray-400">
                                            <div class="flex items-center gap-2">
                                                <i class="bi bi-clock text-red-400 dark:text-red-500/70"></i>
                                                <span class="font-medium">
                                                    ${s.start_time} - ${s.end_time}
                                                </span>
                                            </div>
                                            
                                            ${s.venue ? `
                                            <div class="flex items-center gap-2">
                                                <i class="bi bi-geo-alt text-red-400 dark:text-red-500/70"></i>
                                                <span class="font-medium truncate" ${s.venue_address ? `title=\"${(s.venue_address || '').replace(/\"/g, '&quot;')}\"` : ''}>${s.venue}</span>
                                            </div>
                                            ` : ''}

                                            ${s.presiding_officer ? `
                                            <div class="flex items-center gap-2 md:col-span-2 lg:col-span-1">
                                                <i class="bi bi-person-badge text-red-400 dark:text-red-500/70"></i>
                                                <span class="font-medium truncate">Presiding: ${s.presiding_officer || 'None'}</span>
                                            </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onclick="event.stopPropagation()">
                                ${isStaffOrAdmin ? `
                                    ${s.session_status === 'Inactive' ? `
                                        ${isAdminRole(role) ? `
                                        <button onclick="window.restoreSession(${s.session_id})" class="p-2 text-gray-400 dark:text-gray-500 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 rounded-lg transition" title="Restore Session">
                                            <i class="bi bi-arrow-counterclockwise font-bold"></i>
                                        </button>
                                        ` : ''}
                                    ` : !isLocked ? `
                                        <button onclick="window.editSession(${s.session_id})" class="p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition" title="Edit">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                    ` : ''}
                                    ${canReschedule ? `
                                        <button onclick="window.rescheduleSession(${s.session_id})" class="p-2 text-gray-400 dark:text-gray-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition" title="Reschedule">
                                            <i class="bi bi-arrow-repeat"></i>
                                        </button>
                                    ` : ''}
                                ` : ''}
                                ${(isAdminRole(role) || s.created_by == (user.id || user.user_id)) ? `
                                    <button onclick="event.stopPropagation(); deleteSession(${s.session_id})" class="p-2 text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition" title="${s.session_status === 'Inactive' ? 'Delete Permanently' : 'Delete'}">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                ` : ''}
                                ${isStaffOrAdmin ? `
                                    <div class="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center text-gray-400 group-hover:bg-red-50 dark:group-hover:bg-red-900/20 group-hover:text-red-600 dark:group-hover:text-red-400 transition-all">
                                        <i class="bi bi-chevron-right text-xs"></i>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

// Bulk Action Logic
window.toggleSelectAll = function (checkbox) {
    const checkboxes = document.querySelectorAll('.session-checkbox');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
    window.updateSelectionState();
};

window.updateSelectionState = function () {
    const checkboxes = document.querySelectorAll('.session-checkbox');
    const selected = Array.from(checkboxes).filter(cb => cb.checked);
    const defaultHeader = document.getElementById('defaultHeader');
    const bulkHeader = document.getElementById('bulkHeader');
    const selectedCount = document.getElementById('selectedCount');
    const selectAllCb = document.getElementById('selectAllSessions');
    const selectAllBulkCb = document.getElementById('selectAllSessionsBulk');

    if (selected.length > 0) {
        if (defaultHeader && bulkHeader && bulkHeader.classList.contains('hidden')) {
            defaultHeader.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            setTimeout(() => {
                defaultHeader.classList.add('hidden');
                bulkHeader.classList.remove('hidden');
                setTimeout(() => {
                    bulkHeader.classList.remove('opacity-0', 'scale-95');
                    bulkHeader.classList.add('opacity-100', 'scale-100');
                }, 10);
            }, 300);
        }
        if (selectedCount) selectedCount.textContent = selected.length;
        const allChecked = selected.length === checkboxes.length;
        if (selectAllCb) selectAllCb.checked = allChecked;
        if (selectAllBulkCb) selectAllBulkCb.checked = allChecked;
    } else {
        if (defaultHeader && bulkHeader && !bulkHeader.classList.contains('hidden')) {
            bulkHeader.classList.add('opacity-0', 'scale-95');
            setTimeout(() => {
                bulkHeader.classList.add('hidden');
                defaultHeader.classList.remove('hidden');
                setTimeout(() => {
                    defaultHeader.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
                    defaultHeader.classList.add('opacity-100', 'scale-100');
                }, 10);
            }, 300);
        }
        if (selectAllCb) selectAllCb.checked = false;
        if (selectAllBulkCb) selectAllBulkCb.checked = false;
    }
};

window.clearSelection = function () {
    const checkboxes = document.querySelectorAll('.session-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
    const selectAllCb = document.getElementById('selectAllSessions');
    const selectAllBulkCb = document.getElementById('selectAllSessionsBulk');
    if (selectAllCb) selectAllCb.checked = false;
    if (selectAllBulkCb) selectAllBulkCb.checked = false;
    window.updateSelectionState();
};

window.bulkDeleteSessions = async function () {
    const checkboxes = document.querySelectorAll('.session-checkbox:checked');
    const sessionIds = Array.from(checkboxes).map(cb => cb.value);

    if (sessionIds.length === 0) return;

    const confirmed = await window.showConfirmModal({
        title: `Delete ${sessionIds.length} Sessions?`,
        message: "This will move active sessions to inactive. Inactive sessions will be permanently deleted.",
        confirmText: 'Yes, delete all',
        type: 'danger'
    });

    if (confirmed) {
        try {
            showMainLoading('Deleting sessions...');
            const response = await fetch('../api/api_sessions.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'bulk_delete',
                    session_ids: sessionIds
                })
            });

            const data = await response.json();
            hideMainLoading();

            if (data.success) {
                showNotification(data.message, 'success');
                window.clearSelection();
                // Clear cache and reload
                window.cachedSessions = null;
                await renderSessionsEnhanced();
            } else {
                showNotification(data.message || 'Error performing bulk delete', 'error');
            }
        } catch (error) {
            hideMainLoading();
            console.error('Bulk delete error:', error);
            showNotification('Network error during bulk delete', 'error');
        }
    }
};

// Global filter function for sessions
window.filterSessions = function () {
    const searchTerm = document.getElementById('sessionSearchInput')?.value.toLowerCase().trim() || '';
    const statusFilter = document.getElementById('sessionStatusFilter')?.value || 'all';
    const visibilityFilter = document.getElementById('sessionVisibilityFilter')?.value || 'all';
    const typeFilter = document.getElementById('sessionTypeFilter')?.value || 'all';
    const sortOrder = document.getElementById('sessionSortOrder')?.value || 'desc';

    let filtered = window.cachedSessions.filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchTerm) ||
            (s.venue && s.venue.toLowerCase().includes(searchTerm)) ||
            (s.presiding_officer && s.presiding_officer.toLowerCase().includes(searchTerm));

        const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
        const matchesVisibility = visibilityFilter === 'all' || s.session_status === visibilityFilter;
        const matchesType = typeFilter === 'all' || s.session_type === typeFilter;

        return matchesSearch && matchesStatus && matchesVisibility && matchesType;
    });

    // Enhanced Sort: Pin Emergency Sessions to top, then apply selected sort order
    filtered.sort((a, b) => {
        const isEmergencyA = a.session_type === 'Emergency Session';
        const isEmergencyB = b.session_type === 'Emergency Session';

        // Priority 1: Emergency Sessions always on top
        if (isEmergencyA && !isEmergencyB) return -1;
        if (!isEmergencyA && isEmergencyB) return 1;

        // Priority 2: Sort by Session Date
        const dateA = new Date(a.session_date);
        const dateB = new Date(b.session_date);

        if (dateA - dateB !== 0) {
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        }

        // Priority 3: Tie-breaker - Creation order (newest ID first for most recent)
        const idA = parseInt(a.session_id || a.id);
        const idB = parseInt(b.session_id || b.id);
        return sortOrder === 'desc' ? idB - idA : idA - idB;
    });

    const container = document.getElementById('sessions-list-container');
    if (container) {
        container.innerHTML = renderSessionListHtml(filtered);
    }
};

// Reset function
window.resetSessionFilters = function () {
    const searchInput = document.getElementById('sessionSearchInput');
    const statusFilter = document.getElementById('sessionStatusFilter');
    const visibilityFilter = document.getElementById('sessionVisibilityFilter');
    const typeFilter = document.getElementById('sessionTypeFilter');
    const sortOrder = document.getElementById('sessionSortOrder');

    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = 'all';
    if (visibilityFilter) visibilityFilter.value = 'all';
    if (typeFilter) typeFilter.value = 'all';
    if (sortOrder) sortOrder.value = 'desc';

    filterSessions();
};

// Override the original renderSessions
window.renderSessions = window.renderSessionsEnhanced;

/**
 * Send reminder for a session to all Administrator and Staff users
 * @param {number} sessionId 
 */
window.sendSessionReminder = async function (sessionId) {
    try {
        // Fetch session details
        const sessionResponse = await fetch(`../api/api_sessions.php?id=${sessionId}`);
        const sessionData = await sessionResponse.json();

        if (!sessionData.success || !sessionData.session) {
            showNotification('Failed to load session details', 'error');
            return;
        }

        const session = sessionData.session;

        // Format date and time safely
        const sessionDateSafe = session.session_date ? new Date(session.session_date) : null;
        const dateStr = (sessionDateSafe && !isNaN(sessionDateSafe))
            ? sessionDateSafe.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
            : 'TBD';

        let timeStr = 'TBD';
        if (session.actual_start) {
            const startTime = new Date(session.actual_start);
            timeStr = startTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }

        // Format venue
        const venue = session.venue || 'TBD';

        // Create reminder message following the format: 
        // "Reminder: {session_title} ({session_type}) will start on {date} at {time} at {venue}."
        const reminderMessage = `Reminder: ${session.title} (${session.session_type}) will start on ${dateStr} at ${timeStr} at ${venue}.`;

        // Calculate reminder date (1 hour before session, or use session date if no time)
        let reminderDate = sessionDateSafe && !isNaN(sessionDateSafe) ? new Date(sessionDateSafe) : new Date();
        if (session.actual_start) {
            reminderDate = new Date(session.actual_start);
            reminderDate.setHours(reminderDate.getHours() - 1);
        } else {
            reminderDate.setHours(9, 0, 0, 0); // Default to 9 AM if no time
            reminderDate.setDate(reminderDate.getDate() - 1); // 1 day before if no specific time
        }

        // Show confirmation modal
        const confirmModal = `
        <div id="sendReminderModal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-sm">
            <div class="relative p-6 border w-full max-w-md shadow-2xl rounded-2xl bg-white animate-fade-in-up m-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-900">Send Session Reminder</h3>
                    <button onclick="document.getElementById('sendReminderModal').remove()" class="text-gray-400 hover:text-gray-600 transition">
                        <i class="bi bi-x-lg text-xl"></i>
                    </button>
                </div>
                <div class="space-y-4">
                    <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p class="text-sm text-gray-600 mb-2"><strong>Session:</strong> ${session.title}</p>
                        <p class="text-sm text-gray-600 mb-2"><strong>Date & Time:</strong> ${dateStr} at ${timeStr}</p>
                        <p class="text-sm text-gray-600 mb-2"><strong>Venue:</strong> ${venue}</p>
                        <p class="text-sm text-gray-600"><strong>Reminder Time:</strong> ${reminderDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })}</p>
                    </div>
                    <p class="text-sm text-gray-600">This will send reminders to all <strong>Administrator</strong> and <strong>Staff</strong> users.</p>
                    <div class="flex gap-3 pt-4">
                        <button onclick="document.getElementById('sendReminderModal').remove()" class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition">
                            Cancel
                        </button>
                        <button onclick="confirmSendSessionReminder(${sessionId}, '${reminderMessage.replace(/'/g, "\\'")}', '${reminderDate.toISOString()}')" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition">
                        <i class="bi bi-send mr-2"></i>Send Reminder
                    </button>
                </div>
            </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', confirmModal);

    } catch (error) {
        console.error('Error preparing reminder:', error);
        showNotification('Error preparing reminder: ' + error.message, 'error');
    }
};

/**
 * Confirm and send session reminder
 */
window.confirmSendSessionReminder = async function (sessionId, message, reminderDate) {
    try {
        document.getElementById('sendReminderModal').remove();

        // Call API to create role-based reminders
        const response = await fetch('../api/api_reminders.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: 'Upcoming Session Reminder',
                message: message,
                reminder_date: reminderDate,
                related_type: 'Session',
                related_id: sessionId,
                target_roles: 'Super Admin,Admin,Staff',
                role_based: true // Flag to indicate role-based creation
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification(`Reminders sent successfully to ${data.count || 'all'} users`, 'success');
        } else {
            showNotification(data.message || 'Failed to send reminders', 'error');
        }
    } catch (error) {
        console.error('Error sending reminder:', error);
        showNotification('Error sending reminder: ' + error.message, 'error');
    }
};
window.openManageStaffModal = async function (sessionId) {
    try {
        // Fetch all users to find potential staff
        const userRes = await fetch('../api/api_users.php');
        const userData = await userRes.json();

        if (!userData.success) {
            showNotification('Failed to load users', 'error');
            return;
        }

        const staffUsers = userData.users.filter(u =>
            ['User', 'Staff'].includes(u.user_role) &&
            (u.status || 'Active') === 'Active'
        );

        // Get current session data to see existing assignments
        const sessionRes = await fetch(`../ api / api_sessions.php ? id = ${sessionId} `);
        const sessionData = await sessionRes.json();

        if (!sessionData.success || !sessionData.session) {
            showNotification('Failed to load session details', 'error');
            return;
        }

        const session = sessionData.session;
        const currentAssignedIds = (session.assigned_staff || []).map(s => parseInt(s.user_id));

        const existing = document.getElementById('manageStaffModal');
        if (existing) existing.remove();

        const modalHtml = `
        <div id="manageStaffModal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[60] backdrop-blur-sm">
            <div class="relative p-6 border w-full max-w-md shadow-2xl rounded-2xl bg-white animate-fade-in-up m-4">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h3 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <i class="bi bi-people text-red-600"></i>
                            Manage Staff
                        </h3>
                        <p class="text-sm text-gray-500 mt-1">Assign staff to ${session.title}</p>
                    </div>
                    <button onclick="document.getElementById('manageStaffModal').remove()" class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition">
                        <i class="bi bi-x-lg text-xl"></i>
                    </button>
                </div>

                <div class="space-y-4">
                    <div class="max-h-60 overflow-y-auto pr-2 space-y-2">
                        ${staffUsers.map(u => `
                                <label class="flex items-center p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-all group">
                                    <input type="checkbox" class="staff-assign-checkbox w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500" 
                                           value="${u.user_id}" ${currentAssignedIds.includes(parseInt(u.user_id)) ? 'checked' : ''}>
                                    <div class="ml-3 flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-xs text-red-600 font-bold">
                                            ${u.user_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p class="text-sm font-semibold text-gray-800">${u.user_name}</p>
                                            <p class="text-[10px] text-gray-400">${u.email || u.username}</p>
                                        </div>
                                    </div>
                                </label>
                            `).join('')}
                        ${staffUsers.length === 0 ? '<p class="text-center text-gray-500 py-4">No staff users found</p>' : ''}
                    </div>

                    <div class="flex gap-3 pt-4 border-t border-gray-100">
                        <button onclick="document.getElementById('manageStaffModal').remove()" class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition">
                            Cancel
                        </button>
                        <button onclick="saveSessionAssignments(${sessionId})" class="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-medium shadow-lg shadow-red-500/30 transition-all">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
    </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

    } catch (e) {
        console.error('Error opening manage staff modal:', e);
        showNotification('An error occurred', 'error');
    }
};

window.saveSessionAssignments = async function (sessionId) {
    const checkboxes = document.querySelectorAll('.staff-assign-checkbox:checked');
    const userIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    try {
        const response = await fetch('../api/api_sessions.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                action: 'update_assignments',
                user_ids: userIds
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Assignments updated successfully', 'success');
            document.getElementById('manageStaffModal').remove();

            // Refresh the session details view to show updated staff
            // We need to clear cache first to force a fresh fetch
            if (window.cachedSessions) {
                window.cachedSessions = window.cachedSessions.filter(s => parseInt(s.session_id || s.id) !== parseInt(sessionId));
            }
            viewSessionDetails(sessionId);
        } else {
            showNotification(data.message || 'Failed to update assignments', 'error');
        }
    } catch (e) {
        console.error('Error saving assignments:', e);
        showNotification('An error occurred while saving', 'error');
    }
};

/**
 * Restore a soft-deleted (Inactive) session
 * @param {number} sessionId 
 */
window.restoreSession = async function (sessionId) {
    const confirmed = await window.showConfirmModal({
        title: 'Restore Session?',
        message: 'Are you sure you want to restore this session?',
        description: 'This will move the session from Inactive/Deleted back to Scheduled status.',
        confirmText: 'Restore Session',
        type: 'success'
    });

    if (!confirmed) return;

    try {
        const response = await fetch('../api/api_sessions.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                status: 'Scheduled',
                session_status: 'Active'
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Session restored to Scheduled status.', 'success');

            // Clear cached sessions so details will be re-fetched with fresh data
            if (window.cachedSessions) {
                window.cachedSessions = window.cachedSessions.filter(s => parseInt(s.session_id || s.id) !== parseInt(sessionId));
            }

            // Refresh sessions list
            if (window.renderSessionsEnhanced) {
                window.renderSessionsEnhanced();
            } else if (window.renderSessions) {
                window.renderSessions();
            }
        } else {
            showNotification(data.message || 'Failed to restore session', 'error');
        }
    } catch (e) {
        console.error('Error restoring session:', e);
        showNotification('An error occurred while restoring the session', 'error');
    }
};
