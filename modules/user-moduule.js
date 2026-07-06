/**
 * user-moduule.js
 * Contains the rendering logic for the regular User dashboard and specific features.
 */

window.renderUserDashboard = async function (user) {
    const html = `
        <div class="space-y-8 animate-fade-in-up">

        <!-- Welcome Section -->
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-8 shadow-xl mb-8">
            <div class="absolute inset-0 bg-black opacity-10"></div>
            <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
            <div class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 class="text-3xl font-bold mb-2 text-white">Welcome, ${user ? user.name : 'User'}!</h1>
                    <p class="text-red-100 flex items-center gap-2">
                        <i class="bi bi-clock"></i> Last login: <span id="dashboard-last-login-user">${typeof formatDetailedDate === 'function' ? formatDetailedDate(user ? user.last_login : null) : (user && user.last_login ? user.last_login : 'First login session')}</span>
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
                <!-- User Quick Actions -->
                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Quick Links</h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <button onclick="showSection('agendas')" class="p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex flex-col items-center gap-2 group">
                            <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition border border-gray-200 dark:border-slate-600">
                                <i class="bi bi-journal-text text-xl"></i>
                            </div>
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-700 dark:group-hover:text-red-400">View Agendas</span>
                        </button>
                        <button onclick="showSection('calendar')" class="p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex flex-col items-center gap-2 group">
                            <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition border border-gray-200 dark:border-slate-600">
                                <i class="bi bi-calendar-event text-xl"></i>
                            </div>
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-700 dark:group-hover:text-red-400">Event Calendar</span>
                        </button>
                        <button onclick="showSection('sessions')" class="p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex flex-col items-center gap-2 group">
                            <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition border border-gray-200 dark:border-slate-600">
                                <i class="bi bi-mic-fill text-xl"></i>
                            </div>
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-700 dark:group-hover:text-red-400">Session List</span>
                        </button>
                    </div>
                </div>

                <!-- Recent Agendas -->
                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white">Recent Agendas</h3>
                        <button onclick="showSection('agendas')" class="text-sm text-red-600 dark:text-red-400 font-bold hover:underline">View All</button>
                    </div>
                    <div id="user-recent-agendas" class="space-y-4">
                        <div class="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700 text-center text-gray-500 dark:text-gray-400 italic">
                            Loading recent agendas...
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sidebar (Right 1/3) -->
            <div class="space-y-8">
                <!-- Upcoming Sessions Widget -->
                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700" id="user-upcoming-sessions-container">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Upcoming Sessions</h3>
                    <div class="space-y-4" id="user-upcoming-sessions-list">
                         <div class="animate-pulse flex gap-3">
                            <div class="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded mb-2"></div>
                            <div class="flex-1 space-y-2">
                                <div class="h-4 bg-gray-200 dark:bg-slate-700 w-3/4 rounded"></div>
                                <div class="h-3 bg-gray-200 dark:bg-slate-700 w-1/2 rounded"></div>
                            </div>
                         </div>
                    </div>
                    <button onclick="showSection('calendar')" class="w-full mt-4 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">View Full Calendar</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('content-area').innerHTML = html;

    // Fetch user dashboard data
    await window.loadUserDashboardData();
};

window.loadUserDashboardData = async function () {
    try {
        const response = await fetch('../api/api_dashboard.php', {
            method: 'GET',
            credentials: 'same-origin'
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();

        if (result.success && result.data) {
            const data = result.data;


            // Update upcoming sessions
            const sessionsList = document.getElementById('user-upcoming-sessions-list');
            if (sessionsList) {
                if (data.upcoming_sessions && data.upcoming_sessions.length > 0) {
                    sessionsList.innerHTML = data.upcoming_sessions.map(session => `
                        <div class="flex gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors" onclick="showSection('sessions').then(() => { if (window.viewSessionDetails) window.viewSessionDetails(${session.session_id}); })">
                            <div class="flex-shrink-0 w-12 text-center">
                                <span class="block text-xs font-bold text-red-600 dark:text-red-400 uppercase">${session.month}</span>
                                <span class="block text-xl font-bold text-gray-800 dark:text-white">${session.day}</span>
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1">${session.title}</h4>
                                <p class="text-xs text-gray-500 dark:text-gray-400">${session.time_formatted}</p>
                                <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1"><i class="bi bi-person text-red-400"></i> ${session.creator_name || 'System'}</p>
                                ${session.assigned_staff_names && session.assigned_staff_names.length > 0 ? `
                                <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5"><i class="bi bi-people text-blue-400"></i> ${session.assigned_staff_names.join(', ')}</p>
                                ` : ''}
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

            // Load some mock agendas for the main content
            const recentAgendasList = document.getElementById('user-recent-agendas');
            if (recentAgendasList) {
                recentAgendasList.innerHTML = `
                    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-900 transition cursor-pointer" onclick="showSection('agendas')">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                                <i class="bi bi-file-earmark-text"></i>
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-gray-800 dark:text-gray-200">Regular Session Agenda</h4>
                                <p class="text-xs text-gray-500 dark:text-gray-400">Last updated: Today</p>
                            </div>
                        </div>
                        <i class="bi bi-chevron-right text-gray-400 dark:text-gray-500"></i>
                    </div>
                `;
            }

        }
    } catch (error) {
        console.error('Error loading user dashboard data:', error);
    }
};
