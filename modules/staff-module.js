/**
 * staff-module.js
 * Contains the rendering logic for the Staff dashboard and specific features.
 */

window.renderStaffDashboard = async function (user) {
    const html = `
        <div class="space-y-8 animate-fade-in-up">

        <!-- Welcome Section -->
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-8 shadow-xl mb-8">
            <div class="absolute inset-0 bg-black opacity-10"></div>
            <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
            <div class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 class="text-3xl font-bold mb-2 text-white">Welcome back, ${user ? user.name : 'Staff'}!</h1>
                    <p class="text-red-100 flex items-center gap-2">
                        <i class="bi bi-clock"></i> Last login: <span id="dashboard-last-login-staff">${typeof formatDetailedDate === 'function' ? formatDetailedDate(user ? user.last_login : null) : (user && user.last_login ? user.last_login : 'First login session')}</span>
                    </p>
                </div>
                <div class="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <span class="relative flex h-3 w-3">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span class="font-medium text-sm text-white">All Systems Operational</span>
                </div>
            </div>
        </div>


        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Main Content (Left 2/3) -->
            <div class="lg:col-span-2 space-y-8">
                <!-- Staff Quick Actions -->
                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button onclick="openCreateAgendaModal()" class="p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex flex-col items-center gap-2 group">
                            <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition border border-gray-200 dark:border-slate-600">
                                <i class="bi bi-file-earmark-plus text-xl"></i>
                            </div>
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-700 dark:group-hover:text-red-400">Create Agenda</span>
                        </button>
                        <button onclick="showSection('my-deadlines')" class="p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex flex-col items-center gap-2 group">
                            <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition border border-gray-200 dark:border-slate-600">
                                <i class="bi bi-clock-history text-xl"></i>
                            </div>
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-700 dark:group-hover:text-red-400">My Deadlines</span>
                        </button>
                        <button onclick="showSection('calendar')" class="p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex flex-col items-center gap-2 group">
                            <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition border border-gray-200 dark:border-slate-600">
                                <i class="bi bi-calendar3 text-xl"></i>
                            </div>
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-700 dark:group-hover:text-red-400">Calendar</span>
                        </button>
                        <button onclick="showSection('sessions')" class="p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex flex-col items-center gap-2 group">
                            <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition border border-gray-200 dark:border-slate-600">
                                <i class="bi bi-people-fill text-xl"></i>
                            </div>
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-700 dark:group-hover:text-red-400">Sessions</span>
                        </button>
                    </div>
                </div>

                <!-- My Recent Activity -->
                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700" id="staff-recent-activity">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">My Recent Activity</h3>
                    <div class="space-y-6 relative border-l border-gray-200 dark:border-slate-700 ml-3 pl-6">
                        <div class="animate-pulse">
                            <div class="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                            <div class="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Sidebar (Right 1/3) -->
            <div class="space-y-8">
                
                <!-- My Upcoming Sessions -->
                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700" id="staff-upcoming-sessions-container">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Upcoming Sessions</h3>
                    <div class="space-y-4" id="staff-upcoming-sessions-list">
                         <div class="animate-pulse flex gap-3"><div class="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded mb-2"></div><div class="flex-1 space-y-2"><div class="h-4 bg-gray-200 dark:bg-slate-700 w-3/4 rounded"></div><div class="h-3 bg-gray-200 dark:bg-slate-700 w-1/2 rounded"></div></div></div>
                    </div>
                    <button onclick="showSection('calendar')" class="w-full mt-4 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">View Full Calendar</button>
                </div>

            </div>
        </div>
    `;
    document.getElementById('content-area').innerHTML = html;

    // Fetch dashboard data from API
    await window.loadStaffDashboardData();
};

window.loadStaffDashboardData = async function () {
    try {
        const response = await fetch('../api/api_dashboard.php', {
            method: 'GET',
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
            const data = result.data;


            // Update recent activity
            const activityContainer = document.getElementById('staff-recent-activity');
            if (activityContainer && data.recent_activities && data.recent_activities.length > 0) {
                const activitiesHTML = data.recent_activities.slice(0, 3).map((activity, index) => {
                    const timeAgo = activity.created_at ? window.getTimeAgo(activity.created_at) : 'Recently';
                    return `
                        <div class="relative">
                            <span class="absolute -left-[29px] top-1 w-3 h-3 bg-${index === 0 ? 'green' : index === 1 ? 'blue' : 'gray'}-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                            <p class="text-sm text-gray-800 dark:text-gray-200"><span class="font-bold dark:text-white">${activity.user_name || 'User'}</span> ${activity.action || 'performed an action'}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${timeAgo}</p>
                        </div>
                    `;
                }).join('');

                activityContainer.innerHTML = `
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Recent Activity</h3>
                    <div class="space-y-6 relative border-l border-gray-200 dark:border-slate-700 ml-3 pl-6">
                        ${activitiesHTML}
                    </div>
                `;
            }

            // Update upcoming sessions
            const sessionsList = document.getElementById('staff-upcoming-sessions-list');
            if (sessionsList) {
                if (data.upcoming_sessions && data.upcoming_sessions.length > 0) {
                    sessionsList.innerHTML = data.upcoming_sessions.map(session => `
                        <div class="flex gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors" onclick="showSection('sessions').then(() => { if (window.viewSessionDetails) window.viewSessionDetails(${session.session_id}); })">
                            <div class="flex-shrink-0 w-12 text-center">
                                <span class="block text-xs font-bold text-red-600 dark:text-red-400 uppercase">${session.month}</span>
                                <span class="block text-xl font-bold text-gray-800 dark:text-white">${session.day}</span>
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1" title="${session.title}">${session.title}</h4>
                                <p class="text-xs text-gray-500 dark:text-gray-400">${session.time_formatted} • ${session.venue || 'TBD'}</p>
                                <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1"><i class="bi bi-person text-red-400"></i> ${session.creator_name || 'System'}</p>
                                ${session.assigned_staff_names && session.assigned_staff_names.length > 0 ? `
                                <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5"><i class="bi bi-people text-blue-400"></i> ${session.assigned_staff_names.join(', ')}</p>
                                ` : ''}
                                <span class="inline-block mt-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold rounded">Assigned</span>
                            </div>
                        </div>
                    `).join('');
                } else {
                    sessionsList.innerHTML = `
                        <div class="text-center py-4 text-gray-500 dark:text-gray-400">
                            <p>No upcoming sessions scheduled.</p>
                        </div>
                    `;
                }
            }
        }
    } catch (error) {
        console.error('Error loading staff dashboard data:', error);
    }
};

window.getTimeAgo = function (dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
};
