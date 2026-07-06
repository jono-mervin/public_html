// Administration Modules for LACS - Restored Old UI with Database Sync
// Includes: Reports & Analytics, System Settings, Audit Logs, User Management

// ==============================
// REPORTS & ANALYTICS
// ==============================

window.renderReportsAnalytics = async function () {
    const html = `
        <div class="space-y-6 animate-fade-in-up md:pb-10">
            <!-- Header -->
            <!-- Premium Header - Red Palette -->
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-8 shadow-xl">
                <div class="absolute inset-0 bg-black opacity-10"></div>
                <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                <div class="relative z-10">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div class="text-white">
                            <h1 class="text-3xl font-bold mb-2">Reports & Analytics</h1>
                            <p class="text-red-100 text-sm">System-wide data analysis and reporting</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="exportReports()" class="px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium flex items-center gap-2 shadow-lg transition-all">
                                <i class="bi bi-download"></i> Export Data (CSV)
                            </button>
                            <button onclick="renderReportsAnalytics()" class="p-2 bg-red-700/50 text-white rounded-lg hover:bg-red-700 transition-all border border-red-500/30">
                                <i class="bi bi-arrow-clockwise"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="reports-stats-grid">
                <!-- Loading placeholders -->
                <div class="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md border-l-4 border-red-600 animate-pulse border border-gray-100 dark:border-dark-border">
                    <div class="h-4 bg-gray-100 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                    <div class="h-8 bg-gray-100 dark:bg-slate-700 rounded w-3/4"></div>
                </div>
                <div class="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md border-l-4 border-blue-600 animate-pulse border border-gray-100 dark:border-dark-border">
                     <div class="h-4 bg-gray-100 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                    <div class="h-8 bg-gray-100 dark:bg-slate-700 rounded w-3/4"></div>
                </div>
                <div class="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md border-l-4 border-yellow-500 animate-pulse border border-gray-100 dark:border-dark-border">
                     <div class="h-4 bg-gray-100 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                    <div class="h-8 bg-gray-100 dark:bg-slate-700 rounded w-3/4"></div>
                </div>
                <div class="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md border-l-4 border-green-600 animate-pulse border border-gray-100 dark:border-dark-border">
                     <div class="h-4 bg-gray-100 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                    <div class="h-8 bg-gray-100 dark:bg-slate-700 rounded w-3/4"></div>
                </div>
            </div>

            <!-- Charts Row (Mock structure but updated labels) -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Bar Chart Simulator -->
                <div class="bg-white dark:bg-dark-card rounded-xl shadow-md p-6 border border-gray-100 dark:border-dark-border transition-colors duration-300">
                     <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Session Frequency (Active Stats)</h3>
                     <div class="relative h-64 w-full">
                        <canvas id="sessionFrequencyChart"></canvas>
                     </div>
                </div>

                <!-- Donut Chart Simulator -->
                <div class="bg-white dark:bg-dark-card rounded-xl shadow-md p-6 border border-gray-100 dark:border-dark-border transition-colors duration-300">
                     <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">System Distribution</h3>
                     <div class="relative h-64 w-full flex justify-center">
                        <canvas id="distributionChart"></canvas>
                     </div>
                </div>
            </div>
            
            <!-- Recent Activity List -->
             <div class="bg-white dark:bg-dark-card rounded-xl shadow-md p-6 border border-gray-100 dark:border-dark-border transition-colors duration-300">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Recent System Activities</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-gray-50 dark:bg-dark-bg text-gray-600 dark:text-dark-muted text-xs uppercase">
                            <tr>
                                <th class="p-3">Activity</th>
                                <th class="p-3">User</th>
                                <th class="p-3">Date</th>
                                <th class="p-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody id="recent-activities-body" class="divide-y divide-gray-100 dark:divide-dark-border text-sm">
                            <tr>
                                <td colspan="4" class="p-6 text-center text-gray-400 dark:text-dark-muted">Loading activities...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
             </div>
        </div>
    `;
    document.getElementById('content-area').innerHTML = html;
    await loadReportsDataEnhanced();
};

async function loadReportsDataEnhanced() {
    try {
        const response = await fetch('../api/api_reports.php');
        const result = await response.json();

        if (result.success) {
            const data = result.data;

            // Update Stats Grid
            const statsGrid = document.getElementById('reports-stats-grid');
            if (statsGrid) {
                statsGrid.innerHTML = `
                    <div class="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md border-l-4 border-red-600 transform transition hover:-translate-y-1 border border-gray-100 dark:border-dark-border">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase">Total Users</p>
                                <h3 class="text-2xl font-bold text-gray-800 dark:text-white mt-1">${data.total_users || 0}</h3>
                            </div>
                            <div class="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                                <i class="bi bi-people text-xl"></i>
                            </div>
                        </div>
                        <p class="text-xs text-gray-400 dark:text-dark-muted mt-4">Synced from database</p>
                    </div>

                    <div class="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md border-l-4 border-blue-600 transform transition hover:-translate-y-1 border border-gray-100 dark:border-dark-border">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase">Total Sessions</p>
                                <h3 class="text-2xl font-bold text-gray-800 dark:text-white mt-1">${data.total_sessions || 0}</h3>
                            </div>
                            <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                <i class="bi bi-calendar-event text-xl"></i>
                            </div>
                        </div>
                        <p class="text-xs text-green-600 dark:text-green-400 mt-4 flex items-center">
                            <span class="font-medium">${data.completion_rate || 0}%</span>
                            <span class="text-gray-400 dark:text-dark-muted ml-1">completion rate</span>
                        </p>
                    </div>

                    <div class="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md border-l-4 border-yellow-500 transform transition hover:-translate-y-1 border border-gray-100 dark:border-dark-border">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase">Pending Items</p>
                                <h3 class="text-2xl font-bold text-gray-800 dark:text-white mt-1">${data.pending_items || 0}</h3>
                            </div>
                            <div class="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-600 dark:text-yellow-400">
                                <i class="bi bi-hourglass-split text-xl"></i>
                            </div>
                        </div>
                         <p class="text-xs text-gray-400 dark:text-dark-muted mt-4">Action required</p>
                    </div>

                    <div class="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md border-l-4 border-green-600 transform transition hover:-translate-y-1 border border-gray-100 dark:border-dark-border">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase">Docs Processed</p>
                                <h3 class="text-2xl font-bold text-gray-800 dark:text-white mt-1">${data.docs_processed || 0}</h3>
                            </div>
                            <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                                <i class="bi bi-file-earmark-text text-xl"></i>
                            </div>
                        </div>
                         <p class="text-xs text-green-600 dark:text-green-400 mt-4">Live record count</p>
                    </div>
                `;
            }

            // Charts implementation using Chart.js
            if (typeof Chart !== 'undefined') {
                const ctxFreq = document.getElementById('sessionFrequencyChart');
                if (ctxFreq) {
                    new Chart(ctxFreq, {
                        type: 'bar',
                        data: {
                            labels: data.monthly_activity.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                            datasets: [{
                                label: 'Sessions',
                                data: data.monthly_activity.data || [0, 0, 0, 0, 0, 0],
                                backgroundColor: '#dc2626',
                                borderRadius: 4
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: { y: { beginAtZero: true } }
                        }
                    });
                }

                const ctxDist = document.getElementById('distributionChart');
                if (ctxDist) {
                    const statusData = data.distribution || {};
                    new Chart(ctxDist, {
                        type: 'doughnut',
                        data: {
                            labels: Object.keys(statusData),
                            datasets: [{
                                data: Object.values(statusData),
                                backgroundColor: ['#dc2626', '#3b82f6', '#f59e0b', '#10b981', '#6b7280']
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'bottom' } }
                        }
                    });
                }
            }

            // Recent Activities
            const activitiesBody = document.getElementById('recent-activities-body');
            if (activitiesBody) {
                const logsRes = await fetch('../api/api_logs.php?limit=5');
                const logsData = await logsRes.json();
                if (logsData.success && logsData.data) {
                    activitiesBody.innerHTML = logsData.data.map(log => `
                        <tr class="hover:bg-gray-50 transition">
                            <td class="p-3">
                                <p class="font-medium text-gray-800">${log.action}</p>
                                <p class="text-xs text-gray-500 truncate max-w-xs">${log.description}</p>
                            </td>
                            <td class="p-3 font-medium text-gray-600">${log.user_name || 'System'}</td>
                            <td class="p-3 text-gray-500">${new Date(log.created_at).toLocaleDateString()}</td>
                            <td class="p-3 text-right"><span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">SUCCESS</span></td>
                        </tr>
                    `).join('');
                }
            }
        }
    } catch (e) {
        console.error('Error loading reports data:', e);
    }
}

// ==============================
// USER MANAGEMENT
// ==============================

window.renderUserManagement = async function () {
    const html = `
        <div class="space-y-6 animate-fade-in-up md:pb-10">
            <!-- Premium Header - Red Palette -->
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-8 shadow-xl mb-6">
                <div class="absolute inset-0 bg-black opacity-10"></div>
                <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                <div class="relative z-10">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div class="text-white">
                            <h1 class="text-3xl font-bold mb-2">User & Access Management</h1>
                            <p class="text-red-100 text-sm">Manage system users, roles, and permissions</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="openAddUserModal()" class="px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium flex items-center gap-2 shadow-lg transition-all">
                                <i class="bi bi-person-plus"></i> Add New User
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- User Statistics -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6" id="user-stats-grid">
                <div class="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border animate-pulse"><div class="h-10 bg-gray-50 dark:bg-dark-bg rounded"></div></div>
                <div class="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border animate-pulse"><div class="h-10 bg-gray-50 dark:bg-dark-bg rounded"></div></div>
                <div class="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border animate-pulse"><div class="h-10 bg-gray-50 dark:bg-dark-bg rounded"></div></div>
                <div class="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border animate-pulse"><div class="h-10 bg-gray-50 dark:bg-dark-bg rounded"></div></div>
            </div>

            <!-- Filters and Search -->
            <div class="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border mb-6 flex flex-col md:flex-row gap-4 justify-between items-center transition-colors duration-300">
                <div class="relative w-full md:w-96">
                    <i class="bi bi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-muted"></i>
                    <input type="text" id="user-search-input" onkeyup="filterUsersTable()" placeholder="Search by name, email, or role..." class="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:text-white transition-colors">
                </div>
                <div class="flex gap-2 w-full md:w-auto">
                    <select id="user-role-filter" onchange="filterUsersTable()" class="px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition-colors">
                        <option value="all">All Roles</option>
                        <option value="Super Admin">Super Admin</option><option value="Admin">Admin</option>
                        <option value="Staff">Staff</option>
                        <option value="User">User</option>
                    </select>
                    <select id="user-status-filter" onchange="filterUsersTable()" class="px-3 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition-colors">
                        <option value="all">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Pending">Pending</option>
                    </select>
                </div>
            </div>

            <!-- User List Table -->
            <div class="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden transition-colors duration-300">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse" id="usersTable">
                        <thead>
                            <tr class="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border text-xs uppercase text-gray-500 dark:text-dark-muted font-semibold">
                                <th class="p-4">User</th>
                                <th class="p-4">Role</th>
                                <th class="p-4">Status</th>
                                <th class="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="users-list-body" class="divide-y divide-gray-100 dark:divide-dark-border">
                            <tr>
                                <td colspan="4" class="p-12 text-center text-gray-400 dark:text-dark-muted">Loading user directory...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    document.getElementById('content-area').innerHTML = html;
    await loadUsersDataEnhanced();
};

async function loadUsersDataEnhanced() {
    try {
        const response = await fetch('../api/api_users.php');
        const data = await response.json();

        if (data.success && data.users) {
            const users = data.users;

            // Update Stats
            const stats = document.getElementById('user-stats-grid');
            if (stats) {
                const active = users.filter(u => u.status === 'Active').length;
                stats.innerHTML = `
                    <div class="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border">
                        <p class="text-sm text-gray-500 dark:text-dark-muted">Total Users</p>
                        <p class="text-2xl font-bold text-gray-800 dark:text-white">${users.length}</p>
                    </div>
                    <div class="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border">
                        <p class="text-sm text-gray-500 dark:text-dark-muted">Active Users</p>
                        <p class="text-2xl font-bold text-green-600 dark:text-green-400">${active}</p>
                    </div>
                    <div class="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border">
                        <p class="text-sm text-gray-500 dark:text-dark-muted">Inactive</p>
                        <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${users.length - active}</p>
                    </div>
                    <div class="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border">
                        <p class="text-sm text-gray-500 dark:text-dark-muted">Admins</p>
                        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${users.filter(u => u.user_(role === 'Super Admin' || role === 'Admin')).length}</p>
                    </div>
                `;
            }

            // Update Table
            const tbody = document.getElementById('users-list-body');
            if (tbody) {
                tbody.innerHTML = users.map(user => {
                    const avatar = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_name)}&background=random`;
                    return `
                    <tr class="hover:bg-gray-50 dark:hover:bg-dark-bg transition user-row" data-search="${user.user_name} ${user.email} ${user.user_role} ${user.status}">
                        <td class="p-4">
                            <div class="flex items-center gap-3">
                                <img src="${avatar}" alt="${user.user_name}" class="w-10 h-10 rounded-full">
                                <div>
                                    <p class="text-sm font-bold text-gray-800 dark:text-white">${user.user_name}</p>
                                    <p class="text-[10px] text-gray-400 dark:text-dark-muted uppercase font-semibold tracking-wider mb-0.5">${user.username}</p>
                                    <p class="text-xs text-gray-500 dark:text-dark-muted italic underline decoration-gray-300">${user.email || 'No email'}</p>
                                </div>
                            </div>
                        </td>
                        <td class="p-4">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.user_role === 'Super Admin' || user.user_role === 'Admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'}">
                                ${user.user_role}
                            </span>
                        </td>
                        <td class="p-4">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-dark-muted'}">
                                ${user.status}
                            </span>
                        </td>
                        <td class="p-4 text-right">
                            <div class="flex justify-end gap-2">
                                <button onclick="editUser(${user.user_id})" class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button onclick="deleteUser(${user.user_id})" class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                    `;
                }).join('');
            }
        }
    } catch (e) {
        console.error('Error loading users:', e);
    }
}

window.filterUsersTable = function () {
    const search = document.getElementById('user-search-input').value.toLowerCase();
    const role = document.getElementById('user-role-filter').value;
    const status = document.getElementById('user-status-filter').value;
    const rows = document.querySelectorAll('.user-row');

    rows.forEach(row => {
        const text = row.getAttribute('data-search').toLowerCase();
        const matchesSearch = text.includes(search);
        const matchesRole = role === 'all' || text.includes(role.toLowerCase());
        const matchesStatus = status === 'all' || text.includes(status.toLowerCase());

        row.style.display = (matchesSearch && matchesRole && matchesStatus) ? "" : "none";
    });
};

// ==============================
// AUDIT LOGS
// ==============================

window.renderAuditLogs = async function () {
    try {
        const response = await fetch('../api/api_logs.php?limit=500');
        const data = await response.json();

        if (!data.success) {
            showNotification('Failed to load audit logs', 'error');
            return;
        }

        const logs = data.logs || data.data || [];
        const criticalCount = logs.filter(l => l.action.toLowerCase().includes('delete') || l.action.toLowerCase().includes('fail')).length;

        const html = `
        <div class="space-y-6 animate-fade-in-up pb-10">
            <!-- Header Banner -->
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-8 shadow-xl mb-6">
                <div class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div class="text-white">
                        <h1 class="text-3xl font-bold mb-2">System Audit Logs</h1>
                        <p class="text-red-100 text-sm opacity-90">Monitor system activities and security events</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="exportAuditLogs()" class="px-5 py-2.5 bg-white text-red-600 rounded-xl hover:bg-red-50 text-sm font-bold flex items-center gap-2 shadow-lg transition-all">
                            <i class="bi bi-download"></i> Export CSV
                        </button>
                        <button onclick="renderAuditLogs()" class="px-5 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 text-sm font-bold flex items-center gap-2 border border-white/20 transition-all">
                            <i class="bi bi-arrow-clockwise"></i> Refresh Logs
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border transition-colors duration-300">
                    <p class="text-sm font-medium text-gray-500 dark:text-dark-muted mb-1 uppercase tracking-wider">Total Records</p>
                    <h3 class="text-3xl font-bold text-gray-900 dark:text-white">${logs.length}</h3>
                </div>
                <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border transition-colors duration-300">
                    <p class="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1 uppercase tracking-wider">Critical Events</p>
                    <h3 class="text-3xl font-bold text-gray-900 dark:text-white">${criticalCount}</h3>
                </div>
                <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border transition-colors duration-300">
                    <p class="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wider">Active Users Logged</p>
                    <h3 class="text-3xl font-bold text-gray-900 dark:text-white">${new Set(logs.map(l => l.user_id)).size}</h3>
                </div>
            </div>

            <!-- Filters -->
            <div class="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border flex flex-col md:flex-row gap-4 items-center transition-colors duration-300">
                <div class="relative flex-1 w-full">
                    <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-muted"></i>
                    <input type="text" id="logSearch" onkeyup="filterAuditLogs()" placeholder="Search logs..." 
                        class="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-dark-bg border-0 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm dark:text-white">
                </div>
                <div class="flex items-center gap-3 text-xs font-semibold text-gray-500 dark:text-dark-muted">
                    <span>Rows:</span>
                    <select id="auditLogRowsSelect" onchange="updateAuditLogRows()" class="px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg text-xs font-medium bg-white dark:bg-dark-bg hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500">
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select>
                    <div class="flex items-center gap-1 border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden bg-white dark:bg-dark-bg">
                        <button id="auditLogPrev" onclick="changeAuditLogPage('prev')" class="px-2 py-1 text-gray-500 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-bg disabled:opacity-40 disabled:cursor-not-allowed" title="Previous page">
                            <i class="bi bi-chevron-left text-sm"></i>
                        </button>
                        <span id="auditLogPageInfo" class="px-2 text-[11px] text-gray-500 dark:text-dark-muted font-medium whitespace-nowrap">1 / 1</span>
                        <button id="auditLogNext" onclick="changeAuditLogPage('next')" class="px-2 py-1 text-gray-500 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-bg disabled:opacity-40 disabled:cursor-not-allowed" title="Next page">
                            <i class="bi bi-chevron-right text-sm"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Audit Table -->
            <div class="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden transition-colors duration-300">
                <div class="overflow-x-auto overflow-y-auto max-h-[680px]">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-gray-50 dark:bg-dark-bg text-xs uppercase text-gray-500 dark:text-dark-muted font-bold">
                            <tr>
                                <th class="p-4 pl-6">Timestamp</th>
                                <th class="p-4">User</th>
                                <th class="p-4">Action</th>
                                <th class="p-4">Details</th>
                                <th class="p-4 pr-6 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody id="auditLogsTable" class="divide-y divide-gray-100 dark:divide-dark-border text-sm">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;
        document.getElementById('content-area').innerHTML = html;
        window.auditLogsData = logs;
        window.currentAuditLogPage = 1;
        setTimeout(() => {
            if (typeof window.updateAuditLogRows === 'function') {
                window.updateAuditLogRows();
            }
        }, 0);
    } catch (e) {
        console.error('Audit Logs Error:', e);
    }
};

window.filterAuditLogs = function () {
    window.currentAuditLogPage = 1;
    window.updateAuditLogRows();
};

window.updateAuditLogRows = function () {
    const tbody = document.getElementById('auditLogsTable');
    if (!tbody) return;

    const select = document.getElementById('auditLogRowsSelect');
    const limit = select ? parseInt(select.value, 10) || 10 : 10;

    const searchInput = document.getElementById('logSearch');
    const search = (searchInput?.value || '').toLowerCase();

    const allLogs = Array.isArray(window.auditLogsData) ? window.auditLogsData : [];

    const filtered = allLogs.filter(l => {
        const text = `${l.user_name || ''} ${l.action || ''} ${l.description || ''}`.toLowerCase();
        return !search || text.includes(search);
    });

    const totalPages = filtered.length === 0 ? 1 : Math.max(1, Math.ceil(filtered.length / limit));

    if (!window.currentAuditLogPage || window.currentAuditLogPage < 1) {
        window.currentAuditLogPage = 1;
    }
    if (window.currentAuditLogPage > totalPages) {
        window.currentAuditLogPage = totalPages;
    }

    const startIndex = (window.currentAuditLogPage - 1) * limit;
    const pageLogs = filtered.slice(startIndex, startIndex + limit);

    if (pageLogs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="p-8 text-center text-gray-400 dark:text-dark-muted">No audit logs found.</td>
            </tr>
        `;
    } else {
        tbody.innerHTML = pageLogs.map(l => {
            const date = new Date(l.created_at);
            return `
                <tr class="hover:bg-gray-50 dark:hover:bg-dark-bg transition log-row" data-search="${l.user_name || ''} ${l.action || ''} ${l.description || ''}">
                    <td class="p-4 pl-6 text-gray-500 dark:text-dark-muted">
                        <span class="font-bold text-gray-900 dark:text-white">${date.toLocaleDateString()}</span><br>
                        <span class="text-xs">${date.toLocaleTimeString()}</span>
                    </td>
                    <td class="p-4 font-bold text-gray-800 dark:text-dark-text">${l.user_name || 'System'}</td>
                    <td class="p-4 font-medium text-gray-700 dark:text-dark-muted">${l.action}</td>
                    <td class="p-4 text-gray-600 dark:text-dark-muted truncate max-w-sm">${l.description || '-'}</td>
                    <td class="p-4 pr-6 text-right">
                        <span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-[10px] font-bold uppercase">SUCCESS</span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    const pageInfo = document.getElementById('auditLogPageInfo');
    if (pageInfo) {
        pageInfo.textContent = `${filtered.length === 0 ? 0 : window.currentAuditLogPage} / ${totalPages}`;
    }

    const prevBtn = document.getElementById('auditLogPrev');
    const nextBtn = document.getElementById('auditLogNext');
    if (prevBtn) prevBtn.disabled = window.currentAuditLogPage <= 1;
    if (nextBtn) nextBtn.disabled = window.currentAuditLogPage >= totalPages;
};

window.changeAuditLogPage = function (direction) {
    const select = document.getElementById('auditLogRowsSelect');
    const limit = select ? parseInt(select.value, 10) || 10 : 10;
    if (!limit) return;

    const allLogs = Array.isArray(window.auditLogsData) ? window.auditLogsData : [];
    const searchInput = document.getElementById('logSearch');
    const search = (searchInput?.value || '').toLowerCase();
    const filtered = allLogs.filter(l => {
        const text = `${l.user_name || ''} ${l.action || ''} ${l.description || ''}`.toLowerCase();
        return !search || text.includes(search);
    });
    const totalPages = filtered.length === 0 ? 1 : Math.max(1, Math.ceil(filtered.length / limit));

    if (direction === 'next' && window.currentAuditLogPage < totalPages) {
        window.currentAuditLogPage++;
    } else if (direction === 'prev' && window.currentAuditLogPage > 1) {
        window.currentAuditLogPage--;
    }

    window.updateAuditLogRows();
};

// DELETED CONFLICTING SETTINGS CODE - Handled by main-features.js premium implementation

window.exportReports = function () {
    showNotification('Exporting data...', 'info');
};

window.openAddUserModal = function () {
    const existing = document.getElementById('addUserModal');
    if (existing) existing.remove();

    const modalHtml = `
        <div id="addUserModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div class="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-zoom-in border border-gray-100 dark:border-dark-border">
                <div class="bg-gradient-to-r from-red-600 to-red-800 px-6 py-4 flex justify-between items-center text-white">
                    <h3 class="text-xl font-bold">Add New System User</h3>
                    <button onclick="document.getElementById('addUserModal').remove()" class="text-white/80 hover:text-white transition">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <form id="addUserForm" onsubmit="window.saveNewUser(event)" class="p-6 space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="text-sm font-semibold text-gray-700 dark:text-dark-muted">Full Name *</label>
                            <input type="text" name="user_name" required placeholder="John Doe" class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 transition outline-none">
                        </div>
                        <div class="space-y-1">
                            <label class="text-sm font-semibold text-gray-700 dark:text-dark-muted">Username *</label>
                            <input type="text" name="username" required placeholder="johndoe" class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 transition outline-none">
                        </div>
                    </div>
                    <div class="space-y-1">
                        <label class="text-sm font-semibold text-gray-700 dark:text-dark-muted">Email Address *</label>
                        <input type="email" name="email" required placeholder="john@valenzuela.gov.ph" class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 transition outline-none">
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="text-sm font-semibold text-gray-700 dark:text-dark-muted">Password *</label>
                            <input type="password" name="password" required class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 transition outline-none">
                        </div>
                        <div class="space-y-1">
                            <label class="text-sm font-semibold text-gray-700 dark:text-dark-muted">Access Role *</label>
                            <select name="role" required class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 transition outline-none">
                                <option value="User - Committee">User - Committee</option>
                                <option value="Staff">Staff</option>
                                <option value="Admin">Admin</option>
                                <option value="Super Admin">Super Admin</option>
                            </select>
                        </div>
                    </div>
                    <div class="pt-4 flex gap-3">
                        <button type="button" onclick="document.getElementById('addUserModal').remove()" class="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg text-gray-700 dark:text-dark-muted font-medium hover:bg-gray-50 dark:hover:bg-dark-bg transition">Cancel</button>
                        <button type="submit" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-md transition">Create User</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.saveNewUser = async function (e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());

    try {
        const response = await fetch('../api/api_users.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            showNotification('User created successfully', 'success');
            document.getElementById('addUserModal').remove();
            renderUserManagement(); // Refresh table
        } else {
            showNotification(result.message || 'Failed to create user', 'error');
        }
    } catch (e) {
        showNotification('An error occurred during creation', 'error');
    }
};

window.editUser = async function (id) {
    try {
        const response = await fetch(`../api/api_users.php?id=${id}`);
        const result = await response.json();
        if (!result.success) return showNotification('User not found', 'error');

        const user = result.user;
        const existing = document.getElementById('editUserModal');
        if (existing) existing.remove();

        const modalHtml = `
            <div id="editUserModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div class="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-zoom-in border border-gray-100 dark:border-dark-border">
                    <div class="bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-4 flex justify-between items-center text-white">
                        <h3 class="text-xl font-bold">Edit Member Settings</h3>
                        <button onclick="document.getElementById('editUserModal').remove()" class="text-white/80 hover:text-white transition">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                    <form onsubmit="window.saveUserEdit(event, ${id})" class="p-6 space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <label class="text-sm font-semibold text-gray-700 dark:text-dark-muted">Full Name *</label>
                                <input type="text" name="user_name" value="${user.user_name}" required class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 transition outline-none">
                            </div>
                            <div class="space-y-1">
                                <label class="text-sm font-semibold text-gray-700 dark:text-dark-muted">Username *</label>
                                <input type="text" name="username" value="${user.username}" required class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 transition outline-none">
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="text-sm font-semibold text-gray-700 dark:text-dark-muted">Email Address *</label>
                            <input type="email" name="email" value="${user.email || ''}" required class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 transition outline-none">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <label class="text-sm font-semibold text-gray-700 dark:text-dark-muted">Access Role</label>
                                <select name="role" class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 transition outline-none">
                                    <option value="User - Committee" ${user.user_role === 'User - Committee' ? 'selected' : ''}>User - Committee</option>
                                    <option value="Staff" ${user.user_role === 'Staff' ? 'selected' : ''}>Staff</option>
                                    <option value="Admin" ${user.user_role === 'Admin' ? 'selected' : ''}>Admin</option>
                                    <option value="Super Admin" ${user.user_role === 'Super Admin' ? 'selected' : ''}>Super Admin</option>
                                </select>
                            </div>
                            <div class="space-y-1">
                                <label class="text-sm font-semibold text-gray-700 dark:text-dark-muted">Status</label>
                                <select name="status" class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 transition outline-none">
                                    <option value="Active" ${user.status === 'Active' ? 'selected' : ''}>Active</option>
                                    <option value="Inactive" ${user.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div class="pt-4 flex gap-3">
                            <button type="button" onclick="document.getElementById('editUserModal').remove()" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">Cancel</button>
                            <button type="submit" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-md transition">Update Member</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (e) {
        showNotification('Failed to load user details', 'error');
    }
};

window.saveUserEdit = async function (e, id) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.user_id = id;

    try {
        const response = await fetch('../api/api_users.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            showNotification('User updated successfully', 'success');
            document.getElementById('editUserModal').remove();
            renderUserManagement();
        } else {
            showNotification('Update failed', 'error');
        }
    } catch (e) {
        showNotification('Error updating user', 'error');
    }
};

window.deleteUser = async function (id) {
    const confirmed = await window.showConfirmModal({
        title: 'Delete User Account?',
        message: 'Are you sure you want to permanently remove this user?',
        description: 'This action cannot be undone and will revoke all access for this user.',
        confirmText: 'Delete User',
        type: 'danger'
    });

    if (!confirmed) return;

    const passwordOk = await window.promptPasswordConfirmation({
        title: 'Confirm Delete User',
        message: 'Enter your password to permanently delete this user account.',
        confirmText: 'Confirm Delete'
    });
    if (!passwordOk) return;

    try {
        const response = await fetch('../api/api_users.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: id })
        });
        const result = await response.json();

        if (result.success) {
            window.showAlertModal({
                title: 'User Deleted',
                message: 'The user account has been successfully removed from the system.',
                type: 'success'
            });
            renderUserManagement();
        } else {
            window.showAlertModal({
                title: 'Deletion Failed',
                message: result.message || 'The system could not delete this user. They may have active records or assignments.',
                type: 'error'
            });
        }
    } catch (e) {
        window.showAlertModal({
            title: 'System Error',
            message: 'An error occurred while communicating with the server. Please try again later.',
            type: 'error'
        });
    }
};

// ============================================
// CSV EXPORT UTILITIES
// ============================================

window.downloadCSV = function (data, filename = 'export.csv') {
    if (!data || !data.length) {
        showNotification('No data to export', 'error');
        return;
    }

    // Extract headers
    const headers = Object.keys(data[0]);

    // Create CSV rows
    const csvRows = [
        headers.join(','), // Header row
        ...data.map(row => headers.map(header => {
            const val = row[header] === null || row[header] === undefined ? '' : row[header];
            // Escape double quotes and wrap in quotes if contains comma
            const escaped = String(val).replace(/"/g, '""');
            return `"${escaped}"`;
        }).join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

window.exportReports = async function () {
    try {
        const response = await fetch('../api/api_reports.php');
        const res = await response.json();

        if (!res.success) {
            showNotification('Failed to fetch report data', 'error');
            return;
        }

        const data = res.data;

        // Prepare data for CSV
        const exportData = [
            { category: 'General Statistics', metric: 'Total Users', value: data.total_users },
            { category: 'General Statistics', metric: 'Total Sessions', value: data.total_sessions },
            { category: 'General Statistics', metric: 'Docs Processed', value: data.docs_processed },
            { category: 'General Statistics', metric: 'Completion Rate', value: data.completion_rate + '%' }
        ];

        if (data.distribution) {
            Object.keys(data.distribution).forEach(status => {
                exportData.push({
                    category: 'Session Distribution',
                    metric: status,
                    value: data.distribution[status]
                });
            });
        }

        downloadCSV(exportData, 'System_Reports_' + new Date().toISOString().split('T')[0] + '.csv');
        showNotification('Report exported successfully', 'success');
    } catch (e) {
        console.error('Export error:', e);
        showNotification('Error exporting reports', 'error');
    }
};

window.exportAuditLogs = async function () {
    try {
        // Fetch all logs
        const response = await fetch('../api/api_logs.php?limit=1000');
        const data = await response.json();

        if (!data.success) {
            showNotification('Failed to fetch audit logs', 'error');
            return;
        }

        const logs = data.logs || data.data || [];
        const exportData = logs.map(l => ({
            'Timestamp': l.created_at,
            'User': l.user_name || 'System',
            'Action': l.action,
            'Description': l.description || '',
            'Status': 'SUCCESS'
        }));

        downloadCSV(exportData, 'Audit_Logs_' + new Date().toISOString().split('T')[0] + '.csv');
        showNotification('Audit logs exported successfully', 'success');
    } catch (e) {
        console.error('Export error:', e);
        showNotification('Error exporting audit logs', 'error');
    }
};
