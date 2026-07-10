// Agendas Module for LACS
// Contains the enhanced agendas functionality
// Intended to be loaded after main-features.js

// ==============================
// AGENDAS MODULE - ENHANCED VERSION
// ==============================
window.renderAgendasEnhanced = async function () {
    try {
        console.log('Loading agendas...');
        window.isSubView = false;
        const user = getCurrentUser();
        const role = user ? (user.role || user.user_role || 'User') : 'User';
        const isStaffOrAdmin = (role.toLowerCase() === 'super admin' || role.toLowerCase() === 'admin') || role.toLowerCase() === 'staff';

        const response = await fetch('../api/api_agendas.php');
        const data = await response.json();

        console.log('Agendas API Response:', data);

        if (!data.success) {
            showNotification('Failed to load agendas: ' + data.message, 'error');
            return;
        }

        const agendas = data.agendas || [];
        // Enforce rule: inactive sessions should never be visible in Agenda module
        const sessions = (data.sessions || []).filter(s => (s.session_status || 'Active') !== 'Inactive');

        console.log('Agendas:', agendas);
        console.log('Sessions:', sessions);

        // Cache for later use
        window.cachedAgendas = agendas;
        window.cachedAgendasSessions = sessions;

        // Group agendas by session - FIXED
        const agendasBySession = {};

        // Initialize all (active) sessions
        sessions.forEach(s => {
            agendasBySession[s.session_id] = {
                session: s,
                agendas: []
            };
        });

        // Add agendas to their sessions (only active sessions exist in agendasBySession)
        agendas.forEach(a => {
            if (agendasBySession[a.session_id]) {
                agendasBySession[a.session_id].agendas.push(a);
            }
        });

        // Cache agendasBySession after it's created
        window.cachedAgendasBySession = agendasBySession;

        const totalAgendas = agendas.length;
        const totalSessions = Object.values(agendasBySession).length;
        const sessionsWithAgendas = Object.values(agendasBySession).filter(g => g.agendas.length > 0).length;
        const avgPerSession = sessionsWithAgendas > 0 ? Math.round(totalAgendas / sessionsWithAgendas) : 0;

        console.log('Sessions with agendas:', sessionsWithAgendas);
        console.log('Agendas by session:', agendasBySession);

        const html = `
        <div class="space-y-8 animate-fade-in-up">
            <!-- Premium Header - Standardized Size -->
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-8 shadow-xl">
                <div class="absolute inset-0 bg-black opacity-10"></div>
                <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                <div class="relative z-10">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div class="text-white">
                            <h1 class="text-3xl font-black mb-2 tracking-tight">Session Agendas</h1>
                            <p class="text-red-100 text-sm font-medium">Manage and organize agenda items for each legislative session</p>
                        </div>
                        <div class="flex gap-2">
                            ${isStaffOrAdmin ? `
                            <button onclick="openCreateAgendaModal()" class="px-5 py-2.5 bg-white text-red-600 rounded-xl hover:bg-red-50 text-sm font-bold flex items-center gap-2 shadow-lg transition-all hover:-translate-y-0.5">
                                <i class="bi bi-plus-lg"></i> New Agenda
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Grid - Aligned with Sessions Dashboard -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Total Agendas -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center text-xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                            <i class="bi bi-list-check"></i>
                        </div>
                    </div>
                    <div>
                        <p class="text-3xl font-black text-red-950 dark:text-white tracking-tight mb-1">${totalAgendas}</p>
                        <p class="text-sm text-red-900/60 dark:text-gray-400 font-bold uppercase tracking-wider">Total Agendas</p>
                    </div>
                </div>

                <!-- Sessions with Agendas -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <i class="bi bi-calendar-event"></i>
                        </div>
                    </div>
                    <div>
                        <p class="text-3xl font-black text-gray-800 dark:text-white tracking-tight mb-1">${totalSessions}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Sessions Tracked</p>
                    </div>
                </div>

                <!-- Average Items per Session -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center text-xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            <i class="bi bi-bar-chart"></i>
                        </div>
                    </div>
                    <div>
                        <p class="text-3xl font-black text-gray-800 dark:text-white tracking-tight mb-1">${avgPerSession}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Avg Items / Session</p>
                    </div>
                </div>
            </div>

            <!-- Sessions List with Cards -->
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors duration-300">
                <div class="px-6 md:px-8 py-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-800/50">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 class="text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                            Sessions with Agendas
                            <span class="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs uppercase font-bold tracking-wider leading-none">Active</span>
                        </h3>
                        <div class="flex flex-wrap items-center gap-3">
                            <select id="agendaSessionTypeFilter" onchange="filterAgendaSessions()" class="px-4 py-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors">
                                <option value="all">All Types</option>
                                <option value="Regular Session">Regular Session</option>
                                <option value="Special Session">Special Session</option>
                                <option value="Emergency Session">Emergency Session</option>
                            </select>
                            <div class="relative">
                                <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs"></i>
                                <input type="text" id="agendaSessionSearchInput" oninput="filterAgendaSessions()" placeholder="Search sessions..." class="pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors w-48">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="agenda-sessions-list-container" class="divide-y divide-gray-100 dark:divide-slate-700">
                    ${renderAgendaSessionListHtml(Object.values(agendasBySession))}
                </div>
            </div>
        </div>
        `;
        document.getElementById('content-area').innerHTML = html;
    } catch (e) {
        console.error('Error loading agendas:', e);
        showNotification('Error loading agendas', 'error');
    }
};

// Override original renderAgendas
window.renderAgendas = window.renderAgendasEnhanced;
window.renderAdminAgendas = window.renderAgendasEnhanced;
window.renderStaffAgendas = window.renderAgendasEnhanced;

/**
 * View specific agenda details with session context
 * @param {number} agendaId 
 * @param {number} sessionId 
 */
window.viewAgendaSpecificDetails = async function (agendaId, sessionId, viewOnly = false) {
    console.log('viewAgendaSpecificDetails called with:', { agendaId, sessionId, viewOnly });
    window.isSubView = true;
    window.activeSection = viewOnly ? 'sessions' : 'agendas';
    const user = getCurrentUser();
    const role = user ? (user.role || user.user_role || 'User') : 'User';
    const isStaffOrAdmin = (role.toLowerCase() === 'super admin' || role.toLowerCase() === 'admin') || role.toLowerCase() === 'staff';
    try {
        // Find session in cache
        const session = window.cachedSessions?.find(s => (s.session_id || s.id) == sessionId);
        const execStatus = session ? (session.status || '').toLowerCase() : '';
        const lockedStatuses = ['missed', 'completed', 'cancelled', 'canceled', 'postponed'];
        const isSessionInactive = session && ((session.session_status || 'Active') === 'Inactive' || lockedStatuses.includes(execStatus));

        // Fetch agenda details from API
        const response = await fetch(`../api/api_agendas.php?id=${agendaId}`);
        const data = await response.json();

        if (!data.success) {
            showNotification('Failed to load agenda details', 'error');
            return;
        }

        const agenda = data.agenda;
        window.currentAgenda = agenda;
        const sessionTitle = session ? session.title : (agenda.session_title || 'Session');

        // Update Global UI elements for "Nested Directory Mode"
        const pageTitle = document.getElementById('page-title');
        const breadcrumbCurrent = document.getElementById('breadcrumb-current');

        if (pageTitle) pageTitle.textContent = viewOnly ? 'Sessions' : 'Agendas';
        if (breadcrumbCurrent) {
            const firstBreadcrumb = viewOnly
                ? `<a href="#" onclick="renderSessions()" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">Sessions</a>`
                : `<a href="#" onclick="showSection('agendas')" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">Agenda</a>`;
            const backAction = viewOnly
                ? `viewSessionDetails(${sessionId})`
                : `viewSessionAgenda(${sessionId})`;

            breadcrumbCurrent.innerHTML = `
                ${firstBreadcrumb}
                <i class="bi bi-chevron-right mx-2 text-xs"></i>
                <a href="#" onclick="${backAction}" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">${sessionTitle}</a>
                <i class="bi bi-chevron-right mx-2 text-xs"></i>
                <span class="text-gray-800 dark:text-white font-medium">${agenda.agenda_title}</span>
            `;
        }

        const html = `
            <div class="space-y-6 animate-fade-in-up">
                <!-- Directory Navigation -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border mb-6 transition-colors duration-300">
                    <div class="flex items-center gap-4">
                        <button onclick="${viewOnly ? `viewSessionDetails(${sessionId})` : `viewSessionAgenda(${sessionId})`}" class="w-10 h-10 rounded-lg bg-gray-50 dark:bg-dark-bg flex items-center justify-center text-gray-600 dark:text-dark-muted hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all border border-gray-200 dark:border-dark-border">
                            <i class="bi bi-arrow-left"></i>
                        </button>
                        <div>
                            <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-muted">
                                <span class="hover:text-red-600 dark:hover:text-red-400 cursor-pointer" onclick="${viewOnly ? `renderSessions()` : `showSection('agendas')`}">${viewOnly ? 'Sessions' : 'Agenda'}</span>
                                <i class="bi bi-chevron-right text-[10px]"></i>
                                <span class="hover:text-red-600 dark:hover:text-red-400 cursor-pointer" onclick="${viewOnly ? `viewSessionDetails(${sessionId})` : `viewSessionAgenda(${sessionId})`}">${sessionTitle}</span>
                                <i class="bi bi-chevron-right text-[10px]"></i>
                                <span class="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">${agenda.agenda_title}</span>
                            </div>
                            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Agenda Details</h2>
                        </div>
                    </div>
                    
                </div>

                <!-- Agenda Header Content -->
                <div class="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden transition-colors duration-300">
                    <div class="bg-gradient-to-r from-red-600 to-red-800 p-8 text-white relative">
                        <div class="absolute top-0 right-0 p-8 opacity-10">
                            <i class="bi bi-journal-text text-9xl"></i>
                        </div>
                        <div class="relative z-10">
                            <span class="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-4 inline-block border border-white/30">
                                ${agenda.status || 'Published'}
                            </span>
                            <h2 class="text-3xl font-black mb-1 tracking-tight">${agenda.agenda_title}</h2>
                            ${agenda.agenda_description ? `<p class="text-red-100/80 text-sm mb-3 font-medium max-w-2xl">${agenda.agenda_description}</p>` : ''}
                            <div class="flex flex-wrap items-center gap-4 text-red-50 text-sm">
                                <div class="flex items-center gap-1">
                                    <i class="bi bi-calendar-event"></i>
                                    Part of: ${sessionTitle}
                                </div>
                                <div class="flex items-center gap-1">
                                    <i class="bi bi-clock"></i>
                                    Last Modified: ${agenda.lastModified || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="p-8">
                            <div class="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-dark-border">
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <i class="bi bi-list-ol text-red-600"></i>
                                Agenda Items
                            </h3>
                            <div class="flex gap-2">
                                ${isStaffOrAdmin && !isSessionInactive ? `
                                <button onclick="openCreateAgendaItemModal(${agenda.agenda_id}, '${agenda.agenda_title.replace(/'/g, "\\'")}', ${sessionId})" class="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg hover:bg-red-600 dark:hover:bg-red-700 hover:text-white transition-all">
                                    <i class="bi bi-plus-lg mr-1"></i> Add Item
                                </button>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Agenda Items List -->
                        <div class="space-y-6">
                            ${agenda.items && agenda.items.length > 0 ? agenda.items.map((item, index) => `
                                <div onclick="viewAgendaItemDetailsFull(${item.agenda_item_id}, ${agenda.agenda_id}, ${sessionId})" class="cursor-pointer p-6 rounded-2xl border border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg/50 hover:shadow-md transition-all group">
                                    <div class="flex items-start gap-4">
                                        <div class="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-lg shadow-red-500/20 flex-shrink-0">
                                            ${index + 1}
                                        </div>
                                        <div class="flex-1">
                                            <div class="flex flex-wrap items-center gap-2 mb-1">
                                                <h4 class="text-lg font-bold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">${item.title}</h4>
                                                <span class="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${item.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-900/30' :
                item.status === 'Revision Needed' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-900/30' :
                    item.status === 'Deferred' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/30' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30'
            }">
                                                    ${item.status || 'Pending'}
                                                </span>
                                            </div>
                                            ${item.description ? `<p class="text-sm text-gray-600 dark:text-dark-muted leading-relaxed line-clamp-2">${item.description}</p>` : ''}
                                            <div class="mt-3 flex flex-wrap items-center gap-4 text-sm font-medium">
                                                ${item.deadline ? `
                                                <div class="flex items-center gap-2 text-red-600 dark:text-red-400">
                                                    <i class="bi bi-calendar-event"></i>
                                                    <span>Deadline: ${new Date(item.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                                    <span class="text-xs text-gray-500 dark:text-dark-muted font-normal">(${new Date(item.deadline).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })})</span>
                                                </div>
                                                ` : ''}
                                                
                                                ${item.assigned_user_name ? `
                                                <div class="flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/30">
                                                    <i class="bi bi-person-fill text-xs"></i>
                                                    <span class="text-xs uppercase tracking-wider font-bold">${item.assigned_user_name}</span>
                                                </div>
                                                ` : ''}
                                            </div>
                                        </div>
                                        ${isStaffOrAdmin && !isSessionInactive ? `
                                        <div class="flex-shrink-0 self-center ml-4 flex gap-2">
                                            <button onclick="event.stopPropagation(); openEditAgendaItemModal(${item.agenda_item_id}, ${agenda.agenda_id}, ${sessionId}, false)" class="w-9 h-9 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 dark:border-blue-900/30" title="Edit Item">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            ${isStaffOrAdmin ? `
                                            <button onclick="event.stopPropagation(); deleteAgendaItem(${item.agenda_item_id}, ${agenda.agenda_id}, ${sessionId})" class="w-9 h-9 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100 dark:border-red-900/30" title="Delete Item">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                            ` : ''}
                                        </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('') : `
                                <div class="text-center py-20 bg-gray-50/50 dark:bg-dark-bg/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-dark-border">
                                    <div class="w-20 h-20 bg-white dark:bg-dark-card rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100 dark:border-dark-border">
                                        <i class="bi bi-journal-x text-4xl text-gray-300 dark:text-dark-muted"></i>
                                    </div>
                                    <h4 class="text-lg font-bold text-gray-800 dark:text-white mb-1">No Items in this Agenda</h4>
                                    <p class="text-gray-500 dark:text-dark-muted text-sm max-w-sm mx-auto">Start building your agenda by adding items like resolutions, ordinances, or other topics for discussion.</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('content-area').innerHTML = html;
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error('Error viewing specific agenda:', error);
        showNotification('Error: ' + error.message, 'error');
    }
};

/**
 * View agenda for a specific session
 * @param {number} sessionId 
 */
window.viewSessionAgenda = async function (sessionId) {
    window.isSubView = true;
    window.activeSection = 'agendas';
    const user = getCurrentUser();
    const role = user ? (user.role || user.user_role || 'User') : 'User';
    const isStaffOrAdmin = (role.toLowerCase() === 'super admin' || role.toLowerCase() === 'admin') || role.toLowerCase() === 'staff';
    try {
        // Find session in cached data
        const session = window.cachedAgendasSessions?.find(s => s.session_id == sessionId) ||
            window.cachedSessions?.find(s => s.session_id == sessionId);

        if (!session) {
            showNotification('Session not found', 'error');
            return;
        }

        const execStatus = (session.status || '').toLowerCase();
        const lockedStatuses = ['missed', 'completed', 'cancelled', 'canceled', 'postponed'];
        const isSessionLockedForEditing = (session.session_status || 'Active') === 'Inactive' || lockedStatuses.includes(execStatus);

        // Set sidebar active state to 'agendas'
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === 'agendas') {
                item.classList.add('active');
            }
        });

        // Fetch agendas for this session
        const response = await fetch(`../api/api_agendas.php?session_id=${sessionId}`);
        const data = await response.json();

        if (!data.success) {
            showNotification('Failed to load agendas', 'error');
            return;
        }

        const agendas = data.agendas || [];
        const sessionDate = session.session_date ? new Date(session.session_date) : (session.date ? new Date(session.date) : new Date());

        // Update Global UI elements for "Directory Mode"
        const pageTitle = document.getElementById('page-title');
        const breadcrumbCurrent = document.getElementById('breadcrumb-current');
        if (pageTitle) pageTitle.textContent = 'Agendas';
        if (breadcrumbCurrent) {
            breadcrumbCurrent.innerHTML = `
                <a href="#" onclick="showSection('agendas')" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">Agenda</a>
                <i class="bi bi-chevron-right mx-2 text-xs"></i>
                <span class="text-gray-800 dark:text-white font-medium">${session.title}</span>
            `;
        }

        const html = `
            <div class="space-y-6 animate-fade-in-up">
                <!-- Directory Navigation -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border mb-6 transition-colors duration-300">
                    <div class="flex items-center gap-4">
                        <button onclick="showSection('agendas')" class="w-10 h-10 rounded-lg bg-gray-50 dark:bg-dark-bg flex items-center justify-center text-gray-600 dark:text-dark-muted hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all border border-gray-200 dark:border-dark-border">
                            <i class="bi bi-arrow-left"></i>
                        </button>
                        <div>
                            <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-muted">
                                <span class="hover:text-red-600 dark:hover:text-red-400 cursor-pointer" onclick="showSection('agendas')">Agenda</span>
                                <i class="bi bi-chevron-right text-[10px]"></i>
                                <span class="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">${session.title}</span>
                            </div>
                            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Session Agenda</h2>
                        </div>
                    </div>
                </div>

                <!-- Session Info Card -->
                <div class="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden transition-colors duration-300">
                    <div class="bg-gradient-to-r from-red-600 to-red-800 p-8 text-white relative">
                        <div class="absolute top-0 right-0 p-8 opacity-10">
                            <i class="bi bi-calendar-event text-9xl"></i>
                        </div>
                        <div class="relative z-10">
                            <span class="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-4 inline-block border border-white/30">
                                ${session.session_type}
                            </span>
                            <h1 class="text-3xl font-bold mb-2">${session.title}</h1>
                            <div class="flex flex-wrap items-center gap-4 text-red-50 text-sm">
                                <div class="flex items-center gap-1">
                                    <i class="bi bi-calendar3"></i>
                                    ${sessionDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div class="flex items-center gap-1">
                                    <i class="bi bi-clock"></i>
                                    <span>${session.time || (session.actual_start && session.actual_end ?
                new Date(session.actual_start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' - ' +
                new Date(session.actual_end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                (session.start_time && session.end_time ? session.start_time + ' - ' + session.end_time : 'N/A'))}</span>
                                </div>
                                ${session.venue ? `
                                <div class="flex items-center gap-1">
                                    <i class="bi bi-geo-alt"></i>
                                    ${session.venue}
                                </div>
                                ` : ''}
                                ${session.assigned_staff_names && session.assigned_staff_names.length > 0 ? `
                                <div class="flex items-center gap-1">
                                    <i class="bi bi-people"></i>
                                    Assigned: ${session.assigned_staff_names.join(', ')}
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Agenda Items List -->
                <div class="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border p-8 transition-colors duration-300">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <i class="bi bi-list-check text-red-600"></i>
                            Agenda (${agendas.length})
                        </h3>
                        ${isStaffOrAdmin && !isSessionLockedForEditing ? `
                        <button onclick="openCreateAgendaModal(${sessionId})" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all">
                            <i class="bi bi-plus-lg"></i> Agenda
                        </button>
                        ` : ''}
                    </div>
                    
                    ${agendas.length > 0 ? `
                    <div class="divide-y divide-gray-100 dark:divide-dark-border border border-gray-100 dark:border-dark-border rounded-xl overflow-hidden shadow-sm">
                        ${agendas.map((agenda, index) => {
                    const createdDate = new Date(agenda.created_at);
                    const agendaId = agenda.agenda_id || agenda.id;
                    return `
                                <div class="p-6 hover:bg-gray-50 dark:hover:bg-dark-bg transition-all group cursor-pointer" onclick="viewAgendaSpecificDetails(${agendaId}, ${sessionId})">
                                    <div class="flex items-start gap-4">
                                        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center text-red-700 font-bold border border-red-200 flex-shrink-0">
                                            ${index + 1}
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="flex flex-wrap items-center gap-2 mb-1">
                                                <h4 class="font-semibold text-gray-900 dark:text-white text-base leading-relaxed group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">${agenda.agenda_title}</h4>
                                                <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${agenda.status === 'Draft' ? 'bg-gray-100 text-gray-600 dark:bg-dark-bg dark:text-dark-muted' :
                            agenda.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        } border border-gray-200 dark:border-dark-border">
                                                    ${agenda.status || 'Draft'}
                                                </span>
                                            </div>
                                            ${agenda.agenda_description ? `<p class="text-xs text-gray-500 dark:text-dark-muted mb-2 line-clamp-2">${agenda.agenda_description}</p>` : ''}
                                            <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-dark-muted">
                                                <div class="flex items-center gap-1">
                                                    <i class="bi bi-clock"></i>
                                                    <span>Added ${createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            ${isStaffOrAdmin && !isSessionLockedForEditing ? `
                                            <button onclick="event.stopPropagation(); window.openEditAgendaModal(${agendaId})" class="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" title="Edit">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button onclick="event.stopPropagation(); deleteAgenda(${agendaId})" class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Delete">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `;
                }).join('')}
                    </div>
                    ` : `
                    <div class="p-12 border-2 border-dashed border-gray-200 dark:border-dark-border rounded-xl text-center">
                        <div class="w-16 h-16 bg-gray-50 dark:bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-dark-border">
                            <i class="bi bi-list-task text-2xl text-gray-400 dark:text-dark-muted"></i>
                        </div>
                        <h4 class="font-bold text-gray-800 dark:text-white mb-2">No Agenda Linked</h4>
                        <p class="text-gray-500 dark:text-dark-muted text-sm max-w-xs mx-auto mb-6">This session doesn't have any agenda items yet.</p>
                    </div>
                    `}
                </div>
            </div>
        `;

        document.getElementById('content-area').innerHTML = html;
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error('Error viewing session agenda:', error);
        showNotification('Error: ' + error.message, 'error');
    }
};

// Helper function to render agenda session list HTML
function renderAgendaSessionListHtml(sessionsWithAgendas) {
    const user = getCurrentUser();
    const role = user ? (user.role || user.user_role || 'User') : 'User';
    const isStaffOrAdmin = (role.toLowerCase() === 'super admin' || role.toLowerCase() === 'admin') || role.toLowerCase() === 'staff';
    if (!sessionsWithAgendas || sessionsWithAgendas.length === 0) {
        return `
            <div class="p-12 text-center">
                <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-dark-bg flex items-center justify-center mx-auto mb-4 border border-gray-200 dark:border-dark-border">
                    <i class="bi bi-calendar-x text-4xl text-gray-400 dark:text-dark-muted"></i>
                </div>
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2">No Sessions Found</h3>
                <p class="text-gray-500 dark:text-dark-muted mb-4">No sessions match your search criteria</p>
                ${isStaffOrAdmin ? `
                <button onclick="openCreateAgendaModal()" class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition inline-flex items-center gap-2">
                    <i class="bi bi-plus-lg"></i> Create Agenda
                </button>
                ` : ''}
            </div>
        `;
    }

    return `
        <div class="divide-y divide-gray-100 dark:divide-slate-700">
            ${sessionsWithAgendas.map(group => {
        const session = group.session;
        const sessionAgendas = group.agendas;
        const sessionDate = session.session_date ? new Date(session.session_date) : (session.date ? new Date(session.date) : new Date());

        // Refined Status Colors
        const statusColors = {
            'Completed': { bg: 'green-50', darkBg: 'green-900/20', text: 'green-700', darkText: 'green-400', border: 'green-200', darkBorder: 'green-900/30', icon: 'green-600' },
            'Scheduled': { bg: 'red-50', darkBg: 'red-900/20', text: 'red-800', darkText: 'red-300', border: 'red-200', darkBorder: 'red-900/30', icon: 'red-600' },
            'Cancelled': { bg: 'gray-100', darkBg: 'gray-800/50', text: 'gray-700', darkText: 'gray-400', border: 'gray-200', darkBorder: 'gray-700', icon: 'gray-600' },
            'Ongoing': { bg: 'blue-50', darkBg: 'blue-900/20', text: 'blue-700', darkText: 'blue-400', border: 'blue-200', darkBorder: 'blue-900/30', icon: 'blue-600' }
        };
        const colors = statusColors[session.status] || statusColors['Scheduled'];

        return `
                    <div class="p-6 md:px-8 hover:bg-red-50/30 dark:hover:bg-slate-700/30 transition-all group cursor-pointer" onclick="viewSessionAgenda(${session.session_id})">
                        <div class="flex items-start justify-between gap-6">
                            <div class="flex-1">
                                <div class="flex items-start gap-5">
                                    <!-- Date Box -->
                                    <div class="hidden md:flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 shadow-sm flex-shrink-0 group-hover:border-red-200 dark:group-hover:border-red-900/50 transition-colors">
                                        <span class="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">${sessionDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                                        <span class="text-2xl font-black text-gray-900 dark:text-white leading-none mt-0.5">${sessionDate.getDate()}</span>
                                    </div>

                                    <div class="flex-1">
                                        <div class="flex flex-wrap items-center gap-3 mb-2">
                                            <h4 class="font-black text-gray-900 dark:text-white text-lg group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors tracking-tight">${session.title}</h4>
                                            
                                            <div class="flex gap-2">
                                                <span class="px-2.5 py-0.5 bg-${colors.bg} dark:bg-${colors.darkBg} text-${colors.text} dark:text-${colors.darkText} rounded-lg text-[10px] uppercase font-bold tracking-wider border border-${colors.border} dark:border-${colors.darkBorder} shadow-sm">
                                                    ${session.status}
                                                </span>
                                                <span class="px-2.5 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-lg text-[10px] uppercase font-bold tracking-wider border border-gray-200 dark:border-slate-600">
                                                    ${session.session_type}
                                                </span>
                                            </div>
                                        </div>

                                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-6 text-sm text-gray-500 dark:text-gray-400">
                                            <div class="flex items-center gap-2">
                                                <i class="bi bi-clock text-red-400 dark:text-red-500/70"></i>
                                                <span class="font-medium">
                                                    ${session.time || (session.actual_start ?
                new Date(session.actual_start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                (session.start_time || 'TBD'))}
                                                </span>
                                            </div>
                                            
                                            ${session.venue ? `
                                            <div class="flex items-center gap-2">
                                                <i class="bi bi-geo-alt text-red-400 dark:text-red-500/70"></i>
                                                <span class="font-medium truncate">${session.venue}</span>
                                            </div>
                                            ` : ''}

                                            <div class="flex items-center gap-2">
                                                <i class="bi bi-list-check text-red-400 dark:text-red-500/70"></i>
                                                <span class="font-medium"><strong class="text-gray-900 dark:text-white">${sessionAgendas.length}</strong> agenda items</span>
                                            </div>

                                            ${session.presiding_officer ? `
                                            <div class="flex items-center gap-2 md:col-span-2 lg:col-span-1">
                                                <i class="bi bi-person-badge text-red-400 dark:text-red-500/70"></i>
                                                <span class="font-medium truncate">Presiding: ${session.presiding_officer}</span>
                                            </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="hidden md:flex items-center self-center">
                                <button class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-gray-500 group-hover:bg-red-600 group-hover:text-white dark:group-hover:bg-red-600 transition-all flex items-center justify-center shadow-sm">
                                    <i class="bi bi-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

// Global filter function for agenda sessions
window.filterAgendaSessions = function () {
    const searchTerm = document.getElementById('agendaSessionSearchInput')?.value.toLowerCase().trim() || '';
    const typeFilter = document.getElementById('agendaSessionTypeFilter')?.value || 'all';

    if (!window.cachedAgendasBySession) {
        return;
    }

    const filtered = Object.values(window.cachedAgendasBySession).filter(group => {
        const session = group.session;
        const matchesSearch = session.title.toLowerCase().includes(searchTerm) ||
            (session.venue && session.venue.toLowerCase().includes(searchTerm)) ||
            (session.presiding_officer && session.presiding_officer.toLowerCase().includes(searchTerm));

        const matchesType = typeFilter === 'all' || session.session_type === typeFilter;

        return matchesSearch && matchesType;
    });

    const container = document.getElementById('agenda-sessions-list-container');
    if (container) {
        container.innerHTML = renderAgendaSessionListHtml(filtered);
    }
};

/**
 * Edit Agenda Functionality
 * @param {number} agendaId 
 * @param {number} sessionId 
 */
window.editAgenda = async function (agendaId, sessionId) {
    try {
        // Fetch agenda details
        const agendaResponse = await fetch(`../api/api_agendas.php?id=${agendaId}`);
        const agendaData = await agendaResponse.json();

        if (!agendaData.success || !agendaData.agenda) {
            showNotification('Failed to load agenda details', 'error');
            return;
        }

        const agenda = agendaData.agenda;

        // Fetch available sessions for dropdown
        const sessionsResponse = await fetch('../api/api_sessions.php');
        const sessionsData = await sessionsResponse.json();
        const sessions = sessionsData.success ? (sessionsData.sessions || []) : [];

        // Remove existing modal if any
        const existing = document.getElementById('editAgendaModal');
        if (existing) existing.remove();

        // Build sessions dropdown options
        let sessionsOptions = '';
        sessions.forEach(session => {
            const selected = (session.session_id || session.id) == (agenda.session_id || sessionId) ? 'selected' : '';
            const sessionTitle = session.title || `Session ${session.session_id || session.id}`;
            sessionsOptions += `<option value="${session.session_id || session.id}" ${selected}>${sessionTitle}</option>`;
        });

        const modalHtml = `
            <div id="editAgendaModal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-sm">
                <div class="relative p-6 border dark:border-dark-border w-full max-w-2xl shadow-2xl rounded-2xl bg-white dark:bg-dark-card animate-fade-in-up m-4 max-h-[90vh] overflow-y-auto transition-colors duration-300">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h3 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <i class="bi bi-pencil-square text-red-600"></i>
                                Edit Agenda
                            </h3>
                            <p class="text-sm text-gray-500 dark:text-dark-muted mt-1">Update agenda information</p>
                        </div>
                        <button onclick="document.getElementById('editAgendaModal').remove()" class="text-gray-400 dark:text-dark-muted hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg p-2 transition">
                            <i class="bi bi-x-lg text-xl"></i>
                        </button>
                    </div>
                    <form onsubmit="updateAgenda(event, ${agendaId})" class="space-y-5">
                        <div class="grid grid-cols-1 gap-5">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-dark-muted mb-2">Agenda Title *</label>
                                <input type="text" name="agenda_title" required value="${(agenda.agenda_title || '').replace(/"/g, '&quot;')}" placeholder="e.g., Regular Session Agenda" class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-dark-muted mb-2">Session *</label>
                                <select name="session_id" required class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition">
                                    <option value="">Select Session</option>
                                    ${sessionsOptions}
                                </select>
                            </div>
 
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-dark-muted mb-2">Status *</label>
                                <select name="status" required class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition">
                                    <option value="Draft" ${agenda.status === 'Draft' ? 'selected' : ''}>Draft</option>
                                    <option value="Published" ${agenda.status === 'Published' ? 'selected' : ''}>Published</option>
                                    <option value="Archived" ${agenda.status === 'Archived' ? 'selected' : ''}>Archived</option>
                                </select>
                            </div>
                        </div>

                        <div class="flex gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                            <button type="button" onclick="confirmDeleteAgenda(${agendaId})" class="px-4 py-3 border border-red-300 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition flex items-center gap-2">
                                <i class="bi bi-trash"></i> Delete
                            </button>
                            <div class="flex-1"></div>
                            <button type="button" onclick="document.getElementById('editAgendaModal').remove()" class="px-4 py-3 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-muted rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg font-medium transition">
                                Cancel
                            </button>
                            <button type="submit" class="px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-medium shadow-lg shadow-red-500/30 transition-all">
                                <i class="bi bi-check-lg mr-2"></i>Update Agenda
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (error) {
        console.error('Error opening edit agenda modal:', error);
        showNotification('Error loading agenda details', 'error');
    }
};

/**
 * Update Agenda Function
 */
window.updateAgenda = async function (event, agendaId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
        agenda_id: agendaId,
        agenda_title: formData.get('agenda_title'),
        session_id: parseInt(formData.get('session_id')),
        status: formData.get('status')
    };

    try {
        const response = await fetch('../api/api_agendas.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            showNotification('Agenda updated successfully', 'success');
            document.getElementById('editAgendaModal').remove();
            // Refresh the current view
            if (window.viewAgendaSpecificDetails) {
                const sessionId = data.session_id;
                await window.viewAgendaSpecificDetails(agendaId, sessionId);
            } else if (window.viewSessionAgenda) {
                await window.viewSessionAgenda(data.session_id);
            } else {
                // Fallback: reload agendas
                if (window.renderAgendasEnhanced) {
                    await window.renderAgendasEnhanced();
                }
            }
        } else {
            showNotification(result.message || 'Failed to update agenda', 'error');
        }
    } catch (e) {
        console.error('Update error:', e);
        showNotification('Error updating agenda', 'error');
    }
};

/**
 * Confirm Delete Agenda
 */
window.confirmDeleteAgenda = async function (agendaId) {
    const confirmed = await window.showConfirmModal({
        title: 'Delete Agenda?',
        message: 'Are you sure you want to delete this agenda?',
        description: 'This action cannot be undone and will remove all associated agenda items.',
        confirmText: 'Delete Agenda',
        type: 'danger'
    });

    if (confirmed) {
        deleteAgenda(agendaId);
        document.getElementById('editAgendaModal')?.remove();
    }
};

/**
 * Open Create Agenda Item Modal
 */
window.openCreateAgendaItemModal = async function (agendaId, agendaTitle, sessionId) {
    const existing = document.getElementById('createAgendaItemModal');
    if (existing) existing.remove();

    // Load available users for assignment from database
    let staffOptions = '<option value="">Loading staff...</option>';

    try {
        const users = await window.loadStaffList();
        if (users && users.length > 0) {
            staffOptions = `<option value="">Select User</option>` + window.renderStaffOptions(users);
        } else {
            staffOptions = '<option value="">No users available</option>';
        }
    } catch (e) {
        console.error('Error loading staff for agenda item:', e);
        staffOptions = '<option value="">Error loading staff</option>';
    }

    const modalHtml = `
    <div id="createAgendaItemModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
        <div class="relative border dark:border-dark-border w-full max-w-2xl shadow-2xl rounded-2xl bg-white dark:bg-dark-card animate-fade-in-up m-4 max-h-[90vh] flex flex-col overflow-hidden">
            <div class="flex justify-between items-center p-6 pb-4 border-b border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card rounded-t-2xl shrink-0">
                <div>
                    <h3 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <i class="bi bi-file-earmark-plus text-red-600"></i>
                        Add Agenda Item
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-dark-muted mt-1">
                        Adding to: <span class="font-semibold text-red-600 dark:text-red-400">${agendaTitle}</span>
                    </p>
                </div>
                <button onclick="document.getElementById('createAgendaItemModal').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg p-2 transition">
                    <i class="bi bi-x-lg text-xl"></i>
                </button>
            </div>

            <form onsubmit="saveAgendaItem(event)" class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                <input type="hidden" name="agenda_id" value="${agendaId}">
                <input type="hidden" name="session_id" value="${sessionId}">

                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">Item Title <span class="text-red-500">*</span></label>
                    <input type="text" name="item_title" required placeholder="e.g., Proposed Ordinance No. 123" class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition shadow-sm">
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">Item Description</label>
                    <textarea name="item_description" rows="4" placeholder="Detailed description of this item..." class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition text-sm"></textarea>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">Assign To (Task) <span class="text-red-500">*</span></label>
                        <select name="assigned_to" required class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition shadow-sm">
                            ${staffOptions}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">Due Date <span class="text-red-500">*</span></label>
                        <input type="date" name="due_date" required class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition shadow-sm">
                    </div>
                </div>

                <div class="flex gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                    <button type="button" onclick="document.getElementById('createAgendaItemModal').remove()" class="flex-1 px-4 py-3 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 font-medium transition">
                        Cancel
                    </button>
                    <button type="submit" class="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-medium shadow-lg shadow-red-500/30 transition-all">
                        <i class="bi bi-check-lg mr-2"></i>Add Item
                    </button>
                </div>
            </form>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

/**
 * Save Agenda Item
 */
window.saveAgendaItem = async function (event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
        agenda_id: parseInt(formData.get('agenda_id')),
        session_id: parseInt(formData.get('session_id')),
        item_title: formData.get('item_title'),
        item_purpose: formData.get('item_purpose'),
        item_background: formData.get('item_background'),
        item_description: formData.get('item_description'),
        item_recommendation: formData.get('item_recommendation'),
        due_date: formData.get('due_date'),
        assigned_to: formData.get('assigned_to')
    };

    // Extra fields for automation
    const assignedTo = formData.get('assigned_to');
    const dueDate = formData.get('due_date');

    try {
        // Updated to use the new action
        const response = await fetch('../api/api_agendas.php?action=add_item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.success) {
            showNotification('Agenda item added successfully', 'success');
            document.getElementById('createAgendaItemModal').remove();

            // Trigger automated deadline creation
            if (window.automateDeadlineCreation) {
                window.automateDeadlineCreation({
                    agenda_id: result.item_id, // FIX: Use the Item ID, not the Agenda ID
                    title: data.item_title,
                    description: data.item_description,
                    assigned_to: assignedTo,
                    due_date: dueDate
                });
            }

            // Refresh view
            const sessionId = formData.get('session_id');
            if (window.viewAgendaSpecificDetails) {
                await window.viewAgendaSpecificDetails(data.agenda_id, sessionId);
            }
        } else {
            showNotification(result.message || 'Failed to add item', 'error');
        }
    } catch (e) {
        console.error('Save item error:', e);
        showNotification('Error saving agenda item', 'error');
    }
};

/**
 * Open manage agenda item modal
 */
window.openManageAgendaItemModal = async function (agendaItemId, agendaId, sessionId) {
    try {
        // Fetch current agenda to get item details
        const response = await fetch(`../api/api_agendas.php?id=${agendaId}`);
        const data = await response.json();

        if (!data.success || !data.agenda) {
            showNotification('Failed to load agenda details', 'error');
            return;
        }

        const item = data.agenda.items.find(i => i.agenda_item_id == agendaItemId);

        if (!item) {
            showNotification('Item not found', 'error');
            return;
        }

        const itemIndex = data.agenda.items.findIndex(i => i.agenda_item_id == agendaItemId);
        const isFirst = itemIndex === 0;
        const isLast = itemIndex === data.agenda.items.length - 1;

        const modalHtml = `
            <div id="manageItemModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div class="bg-white dark:bg-dark-card rounded-2xl shadow-2xl p-6 w-full max-w-md m-4 animate-fade-in-up">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white">Manage Agenda Item</h3>
                        <button onclick="document.getElementById('manageItemModal').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <i class="bi bi-x-lg text-xl"></i>
                        </button>
                    </div>
                    
                     <div class="mb-4 p-4 bg-gray-50 dark:bg-dark-bg rounded-lg">
                        <div class="flex justify-between items-start mb-1">
                            <h4 class="font-bold text-gray-900 dark:text-white">${item.title}</h4>
                            <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${item.status === 'Completed' ? 'bg-green-100 text-green-700' :
                item.status === 'Revision Needed' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
            }">
                                ${item.status || 'Pending'}
                            </span>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-dark-muted">${item.description || 'No description'}</p>
                    </div>

                    <div class="space-y-3">
                        <button onclick="openEditAgendaItemModal(${agendaItemId}, ${agendaId}, ${sessionId})" class="w-full flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-blue-200 dark:border-blue-900/30">
                            <span class="text-blue-700 dark:text-blue-400 font-medium">Edit Item</span>
                            <i class="bi bi-pencil text-blue-600 dark:text-blue-400"></i>
                        </button>

                        ${!isFirst ? `
                        <button onclick="reorderAgendaItem(${agendaItemId}, 'up', ${agendaId}, ${sessionId})" class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors border border-gray-200 dark:border-dark-border">
                            <span class="text-gray-700 dark:text-dark-text font-medium">Move Up</span>
                            <i class="bi bi-arrow-up text-gray-600 dark:text-dark-muted"></i>
                        </button>
                        ` : ''}

                        ${!isLast ? `
                        <button onclick="reorderAgendaItem(${agendaItemId}, 'down', ${agendaId}, ${sessionId})" class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors border border-gray-200 dark:border-dark-border">
                            <span class="text-gray-700 dark:text-dark-text font-medium">Move Down</span>
                            <i class="bi bi-arrow-down text-gray-600 dark:text-dark-muted"></i>
                        </button>
                        ` : ''}

                        <button onclick="deleteAgendaItem('${item.agenda_item_id}', '${agendaId}', '${sessionId}')" class="w-full flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-200 dark:border-red-900/30">
                            <span class="text-red-700 dark:text-red-400 font-medium">Delete Item</span>
                            <i class="bi bi-trash text-red-600 dark:text-red-400"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (error) {
        console.error('Error opening manage modal:', error);
        alert('Error opening manage modal: ' + error.message);
        showNotification('Error opening manage modal', 'error');
    }
};

/**
 * Fetch motions from database
 */
window.getMotions = async function () {
    try {
        const response = await fetch('../api/api_agendas.php?action=get_motions');
        const data = await response.json();
        return data.success ? data.motions : [];
    } catch (error) {
        console.error('Error fetching motions:', error);
        return [];
    }
};

/**
 * Open edit agenda item modal
 */
window.openEditAgendaItemModal = async function (agendaItemId, agendaId, sessionId, fullMode = false) {
    try {
        // Close manage modal if open
        const manageModal = document.getElementById('manageItemModal');
        if (manageModal) manageModal.remove();

        // Fetch current item details
        const response = await fetch(`../api/api_agendas.php?id=${agendaId}`);
        const data = await response.json();

        if (!data.success || !data.agenda) {
            showNotification('Failed to load agenda details', 'error');
            return;
        }

        const item = data.agenda.items.find(i => i.agenda_item_id == agendaItemId);
        if (!item) {
            showNotification('Item not found', 'error');
            return;
        }

        // Fetch all staff to get assigned user
        let staffOptions = '<option value="">Select User</option>';
        try {
            const users = await window.loadStaffList();
            if (users && users.length > 0) {
                staffOptions = `<option value="">Select User</option>` + window.renderStaffOptions(users, item.assigned_to);
            }
        } catch (e) {
            console.error('Error loading staff:', e);
        }

        // Fetch Motions
        const motions = await window.getMotions();
        let motionOptions = `<option value="">Select Motion</option>`;
        motions.forEach(m => {
            motionOptions += `<option value="${m.name}" ${item.item_recommendation === m.name ? 'selected' : ''}>${m.name}</option>`;
        });

        const deadlineValue = item.deadline ? new Date(item.deadline).toISOString().slice(0, 16) : '';

        const modalHtml = `
            <div id="editItemModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div class="bg-white dark:bg-dark-card border dark:border-dark-border w-full max-w-lg shadow-2xl rounded-2xl animate-fade-in-up m-4 max-h-[90vh] flex flex-col overflow-hidden">
                    <div class="flex justify-between items-center p-6 pb-4 border-b border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card rounded-t-2xl shrink-0">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white">Edit Agenda Item</h3>
                        <button onclick="document.getElementById('editItemModal').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg p-2 transition">
                            <i class="bi bi-x-lg text-xl"></i>
                        </button>
                    </div>
                    
                    <form id="editItemForm" class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">Item Title *</label>
                            <input type="text" name="item_title" value="${item.item_title.replace(/"/g, '&quot;')}" required
                                placeholder="e.g., Proposed Ordinance No. 123"
                                class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-dark-bg dark:text-white transition shadow-sm">
                        </div>

                        ${fullMode ? `
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2 flex items-center gap-2">
                                <i class="bi bi-info-circle text-red-600 text-xs"></i> Purpose
                            </label>
                            <textarea name="item_purpose" rows="2" placeholder="Enter purpose of this item..."
                                class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-dark-bg dark:text-white transition resize-none text-sm">${item.item_purpose || ''}</textarea>
                        </div>
                        ` : ''}

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2 flex items-center gap-2">
                                <i class="bi bi-justify-left text-red-600 text-xs"></i> Agenda Item Description / Details
                            </label>
                            <textarea name="item_description" rows="4" placeholder="Detailed description of this item..."
                                class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-dark-bg dark:text-white transition text-sm">${item.item_description || ''}</textarea>
                        </div>

                        ${fullMode ? `
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2 flex items-center gap-2">
                                <i class="bi bi-lightning text-red-600 text-xs"></i> Recommendation / Motion
                            </label>
                            <div class="flex gap-2">
                                <select name="item_recommendation" id="motionSelect" class="flex-1 px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-dark-bg dark:text-white transition shadow-sm text-sm">
                                    ${motionOptions}
                                </select>
                                <button type="button" onclick="window.openAddMotionModal()" class="px-2 py-2 bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 transition" title="Add Motion">
                                    <i class="bi bi-plus-lg"></i>
                                </button>
                            </div>
                        </div>
                        ` : ''}

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">Assign To (Task) *</label>
                                <select name="assigned_to" required class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-dark-bg dark:text-white transition shadow-sm">
                                    ${staffOptions}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">Due Date *</label>
                                <input type="date" name="deadline" value="${item.deadline ? item.deadline.split(' ')[0] : ''}" required
                                    class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-dark-bg dark:text-white transition shadow-sm">
                            </div>
                        </div>

                        <div class="flex gap-3 pt-4">
                            <button type="button" onclick="document.getElementById('editItemModal').remove()" 
                                class="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg transition">
                                Cancel
                            </button>
                            <button type="submit" 
                                class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-500/30">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Handle form submission
        document.getElementById('editItemForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            try {
                const response = await fetch('../api/api_agendas.php?action=update_item', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        item_id: agendaItemId,
                        item_title: formData.get('item_title'),
                        item_purpose: fullMode ? formData.get('item_purpose') : (item.item_purpose || ''),
                        item_description: formData.get('item_description'),
                        item_background: fullMode ? formData.get('item_background') : (item.item_background || ''),
                        item_recommendation: fullMode ? formData.get('item_recommendation') : (item.item_recommendation || ''),
                        deadline: formData.get('deadline'),
                        assigned_to: formData.get('assigned_to')
                    })
                });

                const result = await response.json();
                if (result.success) {
                    showNotification('Item updated successfully', 'success');
                    document.getElementById('editItemModal').remove();
                    await window.viewAgendaSpecificDetails(agendaId, sessionId);
                } else {
                    showNotification(result.message || 'Failed to update item', 'error');
                }
            } catch (error) {
                console.error('Error updating item:', error);
                showNotification('Error updating item', 'error');
            }
        });
    } catch (error) {
        console.error('Error opening edit modal:', error);
        showNotification('Error opening edit modal', 'error');
    }
};

/**
 * Delete agenda item
 */
window.deleteAgendaItem = async function (agendaItemId, agendaId, sessionId) {
    // Debug alert to see what we received
    // alert(`Debug deleteAgendaItem:\nItem ID: ${agendaItemId}\nAgenda ID: ${agendaId}\nSession ID: ${sessionId}`);

    if (!agendaItemId) {
        showNotification('Error: Invalid Item ID', 'error');
        console.error('deleteAgendaItem called with missing itemId', { agendaItemId, agendaId, sessionId });
        return;
    }

    const confirmed = await window.showConfirmModal({
        title: 'Delete Agenda Item?',
        message: 'Are you sure you want to delete this agenda item?',
        description: 'This action cannot be undone.',
        confirmText: 'Delete Item',
        type: 'danger'
    });

    if (!confirmed) return;

    const passwordOk = await window.promptPasswordConfirmation({
        title: 'Confirm Delete Agenda Item',
        message: 'Enter your password to permanently delete this agenda item.',
        confirmText: 'Confirm Delete'
    });
    if (!passwordOk) return;

    try {
        const response = await fetch('../api/api_agendas.php?action=delete_item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_id: agendaItemId })
        });

        const result = await response.json();
        if (result.success) {
            showNotification('Item deleted successfully', 'success');
            const manageModal = document.getElementById('manageItemModal');
            if (manageModal) manageModal.remove();
            await window.viewAgendaSpecificDetails(agendaId, sessionId);
        } else {
            showNotification(result.message || 'Failed to delete item', 'error');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showNotification('Error deleting item', 'error');
    }
};

/**
 * Reorder agenda item
 */
window.reorderAgendaItem = async function (itemId, direction, agendaId, sessionId) {
    try {
        // Fetch current agenda to get all items
        const response = await fetch(`../api/api_agendas.php?id=${agendaId}`);
        const data = await response.json();

        if (!data.success || !data.agenda) {
            showNotification('Failed to load agenda details', 'error');
            return;
        }

        const items = data.agenda.items;
        const currentIndex = items.findIndex(i => i.item_id == itemId);

        if (currentIndex === -1) {
            showNotification('Item not found', 'error');
            return;
        }

        // Calculate new index
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (newIndex < 0 || newIndex >= items.length) {
            return; // Can't move beyond bounds
        }

        // Swap items
        [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];

        // Get new order of item IDs
        const newOrder = items.map(i => i.item_id);

        // Send to API
        const reorderResponse = await fetch('../api/api_agendas.php?action=reorder_items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: newOrder })
        });

        const result = await reorderResponse.json();
        if (result.success) {
            showNotification('Item reordered successfully', 'success');
            const manageModal = document.getElementById('manageItemModal');
            if (manageModal) manageModal.remove();
            await window.viewAgendaSpecificDetails(agendaId, sessionId);
        } else {
            showNotification(result.message || 'Failed to reorder item', 'error');
        }
    } catch (error) {
        console.error('Error reordering item:', error);
        showNotification('Error reordering item', 'error');
    }
};

/**
 * View Agenda Item Details Modal
 * @param {number} itemId
 */
window.openViewAgendaItemModal = function (itemId) {
    if (!window.currentAgenda || !window.currentAgenda.items) {
        showNotification('Agenda data not loaded', 'error');
        return;
    }

    const item = window.currentAgenda.items.find(i => i.agenda_item_id == itemId);
    if (!item) {
        showNotification('Item not found', 'error');
        return;
    }

    const existing = document.getElementById('viewAgendaItemModal');
    if (existing) existing.remove();

    // Format date/time
    let deadlineHtml = '';
    if (item.deadline) {
        const deadlineDate = new Date(item.deadline);
        const dateStr = deadlineDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const timeStr = deadlineDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        deadlineHtml = `
            <div class="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/20">
                <i class="bi bi-calendar-event"></i>
                <span class="font-medium">${dateStr}</span>
                <span class="text-xs opacity-75">(${timeStr})</span>
            </div>
        `;
    }

    // Documents (Mockup for now, or check item.documents)
    const documents = item.documents || [];
    let documentsHtml = '';
    if (documents.length > 0) {
        documentsHtml = documents.map(doc => `
            <div class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                        <i class="bi bi-file-earmark-text text-xl"></i>
                    </div>
                    <div>
                        <div class="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <span class="${doc.permission_state === 'Blur' ? 'blur-sm select-none' : ''}">${doc.file_name || 'Document'}</span>
                            ${doc.permission_state ? `<span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                doc.permission_state === 'Private' ? 'bg-gray-100 text-gray-600' :
                                doc.permission_state === 'Lock' ? 'bg-red-100 text-red-600' :
                                doc.permission_state === 'Blur' ? 'bg-yellow-100 text-yellow-600' :
                                'bg-green-100 text-green-600'
                            }">${doc.permission_state}</span>` : `<span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-green-100 text-green-600">Public view</span>`}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-dark-muted">${doc.uploaded_at || ''}</div>
                    </div>
                </div>
                <button onclick="window.open('${doc.file_path}', '_blank')" class="p-2 text-gray-500 hover:text-red-600 transition-colors">
                    <i class="bi bi-download"></i>
                </button>
            </div>
        `).join('');
    } else {
        documentsHtml = `
            <div class="text-center py-8 text-gray-400 dark:text-dark-muted italic border-2 border-dashed border-gray-200 dark:border-dark-border rounded-xl">
                No documents attached to this item.
            </div>
        `;
    }

    const modalHtml = `
        <div id="viewAgendaItemModal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[70] backdrop-blur-sm">
            <div class="relative p-8 border w-full max-w-2xl shadow-2xl rounded-2xl bg-white dark:bg-dark-card animate-fade-in-up m-4">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-white leading-tight">${item.title}</h3>
                        <p class="text-sm text-gray-500 dark:text-dark-muted mt-1">Agenda Item Details</p>
                    </div>
                    <button type="button" onclick="document.getElementById('viewAgendaItemModal').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg">
                        <i class="bi bi-x-lg text-xl"></i>
                    </button>
                </div>

                <div class="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    <!-- Deadline & Assignment -->
                    <div class="flex flex-wrap gap-4">
                        ${deadlineHtml}
                        ${item.assigned_user_name ? `
                        <div class="flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 px-3 py-2 rounded-lg border border-blue-100 dark:border-blue-900/20">
                            <i class="bi bi-person-fill"></i>
                            <span class="font-medium">${item.assigned_user_name}</span>
                        </div>
                        ` : ''}
                    </div>

                    <!-- Background / Purpose -->
                    <div class="bg-gray-50 dark:bg-dark-bg rounded-xl p-5 border border-gray-100 dark:border-dark-border">
                        <h4 class="text-xs font-bold text-gray-500 dark:text-dark-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                             <i class="bi bi-info-circle"></i> Background / Purpose
                        </h4>
                        <div class="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            ${item.item_background ? item.item_background.replace(/\n/g, '<br>') : '<span class="italic text-gray-400">No background information provided.</span>'}
                        </div>
                    </div>

                    <!-- Details / Description -->
                    <div class="bg-gray-50 dark:bg-dark-bg rounded-xl p-5 border border-gray-100 dark:border-dark-border">
                        <h4 class="text-xs font-bold text-gray-500 dark:text-dark-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                            <i class="bi bi-justify-left"></i> Details / Description
                        </h4>
                        <div class="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            ${item.item_description ? item.item_description.replace(/\n/g, '<br>') : '<span class="italic text-gray-400">No description provided.</span>'}
                        </div>
                    </div>

                    <!-- Recommendation / Motion -->
                    <div class="bg-gray-50 dark:bg-dark-bg rounded-xl p-5 border border-gray-100 dark:border-dark-border">
                        <h4 class="text-xs font-bold text-gray-500 dark:text-dark-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                            <i class="bi bi-lightning"></i> Recommendation / Motion
                        </h4>
                        <div class="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-medium">
                            ${item.item_recommendation ? item.item_recommendation.replace(/\n/g, '<br>') : '<span class="italic text-gray-400">No recommendation provided.</span>'}
                        </div>
                    </div>

                    <!-- Documents -->
                    <div>
                        <h4 class="text-xs font-bold text-gray-500 dark:text-dark-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                            <i class="bi bi-paperclip"></i> Attachments
                        </h4>
                        <div class="space-y-3">
                            ${documentsHtml}
                        </div>
                    </div>
                </div>

                <div class="mt-8 pt-6 border-t border-gray-100 dark:border-dark-border flex justify-end">
                    <button onclick="document.getElementById('viewAgendaItemModal').remove()" class="px-6 py-2.5 bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-border font-medium transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

/**
 * View Agenda Item Details (Full Page)
 * @param {number} itemId
 * @param {number} agendaId
 * @param {number} sessionId
 */
window.viewAgendaItemDetailsFull = async function (itemId, agendaId, sessionId) {
    window.isSubView = true;
    window.activeSection = 'agendas';
    try {
        // Fetch agenda details if not already in window.currentAgenda
        if (!window.currentAgenda || (window.currentAgenda.agenda_id || window.currentAgenda.id) != agendaId) {
            const response = await fetch(`../api/api_agendas.php?id=${agendaId}`);
            const data = await response.json();
            if (data.success) {
                window.currentAgenda = data.agenda;
            } else {
                showNotification('Failed to load agenda details', 'error');
                return;
            }
        }

        const items = window.currentAgenda.items || [];
        const item = items.find(i => (i.agenda_item_id || i.item_id) == itemId);

        if (!item) {
            showNotification('Item not found', 'error');
            return;
        }

        window.currentAgendaItem = item;

        const session = window.cachedSessions?.find(s => (s.session_id || s.id) == sessionId);
        const sessionTitle = session ? session.title : (window.currentAgenda.session_title || 'Session');

        // Update Breadcrumbs
        const breadcrumbCurrent = document.getElementById('breadcrumb-current');
        if (breadcrumbCurrent) {
            breadcrumbCurrent.innerHTML = `
                <a href="#" onclick="showSection('agendas')" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">Agenda</a>
                <i class="bi bi-chevron-right mx-2 text-xs"></i>
                <a href="#" onclick="viewSessionAgenda(${sessionId})" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">${sessionTitle}</a>
                <i class="bi bi-chevron-right mx-2 text-xs"></i>
                <a href="#" onclick="window.viewAgendaSpecificDetails(${agendaId}, ${sessionId})" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">${window.currentAgenda.agenda_title}</a>
                <i class="bi bi-chevron-right mx-2 text-xs"></i>
                <span class="text-gray-800 dark:text-white font-medium">${item.item_title}</span>
            `;
        }

        const user = getCurrentUser();
        const role = user ? (user.role || user.user_role || 'User').toLowerCase() : 'user';
        const isAdmin = (role === 'super admin' || role === 'admin');
        const isStaffOrAdmin = isAdmin || role === 'staff';

        // Determine if the parent session is locked (missed / completed / cancelled / postponed / inactive)
        const execStatus = session ? (session.status || '').toLowerCase() : '';
        const lockedStatuses = ['missed', 'completed', 'cancelled', 'canceled', 'postponed'];
        const isSessionLockedForEditing = session && ((session.session_status || 'Active') === 'Inactive' || lockedStatuses.includes(execStatus));

        // Block editing if item is locked OR parent session is locked
        const isItemLocked = item.status === 'Approved' || item.status === 'Completed';
        const isLocked = isItemLocked || isSessionLockedForEditing;
        const canEdit = !isSessionLockedForEditing && (isAdmin || !isItemLocked) && (isStaffOrAdmin || (user && (user.id == item.assigned_to || user.user_id == item.assigned_to)));

        // Render Content (Design like 1st pic, Content like 2nd pic)
        const html = `
            <div class="space-y-6 animate-fade-in-up">
                <!-- Directory Navigation (Breadcrumbs like Image 1) -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border mb-6 transition-colors duration-300">
                    <div class="flex items-center gap-4">
                        <button onclick="window.viewAgendaSpecificDetails(${agendaId}, ${sessionId})" class="w-10 h-10 rounded-lg bg-gray-50 dark:bg-dark-bg flex items-center justify-center text-gray-600 dark:text-dark-muted hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all border border-gray-200 dark:border-dark-border">
                            <i class="bi bi-arrow-left"></i>
                        </button>
                        <div>
                            <div class="flex items-center text-xs text-gray-900 dark:text-white mb-1 font-medium">
                                <a href="#" onclick="showSection('agendas')" class="hover:text-red-600 transition-colors">Agenda</a>
                                <i class="bi bi-chevron-right mx-2 opacity-50"></i> 
                                <a href="#" onclick="viewSessionAgenda(${sessionId})" class="hover:text-red-600 transition-colors">${sessionTitle}</a>
                                <i class="bi bi-chevron-right mx-2 opacity-50"></i>
                                <a href="#" onclick="window.viewAgendaSpecificDetails(${agendaId}, ${sessionId})" class="hover:text-red-600 transition-colors">${window.currentAgenda.agenda_title}</a>
                                <i class="bi bi-chevron-right mx-2 opacity-50"></i>
                                <span class="font-bold">${item.item_title}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        ${canEdit ? `
                        <button onclick="window.openEditAgendaItemModal(${itemId}, ${agendaId}, ${sessionId}, true)" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all">
                            <i class="bi bi-pencil"></i> Edit Item
                        </button>
                        ` : ''}
                        
                    </div>
                </div>

                <!-- Main Content (Like Image 2 structure but Image 1 design) -->
                <div class="space-y-6">
                    <!-- Top Section: Metadata -->
                    <div class="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border p-8 transition-all duration-300">
                        <div class="grid grid-cols-3 gap-y-6">
                            <!-- Row 1: Date Created, Assigned To (Middle), Empty Right -->
                            <div>
                                <p class="text-[11px] font-bold text-gray-400 dark:text-dark-muted uppercase tracking-widest mb-1">Date Created</p>
                                <p class="text-sm font-bold text-gray-900 dark:text-white">${new Date(item.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <div class="flex flex-col items-center text-center">
                                <p class="text-[11px] font-bold text-gray-400 dark:text-dark-muted uppercase tracking-widest mb-1">Assigned To</p>
                                <div class="flex items-center gap-2">
                                    <div class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold border border-red-200 dark:border-red-900/30">
                                        ${(item.assigned_user_name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <p class="text-sm font-bold text-gray-900 dark:text-white">${item.assigned_user_name || 'Unassigned'}</p>
                                </div>
                            </div>
                            <div></div> <!-- Right column empty top row -->

                            <!-- Row 2: Creator, Status -->
                            <div>
                                <p class="text-[11px] font-bold text-gray-400 dark:text-dark-muted uppercase tracking-widest mb-1">Creator</p>
                                <div class="flex items-center gap-2">
                                    <div class="w-5 h-5 rounded bg-gray-100 dark:bg-dark-bg flex items-center justify-center text-[10px] text-gray-600 dark:text-dark-muted">
                                        <i class="bi bi-person"></i>
                                    </div>
                                    <p class="text-sm font-bold text-gray-900 dark:text-white">${item.creator_name || 'System'}</p>
                                </div>
                            </div>
                            <div class="flex flex-col items-center text-center">
                                <p class="text-[11px] font-bold text-gray-400 dark:text-dark-muted uppercase tracking-widest mb-1">Status</p>
                                <div class="flex items-center gap-2">
                                    <div class="w-2 h-2 rounded-full ${item.status === 'Completed' ? 'bg-green-500' :
                item.status === 'Revision Needed' ? 'bg-orange-500' :
                    item.status === 'Deferred' ? 'bg-yellow-500' :
                        'bg-blue-500'
            } shadow-sm animate-pulse"></div>
                                    <p class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">${item.status || 'Pending'}</p>
                                </div>
                            </div>
                            <div></div> <!-- Right column empty bottom row -->
                        </div>
                    </div>

                    <!-- Bottom Section: Item Content -->
                    <div class="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden transition-all duration-300 group/header">
                        <!-- Red Header inside card to match Image 1 style -->
                        <div class="bg-gradient-to-r from-red-600 to-red-800 p-8 text-white relative">
                            <div class="absolute top-0 right-0 p-8 opacity-10">
                                <i class="bi bi-file-earmark-text text-9xl"></i>
                            </div>
                            <div class="relative z-10" id="section-item_title">
                                <div class="flex justify-between items-start">
                                    <span class="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-4 inline-block border border-white/30">
                                        ${item.status || 'Pending'}
                                    </span>
                                    <!-- Always-visible Approve / Revision actions when item is actionable -->
                                    <div class="flex items-center gap-2 inline-edit-controls">
                                        ${isStaffOrAdmin && item.status !== 'Completed' && (item.item_purpose && (item.documents || []).length > 0) ? `
                                            ${item.status !== 'Approved' ? `
                                            <button onclick="window.updateAgendaItemStatus(${itemId}, 'Approved', ${agendaId}, ${sessionId})" class="p-1 px-3 bg-green-500/20 hover:bg-green-500/40 text-white rounded-lg transition-all text-xs font-bold border border-green-500/30 flex items-center gap-1.5" title="Approve Item">
                                                <i class="bi bi-check-circle"></i> Approve
                                            </button>
                                            ` : ''}
                                            <button onclick="window.updateAgendaItemStatus(${itemId}, 'Revision Needed', ${agendaId}, ${sessionId})" class="p-1 px-3 bg-orange-500/20 hover:bg-orange-500/40 text-white rounded-lg transition-all text-xs font-bold border border-orange-500/30 flex items-center gap-1.5" title="${item.status === 'Revision Needed' ? 'Update Revision Request' : 'Request Revision'}">
                                                <i class="bi bi-x-circle"></i> ${item.status === 'Revision Needed' ? 'Revise Again' : 'Revision'}
                                            </button>
                                        ` : ''}
                                        ${canEdit ? `
                                        <button onclick="window.toggleInlineEdit('item_title', ${itemId}, ${agendaId}, ${sessionId})" class="p-1 px-3 bg-white/20 hover:bg-white/40 text-white rounded-lg transition-all text-xs font-bold border border-white/30 flex items-center gap-1.5" title="Edit Title">
                                            <i class="bi bi-pencil-square"></i> Edit Title
                                        </button>
                                        ` : ''}
                                    </div>
                                </div>
                                
                                <div class="content-display">
                                    <h1 class="text-3xl font-bold mb-2">${item.item_title}</h1>
                                </div>
                                <div class="flex items-center gap-4 text-red-50/80 text-sm font-medium">
                                    <div class="flex items-center gap-2">
                                        <i class="bi bi-calendar-check"></i>
                                        Deadline: ${item.deadline ? new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Deadline'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="p-8 space-y-8">
                            <!-- Revision Remarks -->
                            ${item.status === 'Revision Needed' && item.revision_remarks ? `
                            <div class="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/40 rounded-2xl p-6 mb-8 animate-fade-in">
                                <div class="flex items-start gap-4">
                                    <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center shrink-0 text-xl shadow-inner">
                                        <i class="bi bi-exclamation-triangle-fill"></i>
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex items-center justify-between mb-1">
                                            <h3 class="text-orange-900 dark:text-orange-300 font-bold">Revision Requested</h3>
                                            <span class="text-[10px] font-bold uppercase tracking-widest text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">Feedback</span>
                                        </div>
                                        <p class="text-orange-800/80 dark:text-orange-200/70 text-sm leading-relaxed whitespace-pre-wrap">${item.revision_remarks}</p>
                                    </div>
                                </div>
                            </div>
                            ` : ''}

                            <!-- Purpose -->
                            <div class="space-y-3 group/edit relative" id="section-item_purpose">
                                <div class="flex justify-between items-center">
                                    <h4 class="text-xs font-bold text-gray-500 dark:text-dark-muted uppercase tracking-widest flex items-center gap-2 text-[10px]">
                                        <i class="bi bi-info-circle text-red-600"></i> Purpose
                                    </h4>
                                    ${canEdit ? `
                                    <div class="inline-edit-controls opacity-0 group-hover/edit:opacity-100 transition-opacity">
                                        <button onclick="window.toggleInlineEdit('item_purpose', ${itemId}, ${agendaId}, ${sessionId})" class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit Purpose">
                                            <i class="bi bi-pencil-square"></i>
                                        </button>
                                    </div>
                                    ` : ''}
                                </div>
                                <div class="content-display bg-gray-50 dark:bg-dark-bg p-5 rounded-xl border border-gray-100 dark:border-dark-border text-gray-700 dark:text-gray-300 leading-relaxed italic text-sm">
                                    ${item.item_purpose || 'No purpose stated.'}
                                </div>
                            </div>

                            <!-- Description -->
                            <div class="space-y-3 group/edit relative" id="section-item_description">
                                <div class="flex justify-between items-center">
                                    <h4 class="text-xs font-bold text-gray-500 dark:text-dark-muted uppercase tracking-widest flex items-center gap-2 text-[10px]">
                                        <i class="bi bi-justify-left text-red-600"></i> Agenda Item Description / Details
                                    </h4>
                                    ${canEdit ? `
                                    <div class="inline-edit-controls opacity-0 group-hover/edit:opacity-100 transition-opacity">
                                        <button onclick="window.toggleInlineEdit('item_description', ${itemId}, ${agendaId}, ${sessionId})" class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit Description">
                                            <i class="bi bi-pencil-square"></i>
                                        </button>
                                    </div>
                                    ` : ''}
                                </div>
                                <div class="content-display bg-gray-50 dark:bg-dark-bg p-5 rounded-xl border border-gray-100 dark:border-dark-border text-gray-800 dark:text-gray-200 leading-relaxed text-sm">
                                    ${(item.item_description || 'No description provided.').replace(/\n/g, '<br>')}
                                </div>
                            </div>

                            <!-- Motion Section -->
                            <div class="space-y-3 group/edit relative" id="section-item_recommendation">
                                <div class="flex justify-between items-center">
                                    <h4 class="text-xs font-bold text-gray-500 dark:text-dark-muted uppercase tracking-widest flex items-center gap-2 text-[10px]">
                                        <i class="bi bi-lightning text-red-600"></i> Motion
                                    </h4>
                                    ${canEdit ? `
                                    ${!isSessionLockedForEditing ? `
                                    <div class="inline-edit-controls opacity-0 group-hover/edit:opacity-100 transition-opacity">
                                        <button onclick="window.toggleInlineEdit('item_recommendation', ${itemId}, ${agendaId}, ${sessionId})" class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit Motion">
                                            <i class="bi bi-pencil-square"></i>
                                        </button>
                                    </div>
                                    ` : ''}
                                    ` : ''}
                                </div>
                                <div class="content-display bg-gray-50 dark:bg-dark-bg p-5 rounded-xl border border-gray-100 dark:border-dark-border text-gray-700 dark:text-gray-300 text-sm">
                                    ${item.item_recommendation || 'No motion stated.'}
                                </div>
                            </div>

                            <!-- Attachments -->
                             <div class="space-y-3">
                                <div class="flex items-center justify-between">
                                    <h4 class="text-xs font-bold text-gray-500 dark:text-dark-muted uppercase tracking-widest flex items-center gap-2">
                                        <i class="bi bi-paperclip text-red-600"></i> Attachments
                                    </h4>
                                    <input type="file" id="agendaDocInput_${itemId}" class="hidden" multiple
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
                                        onchange="window.uploadAgendaItemDocument(this, ${itemId}, ${agendaId}, ${sessionId})">
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="attachments-grid-${itemId}">
                                    ${(item.documents || []).map(doc => {
                const ext = (doc.file_type || '').toLowerCase();
                const iconClass = ext === 'pdf' ? 'bi-file-earmark-pdf text-red-500' :
                    ['doc', 'docx'].includes(ext) ? 'bi-file-earmark-word text-blue-500' :
                        ['xls', 'xlsx'].includes(ext) ? 'bi-file-earmark-excel text-green-500' :
                            ['jpg', 'jpeg', 'png'].includes(ext) ? 'bi-file-earmark-image text-purple-500' :
                                'bi-file-earmark text-gray-500';
                const canDelete = (isAdmin || !isLocked) && (isStaffOrAdmin || (user && (user.id == doc.uploaded_by || user.user_id == doc.uploaded_by)));
                return `
                                        <div class="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg hover:bg-white dark:hover:bg-dark-card hover:shadow-md transition-all group">
                                            <div class="flex items-center gap-3 cursor-pointer flex-1 min-w-0" onclick="window.open('${doc.file_path}', '_blank')">
                                                <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-card flex items-center justify-center text-xl shrink-0">
                                                    <i class="bi ${iconClass}"></i>
                                                </div>
                                                <div class="min-w-0">
                                                    <p class="text-sm font-bold text-gray-900 dark:text-white truncate flex items-center gap-2">
                                                        <span class="${doc.permission_state === 'Blur' ? 'blur-sm select-none' : ''}">${doc.file_name}</span>
                                                        ${doc.permission_state ? `<span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                                            doc.permission_state === 'Private' ? 'bg-gray-100 text-gray-600' :
                                                            doc.permission_state === 'Lock' ? 'bg-red-100 text-red-600' :
                                                            doc.permission_state === 'Blur' ? 'bg-yellow-100 text-yellow-600' :
                                                            'bg-green-100 text-green-600'
                                                        }">${doc.permission_state}</span>` : `<span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-green-100 text-green-600">Public view</span>`}
                                                    </p>
                                                    <p class="text-[10px] text-gray-500 dark:text-dark-muted">${doc.uploader_name || 'Unknown'} &bull; ${doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}</p>
                                                </div>
                                            </div>
                                            <div class="flex items-center gap-1 shrink-0 ml-2">
                                                <a href="${doc.file_path}" download="${doc.file_name}" class="p-1.5 text-gray-400 hover:text-green-600 rounded-lg transition-colors" title="Download">
                                                    <i class="bi bi-download"></i>
                                                </a>
                                                <button onclick="window.open('${doc.file_path}', '_blank')" class="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg transition-colors" title="View">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                                ${canDelete ? `
                                                <button onclick="window.changeAgendaDocumentPermission(${doc.document_id}, ${agendaId}, ${sessionId}, '${doc.permission_state || 'Public view'}')" class="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors" title="Change Permission">
                                                    <i class="bi bi-shield-lock"></i>
                                                </button>
                                                <button onclick="window.deleteAgendaItemDocument(${doc.document_id}, ${itemId}, ${agendaId}, ${sessionId})" class="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors" title="Delete">
                                                    <i class="bi bi-trash"></i>
                                                </button>
                                                ` : ''}
                                            </div>
                                        </div>`;
            }).join('')}
                                    <!-- Always-visible upload zone (Unless Locked) -->
                                    ${isAdmin || !isLocked ? `
                                    <div class="col-span-full ${(item.documents || []).length > 0 ? 'mt-1' : 'py-8'} text-center bg-gray-50 dark:bg-dark-bg rounded-xl border-2 border-dashed border-gray-200 dark:border-dark-border cursor-pointer hover:border-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-all group ${(item.documents || []).length > 0 ? 'py-4' : 'py-8'}" onclick="window.triggerAgendaDocUpload(${itemId}, ${agendaId}, ${sessionId})">
                                        <i class="bi bi-cloud-upload text-2xl text-gray-300 group-hover:text-red-400 mb-1 block transition-colors"></i>
                                        <p class="text-xs text-gray-500 dark:text-dark-muted group-hover:text-red-500 transition-colors">
                                    ${(item.documents || []).length > 0 ? '<strong>Add more documents</strong>' : 'No attachments yet. <strong>Click here</strong> to upload.'}
                                        </p>
                                    </div>
                                    ` : `
                                    `}
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('content-area').innerHTML = html;
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error('Error viewing agenda item details:', error);
        showNotification('Error: ' + error.message, 'error');
    }
};
/**
 * Open modal to add a new motion type
 */
window.openAddMotionModal = function () {
    const modalHtml = `
        <div id="addMotionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] backdrop-blur-sm">
            <div class="bg-white dark:bg-dark-card rounded-2xl shadow-2xl p-6 w-full max-w-sm m-4 animate-fade-in-up">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">Add New Motion</h3>
                    <button onclick="document.getElementById('addMotionModal').remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <form id="addMotionForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">Motion Name</label>
                        <input type="text" name="name" required placeholder="e.g., For Approval"
                            class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-dark-bg dark:text-white transition">
                    </div>
                    <div class="flex gap-3">
                        <button type="button" onclick="document.getElementById('addMotionModal').remove()" 
                            class="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-lg hover:bg-gray-50 transition">
                            Cancel
                        </button>
                        <button type="submit" 
                            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold shadow-lg shadow-red-500/20">
                            Add Motion
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('addMotionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = new FormData(e.target).get('name');

        try {
            const response = await fetch('../api/api_agendas.php?action=add_motion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });

            const result = await response.json();
            if (result.success) {
                showNotification('Motion added successfully', 'success');
                document.getElementById('addMotionModal').remove();

                // Refresh motion dropdowns if they exist (both modal and inline)
                const motions = await window.getMotions();
                const motionSelects = document.querySelectorAll('select[name="item_recommendation"], select.inline-editor');
                motionSelects.forEach(select => {
                    const currentValue = select.value;
                    let options = '<option value="">Select Motion</option>';
                    motions.forEach(m => {
                        // Select the new one if we just added it, otherwise keep current
                        const isNew = m.name === name;
                        options += `<option value="${m.name}" ${isNew ? 'selected' : (m.name === currentValue ? 'selected' : '')}>${m.name}</option>`;
                    });
                    select.innerHTML = options;

                    // Manually trigger change event if it's the inline editor to enable the Save button
                    if (select.classList.contains('inline-editor')) {
                        select.dispatchEvent(new Event('change'));
                    }
                });
            } else {
                showNotification(result.message || 'Failed to add motion', 'error');
            }
        } catch (error) {
            console.error('Error adding motion:', error);
            showNotification('Error adding motion', 'error');
        }
    });
};

/**
 * Open modal to manage (delete) motion types
 */
window.openManageMotionsModal = async function () {
    const motions = await window.getMotions();

    const modalHtml = `
        <div id="manageMotionsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] backdrop-blur-sm">
            <div class="bg-white dark:bg-dark-card rounded-2xl shadow-2xl p-6 w-full max-w-sm m-4 animate-fade-in-up">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <i class="bi bi-gear-fill text-red-600"></i> Manage Motions
                    </h3>
                    <button onclick="document.getElementById('manageMotionsModal').remove()" class="text-gray-400 hover:text-gray-600 transition-colors">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                
                <div class="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar mb-6">
                    ${motions.length > 0 ? motions.map(m => `
                        <div class="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg hover:bg-white dark:hover:bg-dark-card transition-all group">
                            <span class="text-sm font-medium text-gray-700 dark:text-dark-text">${m.name}</span>
                            <button onclick="window.removeMotion('${m.name.replace(/'/g, "\\'")}')" class="w-8 h-8 rounded-lg bg-red-50 text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center" title="Delete Motion">
                                <i class="bi bi-trash-fill text-sm"></i>
                            </button>
                        </div>
                    `).join('') : '<p class="text-sm text-gray-500 italic text-center py-4">No motions found.</p>'}
                </div>

                <div class="pt-4 border-t border-gray-100 dark:border-dark-border">
                    <button onclick="document.getElementById('manageMotionsModal').remove()" 
                        class="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-dark-text rounded-lg hover:bg-gray-200 transition font-bold">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

/**
 * Remove a motion type with confirmation
 */
window.removeMotion = async function (name) {
    const confirmed = await window.showConfirmModal({
        title: 'Delete Motion',
        message: `Are you sure you want to delete the motion "${name}"?`,
        description: 'This will remove it from the choices but won\'t affect items already using it.',
        type: 'danger',
        confirmText: 'Delete'
    });

    if (!confirmed) return;

    try {
        const response = await fetch('../api/api_agendas.php?action=delete_motion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        const result = await response.json();
        if (result.success) {
            showNotification('Motion deleted successfully', 'success');

            // Re-render manage modal to show updated list
            const modal = document.getElementById('manageMotionsModal');
            if (modal) {
                modal.remove();
                window.openManageMotionsModal();
            }

            // Refresh all dropdowns
            const motions = await window.getMotions();
            const motionSelects = document.querySelectorAll('select[name="item_recommendation"], select.inline-editor');
            motionSelects.forEach(select => {
                const currentValue = select.value;
                let options = '<option value="">Select Motion</option>';
                motions.forEach(m => {
                    options += `<option value="${m.name}" ${m.name === currentValue ? 'selected' : ''}>${m.name}</option>`;
                });
                select.innerHTML = options;
            });
        } else {
            showNotification(result.message || 'Failed to delete motion', 'error');
        }
    } catch (error) {
        console.error('Error deleting motion:', error);
        showNotification('Error deleting motion', 'error');
    }
};
/**
 * Toggle inline editing for a section
 */
window.toggleInlineEdit = async function (field, itemId, agendaId, sessionId) {
    const section = document.getElementById(`section-${field}`);
    if (!section) return;

    const displayArea = section.querySelector('.content-display');
    const controlsArea = section.querySelector('.inline-edit-controls');

    // Use the actual data from the object or fallback to empty string
    const currentValue = (window.currentAgendaItem && window.currentAgendaItem[field]) ? String(window.currentAgendaItem[field]).trim() : '';

    // Save current state to allow cancellation
    section.dataset.originalHtml = displayArea.innerHTML;
    section.dataset.originalValue = currentValue;

    let editHtml = '';
    if (field === 'item_recommendation') {
        const motions = await window.getMotions();
        const user = getCurrentUser();
        const role = user ? (user.role || user.user_role || 'User') : 'User';
        const isStaffOrAdmin = (role.toLowerCase() === 'super admin' || role.toLowerCase() === 'admin') || role.toLowerCase() === 'staff';

        editHtml = `
            <div class="flex gap-2 w-full">
                <select class="inline-editor flex-1 px-4 py-3 border border-blue-300 dark:border-blue-900/50 bg-gray-50 dark:bg-dark-bg rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-lg shadow-blue-500/5">
                    <option value="">Select Motion</option>
                    ${motions.map(m => `<option value="${m.name}" ${m.name === currentValue ? 'selected' : ''}>${m.name}</option>`).join('')}
                </select>
                ${isStaffOrAdmin ? `
                <div class="flex gap-1">
                    <button type="button" onclick="window.openAddMotionModal()" class="px-3 bg-white dark:bg-dark-bg border border-blue-300 dark:border-blue-900/50 rounded-xl text-blue-600 hover:bg-blue-50 transition shadow-sm" title="Add New Motion">
                        <i class="bi bi-plus-lg"></i>
                    </button>
                    <button type="button" onclick="window.openManageMotionsModal()" class="px-3 bg-white dark:bg-dark-bg border border-blue-300 dark:border-blue-900/50 rounded-xl text-red-600 hover:bg-red-50 transition shadow-sm" title="Delete/Manage Motions">
                        <i class="bi bi-trash-fill"></i>
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    } else if (field === 'item_title') {
        editHtml = `
            <input type="text" class="inline-editor w-full px-4 py-3 border-2 border-white/30 bg-white/10 text-white rounded-xl focus:ring-4 focus:ring-white/20 outline-none text-2xl font-bold transition-all placeholder-white/50" 
                value="${currentValue.replace(/"/g, '&quot;')}" placeholder="Enter item title...">
        `;
    } else {
        editHtml = `
            <textarea class="inline-editor w-full px-4 py-3 border border-blue-300 dark:border-blue-900/50 bg-gray-50 dark:bg-dark-bg rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-lg shadow-blue-500/5 resize-none" rows="${field === 'item_description' ? 6 : 3}">${currentValue || ''}</textarea>
        `;
    }

    displayArea.innerHTML = editHtml;

    // Update controls to Save/Cancel (Save is disabled by default)
    controlsArea.innerHTML = `
        <div class="flex gap-1.5 animate-fade-in">
            <button id="saveBtn-${field}" disabled onclick="window.saveInlineEdit('${field}', ${itemId}, ${agendaId}, ${sessionId})" 
                class="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-400 cursor-not-allowed rounded-lg transition-all" title="Save Changes">
                <i class="bi bi-check-lg"></i>
            </button>
            <button onclick="window.cancelInlineEdit('${field}')" class="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all" title="Cancel">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
    `;
    controlsArea.classList.remove('opacity-0');

    // Focus the editor and handle change tracking
    const editor = displayArea.querySelector('.inline-editor');
    if (editor) {
        editor.focus();
        const saveBtn = document.getElementById(`saveBtn-${field}`);

        const trackChanges = () => {
            const isChanged = editor.value !== section.dataset.originalValue;
            if (isChanged) {
                saveBtn.disabled = false;
                saveBtn.classList.remove('bg-gray-100', 'text-gray-400', 'cursor-not-allowed');
                saveBtn.classList.add('bg-green-100', 'text-green-600', 'hover:bg-green-600', 'hover:text-white');
            } else {
                saveBtn.disabled = true;
                saveBtn.classList.add('bg-gray-100', 'text-gray-400', 'cursor-not-allowed');
                saveBtn.classList.remove('bg-green-100', 'text-green-600', 'hover:bg-green-600', 'hover:text-white');
            }
        };

        editor.addEventListener('input', trackChanges);
        editor.addEventListener('change', trackChanges);
    }
};

/**
 * Cancel inline editing
 */
window.cancelInlineEdit = async function (field) {
    const section = document.getElementById(`section-${field}`);
    if (!section) return;

    const editor = section.querySelector('.inline-editor');
    const isChanged = editor && editor.value.trim() !== section.dataset.originalValue.trim();

    if (isChanged) {
        const confirmed = await window.showConfirmModal({
            title: 'Confirm Action',
            message: 'You have unsaved changes. Are you sure you want to discard them?',
            type: 'danger',
            confirmText: 'Confirm',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;
    }

    const displayArea = section.querySelector('.content-display');
    const controlsArea = section.querySelector('.inline-edit-controls');

    displayArea.innerHTML = section.dataset.originalHtml;

    // Reset controls
    const itemId = window.currentAgendaItem.agenda_item_id;
    const agendaId = window.currentAgenda.agenda_id;
    const sessionId = window.currentAgenda.session_id;

    controlsArea.innerHTML = `
        <button onclick="window.toggleInlineEdit('${field}', ${itemId}, ${agendaId}, ${sessionId})" class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit">
            <i class="bi bi-pencil-square"></i>
        </button>
    `;
    controlsArea.classList.add('opacity-0');
};

/**
 * Save inline edited field
 */
window.saveInlineEdit = async function (field, itemId, agendaId, sessionId) {
    const section = document.getElementById(`section-${field}`);
    if (!section) return;

    const editor = section.querySelector('.inline-editor');
    if (!editor) return;

    const newValue = editor.value;

    const confirmed = await window.showConfirmModal({
        title: 'Save Changes',
        message: 'Are you sure you want to save these changes?',
        type: 'info',
        confirmText: 'Save',
        cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
        // We need all current data because api_agendas update_item expects all fields or we used a context-aware body in earlier steps?
        // Let's use the current item data as base
        const item = window.currentAgendaItem;
        const body = {
            item_id: itemId,
            item_title: item.item_title,
            item_purpose: field === 'item_purpose' ? newValue : (item.item_purpose || ''),
            item_description: field === 'item_description' ? newValue : (item.item_description || ''),
            item_recommendation: field === 'item_recommendation' ? newValue : (item.item_recommendation || ''),
            deadline: item.deadline ? item.deadline.split(' ')[0] : '', // API expects raw date
            assigned_to: item.assigned_to
        };

        const response = await fetch('../api/api_agendas.php?action=update_item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const result = await response.json();
        if (result.success) {
            // Update the local cache immediately so the view refresh shows new data
            if (window.currentAgenda && window.currentAgenda.items) {
                const cachedItem = window.currentAgenda.items.find(i => (i.agenda_item_id || i.item_id) == itemId);
                if (cachedItem) {
                    cachedItem[field] = newValue;
                    // Also update the dedicated current item reference
                    if (window.currentAgendaItem && (window.currentAgendaItem.agenda_item_id || window.currentAgendaItem.item_id) == itemId) {
                        window.currentAgendaItem[field] = newValue;
                    }
                }
            }

            showNotification('Field updated successfully', 'success');
            // Refresh the full view to update UI
            await window.viewAgendaItemDetailsFull(itemId, agendaId, sessionId);
        } else {
            showNotification(result.message || 'Failed to update item', 'error');
        }
    } catch (error) {
        console.error('Error updating agenda item:', error);
        showNotification('Error updating item', 'error');
    }
};

/**
 * Update the status of an agenda item (Approve/Revision Needed/etc)
 */
window.updateAgendaItemStatus = async function (itemId, newStatus, agendaId, sessionId) {
    let remarks = null;

    if (newStatus === 'Revision Needed') {
        const existingRemarks = window.currentAgendaItem?.revision_remarks || '';
        remarks = await window.showRevisionModal(itemId, agendaId, sessionId, existingRemarks);
        if (remarks === null) return; // User cancelled
    } else {
        // Show confirmation for important status changes
        const confirmMsg = newStatus === 'Approved' ? 'Are you sure you want to approve this item?' :
            `Change status to ${newStatus}?`;

        if (!await window.showConfirmModal(confirmMsg)) return;
    }

    try {
        const response = await fetch('../api/api_agendas.php?action=update_item_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                item_id: itemId,
                status: newStatus,
                remarks: remarks
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(`Item marked as ${newStatus}`, 'success');

            // Update local cache if possible
            if (window.currentAgenda && window.currentAgenda.items) {
                const item = window.currentAgenda.items.find(i => (i.agenda_item_id || i.item_id) == itemId);
                if (item) item.status = newStatus;
            }
            if (window.currentAgendaItem && (window.currentAgendaItem.agenda_item_id || window.currentAgendaItem.item_id) == itemId) {
                window.currentAgendaItem.status = newStatus;
            }

            // Refresh the current view
            await window.viewAgendaItemDetailsFull(itemId, agendaId, sessionId);
        } else {
            showNotification(result.message || 'Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showNotification('Error updating status', 'error');
    }
};

/**
 * Trigger the hidden file input for agenda item document upload
 */
window.triggerAgendaDocUpload = function (itemId, agendaId, sessionId) {
    const input = document.getElementById(`agendaDocInput_${itemId}`);
    if (input) input.click();
};

/**
 * Upload one or more documents for an agenda item (all roles allowed)
 */
window.uploadAgendaItemDocument = async function (input, itemId, agendaId, sessionId) {
    const files = input.files;
    if (!files || files.length === 0) return;

    let uploadedCount = 0;

    for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('item_id', itemId);

        try {
            const response = await fetch('../api/api_agendas.php?action=upload_item_document', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                uploadedCount++;
                // Update local cache
                if (window.currentAgenda && window.currentAgenda.items) {
                    const item = window.currentAgenda.items.find(i => (i.agenda_item_id || i.item_id) == itemId);
                    if (item) {
                        if (!item.documents) item.documents = [];
                        item.documents.unshift(result.document);
                    }
                }
            } else {
                showNotification(result.message || 'Failed to upload ' + file.name, 'error');
            }
        } catch (e) {
            console.error('Upload error:', e);
            showNotification('Error uploading ' + file.name, 'error');
        }
    }

    // Reset input so same file can be re-selected
    input.value = '';

    if (uploadedCount > 0) {
        showNotification(`${uploadedCount} document(s) uploaded successfully`, 'success');
        await window.viewAgendaItemDetailsFull(itemId, agendaId, sessionId);
    }
};

/**
 * Delete a document from an agenda item (admin/staff only)
 */
window.deleteAgendaItemDocument = async function (documentId, itemId, agendaId, sessionId) {
    if (!await window.showConfirmModal('Are you sure you want to delete this document?')) return;

    const passwordOk = await window.promptPasswordConfirmation({
        title: 'Confirm Delete Document',
        message: 'Enter your password to delete this document.',
        confirmText: 'Confirm Delete'
    });
    if (!passwordOk) return;

    try {
        const response = await fetch('../api/api_agendas.php?action=delete_item_document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document_id: documentId })
        });
        const result = await response.json();
        if (result.success) {
            showNotification('Document deleted successfully', 'success');
            if (window.currentAgenda && window.currentAgenda.items) {
                const item = window.currentAgenda.items.find(i => (i.agenda_item_id || i.item_id) == itemId);
                if (item && item.documents) {
                    item.documents = item.documents.filter(d => d.document_id != documentId);
                }
            }
            await window.viewAgendaItemDetailsFull(itemId, agendaId, sessionId);
        } else {
            showNotification(result.message || 'Failed to delete document', 'error');
        }
    } catch (e) {
        console.error('Delete doc error:', e);
        showNotification('Error deleting document', 'error');
    }
};

/**
 * Show a professional modal to capture revision remarks
 */
window.showRevisionModal = function (itemId, agendaId, sessionId, existingRemarks = '') {
    return new Promise((resolve) => {
        const existing = document.getElementById('revisionModal');
        if (existing) existing.remove();

        const modalHtml = `
        <div id="revisionModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4">
            <div class="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up border border-gray-100 dark:border-dark-border">
                <div class="p-6">
                    <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mb-4 mx-auto text-2xl">
                        <i class="bi bi-pencil-square"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">Revision Needed</h3>
                    <p class="text-gray-500 dark:text-dark-muted text-center text-sm mb-6">Please provide clear instructions on what needs to be revised in this work.</p>
                    
                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-dark-muted mb-2">Revision Instructions</label>
                        <textarea id="revision-remarks-text" rows="5" placeholder="Describe the changes needed..." class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm resize-none">${existingRemarks}</textarea>
                    </div>
                </div>
                <div class="flex border-t border-gray-100 dark:border-dark-border">
                    <button id="cancel-revision" class="flex-1 px-6 py-4 text-sm font-semibold text-gray-500 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors border-r border-gray-100 dark:border-dark-border">
                        Cancel
                    </button>
                    <button id="confirm-revision" class="flex-1 px-6 py-4 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                        ${existingRemarks ? 'Update Request' : 'Request Revision'}
                    </button>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('revisionModal');
        const textarea = document.getElementById('revision-remarks-text');

        // Place cursor at end of text if existing
        if (existingRemarks) {
            textarea.setSelectionRange(existingRemarks.length, existingRemarks.length);
        }
        textarea.focus();

        document.getElementById('cancel-revision').onclick = () => {
            modal.remove();
            resolve(null);
        };

        document.getElementById('confirm-revision').onclick = () => {
            const remarks = textarea.value.trim();
            if (!remarks) {
                textarea.classList.add('border-red-500', 'shake');
                setTimeout(() => textarea.classList.remove('shake'), 10);
                return;
            }
            modal.remove();
            resolve(remarks);
        };
    });
};

window.changeAgendaDocumentPermission = async function (documentId, agendaId, sessionId, currentState) {
    const states = ['Public view', 'Blur', 'Private', 'Lock'];
    let currentIndex = states.indexOf(currentState);
    if (currentIndex === -1) currentIndex = 0;
    const nextState = states[(currentIndex + 1) % states.length];
    
    const confirmed = await window.showConfirmModal({
        title: 'Change Document Permission',
        message: `Current state is "${currentState}". Change to "${nextState}"? (Cycles through Public view, Blur, Private, Lock)`,
        confirmText: 'Change State',
        type: 'danger'
    });
    if (!confirmed) return;
    
    try {
        const response = await fetch('../api/api_agendas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update_document_permission',
                document_id: documentId,
                permission_state: nextState
            })
        });
        const result = await response.json();
        if (result.success) {
            showNotification('Document permission updated to ' + nextState, 'success');
            if (typeof window.viewAgendaDetails === 'function') {
                window.viewAgendaDetails(agendaId, sessionId);
            }
        } else {
            showNotification(result.message || 'Failed to update permission', 'error');
        }
    } catch (e) {
        showNotification('Error updating permission', 'error');
    }
};
