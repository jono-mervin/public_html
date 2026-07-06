// Reminders Module for LACS
// Contains the enhanced reminders functionality
// Intended to be loaded after main-features.js

// ==============================
// REMINDERS MODULE - ENHANCED VERSION
// ==============================
// COMPLETE REMINDERS MODULE - FINAL VERSION
// This is the definitive implementation
// ============================================

/**
 * Calculates a countdown for a session and determines its urgency color.
 * Based on: Green (> 7 days), Yellow (<= 3 days), Red (<= 24 hours).
 * 
 * @param {string} sessionDate 'YYYY-MM-DD'
 * @param {string} startTime 'HH:MM:SS'
 * @returns {object} { text, colorClass, dotColor, isPast }
 */
function getUrgentCountdown(sessionDate, startTime) {
    const now = new Date();
    // If no specific start time yet (TBD), treat the session as lasting until end of that day
    // so it doesn't become "Past Session" right at midnight.
    const effectiveStartTime = (startTime && startTime !== '00:00:00') ? startTime : '23:59:59';
    // Use format that works across browsers
    const target = new Date(sessionDate.replace(/-/g, '/') + ' ' + effectiveStartTime);
    const diffMs = target - now;

    if (diffMs <= 0) {
        return { text: 'Past Session', colorClass: 'bg-gray-100 text-gray-500 border-gray-200', dotColor: 'bg-gray-400', isPast: true };
    }

    const diffHrs = diffMs / (1000 * 60 * 60);
    const diffDays = diffHrs / 24;

    let colorClass, dotColor;
    if (diffHrs <= 24) {
        colorClass = 'bg-red-100 text-red-700 border-red-200 animate-pulse';
        dotColor = 'bg-red-500';
    } else if (diffDays <= 3) {
        colorClass = 'bg-yellow-100 text-yellow-700 border-yellow-200';
        dotColor = 'bg-yellow-500';
    } else if (diffDays > 7) {
        colorClass = 'bg-green-100 text-green-700 border-green-200';
        dotColor = 'bg-green-500';
    } else {
        // Between 3 and 7 days
        colorClass = 'bg-blue-100 text-blue-700 border-blue-200';
        dotColor = 'bg-blue-500';
    }


    const d = Math.floor(diffDays);
    const h = Math.floor(diffHrs % 24);
    const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let countdownText = "";
    if (d > 0) countdownText += `${d}d `;
    if (h > 0 || d === 0) countdownText += `${h}h `;
    if (d === 0 && h < 1) countdownText += `${m}m`;

    return {
        text: countdownText.trim() + ' left',
        colorClass,
        dotColor,
        isPast: false,
        diffDays,
        diffHrs,
        targetTime: target.getTime()
    };
}


/**
 * Handles toggling of automated alert triggers for sessions.
 * @param {number} sessionId 
 * @param {string} type '7d', '3d', '24h', '1h', 'custom'
 * @param {boolean} isChecked 
 */
window.handleAlertToggle = async function (sessionId, type, isChecked) {
    const labelMap = { '7d': '7 Days Before', '3d': '3 Days Before', '24h': '24h Before', '1h': '1h Before' };
    const label = labelMap[type];

    if (!isChecked) {
        // Find existing reminder to delete
        const existing = (window.cachedReminders || []).find(r =>
            r.related_type === 'Session' &&
            r.related_id == sessionId &&
            r.title.includes(label)
        );

        if (existing) {
            try {
                const res = await fetch('../api/api_reminders.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reminder_id: existing.reminder_id })
                });
                const data = await res.json();
                if (data.success) {
                    showNotification(`${label} alert disabled and removed for all users.`, 'info');
                    if (window.activeSection === 'reminders') renderReminders();
                }
            } catch (e) { console.error('Error deleting reminder:', e); }
        } else {
            showNotification(`${type.toUpperCase()} alert disabled locally.`, 'info');
        }
        return;
    }

    try {
        const response = await fetch(`../api/api_sessions.php?id=${sessionId}`);
        const data = await response.json();
        if (!data.success || !data.session) return;

        const session = data.session;
        const sessionTimeStr = (session.session_date + ' ' + (session.actual_start_time || '00:00:00')).replace(/-/g, '/');
        const sessionTime = new Date(sessionTimeStr);
        let reminderDate = new Date(sessionTime);

        switch (type) {
            case '7d': reminderDate.setDate(reminderDate.getDate() - 7); break;
            case '3d': reminderDate.setDate(reminderDate.getDate() - 3); break;
            case '24h': reminderDate.setHours(reminderDate.getHours() - 24); break;
            case '1h': reminderDate.setHours(reminderDate.getHours() - 1); break;
            case 'custom':
                if (window.openCreateReminderModalFinal) {
                    window.openCreateReminderModalFinal({
                        title: `Custom Reminder: ${session.title}`,
                        related_type: 'Session',
                        related_id: sessionId
                    });
                } else {
                    showNotification('Custom reminder setup initiated', 'info');
                }
                return;
        }

        // Generate message
        const sessionDate = new Date(session.session_date + 'T' + (session.actual_start_time || '00:00:00'));
        const sessionDateStr = sessionDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const sessionTimeText = sessionDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

        // Construct a highly accurate message
        const reminderMessage = `Scheduled Session: "${session.title}"\n\nSession Time: ${sessionDateStr} at ${sessionTimeText}\nMilestone: ${label}\n\nNote: You will receive a system alert when we reach the ${label} mark before this session starts.`;
        const isPastReminder = reminderDate < new Date();

        if (isPastReminder) {
            showNotification(`${label} alert cannot be set because this milestone (${reminderDate.toLocaleString()}) has already passed.`, 'warning');
            if (window.activeSection === 'reminders') renderReminders();
            return;
        }

        // Use local time string to avoid ISO/UTC shifts that confuse the API/DB
        const localReminderDate = reminderDate.getFullYear() + '-' +
            String(reminderDate.getMonth() + 1).padStart(2, '0') + '-' +
            String(reminderDate.getDate()).padStart(2, '0') + ' ' +
            String(reminderDate.getHours()).padStart(2, '0') + ':' +
            String(reminderDate.getMinutes()).padStart(2, '0') + ':' +
            String(reminderDate.getSeconds()).padStart(2, '0');

        const rResponse = await fetch('../api/api_reminders.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `${label} Reminder: ${session.title}`,
                message: reminderMessage,
                reminder_date: localReminderDate,
                related_type: 'Session',
                related_id: sessionId,
                target_roles: 'Super Admin,Admin,Staff,User - Committee',
                role_based: true
            })
        });

        const rData = await rResponse.json();
        if (rData.success) {
            showNotification(`${label} alert scheduled successfully for all users.`, 'success');
            if (window.activeSection === 'reminders') renderReminders();
        } else {
            showNotification(rData.message || 'Error scheduling alert', 'error');
        }
    } catch (e) {
        console.error('Error toggling alert:', e);
        showNotification('Failed to process alert trigger', 'error');
    }
};

// Main entry point - this will be called by the navigation
window.renderReminders = async function () {
    console.log('Reminders module loading...');
    window.isSubView = false;
    // Update Title and Breadcrumb
    const pageTitle = document.getElementById('page-title');
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    if (pageTitle) pageTitle.textContent = 'Reminders & Notifications';
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'Reminders';

    try {
        const response = await fetch('../api/api_reminders.php');
        const data = await response.json();

        if (!data.success) {
            console.error('API returned error:', data.message);
            renderRemindersEmptyState();
            return;
        }

        let reminders = data.reminders || [];

        // De-duplicate: Keep only the most recent version of identical reminders for the management view
        const reminderMap = new Map();
        reminders.forEach(r => {
            const key = `${r.title}|${r.message}|${r.related_id || 'none'}`;
            // If already seen, replace only if this one is newer
            if (!reminderMap.has(key) || new Date(r.reminder_date) > new Date(reminderMap.get(key).reminder_date)) {
                reminderMap.set(key, r);
            }
        });
        reminders = Array.from(reminderMap.values());

        // Hide past reminders (do not render items whose reminder_date has already passed)
        const now = new Date();
        reminders = reminders.filter(r => {
            if (!r || !r.reminder_date) return true;
            const d = new Date(String(r.reminder_date).replace(' ', 'T'));
            if (Number.isNaN(d.getTime())) return true; // keep if unparsable
            return d >= now;
        });

        // Sort DESC so newest is on top
        reminders.sort((a, b) => new Date(b.reminder_date) - new Date(a.reminder_date));

        window.cachedReminders = reminders; // Cache for filtering
        console.log('Loaded reminders for management view:', reminders.length);

        // Fetch upcoming sessions for monitoring (Admins and Staffs)
        const user = getCurrentUser();
        const isAdmin = user && user.(role === 'Super Admin' || role === 'Admin');
        const isStaff = user && user.role === 'Staff';
        const canMonitor = isAdmin || isStaff;
        let upcomingSessions = [];

        if (canMonitor) {
            try {
                const sResponse = await fetch('../api/api_sessions.php');
                const sData = await sResponse.json();
                if (sData.success && sData.sessions) {
                    upcomingSessions = sData.sessions.filter(s => s.status === 'Scheduled').slice(0, 4);
                }
            } catch (e) { console.error('Error fetching sessions for reminders:', e); }
        }
        window.cachedUpcomingSessions = upcomingSessions; // Cache for filtering

        const sessionCount = reminders.filter(r => r.related_type === 'Session').length;
        const agendaCount = reminders.filter(r => r.related_type === 'Agenda' || r.related_type === 'AgendaItem' || r.source === 'AgendaDeadline').length;
        const completedCount = reminders.filter(r => new Date(r.reminder_date) < new Date()).length;

        const html = `
        <div class="space-y-6 animate-fade-in-up">
            <!-- Premium Header - Red Palette -->
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-8 shadow-xl mb-6">
                <div class="absolute inset-0 bg-black opacity-10"></div>
                <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                <div class="relative z-10">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div class="text-white">
                            <h1 class="text-3xl font-bold mb-2">${canMonitor ? 'System Reminders & Notifications' : 'Notifications'}</h1>
                            ${canMonitor ? `
                            <p class="text-red-100 text-sm">Manage system-wide reminders and send notifications to authorized users</p>
                            ` : ''}
                        </div>
                        <div class="flex gap-2">
                            ${isAdmin ? `
                            <button onclick="openCreateReminderModalFinal()" class="px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium flex items-center gap-2 shadow-lg transition-all">
                                <i class="bi bi-bell-fill"></i> Create Reminder
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Upcoming Session Reminders & Dashboard Filters -->
            ${canMonitor ? `
            <div class="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden mb-8 animate-fade-in-up">
                <div class="bg-gradient-to-r from-gray-50 to-white dark:from-dark-bg/50 dark:to-dark-card px-6 py-4 border-b border-gray-200 dark:border-dark-border">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div class="flex items-center justify-between flex-1 gap-4">
                            <h3 class="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <i class="bi bi-calendar-check text-red-600"></i>
                                Upcoming Session Reminders
                            </h3>
                            ${upcomingSessions.length > 0 ? `
                            <span class="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-200 dark:border-red-900/40">Critical Monitoring</span>
                            ` : ''}
                        </div>
                        
                        <!-- Moved Filters -->
                        <!-- Session Monitoring Filters -->
                        <div class="flex flex-wrap gap-2">
                            <button onclick="filterUpcomingSessions('all')" id="sessions-filter-all" class="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white transition-all shadow-md">
                                All
                            </button>
                            <button onclick="filterUpcomingSessions('today')" id="sessions-filter-today" class="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-dark-bg text-gray-700 dark:text-dark-text border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-card transition-all">
                                Today’s Sessions
                            </button>
                            <button onclick="filterUpcomingSessions('week')" id="sessions-filter-week" class="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-dark-bg text-gray-700 dark:text-dark-text border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-card transition-all">
                                This Week
                            </button>
                            <button onclick="filterUpcomingSessions('month')" id="sessions-filter-month" class="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-dark-bg text-gray-700 dark:text-dark-text border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-card transition-all">
                                This Month
                            </button>
                            <button onclick="filterUpcomingSessions('special')" id="sessions-filter-special" class="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-dark-bg text-gray-700 dark:text-dark-text border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-card transition-all">
                                Special Sessions Only
                            </button>
                        </div>
                    </div>
                </div>
                
                <div id="upcoming-sessions-list" class="divide-y divide-gray-100 dark:divide-dark-border">
                    ${upcomingSessions.length > 0 ? upcomingSessions.map(s => getSessionItemHtml(s, reminders)).join('') : `
                <div class="p-8 text-center text-gray-500 dark:text-dark-muted text-sm italic">
                    No sessions scheduled for critical monitoring at this time.
                </div>
                `}
                </div>
            </div>
            ` : ''}

            <div class="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden">
                <div class="bg-gradient-to-r from-gray-50 to-white dark:from-dark-bg/50 dark:to-dark-card px-6 py-4 border-b border-gray-200 dark:border-dark-border">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h3 class="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <i class="bi bi-bell-fill text-red-600"></i>
                            ${canMonitor ? 'System Reminders' : 'Your Notifications'}
                        </h3>
                        <div class="flex flex-wrap gap-2">
                            ${canMonitor ? `
                            <button onclick="filterSystemReminders('all')" id="system-filter-all" class="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white transition-all shadow-md">
                                All
                            </button>
                            <button onclick="filterSystemReminders('session')" id="system-filter-session" class="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-dark-bg text-gray-700 dark:text-dark-text border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-card transition-all">
                                Session
                            </button>
                            <button onclick="filterSystemReminders('agenda')" id="system-filter-agenda" class="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-dark-bg text-gray-700 dark:text-dark-text border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-card transition-all">
                                Agenda
                            </button>
                            <button onclick="filterSystemReminders('system')" id="system-filter-system" class="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-dark-bg text-gray-700 dark:text-dark-text border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-card transition-all">
                                System
                            </button>
                            <button onclick="filterSystemReminders('other')" id="system-filter-other" class="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-dark-bg text-gray-700 dark:text-dark-text border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-card transition-all">
                                Other
                            </button>
                            ` : `
                            <button onclick="filterSystemReminders('all')" id="system-filter-all" class="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white transition-all shadow-md">
                                All
                            </button>
                            <button onclick="filterSystemReminders('session')" id="system-filter-session" class="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-dark-bg text-gray-700 dark:text-dark-text border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-card transition-all">
                                Sessions
                            </button>
                            <button onclick="filterSystemReminders('agenda')" id="system-filter-agenda" class="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-dark-bg text-gray-700 dark:text-dark-text border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-card transition-all">
                                Agendas
                            </button>
                            <button onclick="filterSystemReminders('completed')" id="system-filter-completed" class="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-dark-bg text-gray-700 dark:text-dark-text border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-card transition-all">
                                Completed
                            </button>
                            `}
                        </div>
                    </div>
                </div>
                ${reminders.length > 0 ? `
                <div id="reminders-list" class="divide-y divide-gray-100 dark:divide-dark-border">
                    ${reminders.map(r => getReminderItemHtml(r, isAdmin, user)).join('')}
                </div>
    ` : `
                <div class="p-12 text-center bg-white dark:bg-dark-card">
                    <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-dark-bg flex items-center justify-center mx-auto mb-4">
                        <i class="bi bi-bell-slash text-4xl text-gray-400 dark:text-dark-muted"></i>
                    </div>
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2">No Reminders Yet</h3>
                    <p class="text-gray-500 dark:text-dark-muted mb-4">
                        ${user && user.role !== 'User - Committee' ? 'Create your first reminder to get started' : 'You have no active reminders'}
                    </p>
                    ${user && user.role !== 'User - Committee' ? `
                    <button onclick="openCreateReminderModalFinal()" class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition inline-flex items-center gap-2">
                        <i class="bi bi-plus-lg"></i> Create Reminder
                    </button>
                    ` : ''}
                </div>
    `}
            </div>
        </div>
        `;
        document.getElementById('content-area').innerHTML = html;
        console.log('Reminders rendered successfully');
    } catch (e) {
        console.error('Error loading reminders:', e);
        renderRemindersEmptyState();
    }
};


function renderRemindersEmptyState() {
    const user = getCurrentUser();
    const html = `
        <div class="space-y-6 animate-fade-in-up">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-1">${user && user.(role === 'Super Admin' || role === 'Admin') ? 'System Reminders & Notifications' : 'Notifications'}</h2>
                    <p class="text-sm text-gray-500 dark:text-dark-muted">${user && user.(role === 'Super Admin' || role === 'Admin') ? 'Manage system-wide reminders and send notifications to authorized users' : 'Manage your personal notifications and alerts'}</p>
                </div>
                <div class="flex gap-2">
                    ${user && user.role !== 'User - Committee' ? `
                    <button onclick="openCreateReminderModalFinal()" class="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 text-sm font-medium flex items-center gap-2 shadow-lg shadow-red-500/30 transition-all">
                        <i class="bi bi-bell-fill"></i> Create Reminder
                    </button>
                    ` : ''}
                </div>
            </div>
            <div class="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark-border p-12 text-center">
                <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-dark-bg flex items-center justify-center mx-auto mb-4">
                    <i class="bi bi-bell-slash text-4xl text-gray-400 dark:text-dark-muted"></i>
                </div>
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2">No Reminders Available</h3>
                <p class="text-gray-500 dark:text-dark-muted mb-4">${user && user.role !== 'User - Committee' ? 'Create your first reminder to get started' : 'You have no active reminders'}</p>
                ${user && user.role !== 'User - Committee' ? `
                <button onclick="openCreateReminderModalFinal()" class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition inline-flex items-center gap-2">
                    <i class="bi bi-plus-lg"></i> Create Reminder
                </button>
                ` : ''}
            </div>
        </div>
    `;
    document.getElementById('content-area').innerHTML = html;
}

window.openCreateReminderModalFinal = function (initialData = {}) {
    const existing = document.getElementById('createReminderModal');
    if (existing) existing.remove();

    const now = new Date();
    const user = getCurrentUser();
    const isAdmin = user && user.(role === 'Super Admin' || role === 'Admin');
    const isEdit = !!initialData.reminder_id;

    let initialDate = '';
    let initialTime = '';

    if (initialData.date && typeof initialData.date === 'string') {
        const d = new Date(initialData.date.replace(' ', 'T'));
        if (!isNaN(d.getTime())) {
            initialDate = d.toISOString().split('T')[0];
            initialTime = d.toTimeString().split(' ')[0].substring(0, 5);
        }
    }

    // For resending/editing, it's safer to default to current time if no date provided
    if (initialData.title && !initialDate) {
        initialDate = now.toISOString().split('T')[0];
        initialTime = now.toTimeString().split(' ')[0].substring(0, 5);
    }

    const modalHtml = `
        <div id="createReminderModal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-sm">
            <div class="relative p-6 border dark:border-dark-border w-full max-w-md shadow-2xl rounded-2xl bg-white dark:bg-dark-card animate-fade-in-up m-4">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h3 class="text-2xl font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
                            <i class="bi bi-${isEdit ? 'pencil-square' : 'send-fill'} text-red-600"></i>
                            ${isEdit ? 'Edit Reminder' : (initialData.title ? 'Broadcast Reminder' : 'Create Reminder')}
                        </h3>
                        <p class="text-sm text-gray-500 dark:text-red-300 mt-1">
                            ${isEdit ? 'Update the details of this reminder' : (initialData.title ? 'Send this notification to users now' : 'Set a new reminder notification')}
                        </p>
                    </div>
                    <button onclick="document.getElementById('createReminderModal').remove()" class="text-gray-400 dark:text-dark-muted hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg p-2 transition">
                        <i class="bi bi-x-lg text-xl"></i>
                    </button>
                </div>
                <form onsubmit="saveReminderFinal(event)">
                    <input type="hidden" name="reminder_id" value="${initialData.reminder_id || ''}">
                    <input type="hidden" name="related_id" value="${initialData.related_id || ''}">
                    <input type="hidden" name="status" value="Sent">
                    <div class="space-y-5">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">Title *</label>
                            <input type="text" name="title" required value="${initialData.title || ''}" placeholder="e.g., Team Meeting" class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition">
                        </div>
                        ${isAdmin ? `
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">Target Audience</label>
                            <select name="target_scope" class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition">
                                <option value="admin" ${initialData.target_roles === 'Super Admin' ? 'selected' : ''}>Admin</option>
                                <option value="all_staff" ${initialData.target_roles === 'Staff' ? 'selected' : ''}>All Staffs</option>
                                <option value="all_users" ${!initialData.target_roles || initialData.target_roles.includes('User') ? 'selected' : ''}>All users (staffs, users)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">Type</label>
                            <select name="related_type" class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition">
                                <option value="Session" ${initialData.related_type === 'Session' ? 'selected' : ''}>Session</option>
                                <option value="Agenda" ${initialData.related_type === 'Agenda' ? 'selected' : ''}>Agenda</option>
                                <option value="System" ${initialData.related_type === 'System' || !initialData.related_type ? 'selected' : ''}>System</option>
                                <option value="Other" ${initialData.related_type === 'Other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                        ` : ''}
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">Message</label>
                            <textarea name="message" rows="3" placeholder="Add additional details..." class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none">${initialData.message || ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">Date & Time *</label>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs text-gray-500 dark:text-dark-muted mb-1">Date</label>
                                    <input type="date" name="reminder_date" required value="${initialDate}" min="${new Date().toISOString().split('T')[0]}" class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition">
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-500 dark:text-dark-muted mb-1">Time</label>
                                    <input type="time" name="reminder_time" required value="${initialTime}" class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition">
                                </div>
                            </div>
                        </div>
                        <div class="flex gap-3 pt-4">
                            <button type="button" onclick="document.getElementById('createReminderModal').remove()" class="flex-1 px-4 py-3 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg font-medium transition">
                                Cancel
                            </button>
                            <button type="submit" class="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-medium shadow-lg shadow-red-500/30 transition-all text-sm flex items-center justify-center gap-2">
                                <i class="bi bi-send"></i>
                                ${isEdit ? 'Save Changes' : 'Send Notification'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.saveReminderFinal = async function (event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    const isEdit = !!data.reminder_id;

    // Combine separate date and time inputs into datetime format
    if (data.reminder_date && data.reminder_time) {
        data.reminder_date = `${data.reminder_date}T${data.reminder_time}`;
        delete data.reminder_time; // Remove the separate time field
    }

    // Handle target_scope if present
    if (data.target_scope) {
        if (data.target_scope === 'all_staff') {
            data.role_based = true;
            data.target_roles = 'Staff';
        } else if (data.target_scope === 'all_users') {
            data.role_based = true;
            data.target_roles = 'Super Admin,Admin,Staff,User - Committee';
        } else if (data.target_scope === 'admin') {
            data.role_based = true;
            data.target_roles = 'Super Admin';
        }
        delete data.target_scope; // Remove helper field
    }

    try {
        const method = isEdit ? 'PUT' : 'POST';
        if (isEdit) {
            data.action = 'update_reminder';
        }

        const response = await fetch('../api/api_reminders.php', {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.success) {
            const isBroadcast = data.role_based && !isEdit;
            const msg = isEdit
                ? 'Reminder updated successfully'
                : (isBroadcast ? (result.message || `Notification broadcast to ${result.count || ''} recipients successfully!`) : 'Reminder set successfully');

            showNotification(msg, 'success');
            document.getElementById('createReminderModal').remove();

            // Refresh notification bell badge
            if (typeof window.populateNotifications === 'function') {
                window.populateNotifications();
            }
            renderReminders();
        } else {
            showNotification(result.message || 'Failed to process reminder', 'error');
        }
    } catch (e) {
        console.error('Save error:', e);
        showNotification('Error processing reminder', 'error');
    }
};

window.markReminderAsRead = async function (id, silent = false) {
    try {
        const response = await fetch('../api/api_reminders.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reminder_id: id, action: 'mark_read' })
        });
        const result = await response.json();
        if (result.success) {
            if (!silent) {
                showNotification('Reminder marked as read', 'success');
                renderReminders();
            }
            if (window.populateNotifications) window.populateNotifications();
        } else {
            if (!silent) showNotification('Failed to mark reminder as read', 'error');
        }
    } catch (e) {
        console.error('Mark read error:', e);
        if (!silent) showNotification('Error marking reminder as read', 'error');
    }
};

window.deleteReminderFinal = async function (id) {
    const confirmed = await window.showConfirmModal({
        title: 'Delete Reminder',
        message: 'Are you sure you want to remove this notification?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
    });

    if (!confirmed) return;

    const passwordOk = await window.promptPasswordConfirmation({
        title: 'Confirm Delete Reminder',
        message: 'Enter your password to delete this reminder.',
        confirmText: 'Confirm Delete'
    });
    if (!passwordOk) return;

    try {
        const response = await fetch('../api/api_reminders.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reminder_id: id })
        });
        const result = await response.json();
        if (result.success) {
            showNotification(result.message || 'Reminder deleted', 'success');
            // Refresh Both views
            if (typeof window.populateNotifications === 'function') {
                window.populateNotifications();
            }
            renderReminders();
        } else {
            showNotification(result.message || 'Failed to delete reminder', 'error');
        }
    } catch (e) {
        console.error('Delete error:', e);
        showNotification('Error deleting reminder', 'error');
    }
};

window.sendReminderNotification = async function (id) {
    const idStr = String(id);

    // Handle system "Action Required" session reminders (IDs like s_inc_60)
    if (idStr.startsWith('s_inc_')) {
        const sessionId = parseInt(idStr.replace('s_inc_', ''), 10);
        if (!sessionId) {
            showNotification('Unable to send reminder for this session.', 'warning');
            return;
        }

        const confirmed = await window.showConfirmModal({
            title: 'Send Action Required Reminder',
            message: 'Send an immediate reminder to staff about this incomplete session?',
            confirmText: 'Send Now',
            cancelText: 'Cancel',
            type: 'danger'
        });
        if (!confirmed) return;

        try {
            const response = await fetch('../api/api_reminders.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send_incomplete_session', session_id: sessionId })
            });
            const result = await response.json();
            if (result.success) {
                showNotification(result.message || 'Action Required reminder sent.', 'success');
                if (typeof window.populateNotifications === 'function') {
                    window.populateNotifications();
                }
            } else {
                showNotification(result.message || 'Failed to send reminder', 'error');
            }
        } catch (e) {
            console.error('Send error:', e);
            showNotification('Error sending reminder', 'error');
        }
        return;
    }

    // Default: resend an existing reminder batch (numeric ID)
    const batchId = /^\d+$/.test(idStr) ? parseInt(idStr, 10) : null;
    if (!batchId) {
        showNotification('This item cannot be resent.', 'warning');
        return;
    }

    // Use the existing app-wide confirmation modal (consistent design)
    const confirmed = await window.showConfirmModal({
        title: 'Resend Notification',
        message: 'Resend this reminder to all recipients?',
        description: 'Their read status will be reset — they will see it as a new unread notification.',
        confirmText: 'Resend Now',
        cancelText: 'Cancel',
        type: 'danger'
    });

    if (!confirmed) return;

    try {
        const response = await fetch('../api/api_reminders.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reminder_id: batchId, action: 'send_batch' })
        });
        const result = await response.json();
        if (result.success) {
            showNotification(result.message || 'Reminder successfully resent to recipients!', 'success');
            // Refresh the notification bell badge immediately
            if (typeof window.populateNotifications === 'function') {
                window.populateNotifications();
            }
            // Refresh whichever view is currently showing
            if (typeof renderReminders === 'function') {
                renderReminders();
            }
        } else {
            showNotification(result.message || 'Failed to resend reminder', 'error');
        }
    } catch (e) {
        console.error('Send error:', e);
        showNotification('Error resending reminder notification', 'error');
    }
};

/**
 * Generates the HTML for a single reminder item.
 */
function getReminderItemHtml(r, isAdmin, user) {
    const reminderDate = r.reminder_date ? new Date(r.reminder_date.replace(' ', 'T')) : new Date();
    const now = new Date();
    const isPast = reminderDate < now;
    const isToday = reminderDate.toDateString() === now.toDateString();

    const statusColors = {
        'gray': 'dark:from-dark-bg/50 dark:to-dark-card dark:text-dark-muted dark:border-dark-border',
        'red': 'dark:from-red-900/20 dark:to-red-900/10 dark:text-red-400 dark:border-red-900/30',
        'blue': 'dark:from-blue-900/20 dark:to-blue-900/10 dark:text-blue-400 dark:border-blue-900/30',
        'purple': 'dark:from-purple-900/20 dark:to-purple-900/10 dark:text-purple-400 dark:border-purple-900/30'
    };

    let statusColor = isPast ? 'gray' : 'red';
    let statusIcon = isPast ? 'check-circle' : (isToday ? 'exclamation-circle' : 'calendar4-event');
    let statusText = isPast ? 'Past' : (isToday ? 'Today' : 'Upcoming');

    if (r.source === 'Deadline' || r.source === 'AgendaDeadline' || r.related_type === 'Deadline') {
        statusColor = 'red';
        statusIcon = 'alarm';
        statusText = 'Deadline';
    }

    const isRead = (r.read_status === 'Read') || (r.is_read === 1 || r.is_read === true);
    const readBadge = isRead ? '' : '<span class="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block"></span>';
    const idParam = typeof r.reminder_id === 'string' ? `'${r.reminder_id}'` : r.reminder_id;
    const isBatchId = (typeof r.reminder_id === 'number') || (typeof r.reminder_id === 'string' && /^\d+$/.test(r.reminder_id));
    const isActionRequiredSession = typeof r.reminder_id === 'string' && r.reminder_id.startsWith('s_inc_');
    const canSendNow = (isBatchId && (r.source === 'Reminder' || !r.source)) || isActionRequiredSession;

    const resendData = {
        reminder_id: r.reminder_id,
        title: r.title,
        message: r.message || '',
        date: r.reminder_date,
        related_type: r.related_type || 'System',
        related_id: r.related_id || null,
        target_roles: r.target_roles || 'Super Admin,Admin,Staff,User - Committee'
    };
    const resendJson = JSON.stringify(resendData).replace(/'/g, "&#39;").replace(/"/g, "&quot;");

    return `
        <div class="p-6 hover:bg-gray-50 dark:hover:bg-dark-bg/50 transition-all group cursor-pointer" onclick="viewReminderDetails(${idParam}, true)">
            <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-${statusColor}-100 to-${statusColor}-200 ${statusColors[statusColor] || ''} flex items-center justify-center text-${statusColor}-600 flex-shrink-0 shadow-sm transition-all duration-300">
                            <i class="bi bi-${statusIcon} text-xl"></i>
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-2">
                                <h4 class="font-bold text-gray-900 dark:text-white text-lg group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">${r.title}${readBadge}</h4>
                                <span class="px-2 py-1 bg-${statusColor}-100 dark:bg-${statusColor}-900/30 text-${statusColor}-700 dark:text-${statusColor}-400 rounded-full text-xs font-medium border border-${statusColor}-200 dark:border-${statusColor}-900/30">
                                    ${statusText}
                                </span>
                                ${(r.source === 'Deadline' || r.source === 'AgendaDeadline') ?
            `<span class="px-2 py-1 bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-dark-muted rounded-full text-xs font-medium border border-gray-200 dark:border-dark-border"><i class="bi bi-clock-history mr-1"></i>System</span>` : ''}
                            </div>
                            ${r.message ? `<p class="text-gray-600 dark:text-dark-muted text-sm mb-3 leading-relaxed line-clamp-2">${r.message}</p>` : ''}
                            ${r.target_roles ? `
                            <div class="flex items-center gap-2 mb-3">
                                <span class="text-[10px] font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider">Recipients:</span>
                                <div class="flex flex-wrap gap-1">
                                    ${r.target_roles.split(',').map(role => {
                const roleColor = role.trim() === 'Super Admin' ? 'red' : role.trim() === 'Staff' ? 'blue' : 'green';
                return `<span class="px-2 py-0.5 bg-${roleColor}-50 dark:bg-${roleColor}-900/20 text-${roleColor}-700 dark:text-${roleColor}-400 border border-${roleColor}-200 dark:border-${roleColor}-900/30 rounded text-[10px] font-semibold">${role.trim()}</span>`;
            }).join('')}
                                </div>
                            </div>
                            ` : ''}
                            <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-dark-muted">
                                <div class="flex items-center gap-1">
                                    <i class="bi bi-calendar3 text-${statusColor}-500"></i>
                                    <span>${reminderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <div class="flex items-center gap-1">
                                    <i class="bi bi-clock text-${statusColor}-500"></i>
                                    <span>${reminderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex gap-2" onclick="event.stopPropagation()">
                    ${isAdmin ? `
                        ${canSendNow ? `
                        <button onclick="window.sendReminderNotification(${idParam})" class="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 dark:text-dark-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Send Notification Now">
                            <i class="bi bi-send text-lg"></i>
                        </button>
                        ` : ''}
                        <button onclick='openCreateReminderModalFinal(${resendJson})' class="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 dark:text-dark-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Edit Reminder">
                            <i class="bi bi-pencil text-lg"></i>
                        </button>
                        ${(r.source !== 'System' && r.source !== 'Deadline' && r.source !== 'AgendaDeadline') ? `
                        <button onclick="deleteReminderFinal(${idParam})" class="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 dark:text-dark-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Delete">
                            <i class="bi bi-trash text-lg"></i>
                        </button>
                        ` : ''}
                    ` : `
                        ${user && user.role !== 'User - Committee' ? `
                         ${canSendNow ? `
                         <button onclick="window.sendReminderNotification(${idParam})" class="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 dark:text-dark-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Send Notification Now">
                            <i class="bi bi-send text-lg"></i>
                        </button>
                        ` : ''}
                        ` : ''}
                    `}
                </div>
            </div>
        </div>
    `;
}

/**
 * Generates HTML for an upcoming session monitoring item
 */
function getSessionItemHtml(s, reminders = []) {
    const countdown = getUrgentCountdown(s.session_date, s.actual_start_time || '00:00:00');

    // Check existing reminders for this session to persist checkbox state
    const hasInterval = (type) => {
        const label = { '7d': '7 Days Before', '3d': '3 Days Before', '24h': '24h Before', '1h': '1h Before' }[type];
        return (reminders || window.cachedReminders || []).some(r => r.related_type === 'Session' &&
            r.related_id == s.session_id &&
            r.title.includes(label));
    };

    // Check if a milestone is already in the past
    const isLate = (days) => {
        return countdown.diffDays < (days / 24);
    };

    return `
    <div class="p-5 hover:bg-gray-50 dark:hover:bg-dark-bg/40 transition-all group cursor-pointer relative" onclick="viewSessionDetails(${s.session_id})">
        <div class="flex items-center justify-between gap-4 relative z-10">
            <div class="flex items-center gap-4 flex-1">
                <div class="w-12 h-12 rounded-xl bg-white dark:bg-dark-card flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm border border-gray-100 dark:border-dark-border flex-shrink-0">
                    <i class="bi bi-calendar2-week text-xl"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <h4 class="font-bold text-gray-900 dark:text-white text-base group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">${s.title}</h4>
                        <span class="px-2 py-0.5 ${countdown.colorClass} rounded-full text-[10px] font-bold border shadow-xs flex-shrink-0 flex items-center gap-1">
                            <span class="w-1 h-1 rounded-full ${countdown.dotColor} ${countdown.isPast ? '' : 'animate-pulse'}"></span>
                            ${countdown.text.toUpperCase()}
                        </span>
                    </div>
                    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-dark-muted mb-3">
                        <span class="flex items-center gap-1"><i class="bi bi-clock text-red-500/80 dark:text-red-400/80"></i> ${s.date} ${s.time ? `| ${s.time}` : ''}</span>
                        <span class="flex items-center gap-1"><i class="bi bi-geo-alt"></i> ${s.venue || 'TBD'}</span>
                        <span class="flex items-center gap-1"><i class="bi bi-tag"></i> ${s.session_type}</span>
                        <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> ${s.status}</span>
                    </div>

                    <!-- Notification Alert Triggers -->
                    <div class="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-gray-100 dark:border-dark-border/50">
                        <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-dark-muted uppercase tracking-widest mr-1">
                            <i class="bi bi-bell-fill text-red-500"></i> Active Alerts:
                        </div>
                        <label class="flex items-center gap-2 ${isLate(7 * 24) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer group/label'}" onclick="event.stopPropagation()">
                            <input type="checkbox" ${isLate(7 * 24) ? 'disabled' : ''} ${hasInterval('7d') ? 'checked' : ''} onchange="handleAlertToggle(${s.session_id}, '7d', this.checked)" class="w-3.5 h-3.5 rounded text-red-600 border-gray-300 focus:ring-red-500 ${isLate(7 * 24) ? 'cursor-not-allowed' : 'cursor-pointer'}">
                            <span class="text-[11px] font-medium ${hasInterval('7d') ? 'text-red-600 font-bold' : 'text-gray-600 dark:text-dark-muted'} ${!isLate(7 * 24) ? 'group-hover/label:text-red-600' : ''} transition-colors">7 Days Before</span>
                        </label>
                        <label class="flex items-center gap-2 ${isLate(3 * 24) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer group/label'}" onclick="event.stopPropagation()">
                            <input type="checkbox" ${isLate(3 * 24) ? 'disabled' : ''} ${hasInterval('3d') ? 'checked' : ''} onchange="handleAlertToggle(${s.session_id}, '3d', this.checked)" class="w-3.5 h-3.5 rounded text-red-600 border-gray-300 focus:ring-red-500 ${isLate(3 * 24) ? 'cursor-not-allowed' : 'cursor-pointer'}">
                            <span class="text-[11px] font-medium ${hasInterval('3d') ? 'text-red-600 font-bold' : 'text-gray-600 dark:text-dark-muted'} ${!isLate(3 * 24) ? 'group-hover/label:text-red-600' : ''} transition-colors">3 Days Before</span>
                        </label>
                        <label class="flex items-center gap-2 ${isLate(24) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer group/label'}" onclick="event.stopPropagation()">
                            <input type="checkbox" ${isLate(24) ? 'disabled' : ''} ${hasInterval('24h') ? 'checked' : ''} onchange="handleAlertToggle(${s.session_id}, '24h', this.checked)" class="w-3.5 h-3.5 rounded text-red-600 border-gray-300 focus:ring-red-500 ${isLate(24) ? 'cursor-not-allowed' : 'cursor-pointer'}">
                            <span class="text-[11px] font-medium ${hasInterval('24h') ? 'text-red-600 font-bold' : 'text-gray-600 dark:text-dark-muted'} ${!isLate(24) ? 'group-hover/label:text-red-600' : ''} transition-colors">24h Before</span>
                        </label>
                        <label class="flex items-center gap-2 ${isLate(1) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer group/label'}" onclick="event.stopPropagation()">
                            <input type="checkbox" ${isLate(1) ? 'disabled' : ''} ${hasInterval('1h') ? 'checked' : ''} onchange="handleAlertToggle(${s.session_id}, '1h', this.checked)" class="w-3.5 h-3.5 rounded text-red-600 border-gray-300 focus:ring-red-500 ${isLate(1) ? 'cursor-not-allowed' : 'cursor-pointer'}">
                            <span class="text-[11px] font-medium ${hasInterval('1h') ? 'text-red-600 font-bold' : 'text-gray-600 dark:text-dark-muted'} ${!isLate(1) ? 'group-hover/label:text-red-600' : ''} transition-colors">1h Before</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer group/label" onclick="event.stopPropagation()">
                            <input type="checkbox" onchange="handleAlertToggle(${s.session_id}, 'custom', this.checked)" class="w-3.5 h-3.5 rounded text-red-600 border-gray-300 focus:ring-red-500 cursor-pointer">
                            <span class="text-[11px] font-medium text-gray-600 dark:text-dark-muted group-hover/label:text-red-600 transition-colors italic">Custom</span>
                        </label>
                    </div>
                </div>
            </div>
            <div class="flex-shrink-0">
                <button class="p-2 bg-white dark:bg-dark-card text-gray-400 dark:text-dark-muted hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all border border-gray-100 dark:border-dark-border shadow-sm">
                    <i class="bi bi-arrow-right-short text-xl"></i>
                </button>
            </div>
        </div>
    </div>
    `;
}

// Filter upcoming sessions monitoring area
window.filterUpcomingSessions = function (filterType) {
    if (!window.cachedUpcomingSessions) return;

    // Update active button state for sessions filters
    document.querySelectorAll('[id^="sessions-filter-"]').forEach(btn => {
        btn.classList.remove('bg-red-600', 'text-white', 'hover:bg-red-700');
        btn.classList.add(
            'bg-white',
            'text-gray-700',
            'border',
            'border-gray-300',
            'dark:bg-dark-bg',
            'dark:text-dark-text',
            'dark:border-dark-border',
            'hover:bg-gray-50',
            'dark:hover:bg-dark-card'
        );
    });
    const activeBtn = document.getElementById(`sessions-filter-${filterType}`);
    if (activeBtn) {
        activeBtn.classList.remove(
            'bg-white',
            'text-gray-700',
            'border',
            'border-gray-300',
            'dark:bg-dark-bg',
            'dark:text-dark-text',
            'dark:border-dark-border',
            'hover:bg-gray-50',
            'dark:hover:bg-dark-card'
        );
        activeBtn.classList.add('bg-red-600', 'text-white', 'hover:bg-red-700');
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    let filteredSessions = [...(window.cachedUpcomingSessions || [])];

    if (filterType === 'today') {
        filteredSessions = filteredSessions.filter(s => {
            const d = new Date(s.session_date);
            return d >= startOfToday && d <= endOfToday;
        });
    } else if (filterType === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        filteredSessions = filteredSessions.filter(s => {
            const d = new Date(s.session_date);
            return d >= startOfWeek && d <= endOfWeek;
        });
    } else if (filterType === 'month') {
        filteredSessions = filteredSessions.filter(s => {
            const d = new Date(s.session_date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
    } else if (filterType === 'special') {
        filteredSessions = filteredSessions.filter(s => s.session_type && s.session_type.toLowerCase().includes('special'));
    }

    const sessionListContainer = document.getElementById('upcoming-sessions-list');
    if (sessionListContainer) {
        if (filteredSessions.length === 0) {
            sessionListContainer.innerHTML = `
                <div class="p-8 text-center text-gray-500 dark:text-dark-muted text-sm italic border-t border-gray-100 dark:border-dark-border">
                    No upcoming sessions found for this filter.
                </div>
            `;
        } else {
            sessionListContainer.innerHTML = filteredSessions.map(s => getSessionItemHtml(s)).join('');
        }
    }
};

// Filter the main System Reminders / Notifications list
window.filterSystemReminders = function (filterType) {
    if (!window.cachedReminders) return;

    // Update active button state for system filters
    document.querySelectorAll('[id^="system-filter-"]').forEach(btn => {
        btn.classList.remove('bg-red-600', 'text-white', 'hover:bg-red-700');
        btn.classList.add(
            'bg-white',
            'text-gray-700',
            'border',
            'border-gray-300',
            'dark:bg-dark-bg',
            'dark:text-dark-text',
            'dark:border-dark-border',
            'hover:bg-gray-50',
            'dark:hover:bg-dark-card'
        );
    });
    const activeBtn = document.getElementById(`system-filter-${filterType}`);
    if (activeBtn) {
        activeBtn.classList.remove(
            'bg-white',
            'text-gray-700',
            'border',
            'border-gray-300',
            'dark:bg-dark-bg',
            'dark:text-dark-text',
            'dark:border-dark-border',
            'hover:bg-gray-50',
            'dark:hover:bg-dark-card'
        );
        activeBtn.classList.add('bg-red-600', 'text-white', 'hover:bg-red-700');
    }

    let filtered = [...window.cachedReminders];
    const now = new Date();

    if (filterType === 'session') {
        filtered = filtered.filter(r => r.related_type === 'Session');
    } else if (filterType === 'agenda') {
        filtered = filtered.filter(r => r.related_type === 'Agenda' || r.related_type === 'AgendaItem' || r.source === 'AgendaDeadline');
    } else if (filterType === 'system') {
        filtered = filtered.filter(r =>
            r.related_type === 'System' ||
            ((r.creator_role === 'System' || r.source === 'System') && r.related_type !== 'Session' && r.related_type !== 'Agenda' && r.related_type !== 'AgendaItem')
        );
    } else if (filterType === 'other') {
        filtered = filtered.filter(r =>
            r.related_type !== 'Session' &&
            r.related_type !== 'Agenda' &&
            r.related_type !== 'AgendaItem' &&
            r.related_type !== 'System' &&
            r.source !== 'AgendaDeadline' &&
            !(r.source === 'System' && r.related_type !== 'Session')
        );
    } else if (filterType === 'completed') {
        filtered = filtered.filter(r => new Date(r.reminder_date) < now);
    }

    const listContainer = document.getElementById('reminders-list');
    if (!listContainer) return;

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="p-12 text-center bg-white dark:bg-dark-card rounded-xl">
                <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-dark-bg flex items-center justify-center mx-auto mb-4">
                    <i class="bi bi-inbox text-4xl text-gray-400 dark:text-dark-muted"></i>
                </div>
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2">No Reminders Found</h3>
                <p class="text-gray-500 dark:text-dark-muted">No reminders match the selected filter.</p>
            </div>
        `;
    } else {
        const user = getCurrentUser();
        const isAdmin = user && user.(role === 'Super Admin' || role === 'Admin');
        listContainer.innerHTML = filtered.map(r => getReminderItemHtml(r, isAdmin, user)).join('');
    }
};

// Keep old filterReminders for backward compatibility if any
window.filterReminders = function (type) {
    window.filterUpcomingSessions(type);
    window.filterSystemReminders(type);
};

window.viewReminderDetails = async function (reminderId, forceModal = false) {
    let reminder = (window.cachedReminders || []).find(r => r.reminder_id == reminderId);

    // Fallback search in header cache if main cache is empty
    if (!reminder && window.latestNotifications) {
        reminder = window.latestNotifications.find(r => r.reminder_id == reminderId);
    }

    if (!reminder) {
        try {
            const response = await fetch('../api/api_reminders.php');
            const data = await response.json();
            if (data.success && data.reminders) {
                window.cachedReminders = data.reminders;
                reminder = window.cachedReminders.find(r => r.reminder_id == reminderId);
            }
        } catch (e) { console.error(e); }
    }

    if (!reminder) return;

    const user = getCurrentUser();
    const isAdmin = user && user.(role === 'Super Admin' || role === 'Admin');
    const isStaff = user && user.role === 'Staff';
    const canMonitor = isAdmin || isStaff;
    const isUnread = !reminder.is_read || reminder.is_read === 0 || reminder.is_read === false;

    // Auto-mark as read for Staff and Users (Silent - no alert, no redirect)
    // If forceModal is true (from bell icon), even Admins mark as read
    if ((!isAdmin || forceModal) && isUnread) {
        window.markReminderAsRead(reminderId, true);
        // Silently update local state
        reminder.is_read = true;
        reminder.read_status = 'Read';
    }

    if (!canMonitor || forceModal) {
        // Show Modal for regular Users OR if forced (by notification bell)
        openReminderDetailModal(reminder);
        return;
    }

    // Original Full Page Behavior for Administrators
    window.isSubView = true;
    window.activeSection = 'reminders';
    const pageTitle = document.getElementById('page-title');
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    if (pageTitle) pageTitle.textContent = reminder.title;
    if (breadcrumbCurrent) {
        breadcrumbCurrent.innerHTML = `
            <a href="#" onclick="showSection('reminders')" class="hover:text-red-600 dark:text-dark-text dark:hover:text-red-400 transition-colors">Reminders</a>
            <i class="bi bi-chevron-right mx-2 text-xs"></i>
            <span class="text-gray-800 dark:text-white font-medium">${reminder.title}</span>
        `;
    }

    const reminderDate = new Date(reminder.reminder_date);
    const now = new Date();
    const isPast = reminderDate < now;
    const isToday = reminderDate.toDateString() === now.toDateString();

    let statusColor = isPast ? 'gray' : 'red';
    let statusIcon = isPast ? 'check-circle' : (isToday ? 'exclamation-circle' : 'calendar4-event');
    let statusText = isPast ? 'Past' : (isToday ? 'Today' : 'Upcoming');

    // Styles for Deadlines (System or Manual)
    if (reminder.source === 'Deadline' || reminder.source === 'AgendaDeadline' || reminder.related_type === 'Deadline') {
        statusColor = 'red';
        statusIcon = 'alarm';
        statusText = 'Deadline';
    }

    const isRead = (reminder.read_status === 'Read') || (reminder.is_read === 1 || reminder.is_read === true);

    const html = `
        <div class="space-y-6 animate-fade-in-up">
            <!--Header Status Bar-->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border mb-6 w-full">
                <div class="flex items-center gap-4">
                    <button onclick="showSection('reminders')" class="w-10 h-10 rounded-lg bg-gray-50 dark:bg-dark-bg flex items-center justify-center text-gray-600 dark:text-dark-muted hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all border border-gray-200 dark:border-dark-border">
                        <i class="bi bi-arrow-left"></i>
                    </button>
                    <div>
                        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-muted">
                            <span class="hover:text-red-600 dark:hover:text-red-400 cursor-pointer" onclick="showSection('reminders')">Reminders</span>
                            <i class="bi bi-chevron-right text-[10px]"></i>
                            <span class="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">${reminder.title}</span>
                        </div>
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Reminder Details</h2>
                    </div>
                </div>
                <div class="flex gap-2">
                    ${(reminder.source === 'Deadline' || reminder.source === 'AgendaDeadline') ? `
                        ${user && user.role !== 'User - Committee' ? `
                        <button onclick="openCreateReminderModalFinal({title: 'Reminder: ' + '${reminder.title}'.replace(/'/g, "\\'"), message: 'Reminder for deadline: ' + '${reminder.title}'.replace(/'/g, "\\'"), date: '${reminder.reminder_date}'})" class="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 text-sm font-medium flex items-center gap-2 shadow-lg shadow-red-500/30 transition-all">
                             <i class="bi bi-send"></i> Send Notification
                        </button>
                        ` : ''}
                    ` : `
                        ${isAdmin ? `
                        <button onclick="window.sendReminderNotification(${typeof reminder.reminder_id === 'string' ? `'${reminder.reminder_id}'` : reminder.reminder_id})" class="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-sm font-medium flex items-center gap-2 transition-all" title="Send Notification">
                            <i class="bi bi-send"></i> Send
                        </button>
                        <button onclick="editReminder(${typeof reminder.reminder_id === 'string' ? `'${reminder.reminder_id}'` : reminder.reminder_id})" class="px-4 py-2 bg-white dark:bg-dark-bg text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm font-medium flex items-center gap-2 transition-all">
                            <i class="bi bi-pencil"></i> Edit
                        </button>` : ''}
                        ${user && user.role !== 'User - Committee' ? `
                        <button onclick="deleteReminderFinal(${typeof reminder.reminder_id === 'string' ? `'${reminder.reminder_id}'` : reminder.reminder_id})" class="px-4 py-2 bg-white dark:bg-dark-bg text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium flex items-center gap-2 transition-all">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                        ` : ''}
                        ${!isAdmin && !isRead ? `
                        <button onclick="markReminderAsRead(${typeof reminder.reminder_id === 'string' ? `'${reminder.reminder_id}'` : reminder.reminder_id})" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all">
                            <i class="bi bi-check-circle"></i> Mark as Read
                        </button>` : ''}
                        ${reminder.title.includes('Action Required') ? `
                         <button onclick="if(typeof window.editSession === 'function') window.editSession(${reminder.related_id})" class="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 text-sm font-medium flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all">
                             <i class="bi bi-pencil-square"></i> Update Session
                        </button>
                        ` : ''}
                    `}
                </div>
            </div>

            <div class="space-y-6">
                <div class="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden">
                    <div class="bg-gradient-to-r from-${statusColor === 'gray' ? 'slate' : statusColor}-600 to-${statusColor === 'gray' ? 'slate' : statusColor}-800 p-8 text-white relative">
                        <div class="absolute top-0 right-0 p-8 opacity-10">
                            <i class="bi bi-bell text-9xl"></i>
                        </div>
                        <div class="relative z-10">
                            <span class="px-3 py-1 bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-full text-xs font-semibold mb-4 inline-block border border-white/30 dark:border-white/10">
                                ${statusText} Reminder
                            </span>
                            <h1 class="text-3xl font-bold mb-2">${reminder.title}</h1>
                            <p class="text-white/80 dark:text-white/60 text-lg leading-relaxed">${reminder.message || 'No description provided.'}</p>
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 class="text-xs font-bold text-gray-400 dark:text-dark-muted uppercase tracking-widest mb-4">Time & Date</h4>
                                <div class="space-y-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                                            <i class="bi bi-calendar-event"></i>
                                        </div>
                                        <div>
                                            <p class="text-sm font-bold text-gray-900 dark:text-white">${reminderDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                            <p class="text-xs text-gray-500 dark:text-dark-muted">Scheduled Date</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                                            <i class="bi bi-clock"></i>
                                        </div>
                                        <div>
                                            <p class="text-sm font-bold text-gray-900 dark:text-white">${reminderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                                            <p class="text-xs text-gray-500 dark:text-dark-muted">Scheduled Time</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 class="text-xs font-bold text-gray-400 dark:text-dark-muted uppercase tracking-widest mb-4">Metadata</h4>
                                <div class="space-y-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <i class="bi bi-person"></i>
                                        </div>
                                        <div>
                                            <p class="text-sm font-bold text-gray-900 dark:text-white">${reminder.creator_name || 'System'}</p>
                                            <p class="text-xs text-gray-500 dark:text-dark-muted">Created By</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                            <i class="bi bi-info-circle"></i>
                                        </div>
                                        <div>
                                            <p class="text-sm font-bold text-gray-900 dark:text-white">${isRead ? 'Read' : 'Unread'}</p>
                                            <p class="text-xs text-gray-500 dark:text-dark-muted">Status</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <i class="bi bi-people text-red-600"></i> Recipients
                        </h4>
                        ${isAdmin && (reminder.source !== 'Deadline' && reminder.source !== 'AgendaDeadline') ? `
                        <button onclick="openAddRecipientsModal(${typeof reminder.reminder_id === 'string' ? `'${reminder.reminder_id}'` : reminder.reminder_id})" class="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Add Recipients">
                            <i class="bi bi-person-plus-fill"></i>
                        </button>` : ''}
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${reminder.target_roles ? reminder.target_roles.split(',').map(role => {
        const roleColor = role.trim() === 'Super Admin' ? 'red' : role.trim() === 'Staff' ? 'blue' : 'green';
        return `
                            <span class="px-3 py-1 bg-${roleColor}-50 dark:bg-${roleColor}-900/20 text-${roleColor}-700 dark:text-${roleColor}-400 rounded-full text-xs font-semibold border border-${roleColor}-200 dark:border-${roleColor}-900/30">
                                ${role.trim()}
                            </span>`;
    }).join('') : '<p class="text-xs text-gray-500 dark:text-dark-muted italic">No recipients assigned</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('content-area').innerHTML = html;
};

// Also set as global for compatibility
window.renderAdminReminders = window.renderReminders;
window.renderStaffReminders = window.renderReminders;
window.renderRemindersAsync = window.renderReminders;

// Pagination for notifications dropdown
window.notificationsDisplayLimit = 5;

// Function to populate header notifications
window.populateNotifications = async function (isLoadMore = false) {
    try {
        let reminders;

        // If just loading more, use cached data to avoid redundant API hits
        if (isLoadMore && window.latestNotifications) {
            reminders = window.latestNotifications;
        } else {
            const response = await fetch('../api/api_reminders.php?view=notifications');
            const data = await response.json();
            if (!data.success) return;
            reminders = data.reminders || [];
            window.latestNotifications = reminders;
        }

        const unreadCount = reminders.filter(r => !r.is_read || r.is_read === 0 || r.is_read === false).length;

        // Update badge
        const badge = document.getElementById('notification-badge');
        if (badge) {
            if (unreadCount > 0) {
                badge.classList.remove('hidden');
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                badge.className = "absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-600 text-[10px] font-bold text-white rounded-full border-2 border-white dark:border-dark-card";
            } else {
                badge.classList.add('hidden');
            }
        }

        // Update list
        const list = document.getElementById('notifications-list');
        if (list) {
            // Add scroll listener once
            if (!list.dataset.hasScrollListener) {
                list.addEventListener('scroll', () => {
                    // Detect near bottom (scrolling down to load older)
                    if (list.scrollTop + list.clientHeight >= list.scrollHeight - 20) {
                        if (window.notificationsDisplayLimit < (window.latestNotifications ? window.latestNotifications.length : 0)) {
                            window.notificationsDisplayLimit += 5;
                            window.populateNotifications(true); // Load more from cache
                        }
                    }
                });
                list.dataset.hasScrollListener = 'true';
            }

            if (reminders.length === 0) {
                list.innerHTML = '<div class="p-8 text-center text-gray-500 dark:text-dark-muted text-sm"><i class="bi bi-bell-slash text-2xl block mb-2 opacity-20"></i>No new notifications</div>';
            } else {
                // Show items up to current limit
                const latest = reminders.slice(0, window.notificationsDisplayLimit);
                list.innerHTML = latest.map(r => {
                    const timeAgo = r.created_at ? getTimeAgo(new Date(r.created_at)) : 'Recently';
                    const isUnread = !r.is_read || r.is_read === 0 || r.is_read === false;

                    const idParam = typeof r.reminder_id === 'string' ? `'${r.reminder_id}'` : r.reminder_id;
                    return `
                        <div onclick="viewReminderDetails(${idParam}, true)" class="p-4 hover:bg-gray-50 dark:hover:bg-dark-bg/50 border-b border-gray-100 dark:border-dark-border cursor-pointer transition-colors ${isUnread ? 'bg-red-50/30 dark:bg-red-900/10' : ''}">
                            <div class="flex items-start space-x-3">
                                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xs shadow-sm">
                                    <i class="bi bi-bell"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex justify-between items-start">
                                        <p class="text-sm ${isUnread ? 'font-bold' : 'font-medium'} text-gray-900 dark:text-white line-clamp-1">${r.title}</p>
                                        ${isUnread ? '<span class="w-2 h-2 bg-red-600 rounded-full"></span>' : ''}
                                    </div>
                                    <p class="text-xs text-gray-500 dark:text-dark-muted mt-0.5 line-clamp-2">${r.message || 'No additional details'}</p>
                                    <p class="text-[10px] text-gray-400 dark:text-dark-muted mt-1">${timeAgo}</p>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (e) {
        console.error('Error populating notifications:', e);
    }
};

// Helper for time ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return "just now";
}

// Initial call and set interval
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(window.populateNotifications, 1000);
    setInterval(window.populateNotifications, 60000); // Check every minute
});

console.log('Reminders module loaded and ready');

/**
 * Premium Modal for Notification Details
 * @param {Object} reminder 
 */
function openReminderDetailModal(reminder) {
    const existing = document.getElementById('reminderDetailModal');
    if (existing) existing.remove();

    const reminderDate = new Date(reminder.reminder_date);
    const dateStr = reminderDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const timeStr = reminderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Choose header color:
    // - Default red for all reminders
    // - Agendas purple for visual distinction
    // (Sessions, including Action Required, stay red for consistency)
    let statusColor = 'red';
    if (reminder.related_type === 'Agenda') statusColor = 'purple';
    if (reminder.source === 'System' || reminder.source === 'Deadline') statusColor = 'red';

    const modalHtml = `
        <div id="reminderDetailModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center animate-fade-in p-4">
            <div class="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform scale-100 animate-fade-in-up border border-gray-100 dark:border-dark-border">
                <div class="bg-gradient-to-r from-${statusColor}-600 to-${statusColor}-800 p-6 text-white relative">
                    <button onclick="document.getElementById('reminderDetailModal').remove()" class="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1 transition">
                        <i class="bi bi-x-lg"></i>
                    </button>
                    <div class="flex items-center gap-3 mb-2">
                        <span class="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-wider border border-white/20">
                            ${reminder.related_type || 'Notification'}
                        </span>
                    </div>
                    <h3 class="text-xl font-bold">${reminder.title}</h3>
                </div>
                <div class="p-6 space-y-4">
                    <div class="text-gray-600 dark:text-dark-muted leading-relaxed text-sm">
                        ${reminder.message || 'No additional details provided.'}
                    </div>
                    
                    <div class="pt-4 border-t border-gray-100 dark:border-dark-border grid grid-cols-2 gap-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-${statusColor}-50 dark:bg-${statusColor}-900/10 flex items-center justify-center text-${statusColor}-600">
                                <i class="bi bi-bell"></i>
                            </div>
                            <div>
                                <p class="text-[10px] text-gray-400 dark:text-dark-muted uppercase font-bold tracking-tighter">Reminder For</p>
                                <p class="text-xs font-semibold text-gray-700 dark:text-white">${dateStr}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-${statusColor}-50 dark:bg-${statusColor}-900/10 flex items-center justify-center text-${statusColor}-600">
                                <i class="bi bi-clock"></i>
                            </div>
                            <div>
                                <p class="text-[10px] text-gray-400 dark:text-dark-muted uppercase font-bold">Alert Time</p>
                                <p class="text-xs font-semibold text-gray-700 dark:text-white">${timeStr}</p>
                            </div>
                        </div>
                    </div>

                    ${(reminder.related_type === 'Session' && reminder.related_id) ? `
                    <div class="pt-4">
                        <button onclick="document.getElementById('reminderDetailModal').remove(); showSection('sessions')" class="w-full py-2.5 bg-gray-50 dark:bg-dark-bg hover:bg-${statusColor}-50 dark:hover:bg-${statusColor}-900/10 text-gray-600 dark:text-dark-text hover:text-${statusColor}-600 dark:hover:text-${statusColor}-400 rounded-xl text-sm font-bold transition-all border border-gray-100 dark:border-dark-border flex items-center justify-center gap-2">
                            <i class="bi bi-eye"></i> View Details
                        </button>
                    </div>
                    ` : (reminder.link ? `
                    <div class="pt-4">
                        <button onclick="document.getElementById('reminderDetailModal').remove(); showSection('${reminder.link}')" class="w-full py-2.5 bg-gray-50 dark:bg-dark-bg hover:bg-${statusColor}-50 dark:hover:bg-${statusColor}-900/10 text-gray-600 dark:text-dark-text hover:text-${statusColor}-600 dark:hover:text-${statusColor}-400 rounded-xl text-sm font-bold transition-all border border-gray-100 dark:border-dark-border flex items-center justify-center gap-2">
                            <i class="bi bi-box-arrow-up-right"></i> View ${reminder.link.charAt(0).toUpperCase() + reminder.link.slice(1)}
                        </button>
                    </div>
                    ` : '')}

                    <div class="pt-2">
                        <button onclick="document.getElementById('reminderDetailModal').remove()" class="w-full py-3 bg-${statusColor}-600 hover:bg-${statusColor}-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-${statusColor}-500/30 transition-all active:scale-95">
                            Got it
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ============================================
// EDIT & RECIPIENT MODALS
// ============================================

// ============================================
// EDIT & RECIPIENT MODALS
// ============================================

window.editReminder = function (reminderId) {
    const reminder = window.cachedReminders.find(r => r.reminder_id == reminderId);
    if (!reminder) {
        showNotification('Reminder not found', 'error');
        return;
    }

    const reminderDate = new Date(reminder.reminder_date);
    // Format for datetime-local input: YYYY-MM-DDTHH:mm
    const year = reminderDate.getFullYear();
    const month = String(reminderDate.getMonth() + 1).padStart(2, '0');
    const day = String(reminderDate.getDate()).padStart(2, '0');
    const hours = String(reminderDate.getHours()).padStart(2, '0');
    const minutes = String(reminderDate.getMinutes()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;

    const html = `
        <div class="space-y-6 animate-fade-in-up">
            <!--Header Status Bar-->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border mb-6 w-full">
                <div class="flex items-center gap-4">
                    <button onclick="checkDirtyAndGoBack('reminders')" class="w-10 h-10 rounded-lg bg-gray-50 dark:bg-dark-bg flex items-center justify-center text-gray-600 dark:text-dark-muted hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all border border-gray-200 dark:border-dark-border">
                        <i class="bi bi-arrow-left"></i>
                    </button>
                    <div>
                        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-muted">
                            <span class="hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-colors" onclick="checkDirtyAndGoBack('reminders')">Reminders</span>
                            <i class="bi bi-chevron-right text-[10px]"></i>
                            <span class="hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-colors" onclick="checkDirtyAndGoBack('details', ${reminder.reminder_id})">${reminder.title}</span>
                            <i class="bi bi-chevron-right text-[10px]"></i>
                            <span class="text-gray-900 dark:text-white font-medium">Edit</span>
                        </div>
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Edit Reminder</h2>
                    </div>
                </div>
            </div>

            <div class="max-w-3xl mx-auto">
                <div class="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark-border p-8">
                    <form id="editReminderForm" onsubmit="saveReminderEdit(event, ${reminder.reminder_id})" class="space-y-6">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">Title</label>
                                <input type="text" id="edit_reminder_title" value="${reminder.title}" required 
                                    class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 dark:bg-dark-bg dark:text-white hover:bg-white dark:hover:bg-dark-card" 
                                    placeholder="e.g. Budget Review Meeting"
                                    oninput="window.isDirty = true">
                            </div>
    
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">Message</label>
                                <textarea id="edit_reminder_message" rows="5" required 
                                    class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 dark:bg-dark-bg dark:text-white hover:bg-white dark:hover:bg-dark-card" 
                                    placeholder="Enter reminder details..."
                                    oninput="window.isDirty = true">${reminder.message || ''}</textarea>
                            </div>
    
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">Date & Time</label>
                                    <input type="datetime-local" id="edit_reminder_date" value="${formattedDate}" required 
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 dark:bg-dark-bg dark:text-white hover:bg-white dark:hover:bg-dark-card"
                                        onchange="window.isDirty = true" oninput="window.isDirty = true">
                                </div>
                            </div>
                        </div>
    
                        <div class="flex gap-3 pt-6 border-t border-gray-100 dark:border-dark-border">
                            <button type="button" onclick="checkDirtyAndCancel(${reminder.reminder_id})" class="flex-1 px-4 py-3 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 font-medium transition-all">
                                Cancel
                            </button>
                            <button type="submit" class="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-medium shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2">
                                <i class="bi bi-check-lg"></i>
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.getElementById('content-area').innerHTML = html;
};

window.checkDirtyAndGoBack = function (destination, id) {
    if (window.isDirty) {
        showUnsavedChangesModal(() => {
            window.isDirty = false;
            // Proceed with navigation
            if (destination === 'reminders') {
                showSection('reminders');
            } else if (destination === 'details' && id) {
                viewReminderDetails(id);
            }
        });
        return;
    }
    window.isDirty = false;

    if (destination === 'reminders') {
        showSection('reminders');
    } else if (destination === 'details' && id) {
        viewReminderDetails(id);
    }
};

window.checkDirtyAndCancel = function (reminderId) {
    if (window.isDirty) {
        showUnsavedChangesModal(() => {
            window.isDirty = false;
            viewReminderDetails(reminderId);
        }, {
            title: 'Cancel Edit',
            message: 'Are you sure you want to cancel?',
            description: 'Any unsaved changes will be lost.',
            confirmText: 'Yes, Cancel'
        });
    } else {
        viewReminderDetails(reminderId);
    }
};

window.saveReminderEdit = async function (event, reminderId) {
    event.preventDefault();

    const title = document.getElementById('edit_reminder_title').value;
    const message = document.getElementById('edit_reminder_message').value;
    const date = document.getElementById('edit_reminder_date').value;

    try {
        const response = await fetch('../api/api_reminders.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update_reminder',
                reminder_id: reminderId,
                title: title,
                message: message,
                reminder_date: date
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Reminder updated successfully', 'success');
            window.isDirty = false;

            // Allow fetch to complete for fresh data before showing details
            const remindersResponse = await fetch('../api/api_reminders.php');
            const remindersData = await remindersResponse.json();
            if (remindersData.success) {
                window.cachedReminders = remindersData.reminders;
            }

            viewReminderDetails(reminderId);
        } else {
            showNotification(data.message || 'Failed to update reminder', 'error');
        }
    } catch (error) {
        console.error('Error updating reminder:', error);
        showNotification('An error occurred while updating the reminder', 'error');
    }
};

window.openAddRecipientsModal = async function (reminderId) {
    // Show loading or just open modal and load users dynamically
    let users = [];
    let reminder = window.cachedReminders ? window.cachedReminders.find(r => r.reminder_id == reminderId) : null;

    try {
        // Fetch all users
        const response = await fetch('../api/api_users.php');
        const data = await response.json();
        if (data.status === 'success' || data.success) {
            users = data.data || data.users || [];
        }

        // If it's a session-related reminder, filter to only show assigned staff
        if (reminder && reminder.related_type === 'Session' && reminder.related_id) {
            const sessionRes = await fetch(`../api/api_sessions.php?id=${reminder.related_id}`);
            const sessionData = await sessionRes.json();

            if (sessionData.success && sessionData.session && sessionData.session.assigned_staff) {
                const assignedIds = sessionData.session.assigned_staff.map(s => parseInt(s.user_id));
                users = users.filter(u => assignedIds.includes(parseInt(u.user_id)));
            }
        }
    } catch (e) {
        console.error("Failed to fetch data for modal", e);
        showNotification("Failed to load recipients list", "error");
        return;
    }

    const modalHtml = `
        <div id="addRecipientsModal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-sm">
            <div class="relative p-8 border dark:border-dark-border w-full max-w-2xl shadow-2xl rounded-2xl bg-white dark:bg-dark-card animate-fade-in-up m-4 h-[80vh] flex flex-col">
                <div class="flex justify-between items-center mb-6 flex-shrink-0">
                    <div>
                        <h3 class="text-2xl font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
                            <i class="bi bi-person-plus-fill text-red-600"></i>
                            Add Recipients
                        </h3>
                        <p class="text-sm text-gray-500 dark:text-red-300 mt-1">Select users to add to this reminder</p>
                    </div>
                    <button onclick="document.getElementById('addRecipientsModal').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg p-2 transition">
                        <i class="bi bi-x-lg text-xl"></i>
                    </button>
                </div>

                <div class="mb-4 flex-shrink-0">
                    <input type="text" id="recipientSearch" placeholder="Search users..." class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-dark-bg dark:text-white" onkeyup="filterRecipientsList()">
                </div>

                <form id="addRecipientsForm" onsubmit="saveRecipients(event, ${reminderId})" class="flex flex-col flex-1 overflow-hidden">
                    <div class="flex-1 overflow-y-auto border border-gray-100 dark:border-dark-border rounded-xl p-2 mb-6 space-y-2 custom-scrollbar" id="recipientsList">
                        ${users.map(u => `
                            <label class="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-dark-bg rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-200 dark:hover:border-dark-border">
                                <input type="checkbox" name="recipient_ids[]" value="${u.user_id}" class="w-5 h-5 text-red-600 rounded focus:ring-red-500 border-gray-300 dark:border-dark-border dark:bg-dark-bg mr-3">
                                <div>
                                    <p class="font-bold text-sm text-gray-900 dark:text-white">${u.user_name}</p>
                                    <p class="text-xs text-gray-500 dark:text-dark-muted">${u.role || u.user_role}</p>
                                </div>
                            </label>
                        `).join('')}
                    </div>

                    <div class="flex gap-3 pt-6 border-t border-gray-100 dark:border-dark-border flex-shrink-0">
                        <button type="button" onclick="document.getElementById('addRecipientsModal').remove()" class="flex-1 px-4 py-3 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-xl hover:bg-gray-50 dark:hover:bg-dark-bg font-medium transition-all">
                            Cancel
                        </button>
                        <button type="submit" class="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-medium shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2">
                            <i class="bi bi-plus-lg"></i>
                            Add Selected
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.filterRecipientsList = function () {
    const input = document.getElementById('recipientSearch');
    const filter = input.value.toLowerCase();
    const list = document.getElementById('recipientsList');
    const labels = list.getElementsByTagName('label');

    for (let i = 0; i < labels.length; i++) {
        const p = labels[i].getElementsByTagName('p')[0];
        const txtValue = p.textContent || p.innerText;
        if (txtValue.toLowerCase().indexOf(filter) > -1) {
            labels[i].style.display = "";
        } else {
            labels[i].style.display = "none";
        }
    }
};

window.saveRecipients = async function (event, reminderId) {
    event.preventDefault();

    const checkboxes = document.querySelectorAll('#recipientsList input[type="checkbox"]:checked');
    const recipientIds = Array.from(checkboxes).map(cb => cb.value);

    if (recipientIds.length === 0) {
        showNotification('Please select at least one recipient', 'warning');
        return;
    }

    try {
        const response = await fetch('../api/api_reminders.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'add_recipients',
                reminder_id: reminderId,
                recipient_ids: recipientIds
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification(data.message, 'success');
            document.getElementById('addRecipientsModal').remove();

            // Refresh reminders
            if (typeof renderReminders === 'function') {
                renderReminders();
                // If we are in details view, we might want to refresh details too or jump back to list
                // renderReminders will put us back in list view which is fine.
                // Or we can reload details:
                setTimeout(() => window.viewReminderDetails(reminderId), 500);
            }
        } else {
            showNotification(data.message || 'Failed to add recipients', 'error');
        }
    } catch (error) {
        console.error('Error adding recipients:', error);
        showNotification('An error occurred while adding recipients', 'error');
    }
};

// ============================================
// ENHANCED REPORTS & ANALYTICS MODULE
// ============================================

window.renderReportsAnalytics = function () {
    const html = `
        <div class="space-y-6 animate-fade-in-up">
            <!--Premium Header - Red Palette -->
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-8 shadow-xl">
                <div class="absolute inset-0 bg-black opacity-10"></div>
                <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                <div class="relative z-10">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div class="text-white">
                            <h1 class="text-3xl font-bold mb-2">Reports & Analytics</h1>
                            <p class="text-red-100 text-sm">Comprehensive system insights and performance metrics</p>
                        </div>
                        <div class="flex gap-2">
                            <button class="px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 text-white rounded-lg hover:bg-opacity-30 text-sm font-medium flex items-center gap-2 transition-all">
                                <i class="bi bi-download"></i> Export PDF
                            </button>
                            <button class="px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium flex items-center gap-2 shadow-lg transition-all">
                                <i class="bi bi-file-earmark-excel"></i> Export Excel
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!--Stats Grid-->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 p-6 rounded-xl shadow-sm border border-blue-200 dark:border-blue-900/30 hover:shadow-xl transition-all duration-300">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-blue-500 opacity-10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                    <div class="relative z-10">
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                <i class="bi bi-people-fill text-2xl"></i>
                            </div>
                        </div>
                        <h3 class="text-3xl font-bold text-blue-900 dark:text-white mb-1">1,247</h3>
                        <p class="text-sm text-blue-700 dark:text-blue-400 font-medium">Total Users</p>
                        <div class="mt-3 flex items-center text-xs text-green-600 dark:text-green-400">
                            <i class="bi bi-arrow-up mr-1"></i>
                            <span>+12% from last month</span>
                        </div>
                    </div>
                </div>

                <div class="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 p-6 rounded-xl shadow-sm border border-green-200 dark:border-green-900/30 hover:shadow-xl transition-all duration-300">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-green-500 opacity-10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                    <div class="relative z-10">
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                <i class="bi bi-calendar-check text-2xl"></i>
                            </div>
                        </div>
                        <h3 class="text-3xl font-bold text-green-900 dark:text-white mb-1">342</h3>
                        <p class="text-sm text-green-700 dark:text-green-400 font-medium">Sessions Completed</p>
                        <div class="mt-3 flex items-center text-xs text-green-600 dark:text-green-400">
                            <i class="bi bi-arrow-up mr-1"></i>
                            <span>+8% from last month</span>
                        </div>
                    </div>
                </div>

                <div class="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 p-6 rounded-xl shadow-sm border border-orange-200 dark:border-orange-900/30 hover:shadow-xl transition-all duration-300">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-orange-500 opacity-10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                    <div class="relative z-10">
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                <i class="bi bi-file-earmark-text text-2xl"></i>
                            </div>
                        </div>
                        <h3 class="text-3xl font-bold text-orange-900 dark:text-white mb-1">2,156</h3>
                        <p class="text-sm text-orange-700 dark:text-orange-400 font-medium">Documents Processed</p>
                        <div class="mt-3 flex items-center text-xs text-green-600 dark:text-green-400">
                            <i class="bi bi-arrow-up mr-1"></i>
                            <span>+15% from last month</span>
                        </div>
                    </div>
                </div>

                <div class="group relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 p-6 rounded-xl shadow-sm border border-red-200 dark:border-red-900/30 hover:shadow-xl transition-all duration-300">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-red-500 opacity-10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                    <div class="relative z-10">
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                <i class="bi bi-graph-up text-2xl"></i>
                            </div>
                        </div>
                        <h3 class="text-3xl font-bold text-red-900 dark:text-white mb-1">94%</h3>
                        <p class="text-sm text-red-700 dark:text-red-400 font-medium">Completion Rate</p>
                        <div class="mt-3 flex items-center text-xs text-green-600 dark:text-green-400">
                            <i class="bi bi-arrow-up mr-1"></i>
                            <span>+3% from last month</span>
                        </div>
                    </div>
                </div>
            </div>

            <!--Charts Grid-->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark-border p-6">
                    <h3 class="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <i class="bi bi-bar-chart-fill text-red-600"></i>
                        Monthly Activity
                    </h3>
                    <canvas id="monthlyChart" height="200"></canvas>
                </div>

                <div class="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark-border p-6">
                    <h3 class="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <i class="bi bi-pie-chart-fill text-red-600"></i>
                        Session Distribution
                    </h3>
                    <canvas id="distributionChart" height="200"></canvas>
                </div>
            </div>
        </div>
    `;
    document.getElementById('content-area').innerHTML = html;

    // Initialize charts if Chart.js is available
    if (typeof Chart !== 'undefined') {
        setTimeout(() => {
            const monthlyCtx = document.getElementById('monthlyChart');
            if (monthlyCtx) {
                new Chart(monthlyCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            label: 'Sessions',
                            data: [45, 52, 48, 61, 58, 67],
                            backgroundColor: 'rgba(220, 38, 38, 0.8)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--dark-muted').trim() || '#94a3b8' }
                            },
                            x: {
                                ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--dark-muted').trim() || '#94a3b8' }
                            }
                        },
                        plugins: {
                            legend: {
                                labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--dark-text').trim() || '#f8fafc' }
                            }
                        }
                    }
                });
            }

            const distCtx = document.getElementById('distributionChart');
            if (distCtx) {
                new Chart(distCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Completed', 'Pending', 'Cancelled'],
                        datasets: [{
                            data: [65, 25, 10],
                            backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--dark-text').trim() || '#f8fafc' }
                            }
                        }
                    }
                });
            }
        }, 100);
    }
};

// ============================================
// ENHANCED MY PROFILE MODULE
// ============================================

window.renderProfile = function () {
    const user = getCurrentUser();
    const html = `
        <div class="space-y-6 animate-fade-in-up">
            <!--Header-->
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-8 shadow-xl">
                <div class="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div class="relative group">
                        <div class="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30 shadow-2xl overflow-hidden">
                            <i class="bi bi-person-fill text-5xl text-white"></i>
                        </div>
                        <button class="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-red-600 rounded-lg shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                            <i class="bi bi-camera-fill"></i>
                        </button>
                    </div>
                    <div class="text-center md:text-left text-white">
                        <h1 class="text-3xl font-bold">${user.name}</h1>
                        <p class="text-red-100 flex items-center justify-center md:justify-start gap-2">
                            <span class="px-2 py-0.5 bg-white/20 rounded-md text-xs font-medium uppercase tracking-wider">${user.role}</span>
                            <span class="opacity-60">•</span>
                            <span>${user.email}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!--Actions-->
                <div class="md:col-span-1 space-y-6">
                    <div class="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark-border p-6">
                        <h3 class="font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h3>
                        <div class="space-y-3">
                            <button onclick="openEditProfileModal()" class="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg text-gray-700 dark:text-dark-text rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all flex items-center gap-3 font-medium border border-gray-200 dark:border-dark-border">
                                <i class="bi bi-pencil-square"></i> Edit Profile
                            </button>
                            <button onclick="openChangePasswordModal()" class="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg text-gray-700 dark:text-dark-text rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 transition-all flex items-center gap-3 font-medium border border-gray-200 dark:border-dark-border">
                                <i class="bi bi-shield-lock"></i> Change Password
                            </button>
                            <button onclick="logout()" class="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg text-gray-700 dark:text-dark-text rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all flex items-center gap-3 font-medium border border-gray-200 dark:border-dark-border">
                                <i class="bi bi-box-arrow-right"></i> Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                <!--Details-->
                <div class="md:col-span-2">
                    <div class="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden">
                        <div class="px-6 py-4 border-b border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg/50">
                            <h3 class="font-bold text-gray-900 dark:text-white">Profile Details</h3>
                        </div>
                        <div class="p-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div class="space-y-2">
                                    <label class="text-xs font-bold text-gray-400 dark:text-dark-muted uppercase">Full Name</label>
                                    <p class="text-gray-900 dark:text-white font-medium">${user.name}</p>
                                </div>
                                <div class="space-y-2">
                                    <label class="text-xs font-bold text-gray-400 dark:text-dark-muted uppercase">Email Address</label>
                                    <p class="text-gray-900 dark:text-white font-medium">${user.email}</p>
                                </div>
                                <div class="space-y-2">
                                    <label class="text-xs font-bold text-gray-400 dark:text-dark-muted uppercase">User Role</label>
                                    <p class="text-gray-900 dark:text-white font-medium uppercase">${user.role}</p>
                                </div>
                                <div class="space-y-2">
                                    <label class="text-xs font-bold text-gray-400 dark:text-dark-muted uppercase">Account Status</label>
                                    <div>
                                        <span class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold">ACTIVE</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('content-area').innerHTML = html;
};

window.openEditProfileModal = function () {
    const user = getCurrentUser();
    const modalHtml = `
        <div id="editProfileModal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-sm">
            <div class="relative p-6 border dark:border-dark-border w-full max-w-md shadow-2xl rounded-2xl bg-white dark:bg-dark-card animate-fade-in-up m-4">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
                        <i class="bi bi-pencil-square text-red-600"></i>
                        Edit Profile
                    </h3>
                    <button onclick="document.getElementById('editProfileModal').remove()" class="text-gray-400 dark:text-dark-muted hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg p-2 transition">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <form onsubmit="saveProfileEdit(event)" class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">Full Name</label>
                        <input type="text" id="edit_name" value="${user.name}" required class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg dark:bg-dark-bg dark:text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">Email</label>
                        <input type="text" id="edit_email" value="${user.email}" required class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg dark:bg-dark-bg dark:text-white">
                    </div>
                    <div class="flex gap-3 pt-4">
                        <button type="button" onclick="document.getElementById('editProfileModal').remove()" class="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg font-medium">Cancel</button>
                        <button type="submit" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.openChangePasswordModal = function () {
    const modalHtml = `
        <div id="changePasswordModal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-sm">
            <div class="relative p-6 border dark:border-dark-border w-full max-w-md shadow-2xl rounded-2xl bg-white dark:bg-dark-card animate-fade-in-up m-4">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-orange-800 dark:text-orange-400 flex items-center gap-2">
                        <i class="bi bi-shield-lock text-orange-600"></i>
                        Change Password
                    </h3>
                    <button onclick="document.getElementById('changePasswordModal').remove()" class="text-gray-400 dark:text-dark-muted hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg p-2 transition">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <form onsubmit="savePasswordChange(event)" class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">Current Password</label>
                        <input type="password" id="current_pass" required class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg dark:bg-dark-bg dark:text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">New Password</label>
                        <input type="password" id="new_pass" required class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg dark:bg-dark-bg dark:text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">Confirm New Password</label>
                        <input type="password" id="confirm_pass" required class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg dark:bg-dark-bg dark:text-white">
                    </div>
                    <div class="flex gap-3 pt-4">
                        <button type="button" onclick="document.getElementById('changePasswordModal').remove()" class="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg font-medium">Cancel</button>
                        <button type="submit" class="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium">Update Password</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.saveProfileEdit = function (event) {
    if (event) event.preventDefault();
    const name = document.getElementById('edit_name').value;
    const email = document.getElementById('edit_email').value;

    // Instead of saving directly, open verification modal
    openVerifyPasswordModal(name, email);
};

window.openVerifyPasswordModal = function (newName, newEmail) {
    const modalHtml = `
        <div id="verifyPasswordModal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[60] backdrop-blur-sm">
            <div class="relative p-6 border dark:border-dark-border w-full max-w-sm shadow-2xl rounded-2xl bg-white dark:bg-dark-card animate-fade-in-up m-4">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
                        <i class="bi bi-shield-lock text-red-600"></i>
                        Verify Identity
                    </h3>
                    <button onclick="document.getElementById('verifyPasswordModal').remove()" class="text-gray-400 dark:text-dark-muted hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg p-2 transition">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <div class="mb-4">
                    <p class="text-sm text-gray-600 dark:text-dark-muted">Please enter your current password to confirm profile changes.</p>
                </div>
                <div class="space-y-4">
                    <div>
                        <input type="password" id="verify_pass" placeholder="Current Password" required class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg dark:bg-dark-bg dark:text-white focus:ring-2 focus:ring-red-500 outline-none">
                    </div>
                    <div class="flex gap-3 pt-2">
                        <button type="button" onclick="document.getElementById('verifyPasswordModal').remove()" class="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg font-medium">Cancel</button>
                        <button onclick="confirmProfileUpdate('${newName.replace(/'/g, "\\'")}', '${newEmail.replace(/'/g, "\\'")}')" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-lg shadow-red-500/30 transition-all">Confirm</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const passInput = document.getElementById('verify_pass');
    passInput.focus();

    // Allow pressing Enter to submit
    passInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmProfileUpdate(newName, newEmail);
        }
    });
};

window.confirmProfileUpdate = async function (name, email) {
    const password = document.getElementById('verify_pass').value;
    if (!password) {
        showNotification('Password is required', 'error');
        return;
    }

    try {
        const response = await fetch('../api/api_users.php?action=update_profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, current_pass: password })
        });
        const result = await response.json();

        if (result.success) {
            showNotification('Profile updated successfully', 'success');
            document.getElementById('verifyPasswordModal')?.remove();
            document.getElementById('editProfileModal')?.remove();

            // Update local storage to reflect changes immediately
            const user = getCurrentUser();
            if (user) {
                user.name = name;
                user.email = email;
                localStorage.setItem('currentUser', JSON.stringify(user));
            }

            // Sync session storage
            if (sessionStorage.getItem('currentUser')) {
                sessionStorage.setItem('currentUser', JSON.stringify(user));
            }

            // Re-render
            if (typeof renderProfile === 'function') renderProfile();
        } else {
            showNotification(result.message || 'Update failed', 'error');
        }
    } catch (e) {
        console.error('Error updating profile:', e);
        showNotification('An error occurred', 'error');
    }
};

window.savePasswordChange = async function (event) {
    if (event) event.preventDefault();
    const currentPass = document.getElementById('current_pass').value;
    const newPass = document.getElementById('new_pass').value;
    const confirmPass = document.getElementById('confirm_pass').value;

    if (newPass !== confirmPass) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    try {
        const response = await fetch('../api/api_users.php?action=change_password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_pass: currentPass, new_pass: newPass })
        });
        const result = await response.json();
        if (result.success) {
            showNotification('Password updated successfully', 'success');
            document.getElementById('changePasswordModal').remove();
        } else {
            showNotification(result.message || 'Update failed', 'error');
        }
    } catch (e) {
        console.error('Error changing password:', e);
        showNotification('An error occurred', 'error');
    }
};

console.log('Reports & Analytics and Profile modules enhanced');

// ============================================
// ALL NOTIFICATIONS VIEW - CENTERED LAYOUT
// ============================================

window.renderAllNotifications = async function () {
    console.log('Rendering All Notifications Centered View...');

    // 1. Update Navbar to show Back Arrow + Notification
    const pageTitle = document.getElementById('page-title');
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    const breadcrumbHome = document.getElementById('breadcrumb-home');

    if (pageTitle) {
        pageTitle.innerHTML = `
            <div class="flex items-center gap-4">
                <button onclick="showSection('dashboard')" class="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-dark-muted hover:text-red-600 dark:hover:text-red-400 transition-all">
                    <i class="bi bi-arrow-left text-xl"></i>
                </button>
                <span class="text-gray-900 dark:text-white">Notification</span>
            </div>
        `;
    }

    if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'Notifications';

    try {
        const response = await fetch('../api/api_reminders.php?view=notifications');
        const data = await response.json();

        if (!data.success) {
            document.getElementById('content-area').innerHTML = `
                <div class="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-dark-muted">
                    <i class="bi bi-exclamation-triangle text-5xl mb-4 opacity-20"></i>
                    <p>Failed to load notifications</p>
                </div>
            `;
            return;
        }

        let reminders = data.reminders || [];
        reminders.sort((a, b) => new Date(b.reminder_date) - new Date(a.reminder_date));

        const unreadCount = reminders.filter(r => !r.is_read || r.is_read == 0).length;

        // 2. Render Centered Layout
        const html = `
            <div class="max-w-3xl mx-auto py-8 px-4 animate-fade-in-up">
                <!-- Centered Container -->
                <div class="bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-gray-100 dark:border-dark-border overflow-hidden">
                    <!-- Header inside the box -->
                    <div class="p-6 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-gray-50/30 dark:bg-dark-bg/20">
                        <div>
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white">All Notifications</h3>
                            <p class="text-sm text-gray-500 dark:text-dark-muted">You have ${unreadCount} unread notifications</p>
                        </div>
                        <div class="flex gap-3 items-center">
                            <button onclick="clearAllNotificationsFull()" class="text-xs font-semibold text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-gray-200 transition">
                                Clear all
                            </button>
                            <button onclick="markAllAsRead()" class="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 transition">
                                Mark all as read
                            </button>
                        </div>
                    </div>

                    <!-- Tabs/Filters -->
                    <div class="flex border-b border-gray-100 dark:border-dark-border">
                        <button onclick="filterAllNotifications('all')" id="tab-all" class="flex-1 py-3 text-sm font-bold text-red-600 border-b-2 border-red-600">All</button>
                        <button onclick="filterAllNotifications('unread')" id="tab-unread" class="flex-1 py-3 text-sm font-medium text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-gray-200 transition">Unread</button>
                    </div>

                    <!-- List container -->
                    <div id="all-notifications-list" class="divide-y divide-gray-100 dark:divide-dark-border min-h-[400px]">
                        ${reminders.length > 0 ? reminders.map(r => {
            const isUnread = !r.is_read || r.is_read == 0;
            const timeAgo = r.reminder_date ? window.getTimeAgoFinal(r.reminder_date) : 'Recently';
            const idParam = typeof r.reminder_id === 'string' ? `'${r.reminder_id}'` : r.reminder_id;

            let iconColor = 'red';
            if (r.related_type === 'Session') iconColor = 'blue';
            if (r.related_type === 'Agenda') iconColor = 'purple';

            return `
                                <div onclick="handleNotificationClick(${idParam}, this)" class="p-5 hover:bg-gray-50 dark:hover:bg-dark-bg/50 cursor-pointer transition-all group flex gap-4 ${isUnread ? 'bg-red-50/30 dark:bg-red-900/10' : ''}">
                                    <div class="w-12 h-12 rounded-xl bg-${iconColor}-100 dark:bg-${iconColor}-900/30 text-${iconColor}-600 dark:text-${iconColor}-400 flex items-center justify-center flex-shrink-0 shadow-sm border border-${iconColor}-200 dark:border-${iconColor}-900/30 group-hover:scale-110 transition-transform">
                                        <i class="bi ${r.related_type === 'Session' ? 'bi-calendar-event' : 'bi-bell'} text-xl"></i>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex justify-between items-start mb-1">
                                            <h4 class="text-sm ${isUnread ? 'font-black' : 'font-bold'} text-gray-900 dark:text-white truncate">${r.title}</h4>
                                            <span class="text-[10px] text-gray-400 dark:text-dark-muted whitespace-nowrap ml-2">${timeAgo}</span>
                                        </div>
                                        <p class="text-sm text-gray-500 dark:text-dark-muted line-clamp-2 leading-relaxed">
                                            ${r.message || 'View details for more information.'}
                                        </p>
                                        ${isUnread ? `
                                        <div class="mt-2 flex items-center gap-1">
                                            <span class="w-2 h-2 bg-red-600 rounded-full"></span>
                                            <span class="text-[10px] font-bold text-red-600 uppercase tracking-widest">New</span>
                                        </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
        }).join('') : `
                            <div class="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-dark-muted italic">
                                <i class="bi bi-bell-slash text-5xl mb-3 opacity-20"></i>
                                <p>No notifications to show</p>
                            </div>
                        `}
                    </div>
                    
                    <!-- Footer -->
                    <div class="p-4 bg-gray-50/50 dark:bg-dark-bg/50 text-center border-t border-gray-100 dark:border-dark-border">
                         <p class="text-[10px] text-gray-400 dark:text-dark-muted uppercase font-bold tracking-widest">End of Notifications</p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('content-area').innerHTML = html;
        window.cachedFullNotifications = reminders;

    } catch (e) {
        console.error('Error rendering all notifications:', e);
    }
};

// Handle notification click (Mark as read + Show Detail)
window.handleNotificationClick = async function (id, element) {
    const reminder = window.cachedFullNotifications.find(r => r.reminder_id == id);
    if (!reminder) return;

    if (!reminder.is_read || reminder.is_read == 0) {
        // Mark as read SILENTLY to prevent redirection to standard dashboard
        await window.markReminderAsRead(id, true);
        reminder.is_read = 1;

        // Update UI state in current centered view
        if (element) {
            element.classList.remove('bg-red-50/30', 'dark:bg-red-900/10');
            const unreadBadge = element.querySelector('.mt-2.flex.items-center.gap-1');
            if (unreadBadge) unreadBadge.remove();

            const title = element.querySelector('h4');
            if (title) {
                title.classList.remove('font-black');
                title.classList.add('font-bold');
            }
        }

        // Refresh unread count label
        const unreadLabel = document.querySelector('.max-w-3xl p.text-sm');
        if (unreadLabel) {
            const currentTotal = window.cachedFullNotifications.filter(r => !r.is_read || r.is_read == 0).length;
            unreadLabel.textContent = `You have ${currentTotal} unread notifications`;
        }
    }

    // Reuse the detail modal logic
    if (typeof openReminderDetailModal === 'function') {
        openReminderDetailModal(reminder);
    }
};

// Filter logic
window.filterAllNotifications = function (type) {
    const list = document.getElementById('all-notifications-list');
    const tabAll = document.getElementById('tab-all');
    const tabUnread = document.getElementById('tab-unread');

    // Update tabs styling
    if (type === 'all') {
        tabAll.classList.add('text-red-600', 'border-red-600', 'border-b-2');
        tabAll.classList.remove('text-gray-500', 'font-medium');
        tabAll.classList.add('font-bold');

        tabUnread.classList.remove('text-red-600', 'border-red-600', 'border-b-2', 'font-bold');
        tabUnread.classList.add('text-gray-500', 'font-medium');
    } else {
        tabUnread.classList.add('text-red-600', 'border-red-600', 'border-b-2');
        tabUnread.classList.remove('text-gray-500', 'font-medium');
        tabUnread.classList.add('font-bold');

        tabAll.classList.remove('text-red-600', 'border-red-600', 'border-b-2', 'font-bold');
        tabAll.classList.add('text-gray-500', 'font-medium');
    }

    let filtered = window.cachedFullNotifications;
    if (type === 'unread') {
        filtered = filtered.filter(r => !r.is_read || r.is_read == 0);
    }

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-dark-muted italic">
                <i class="bi bi-check2-circle text-5xl mb-3 opacity-20"></i>
                <p>No ${type === 'unread' ? 'unread ' : ''}notifications</p>
            </div>
        `;
        return;
    }

    list.innerHTML = filtered.map(r => {
        const isUnread = !r.is_read || r.is_read == 0;
        const timeAgo = r.reminder_date ? window.getTimeAgoFinal(r.reminder_date) : 'Recently';
        const idParam = typeof r.reminder_id === 'string' ? `'${r.reminder_id}'` : r.reminder_id;

        // Icon color mapping for notifications list:
        // - Default red for all notifications
        // - Agendas purple for quick visual distinction
        // (Sessions are also red for consistency with the Reminders design)
        let iconColor = 'red';
        if (r.related_type === 'Agenda') iconColor = 'purple';

        return `
            <div onclick="handleNotificationClick(${idParam}, this)" class="p-5 hover:bg-gray-50 dark:hover:bg-dark-bg/50 cursor-pointer transition-all group flex gap-4 ${isUnread ? 'bg-red-50/30 dark:bg-red-900/10' : ''}">
                <div class="w-12 h-12 rounded-xl bg-${iconColor}-100 dark:bg-${iconColor}-900/30 text-${iconColor}-600 dark:text-${iconColor}-400 flex items-center justify-center flex-shrink-0 shadow-sm border border-${iconColor}-200 dark:border-${iconColor}-900/30 group-hover:scale-110 transition-transform">
                    <i class="bi ${r.related_type === 'Session' ? 'bi-calendar-event' : 'bi-bell'} text-xl"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start mb-1">
                        <h4 class="text-sm ${isUnread ? 'font-black' : 'font-bold'} text-gray-900 dark:text-white truncate">${r.title}</h4>
                        <span class="text-[10px] text-gray-400 dark:text-dark-muted whitespace-nowrap ml-2">${timeAgo}</span>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-dark-muted line-clamp-2 leading-relaxed">
                        ${r.message || 'View details for more information.'}
                    </p>
                    ${isUnread ? `
                    <div class="mt-2 flex items-center gap-1">
                        <span class="w-2 h-2 bg-red-600 rounded-full"></span>
                        <span class="text-[10px] font-bold text-red-600 uppercase tracking-widest">New</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
};

window.markAllAsRead = async function () {
    const unread = window.cachedFullNotifications.filter(r => !r.is_read || r.is_read == 0);
    if (unread.length === 0) return;

    try {
        await Promise.all(unread.map(r => window.markReminderAsRead(r.reminder_id, true)));
        showNotification('All notifications marked as read', 'success');
        renderAllNotifications(); // Refresh full view once finished
    } catch (e) {
        console.error('Error marking all as read:', e);
    }
};

// Clear all notifications for the current user (used by bell dropdown and full notifications page)
window.clearAllNotificationsFull = async function (refreshFullPage = true) {
    try {
        // Ask API to clear reminder_recipients for the current user only
        await fetch('../api/api_reminders.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'clear_all_recipients' })
        });

        // Refresh dropdown and full view
        if (typeof window.populateNotifications === 'function') {
            await window.populateNotifications();
        }
        if (refreshFullPage && typeof window.renderAllNotifications === 'function') {
            await window.renderAllNotifications();
        }

        if (typeof showNotification === 'function') {
            showNotification('All notifications cleared', 'success');
        }
    } catch (e) {
        console.error('Error clearing notifications:', e);
        if (typeof showNotification === 'function') {
            showNotification('Error clearing notifications', 'error');
        }
    }
};

// Variant used by the bell dropdown: clear notifications but stay on current page
window.clearAllNotificationsFromBell = async function () {
    await window.clearAllNotificationsFull(false);
};

window.getTimeAgoFinal = function (dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    return date.toLocaleDateString();
};

