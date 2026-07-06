// Deadlines Module for LACS
// Contains the enhanced deadlines functionality
// Intended to be loaded after main-features.js

// ==============================
// DEADLINES MODULE - ENHANCED VERSION
// ==============================

/**
 * Handle specific actions for deadlines based on their source and title
 */
window.handleDeadlineAction = function (id, source, title) {
    if (source === 'Session Requirement') {
        if (title === 'Assign Venue' || title === 'Set Session Time') {
            if (typeof window.editSession === 'function') {
                window.editSession(id);
                return;
            }
        } else if (title === 'Create Agenda') {
            if (typeof window.openCreateAgendaModal === 'function') {
                window.openCreateAgendaModal(id);
                return;
            }
        } else if (title === 'Add Agenda Items') {
            if (typeof window.viewSessionAgenda === 'function') {
                window.viewSessionAgenda(id);
                return;
            }
        } else if (title === 'Upload Documents') {
            if (typeof window.uploadSessionAttachments === 'function') {
                window.uploadSessionAttachments(id);
                return;
            }
        }
    }

    // Default fallback: Go to session details
    if (source === 'Legislative Session' || source === 'Session Requirement') {
        if (typeof showSection === 'function') {
            showSection('sessions').then(() => {
                if (window.viewSessionDetails) {
                    window.viewSessionDetails(id);
                }
            });
        }
    } else if (source && source.includes('Agenda Item')) {
        if (typeof showSection === 'function') {
            showSection('agendas');
        }
    }
};

window.renderDeadlinesEnhanced = async function () {
    try {
        const response = await fetch('../api/api_deadlines.php');
        const data = await response.json();

        if (!data.success) {
            showNotification('Failed to load deadlines: ' + data.message, 'error');
            return;
        }

        const deadlines = data.deadlines || [];

        // Cache for later use
        window.cachedDeadlines = deadlines;

        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = deadlines.filter(d => {
            const dueDate = new Date(d.due_date);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate >= today && d.status !== 'Completed';
        }).length;

        const overdue = deadlines.filter(d => {
            const dueDate = new Date(d.due_date);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate < today && d.status !== 'Completed';
        }).length;

        const completed = deadlines.filter(d => d.status === 'Completed').length;

        const html = `
        <div class="space-y-6 animate-fade-in-up">
            <!-- Premium Header - Red -->
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-8 shadow-xl">
                <div class="absolute inset-0 bg-black opacity-10"></div>
                <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                <div class="relative z-10">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div class="text-white">
                            <h1 class="text-3xl font-bold mb-2">Deadline Tracking</h1>
                            <p class="text-red-100 text-sm">Monitor and manage all deadlines</p>
                        </div>
                        <div class="flex gap-2">
                            <!-- Read Only View -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Grid - Aligned with Sessions Dashboard -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <!-- Total Deadlines -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center text-xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                            <i class="bi bi-list-task"></i>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-3xl font-black text-red-900 dark:text-white tracking-tight mb-1">${deadlines.length}</h3>
                        <p class="text-sm text-red-900/60 dark:text-red-400 font-bold uppercase tracking-wider">Total Deadlines</p>
                    </div>
                </div>

                <!-- Overdue -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center text-xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            <i class="bi bi-exclamation-triangle"></i>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-3xl font-black text-gray-800 dark:text-white tracking-tight mb-1">${overdue}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Overdue Tasks</p>
                    </div>
                </div>

                <!-- Upcoming -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <i class="bi bi-clock-history"></i>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-3xl font-black text-gray-800 dark:text-white tracking-tight mb-1">${upcoming}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Upcoming</p>
                    </div>
                </div>

                <!-- Completed -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center text-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <i class="bi bi-check-circle"></i>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-3xl font-black text-gray-800 dark:text-white tracking-tight mb-1">${completed}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Completed</p>
                    </div>
                </div>
            </div>

            <!-- Filter Bar -->
            <div class="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark-border p-4 transition-colors duration-300">
                <div class="flex flex-col md:flex-row gap-4 items-center">
                    <div class="flex-1">
                        <select id="statusFilter" onchange="filterDeadlinesByStatus(this.value)" class="w-full px-4 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-colors">
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                    <div class="flex-1">
                        <select id="priorityFilter" onchange="filterDeadlinesByPriority(this.value)" class="w-full px-4 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-colors">
                            <option value="">All Priorities</option>
                            <option value="High">High Priority</option>
                            <option value="Medium">Medium Priority</option>
                            <option value="Low">Low Priority</option>
                        </select>
                    </div>
                    <div class="flex-1">
                        <input type="text" id="deadlineSearch" oninput="searchDeadlines(this.value)" placeholder="Search deadlines..." class="w-full px-4 py-2 border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-colors">
                    </div>
                </div>
            </div>

            <!-- Deadlines List -->
    <div class="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden transition-colors duration-300">
        <div class="bg-gradient-to-r from-gray-50 to-white dark:from-dark-bg/50 dark:to-dark-card px-6 py-4 border-b border-gray-200 dark:border-dark-border">
            <h3 class="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <i class="bi bi-list-ul text-red-600"></i>
                All Deadlines
            </h3>
        </div>
        ${deadlines.length > 0 ? `
                <div id="deadlinesList" class="divide-y divide-gray-100 dark:divide-dark-border">
                    ${deadlines.map(d => {
            const dueDate = new Date(d.due_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDateOnly = new Date(dueDate);
            dueDateOnly.setHours(0, 0, 0, 0);
            const isOverdue = dueDateOnly < today && d.status !== 'Completed';
            const daysUntil = Math.ceil((dueDateOnly - today) / (1000 * 60 * 60 * 24));

            // Priority styling
            let priorityClasses = '';
            if (d.priority === 'High') {
                priorityClasses = 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30';
            } else if (d.priority === 'Medium') {
                priorityClasses = 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/30';
            } else {
                priorityClasses = 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30';
            }

            // Status styling
            let statusClasses = '';
            if (d.status === 'Completed' || d.status === 'Approved') {
                statusClasses = 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
            } else if (d.status === 'In Progress') {
                statusClasses = 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            } else if (d.status === 'Revision Needed') {
                statusClasses = 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
            } else if (d.status === 'Deferred') {
                statusClasses = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
            } else {
                statusClasses = 'bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-dark-muted border-gray-200 dark:border-dark-border';
            }

            // Icon background
            let iconBg = '';
            if (d.priority === 'High') {
                iconBg = 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30';
            } else if (d.priority === 'Medium') {
                iconBg = 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/30';
            } else {
                iconBg = 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30';
            }

            return `
                        <div class="deadline-item p-6 hover:bg-gray-50 dark:hover:bg-dark-bg transition-all group" data-status="${d.status}" data-priority="${d.priority}">
                            <div class="flex items-start gap-4">
                                <div class="w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 shadow-sm border">
                                    <i class="bi ${d.source === 'Session Requirement' ? 'bi-exclamation-triangle-fill' : 'bi-calendar-event'} text-xl"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-start justify-between mb-2">
                                        <div class="flex-1">
                                            <h4 class="font-bold text-gray-900 dark:text-white text-lg mb-1">${d.title}</h4>
                                            ${d.description ? `<p class="text-sm text-gray-600 dark:text-dark-muted mb-2">${d.description}</p>` : ''}
                                        </div>
                                         <div class="flex items-center gap-2 ml-4">
                                            <span class="text-xs px-2 py-1 bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-dark-muted rounded-lg border border-gray-200 dark:border-dark-border">
                                                ${d.source || 'Task'}
                                            </span>
                                            ${d.source === 'Legislative Session' || d.source === 'Session Requirement' ? `
                                            <button onclick="window.handleDeadlineAction(${d.id}, '${d.source}', '${d.title.replace(/'/g, "\\'")}')" class="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" title="Go to Action">
                                                <i class="bi bi-arrow-right-circle"></i>
                                            </button>
                                            ` : d.source.includes('Agenda Item') ? `
                                            <button onclick="showSection('agendas')" class="p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition" title="View Agendas">
                                                <i class="bi bi-eye"></i>
                                            </button>
                                            ` : ''}
                                            <button onclick="viewDeadlineLogs(${d.id}, '${d.source || 'Task'}', this.getAttribute('data-title'))" data-title="${d.title}" class="p-2 text-gray-500 dark:text-dark-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-card rounded-lg transition" title="View Logs">
                                                <i class="bi bi-clock-history"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-3 flex-wrap">
                                        <span class="px-2 py-1 ${statusClasses} rounded-full text-xs font-medium border">
                                            ${d.status}
                                        </span>
                                        <span class="px-2 py-1 ${priorityClasses} rounded-full text-xs font-medium border">
                                            ${d.priority} Priority
                                        </span>
                                        <span class="flex items-center gap-1 text-sm ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-600 dark:text-dark-muted'}">
                                            <i class="bi bi-calendar3"></i>
                                            ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            ${isOverdue ? ' (Overdue)' : daysUntil === 0 ? ' (Today)' : daysUntil === 1 ? ' (Tomorrow)' : daysUntil > 0 ? ` (${daysUntil} days)` : ''}
                                        </span>
                                        ${d.assigned_to ? `
                                        <span class="flex items-center gap-1 text-sm text-gray-600 dark:text-dark-text">
                                            <i class="bi bi-person"></i>
                                            ${d.assigned_to}
                                        </span>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                        `;
        }).join('')}
                </div>
                ` : `
                <div class="p-12 text-center">
                    <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-dark-bg flex items-center justify-center mx-auto mb-4 border border-gray-200 dark:border-dark-border">
                        <i class="bi bi-calendar-x text-4xl text-gray-400 dark:text-dark-muted"></i>
                    </div>
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2">No Deadlines Yet</h3>
                    <p class="text-gray-500 dark:text-dark-muted mb-4 transition-colors">Create your first deadline to start tracking</p>
                    <button onclick="showSection('agendas')" class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition inline-flex items-center gap-2">
                        <i class="bi bi-journal-text"></i> Go to Agendas
                    </button>
                </div>
                `}
    </div>
        </div>
    `;
        document.getElementById('content-area').innerHTML = html;
    } catch (e) {
        console.error('Error loading deadlines:', e);
        showNotification('Error loading deadlines', 'error');
    }
};

// Function to automate deadline creation from Agenda Item
window.automateDeadlineCreation = async function (agendaItemData) {
    if (!agendaItemData || !agendaItemData.due_date) return;

    try {
        console.log('Automating deadline creation...', agendaItemData);
        const response = await fetch('../api/api_automate_deadlines.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(agendaItemData)
        });
        const result = await response.json();
        if (result.success) {
            console.log('Deadline created automatically:', result.deadline_id);
            showNotification('task successfully', 'success');
            // Refresh deadlines if visible
            if (document.getElementById('deadlinesList')) {
                renderDeadlines();
            }
        } else {
            console.error('Failed to create automated deadline:', result.message);
        }
    } catch (e) {
        console.error('Error in deadline automation:', e);
    }
};

// Override original renderDeadlines
window.renderDeadlines = window.renderDeadlinesEnhanced;
window.renderAdminDeadlines = window.renderDeadlinesEnhanced;
window.renderMyDeadlines = window.renderDeadlinesEnhanced;

console.log('Deadline Tracking color coding fixed');

// ============================================
// FINAL PREMIUM UI OVERRIDES - REMINDERS & AUDIT LOGS
// ============================================

window.renderRemindersEnhancedPremium = async function () {
    try {
        const response = await fetch('../api/api_reminders.php');
        const data = await response.json();

        if (!data.success) {
            showNotification('Failed to load reminders: ' + data.message, 'error');
            return;
        }

        const reminders = data.reminders || [];
        const upcoming = reminders.filter(r => new Date(r.reminder_date) > new Date()).length;
        const sent = reminders.filter(r => new Date(r.reminder_date) <= new Date()).length;

        const html = `
        <div class="space-y-6 animate-fade-in-up">
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-8 shadow-xl mb-6">
                <div class="absolute inset-0 bg-black opacity-10"></div>
                <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                <div class="relative z-10 text-white">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 class="text-3xl font-bold mb-2">Reminders & Notifications</h1>
                            <p class="text-red-100 dark:text-red-200 text-sm opacity-90 tracking-wide">Stay on track with your legislative tasks</p>
                        </div>
                        <button onclick="openCreateReminderModal()" class="px-6 py-3 bg-white dark:bg-dark-bg text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-dark-card text-sm font-bold flex items-center gap-2 shadow-lg transition-all transform hover:-translate-y-1">
                            <i class="bi bi-bell-plus-fill"></i> New Reminder
                        </button>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border flex items-center gap-4 transition-colors">
                    <div class="w-12 h-12 bg-white dark:bg-dark-bg rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 border border-gray-200 dark:border-dark-border font-bold">
                        <i class="bi bi-collection text-xl"></i>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 dark:text-dark-muted uppercase font-bold tracking-wider">Total</p>
                        <h3 class="text-2xl font-black text-gray-900 dark:text-white">${reminders.length}</h3>
                    </div>
                </div>
                <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border flex items-center gap-4 transition-colors">
                    <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                        <i class="bi bi-clock-history text-xl"></i>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 dark:text-dark-muted uppercase font-bold tracking-wider">Upcoming</p>
                        <h3 class="text-2xl font-black text-gray-900 dark:text-white">${upcoming}</h3>
                    </div>
                </div>
                <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border flex items-center gap-4 transition-colors">
                    <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 font-bold">
                        <i class="bi bi-send-check text-xl"></i>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 dark:text-dark-muted uppercase font-bold tracking-wider">Sent</p>
                        <h3 class="text-2xl font-black text-gray-900 dark:text-white">${sent}</h3>
                    </div>
                </div>
            </div>

            <div class="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden transition-colors">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 dark:bg-dark-bg text-[10px] uppercase text-gray-500 dark:text-dark-muted font-black tracking-widest">
                        <tr>
                            <th class="p-4 pl-6">Reminder Details</th>
                            <th class="p-4">Schedule</th>
                            <th class="p-4 pr-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-dark-border text-sm italic-details">
                        ${reminders.length > 0 ? reminders.map(r => `
                        <tr class="hover:bg-red-50/20 dark:hover:bg-red-900/10 transition-all group">
                            <td class="p-4 pl-6">
                                <div class="font-bold text-gray-900 dark:text-white mb-0.5">${r.title}</div>
                                <div class="text-xs text-gray-500 dark:text-dark-muted truncate max-w-md">${r.message || 'No additional message'}</div>
                            </td>
                            <td class="p-4">
                                <div class="flex items-center gap-2 text-gray-700 dark:text-dark-text font-medium whitespace-nowrap">
                                    <i class="bi bi-calendar3 text-red-500 dark:text-red-400"></i>
                                    ${new Date(r.reminder_date).toLocaleString()}
                                </div>
                            </td>
                            <td class="p-4 pr-6 text-right">
                                <button onclick="deleteReminder(${r.reminder_id})" class="p-2 text-gray-400 dark:text-dark-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-dark-bg rounded-lg transition-all">
                                    <i class="bi bi-trash-fill"></i>
                                </button>
                            </td>
                        </tr>
                        `).join('') : `
                        <tr>
                            <td colspan="3" class="p-16 text-center text-gray-400 dark:text-dark-muted">
                                <i class="bi bi-bell-slash text-4xl mb-3 opacity-20 block"></i>
                                <span class="font-medium">No active reminders</span>
                            </td>
                        </tr>
                        `}
                    </tbody>
                </table>
            </div>
        </div>
    `;
        document.getElementById('content-area').innerHTML = html;
    } catch (e) {
        showNotification('Error loading reminders', 'error');
    }
};

window.renderAuditLogsEnhancedPremium = async function () {
    try {
        const response = await fetch('../api/api_logs.php');
        const data = await response.json();

        if (!data.success) {
            showNotification('Failed to load audit logs', 'error');
            return;
        }

        const logs = data.logs || [];
        const criticalCount = logs.filter(l => l.severity === 'Critical' || (l.action && (l.action.toLowerCase().includes('delete') || l.action.toLowerCase().includes('fail')))).length;

        const html = `
        <div class="space-y-6 animate-fade-in-up pb-10">
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-8 shadow-xl mb-6">
                <div class="absolute inset-0 bg-black opacity-10"></div>
                <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                <div class="relative z-10 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 class="text-3xl font-bold mb-2">System Audit Logs</h1>
                        <p class="text-red-100 text-sm opacity-90 tracking-wide">Monitor administrative activities and security events</p>
                    </div>
                    <button onclick="renderAuditLogs()" class="px-5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-bold transition-all">
                        <i class="bi bi-arrow-clockwise mr-2"></i> Refresh Data
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border flex items-center justify-between transition-colors">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400">
                            <i class="bi bi-shield-check text-2xl"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 dark:text-dark-muted uppercase font-black tracking-widest">Logged Activities</p>
                            <h3 class="text-3xl font-black text-gray-900 dark:text-white">${logs.length}</h3>
                        </div>
                    </div>
                </div>
                <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border flex items-center justify-between transition-colors">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <i class="bi bi-exclamation-octagon text-2xl"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 dark:text-dark-muted uppercase font-black tracking-widest">Critical Events</p>
                            <h3 class="text-3xl font-black text-gray-900 dark:text-white">${criticalCount}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border flex flex-wrap gap-4 transition-colors">
                <div class="relative flex-1">
                    <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-muted"></i>
                    <input type="text" id="logSearch" onkeyup="filterAuditLogs()" placeholder="Search activities..." 
                        class="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-dark-bg border-0 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm text-gray-800 dark:text-white">
                </div>
            </div>

            <div class="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden transition-colors">
                <table class="w-full text-left" id="auditLogsTable">
                    <thead class="bg-gray-50 dark:bg-dark-bg text-[10px] uppercase text-gray-500 dark:text-dark-muted font-black tracking-widest">
                        <tr>
                            <th class="p-4 pl-6">Actor</th>
                            <th class="p-4">Action Event</th>
                            <th class="p-4">Timestamp</th>
                            <th class="p-4 pr-6 text-right">Severity</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-dark-border text-sm">
                        ${logs.length > 0 ? logs.map(l => {
            const date = new Date(l.created_at);
            const isCritical = (l.action && (l.action.toLowerCase().includes('delete') || l.action.toLowerCase().includes('fail')));
            return `
                            <tr class="hover:bg-gray-50/50 dark:hover:bg-dark-bg/50 transition-all log-row group" data-search="${l.user_name} ${l.action} ${l.description}">
                                <td class="p-4 pl-6">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-bg flex items-center justify-center text-gray-600 dark:text-white font-bold group-hover:bg-red-100 dark:group-hover:bg-red-900/30 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                            ${(l.user_name || 'S').charAt(0)}
                                        </div>
                                        <span class="font-bold text-gray-900 dark:text-white">${l.user_name || 'System'}</span>
                                    </div>
                                </td>
                                <td class="p-4">
                                    <div class="font-medium text-gray-700 dark:text-dark-text">${l.action}</div>
                                    <div class="text-xs text-gray-500 dark:text-dark-muted max-w-xs truncate" title="${l.description}">${l.description || '-'}</div>
                                </td>
                                <td class="p-4 text-gray-500 dark:text-dark-muted text-xs">
                                    ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
                                </td>
                                <td class="p-4 pr-6 text-right">
                                    <span class="px-2 py-1 rounded-md text-[10px] font-black uppercase ${isCritical ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-dark-muted'}">
                                        ${isCritical ? 'CRITICAL' : 'INFO'}
                                    </span>
                                </td>
                            </tr>
                            `;
        }).join('') : `
                        <tr><td colspan="4" class="p-16 text-center text-gray-400 dark:text-dark-muted italic">No system logs recorded</td></tr>
                        `}
                    </tbody>
                </table>
            </div>
        </div>
    `;
        document.getElementById('content-area').innerHTML = html;
    } catch (e) {
        showNotification('Error loading audit logs', 'error');
    }
};

function filterAuditLogs() {
    const search = document.getElementById('logSearch').value.toLowerCase();
    const rows = document.querySelectorAll('.log-row');
    rows.forEach(row => {
        const text = row.getAttribute('data-search').toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
}

// Global Overrides
window.renderReminders = window.renderRemindersEnhancedPremium;
window.renderAdminReminders = window.renderRemindersEnhancedPremium;
window.renderStaffReminders = window.renderRemindersEnhancedPremium;

window.renderAuditLogs = window.renderAuditLogsEnhancedPremium;
window.renderAdminAuditLogs = window.renderAuditLogsEnhancedPremium;

console.log('Premium UI Overrides for Reminders and Audit Logs active.');

// ============================================
// FORCED OVERRIDES FOR DEADLINES AND REMINDERS (STAFF ASSIGNMENT FIX)
// ============================================

// CRUD Functions Removed for Read-Only Mode
window.openCreateDeadlineModal = function () {
    showNotification('Deadlines are now managed through Agenda Items.', 'info');
};

/**
 * View logs for a specific deadline/item
 */
window.viewDeadlineLogs = async function (id, type, title) {
    if (!id) return;

    // Determine entity type for the API
    let entityType = 'Deadline';
    const sessionSources = ['Legislative Session', 'Session', 'Upcoming', 'Session Requirement'];

    if (sessionSources.includes(type)) {
        entityType = 'Session';
    } else if (type && type.includes('Agenda Item')) {
        entityType = 'AgendaItem';
    }

    try {
        const modalHtml = `
            <div id="logsModal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
                <div class="relative p-0 border dark:border-dark-border w-full max-w-2xl shadow-2xl rounded-2xl bg-white dark:bg-dark-card m-4 flex flex-col max-h-[85vh]">
                    <div class="p-6 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-gradient-to-r from-red-50 to-white dark:from-dark-bg/50 dark:to-dark-card rounded-t-2xl">
                        <div>
                            <h3 class="text-xl font-black text-red-800 dark:text-red-400 flex items-center gap-2 uppercase tracking-tight">
                                <i class="bi bi-clock-history text-red-600"></i>
                                Activity Logs
                            </h3>
                            <p class="text-[11px] text-gray-500 dark:text-red-300 mt-1 uppercase font-bold tracking-widest opacity-70">Item History: <span class="text-gray-800 dark:text-red-100 underline decoration-red-500/30 font-black">${title || (type + ' #' + id)}</span></p>
                        </div>
                        <button onclick="document.getElementById('logsModal').remove()" class="text-gray-400 dark:text-dark-muted hover:text-red-600 dark:hover:text-white hover:bg-red-50 dark:hover:bg-dark-bg p-2 rounded-lg transition-all shadow-sm">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                    
                    <div class="p-6 overflow-y-auto flex-1 custom-scrollbar bg-gray-50/30 dark:bg-dark-bg/20">
                        <div id="logsContent">
                            <div class="flex flex-col items-center justify-center py-12">
                                <div class="animate-spin rounded-full h-10 w-10 border-4 border-red-600 border-t-transparent shadow-md"></div>
                                <p class="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Fetching Logs...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('logsModal')?.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const response = await fetch(`../api/api_logs.php?entity_type=${entityType}&entity_id=${id}&limit=50`);
        const data = await response.json();

        const contentDiv = document.getElementById('logsContent');

        if (data.success && data.data && data.data.length > 0) {
            const logsHtml = `
                <div class="space-y-4">
                    ${data.data.map(log => {
                const date = new Date(log.created_at);

                // Enhanced UI logic for icons and colors (Consolidated from session-features)
                let icon = 'bi-circle-fill';
                let iconColor = 'text-gray-400';
                let bgColor = 'bg-white dark:bg-dark-card';
                let accentColor = 'border-gray-200';

                const action = log.action.toLowerCase();
                if (action.includes('create') || action.includes('add')) {
                    icon = 'bi-plus-circle-fill';
                    iconColor = 'text-emerald-500';
                    bgColor = 'bg-emerald-50/30 dark:bg-emerald-900/10';
                    accentColor = 'border-emerald-100 dark:border-emerald-900/30';
                } else if (action.includes('update') || action.includes('edit') || action.includes('save')) {
                    icon = 'bi-pencil-square';
                    iconColor = 'text-blue-500';
                    bgColor = 'bg-blue-50/30 dark:bg-blue-900/10';
                    accentColor = 'border-blue-100 dark:border-blue-900/30';
                } else if (action.includes('delete') || action.includes('remove')) {
                    icon = 'bi-trash3-fill';
                    iconColor = 'text-red-500';
                    bgColor = 'bg-red-50/30 dark:bg-red-900/10';
                    accentColor = 'border-red-100 dark:border-red-900/30';
                } else if (action.includes('status')) {
                    icon = 'bi-arrow-repeat';
                    iconColor = 'text-amber-500';
                    bgColor = 'bg-amber-50/30 dark:bg-amber-900/10';
                    accentColor = 'border-amber-100 dark:border-amber-900/30';
                } else if (action.includes('agenda')) {
                    icon = 'bi-journal-text';
                    iconColor = 'text-indigo-500';
                    bgColor = 'bg-indigo-50/30 dark:bg-indigo-900/10';
                    accentColor = 'border-indigo-100 dark:border-indigo-900/30';
                }

                return `
                        <div class="flex gap-4 p-4 rounded-2xl border ${accentColor} ${bgColor} hover:shadow-md transition-all duration-300 group">
                            <div class="flex-shrink-0">
                                <div class="w-10 h-10 rounded-xl bg-white dark:bg-dark-bg flex items-center justify-center ${iconColor} shadow-sm border border-gray-50 dark:border-dark-border group-hover:scale-110 transition-transform">
                                    <i class="bi ${icon} text-lg"></i>
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-start justify-between gap-4 mb-2">
                                    <h4 class="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight">${log.action}</h4>
                                    <span class="text-[10px] text-gray-400 dark:text-dark-muted font-bold whitespace-nowrap bg-gray-100 dark:bg-dark-bg px-2 py-0.5 rounded-full">
                                        ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <p class="text-xs text-gray-600 dark:text-dark-muted leading-relaxed mb-3">
                                    ${log.description}
                                </p>
                                <div class="flex items-center gap-3 pt-2 border-t border-gray-100/50 dark:border-dark-border/30">
                                    <div class="flex items-center gap-1.5">
                                        <div class="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[8px] font-bold">
                                            ${(log.user_name || 'S').charAt(0).toUpperCase()}
                                        </div>
                                        <span class="text-[10px] font-black text-gray-500 dark:text-dark-muted uppercase tracking-widest">${log.user_name || 'System'}</span>
                                    </div>
                                    <span class="text-gray-200 dark:text-dark-border">|</span>
                                    <span class="text-[9px] font-mono text-gray-400 tracking-tighter">${log.ip_address || '0.0.0.0'}</span>
                                </div>
                            </div>
                        </div>
                        `;
            }).join('')}
                </div>
            `;
            contentDiv.innerHTML = logsHtml;
        } else {
            contentDiv.innerHTML = `
                <div class="text-center py-16 bg-white dark:bg-dark-card rounded-3xl border border-dashed border-gray-200 dark:border-dark-border">
                    <div class="w-20 h-20 bg-gray-50 dark:bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="bi bi-clipboard-x text-gray-300 dark:text-dark-muted text-4xl"></i>
                    </div>
                    <h3 class="text-lg font-black text-gray-800 dark:text-white mb-2 uppercase tracking-tight">No History Found</h3>
                    <p class="text-gray-500 dark:text-dark-muted text-xs font-medium max-w-xs mx-auto">There are no recorded activities for this specific ${entityType.toLowerCase()} yet.</p>
                </div>
            `;
        }

    } catch (e) {
        console.error('Error fetching logs:', e);
        const contentDiv = document.getElementById('logsContent');
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div class="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-center text-sm border-2 border-red-100 dark:border-red-900/30 flex flex-col items-center gap-3">
                    <i class="bi bi-exclamation-octagon text-3xl"></i>
                    <div class="font-bold uppercase tracking-widest">Connectivity Error</div>
                    <p class="text-xs opacity-80">Failed to establish connection with the logging server. Please reload and try again.</p>
                </div>
            `;
        }
    }
};

window.openCreateReminderModal = function () {
    // Remove existing
    document.getElementById('createReminderModal')?.remove();

    const modalHtml = `
    <div id="createReminderModal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-sm">
        <div class="relative p-6 border dark:border-dark-border w-full max-w-lg shadow-2xl rounded-2xl bg-white dark:bg-dark-card animate-fade-in-up m-4">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h3 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <i class="bi bi-bell-fill text-red-600"></i>
                        New Reminder
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-dark-muted mt-1">Schedule a notification</p>
                </div>
                <button onclick="document.getElementById('createReminderModal').remove()" class="text-gray-400 dark:text-dark-muted hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg p-2 transition">
                    <i class="bi bi-x-lg text-xl"></i>
                </button>
            </div>
            <form onsubmit="saveReminderFiltered(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">Subject *</label>
                    <input type="text" name="title" required class="w-full px-4 py-2 bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">Message</label>
                    <textarea name="message" rows="3" class="w-full px-4 py-2 bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"></textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">Date *</label>
                        <input type="datetime-local" name="reminder_date" required class="w-full px-4 py-2 bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">Assign Staff</label>
                        <select id="reminderAssignee" name="assigned_to" class="w-full px-4 py-2 bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all">
                            <option value="">Loading staff...</option>
                        </select>
                    </div>
                </div>
                <div class="pt-2 flex gap-3">
                    <button type="button" onclick="document.getElementById('createReminderModal').remove()" class="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg hover:bg-gray-50 dark:hover:bg-dark-card text-gray-700 dark:text-dark-text font-medium transition-all rounded-lg">Cancel</button>
                    <button type="submit" class="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-medium shadow-lg transition-all">Set Reminder</button>
                </div>
            </form>
        </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Load staff
    setTimeout(async () => {
        const staff = await loadStaffList();
        const sel = document.getElementById('reminderAssignee');
        if (sel) sel.innerHTML = renderStaffOptions(staff);
    }, 100);
};

window.saveReminderFiltered = async function (e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());

    try {
        const res = await fetch('../api/api_reminders.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.success) {
            showNotification('Reminder scheduled successfully', 'success');
            document.getElementById('createReminderModal').remove();
            renderReminders();
        } else {
            showNotification(json.message || 'Error scheduled reminder', 'error');
        }
    } catch (e) {
        console.error(e);
        showNotification('Error saving reminder', 'error');
    }
};
