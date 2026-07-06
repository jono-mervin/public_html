// ==================== SESSION ACTION FUNCTIONS ====================

/**
 * Guard: block all session mutations when the session is not editable.
 * Rules:
 *  - session_status === 'Inactive'  → blocked (must be restored first)
 *  - status in Missed / Completed / Cancelled / Postponed → blocked but still visible
 * @param {number} sessionId
 * @returns {Promise<boolean>} true if editable, false if locked or not found
 */
window.ensureSessionActive = async function (sessionId) {
    try {
        const resp = await fetch(`../api/api_sessions.php?id=${sessionId}&_t=${new Date().getTime()}`);
        const data = await resp.json();
        const session = data?.session;
        if (!data.success || !session) return false;
        const visibilityStatus = session.session_status || 'Active';
        const execStatus = (session.status || '').toLowerCase();
        const lockedStatuses = ['missed', 'completed', 'cancelled', 'canceled', 'postponed'];
        if (visibilityStatus === 'Inactive') {
            showNotification('This session is inactive. Restore the session to make changes.', 'error');
            return false;
        }
        if (lockedStatuses.includes(execStatus)) {
            showNotification(`This session is ${session.status}. It is read-only and cannot be edited.`, 'error');
            return false;
        }
        return true;
    } catch (e) {
        console.error('ensureSessionActive error:', e);
        return false;
    }
};

// Record Attendance Function
window.recordSessionAttendance = async function (sessionId) {
    try {
        if (!(await window.ensureSessionActive(sessionId))) return;
        const response = await fetch(`../api/api_sessions.php?id=${sessionId}&_t=${new Date().getTime()}`);
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Invalid JSON response:', text);
            throw new Error('Invalid JSON response');
        }

        // Fetch members list
        const membersResponse = await fetch(`../api/api_sessions.php?members=1&_t=${new Date().getTime()}`);
        const membersText = await membersResponse.text();
        let membersData;
        try {
            membersData = JSON.parse(membersText);
        } catch (e) {
            console.error('Invalid members JSON response:', membersText);
            throw new Error('Invalid members JSON response');
        }
        const members = membersData.members || [];

        if (!data.success || !data.session) {
            showNotification('Failed to load session details', 'error');
            return;
        }

        const session = data.session;
        const assignedStaff = session.assigned_staff || [];
        const existingAttendance = session.attendance || []; // Using the 'attendance' key mapped in API

        // Helper to find existing record
        const findRecord = (userId, memberId) => {
            return existingAttendance.find(r =>
                (userId && r.user_id == userId) ||
                (memberId && r.member_id == memberId)
            );
        };

        // Combine lists
        // Create list of items: { type: 'member'|'staff', id: ..., name: ..., position: ..., avatar: ... }
        let allAttendees = [];

        // Add Members
        members.forEach(m => {
            allAttendees.push({
                type: 'member',
                id: m.member_id,
                name: m.full_name,
                position: m.position, // e.g., 'Councilor'
                avatar: null
            });
        });

        // Add Staff
        assignedStaff.forEach(s => {
            // Check if not already added (unlikely for staff vs member, but good practice)
            allAttendees.push({
                type: 'staff',
                id: s.user_id,
                name: s.user_name,
                position: 'Staff',
                avatar: s.avatar_url
            });
        });

        // Render rows function
        const renderRow = (attendee, index) => {
            const record = findRecord(attendee.type === 'staff' ? attendee.id : null, attendee.type === 'member' ? attendee.id : null);
            // If an attendance record exists, use its status; otherwise leave blank (no default)
            const currentStatus = record ? (record.status || '') : '';
            const timeIn = record ? record.time_in : '';
            const timeOut = record ? record.time_out : '';

            const initial = attendee.name.charAt(0).toUpperCase();

            return `
                <tr class="hover:bg-gray-50 dark:hover:bg-dark-bg/50 transition-colors search-item" id="attendanceRow_${index}" 
                    data-user-id="${attendee.type === 'staff' ? attendee.id : ''}" 
                    data-member-id="${attendee.type === 'member' ? attendee.id : ''}">
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-sm">
                                ${initial}
                            </div>
                            <div>
                                <div class="font-medium text-gray-900 dark:text-white">${attendee.name}</div>
                                <div class="text-xs text-gray-500 dark:text-dark-muted">${attendee.position || ''}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <select id="status_${index}" class="px-3 py-1 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition">
                            <option value="" ${!currentStatus ? 'selected' : ''}></option>
                            <option value="Present" ${currentStatus === 'Present' ? 'selected' : ''}>Present</option>
                            <option value="Absent" ${currentStatus === 'Absent' ? 'selected' : ''}>Absent</option>
                            <option value="Late" ${currentStatus === 'Late' ? 'selected' : ''}>Late</option>
                            <option value="Excused" ${currentStatus === 'Excused' ? 'selected' : ''}>Excused</option>
                        </select>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <input type="time" id="timeIn_${index}" value="${timeIn}" class="px-3 py-1 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition">
                    </td>
                    <td class="px-4 py-3 text-center">
                        <input type="time" id="timeOut_${index}" value="${timeOut}" class="px-3 py-1 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition">
                    </td>
                </tr>
            `;
        };

        const modalCodes = `
            <div id="attendanceModal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-sm">
                <div class="relative p-6 border dark:border-dark-border w-full max-w-3xl shadow-2xl rounded-2xl bg-white dark:bg-dark-card animate-fade-in-up m-4">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">${existingAttendance.length > 0 ? 'Update' : 'Record'} Attendance</h3>
                        <button onclick="document.getElementById('attendanceModal').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                            <i class="bi bi-x-lg text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30 flex justify-between items-center">
                        <div>
                            <h4 class="font-bold text-red-800 dark:text-red-300 mb-1">${session.title}</h4>
                            <p class="text-sm text-red-600 dark:text-red-400">${new Date(session.session_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div class="text-right">
                           <span class="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded-full uppercase">${session.session_type}</span>
                        </div>
                    </div>

                    <div class="max-h-[50vh] overflow-y-auto mb-6 border dark:border-dark-border rounded-lg no-scrollbar">
                        <table class="w-full">
                            <thead class="bg-gray-50 dark:bg-dark-bg sticky top-0 z-10 border-b dark:border-dark-border">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-dark-muted uppercase">Name</th>
                                    <th class="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-dark-muted uppercase">Status</th>
                                    <th class="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-dark-muted uppercase">Time In</th>
                                    <th class="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-dark-muted uppercase">Time Out</th>
                                </tr>
                            </thead>
                            <tbody id="attendanceList" class="divide-y divide-gray-200 dark:divide-dark-border bg-white dark:bg-dark-card">
                                <!-- Council Members Header -->
                                <tr class="bg-gray-100 dark:bg-dark-bg/80"><td colspan="4" class="px-4 py-2 text-xs font-bold text-gray-500 dark:text-dark-muted uppercase">Council Members</td></tr>
                                ${allAttendees.filter(a => a.type === 'member').map((a, i) => renderRow(a, allAttendees.findIndex(x => x === a))).join('')}
                                
                                <!-- User Header -->
                                <tr class="bg-gray-100 dark:bg-dark-bg/80"><td colspan="4" class="px-4 py-2 text-xs font-bold text-gray-500 dark:text-dark-muted uppercase">Assigned Users</td></tr>
                                ${allAttendees.filter(a => a.type === 'staff').length === 0 ?
                '<tr><td colspan="4" class="p-4 text-center text-sm text-gray-500 dark:text-dark-muted italic">No users assigned</td></tr>' :
                allAttendees.filter(a => a.type === 'staff').map((a, i) => renderRow(a, allAttendees.findIndex(x => x === a))).join('')
            }
                            </tbody>
                        </table>
                    </div>

                    <div class="mb-6">
                        <label class="block text-sm font-bold text-gray-700 dark:text-dark-muted mb-2">Notes</label>
                        <textarea id="attendanceNotes" rows="2" class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition" placeholder="Add any notes about attendance...">${existingAttendance.length > 0 && existingAttendance[0].notes ? existingAttendance[0].notes : ''}</textarea>
                    </div>

                    <div class="flex gap-3">
                        <button onclick="document.getElementById('attendanceModal').remove()" class="flex-1 px-6 py-3 border border-gray-300 dark:border-dark-border rounded-lg text-gray-700 dark:text-dark-text font-medium hover:bg-gray-50 dark:hover:bg-dark-bg transition">
                            Cancel
                        </button>
                        <button onclick="saveAttendance(${sessionId}, ${allAttendees.length})" class="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition shadow-lg shadow-red-500/20">
                            ${existingAttendance.length > 0 ? 'Update' : 'Save'} Attendance
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalCodes);
    } catch (error) {
        console.error('Error opening attendance modal:', error);
        showNotification('Failed to open attendance modal', 'error');
    }
};

window.saveAttendance = async function (sessionId, count) {
    if (!(await window.ensureSessionActive(sessionId))) return;
    const attendanceData = [];

    for (let i = 0; i < count; i++) {
        const row = document.getElementById(`attendanceRow_${i}`);
        if (!row) continue; // Skip if row doesn't exist (e.g. headers don't have IDs like this, logic depends on index mapping)

        // Wait, my mapping above used index from map which resets or filtered. 
        // I need to be careful.
        // In renderRow(a, allAttendees.findIndex(x => x === a)) I used unique index from original array.
        // So loop 0 to allAttendees.length is safe if I used that index.

        const userId = row.getAttribute('data-user-id');
        const memberId = row.getAttribute('data-member-id');
        const status = document.getElementById(`status_${i}`)?.value;
        const timeIn = document.getElementById(`timeIn_${i}`)?.value;
        const timeOut = document.getElementById(`timeOut_${i}`)?.value;

        if (userId || memberId) {
            attendanceData.push({
                user_id: userId || null,
                member_id: memberId || null,
                status,
                timeIn,
                timeOut
            });
        }
    }

    const notes = document.getElementById('attendanceNotes')?.value;

    try {
        const response = await fetch('../api/api_sessions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'record_attendance',
                session_id: sessionId,
                attendance_data: attendanceData,
                notes: notes
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Attendance recorded successfully', 'success');
            document.getElementById('attendanceModal').remove();

            // Refresh session view
            if (window.cachedSessions) {
                window.cachedSessions = window.cachedSessions.filter(s => parseInt(s.session_id || s.id) !== parseInt(sessionId));
            }
            if (typeof viewSessionDetails === 'function') {
                viewSessionDetails(sessionId);
            }
        } else {
            showNotification(result.message || 'Failed to record attendance', 'error');
        }
    } catch (error) {
        console.error('Error saving attendance:', error);
        showNotification('An error occurred while saving attendance', 'error');
    }
};

// Add Meeting Minutes Function
window.addMeetingMinutes = async function (sessionId) {
    try {
        if (!(await window.ensureSessionActive(sessionId))) return;
        const response = await fetch(`../api/api_sessions.php?id=${sessionId}&_t=${new Date().getTime()}`);
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Invalid JSON response:', text);
            throw new Error('Invalid JSON response');
        }

        if (!data.success || !data.session) {
            showNotification('Failed to load session details', 'error');
            return;
        }

        const session = data.session;

        const modal = `
            <div id="minutesModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 backdrop-blur-sm flex items-center justify-center p-4">
                <div class="bg-white dark:bg-dark-card w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up border dark:border-dark-border">
                    <div class="flex justify-between items-center p-6 border-b border-gray-100 dark:border-dark-border shrink-0 bg-red-50 dark:bg-red-900/20 rounded-t-2xl">
                        <div>
                            <h3 class="text-2xl font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
                                <i class="bi bi-file-earmark-text text-red-600"></i>
                                Add Meeting Minutes
                            </h3>
                            <p class="text-sm text-red-600 dark:text-red-300 mt-1">Record the outcomes of the session</p>
                        </div>
                        <button onclick="document.getElementById('minutesModal').remove()" class="text-gray-400 dark:text-dark-muted hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-bg p-2 rounded-lg transition-all">
                            <i class="bi bi-x-lg text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="overflow-y-auto p-6 flex-1 custom-scrollbar">
                        <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                            <h4 class="font-bold text-red-800 dark:text-red-300 mb-1">${session.title}</h4>
                            <p class="text-sm text-red-600 dark:text-red-400">${new Date(session.session_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-dark-muted mb-2">Meeting Summary <span class="text-red-500">*</span></label>
                                <textarea id="minutesSummary" rows="3" class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition" placeholder="Brief summary of the meeting..." required>${session.minutes ? session.minutes.summary || '' : ''}</textarea>
                            </div>

                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-dark-muted mb-2">Topics Discussed <span class="text-red-500">*</span></label>
                                <textarea id="minutesTopics" rows="4" class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition" placeholder="• Topic 1&#10;• Topic 2&#10;• Topic 3" required>${session.minutes ? session.minutes.topics || '' : ''}</textarea>
                            </div>

                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-dark-muted mb-2">Decisions Made</label>
                                <textarea id="minutesDecisions" rows="3" class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition" placeholder="List key decisions made during the meeting...">${session.minutes ? session.minutes.decisions || '' : ''}</textarea>
                            </div>

                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-dark-muted mb-2">Action Items</label>
                                <textarea id="minutesActions" rows="3" class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition" placeholder="• Action item 1 - Assigned to: [Name]&#10;• Action item 2 - Assigned to: [Name]">${session.minutes ? session.minutes.action_items || '' : ''}</textarea>
                            </div>
                        </div>
                    </div>

                    <div class="p-6 border-t border-gray-100 dark:border-dark-border shrink-0 bg-gray-50 dark:bg-dark-bg/50 rounded-b-2xl flex flex-col md:flex-row gap-3">
                        <button onclick="document.getElementById('minutesModal').remove()" class="flex-1 px-6 py-3 border border-gray-300 dark:border-dark-border rounded-xl text-gray-700 dark:text-dark-text font-medium hover:bg-white dark:hover:bg-dark-bg transition shadow-sm">
                            Cancel
                        </button>
                        <button onclick="saveMeetingMinutes(${sessionId}, 'draft')" class="flex-1 px-6 py-3 border-2 border-red-600 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                            Save as Draft
                        </button>
                        <button onclick="saveMeetingMinutes(${sessionId}, 'published')" class="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-500/30">
                            Publish Minutes
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);

        // Attach live validation to clear error styles when user types
        const summaryEl = document.getElementById('minutesSummary');
        const topicsEl = document.getElementById('minutesTopics');
        [summaryEl, topicsEl].forEach(el => {
            if (!el) return;
            el.addEventListener('input', () => {
                el.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
            });
        });
    } catch (error) {
        console.error('Error opening minutes modal:', error);
        showNotification('Failed to open minutes modal', 'error');
    }
};

window.saveMeetingMinutes = async function (sessionId, status) {
    if (!(await window.ensureSessionActive(sessionId))) return;
    const minutesData = {
        summary: document.getElementById('minutesSummary')?.value,
        topics: document.getElementById('minutesTopics')?.value,
        decisions: document.getElementById('minutesDecisions')?.value,
        actions: document.getElementById('minutesActions')?.value,
        status: status
    };

    // Frontend validation: mark required textareas instead of showing a toast
    const summaryEl = document.getElementById('minutesSummary');
    const topicsEl = document.getElementById('minutesTopics');
    let hasError = false;

    if (!minutesData.summary || !minutesData.summary.trim()) {
        if (summaryEl) {
            summaryEl.classList.add('border-red-500', 'ring-1', 'ring-red-500');
        }
        hasError = true;
    }

    if (!minutesData.topics || !minutesData.topics.trim()) {
        if (topicsEl) {
            topicsEl.classList.add('border-red-500', 'ring-1', 'ring-red-500');
        }
        hasError = true;
    }

    if (hasError) {
        (summaryEl || topicsEl)?.focus();
        return;
    }

    try {
        const response = await fetch('../api/api_sessions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'save_minutes',
                session_id: sessionId,
                ...minutesData
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(`Meeting minutes ${status === 'draft' ? 'saved as draft' : 'published'} successfully`, 'success');
            document.getElementById('minutesModal').remove();

            // Refresh session view
            if (window.cachedSessions) {
                window.cachedSessions = window.cachedSessions.filter(s => parseInt(s.session_id || s.id) !== parseInt(sessionId));
            }
            if (typeof viewSessionDetails === 'function') {
                viewSessionDetails(sessionId);
            }
        } else {
            showNotification(result.message || 'Failed to save meeting minutes', 'error');
        }
    } catch (error) {
        console.error('Error saving minutes:', error);
        showNotification('An error occurred while saving minutes', 'error');
    }
};

// Upload Attachments Function
window.uploadSessionAttachments = async function (sessionId) {
    try {
        if (!(await window.ensureSessionActive(sessionId))) return;
        // Direct upload: open file picker and upload immediately (no modal)
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';
        input.style.display = 'none';

        input.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;

            const formData = new FormData();
            formData.append('action', 'upload_documents');
            formData.append('session_id', String(sessionId));
            files.forEach(f => formData.append('files[]', f));

            try {
                const response = await fetch('../api/api_sessions.php', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();

                if (result.success) {
                    showNotification(`${files.length} file(s) uploaded successfully`, 'success');

                    // Refresh session view
                    if (window.cachedSessions) {
                        window.cachedSessions = window.cachedSessions.filter(s => parseInt(s.session_id || s.id) !== parseInt(sessionId));
                    }
                    if (typeof viewSessionDetails === 'function') {
                        viewSessionDetails(sessionId);
                    }
                } else {
                    showNotification(result.message || 'Failed to upload files', 'error');
                }
            } catch (err) {
                console.error('Error uploading files:', err);
                showNotification('An error occurred while uploading files', 'error');
            } finally {
                input.remove();
            }
        }, { once: true });

        document.body.appendChild(input);
        input.click();
    } catch (error) {
        console.error('Error opening attachments modal:', error);
        showNotification('Failed to open file picker', 'error');
    }
};

window.removeFile = function (index) {
    if (window._selectedFiles) {
        window._selectedFiles.splice(index, 1);
        displayFiles();
    }
};

window.uploadFiles = async function (sessionId) {
    if (!(await window.ensureSessionActive(sessionId))) return;
    const selectedFiles = window._selectedFiles || [];
    if (selectedFiles.length === 0) {
        showNotification('Please select at least one file', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('action', 'upload_documents');
    formData.append('session_id', sessionId);
    selectedFiles.forEach(file => {
        formData.append('files[]', file);
    });

    try {
        const response = await fetch('../api/api_sessions.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showNotification(`${selectedFiles.length} file(s) uploaded successfully`, 'success');
            document.getElementById('attachmentsModal').remove();
            window._selectedFiles = [];

            // Refresh session view
            if (window.cachedSessions) {
                window.cachedSessions = window.cachedSessions.filter(s => parseInt(s.session_id || s.id) !== parseInt(sessionId));
            }
            if (typeof viewSessionDetails === 'function') {
                viewSessionDetails(sessionId);
            }
        } else {
            showNotification(result.message || 'Failed to upload files', 'error');
        }
    } catch (error) {
        console.error('Error uploading files:', error);
        showNotification('An error occurred while uploading files', 'error');
    }
};

function displayFiles() {
    const fileList = document.getElementById('fileList');
    const selectedFiles = window._selectedFiles || [];
    if (!fileList) return;

    fileList.innerHTML = selectedFiles.map((file, index) => `
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg/50 rounded-lg border border-gray-200 dark:border-dark-border transition">
            <div class="flex items-center gap-3">
                <i class="bi bi-file-earmark text-2xl text-red-600 dark:text-red-400"></i>
                <div>
                    <p class="font-medium text-gray-900 dark:text-white text-sm font-bold">${file.name}</p>
                    <p class="text-xs text-gray-500 dark:text-dark-muted">${(file.size / 1024).toFixed(2)} KB</p>
                </div>
            </div>
            <button onclick="removeFile(${index})" class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">
                <i class="bi bi-x-circle text-xl"></i>
            </button>
        </div>
    `).join('');
}

// Cancel Session Function (Kept mainly as is, but updated API call)
window.cancelSession = async function (sessionId) {
    try {
        if (!(await window.ensureSessionActive(sessionId))) return;
        const response = await fetch(`../api/api_sessions.php?id=${sessionId}`);
        const data = await response.json();

        if (!data.success || !data.session) {
            showNotification('Failed to load session details', 'error');
            return;
        }

        const session = data.session;

        const modal = `
            <div id="cancelModal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-sm">
                <div class="relative p-6 border dark:border-dark-border w-full max-w-md shadow-2xl rounded-2xl bg-white dark:bg-dark-card animate-fade-in-up m-4">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-2xl font-bold text-red-600 dark:text-red-400">Cancel Session</h3>
                        <button onclick="document.getElementById('cancelModal').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                            <i class="bi bi-x-lg text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900/30">
                        <div class="flex items-start gap-3">
                            <i class="bi bi-exclamation-triangle text-2xl text-red-600 dark:text-red-400 mt-1"></i>
                            <div>
                                <h4 class="font-bold text-red-800 dark:text-red-300 mb-1">${session.title}</h4>
                                <p class="text-sm text-red-600 dark:text-red-400">${new Date(session.session_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>

                    <div class="mb-6">
                        <label class="block text-sm font-bold text-gray-700 dark:text-dark-muted mb-2">Reason for Cancellation *</label>
                        <select id="cancelReason" class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-3 transition">
                            <option value="">Select a reason...</option>
                            <option value="weather">Weather Conditions</option>
                            <option value="emergency">Emergency Situation</option>
                            <option value="quorum">Lack of Quorum</option>
                            <option value="conflict">Schedule Conflict</option>
                            <option value="technical">Technical Issues</option>
                            <option value="other">Other</option>
                        </select>
                        <textarea id="cancelNotes" rows="3" class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition" placeholder="Additional notes (optional)..."></textarea>
                    </div>

                    <div class="mb-6">
                        <label class="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" id="notifyParticipants" checked class="w-4 h-4 text-red-600 border-gray-300 dark:border-dark-border dark:bg-dark-bg rounded focus:ring-red-500 transition">
                            <span class="text-sm text-gray-700 dark:text-dark-text group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">Notify all participants about cancellation</span>
                        </label>
                    </div>

                    <div class="flex gap-3">
                        <button onclick="document.getElementById('cancelModal').remove()" class="flex-1 px-6 py-3 border border-gray-300 dark:border-dark-border rounded-lg text-gray-700 dark:text-dark-text font-medium hover:bg-gray-50 dark:hover:bg-dark-bg transition">
                            Keep Session
                        </button>
                        <button onclick="confirmCancelSession(${sessionId})" class="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition shadow-lg shadow-red-500/20">
                            Cancel Session
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);
    } catch (error) {
        console.error('Error opening cancel modal:', error);
        showNotification('Failed to open cancel modal', 'error');
    }
};

window.confirmCancelSession = async function (sessionId) {
    if (!(await window.ensureSessionActive(sessionId))) return;
    const reason = document.getElementById('cancelReason')?.value;
    const notes = document.getElementById('cancelNotes')?.value;
    const notify = document.getElementById('notifyParticipants')?.checked;

    if (!reason) {
        showNotification('Please select a reason for cancellation', 'error');
        return;
    }

    try {
        const response = await fetch('../api/api_sessions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'cancel_session',
                session_id: sessionId,
                reason: reason,
                notes: notes,
                notify: notify
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Session cancelled successfully', 'success');
            document.getElementById('cancelModal').remove();

            // Refresh the session view
            setTimeout(() => {
                showSection('sessions');
            }, 1000);
        } else {
            showNotification(result.message || 'Failed to cancel session', 'error');
        }
    } catch (error) {
        console.error('Error cancelling session:', error);
        showNotification('An error occurred while cancelling session', 'error');
    }
};

window.deleteSessionDocument = async function (documentId, sessionId) {
    if (!(await window.ensureSessionActive(sessionId))) return;
    const confirmed = await window.showConfirmModal({
        title: 'Delete Document?',
        message: 'Are you sure you want to delete this document?',
        confirmText: 'Delete Document'
    });
    if (!confirmed) return;

    const passwordOk = await window.promptPasswordConfirmation({
        title: 'Confirm Delete Document',
        message: 'Enter your password to permanently delete this document.',
        confirmText: 'Confirm Delete'
    });
    if (!passwordOk) return;

    try {
        const response = await fetch('../api/api_sessions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete_document',
                document_id: documentId,
                session_id: sessionId
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Document deleted successfully', 'success');
            // Refresh view
            if (window.cachedSessions) {
                window.cachedSessions = window.cachedSessions.filter(s => parseInt(s.session_id || s.id) !== parseInt(sessionId));
            }
            if (typeof viewSessionDetails === 'function') {
                viewSessionDetails(sessionId);
            }
        } else {
            showNotification(result.message || 'Failed to delete document', 'error');
        }
    } catch (error) {
        console.error('Error deleting document:', error);
        showNotification('An error occurred while deleting document', 'error');
    }
};

// Assign Staff Function
window.assignSessionStaff = async function (sessionId) {
    try {
        if (!(await window.ensureSessionActive(sessionId))) return;
        // Fetch session details and all users
        const [sessionResponse, usersResponse] = await Promise.all([
            fetch(`../api/api_sessions.php?id=${sessionId}&_t=${new Date().getTime()}`),
            fetch(`../api/api_users.php?_t=${new Date().getTime()}`)
        ]);

        const sessionData = await sessionResponse.json();
        const usersData = await usersResponse.json();

        if (!sessionData.success || !sessionData.session) {
            showNotification('Failed to load session details', 'error');
            return;
        }

        const session = sessionData.session;
        const allUsers = usersData.users || [];
        // Only active "User" role accounts can be assigned
        const staffUsers = allUsers.filter(u => u.user_role === 'User - Committee' && (u.status || 'Active') === 'Active');

        const currentAssignments = session.assigned_staff ? session.assigned_staff.map(s => parseInt(s.user_id)) : [];

        const modalId = 'assignStaffModal';

        const renderUserRow = (user) => {
            const isAssigned = currentAssignments.includes(parseInt(user.user_id));
            const initial = user.user_name.charAt(0).toUpperCase();

            return `
                <label class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-dark-bg/50 rounded-lg cursor-pointer transition group">
                    <div class="flex items-center gap-3">
                        <div class="relative">
                            ${user.avatar_url
                    ? `<img src="${user.avatar_url}" class="w-10 h-10 rounded-full object-cover">`
                    : `<div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold">${initial}</div>`
                }
                            ${isAssigned ? '<div class="absolute -bottom-1 -right-1 bg-green-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border border-white dark:border-dark-card"><i class="bi bi-check"></i></div>' : ''}
                        </div>
                        <div>
                            <p class="font-medium text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">${user.user_name}</p>
                            <p class="text-xs text-gray-500 dark:text-dark-muted">${user.user_role}</p>
                        </div>
                    </div>
                    <input type="checkbox" id="staff_${user.user_id}" value="${user.user_id}" 
                        ${isAssigned ? 'checked' : ''} 
                        class="w-5 h-5 text-red-600 border-gray-300 dark:border-dark-border dark:bg-dark-bg rounded focus:ring-red-500 cursor-pointer transition">
                </label>
            `;
        };

        const modalHtml = `
            <div id="${modalId}" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-sm">
                <div class="relative p-6 border dark:border-dark-border w-full max-w-lg shadow-2xl rounded-2xl bg-white dark:bg-dark-card animate-fade-in-up m-4 flex flex-col max-h-[90vh]">
                    <div class="flex justify-between items-center mb-6 shrink-0">
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Assign Users</h3>
                        <button onclick="document.getElementById('${modalId}').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                            <i class="bi bi-x-lg text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30 shrink-0">
                         <h4 class="font-bold text-red-800 dark:text-red-300 mb-1">${session.title}</h4>
                         <p class="text-sm text-red-600 dark:text-red-400">${new Date(session.session_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    
                    <div class="mb-4 relative shrink-0">
                        <i class="bi bi-search absolute left-3 top-3 text-gray-400 dark:text-dark-muted"></i>
                        <input type="text" id="staffSearch" placeholder="Search users..." 
                            class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                            onkeyup="filterStaffList(this.value)">
                    </div>

                    <div id="staffList" class="flex-1 overflow-y-auto space-y-1 pr-2 mb-6 border dark:border-dark-border rounded-lg p-2 max-h-64 no-scrollbar">
                        ${staffUsers.map(renderUserRow).join('')}
                        ${staffUsers.length === 0 ? '<p class="text-center text-gray-500 dark:text-dark-muted py-4">No users found</p>' : ''}
                    </div>

                    <div class="flex gap-3 shrink-0">
                        <button onclick="document.getElementById('${modalId}').remove()" class="flex-1 px-6 py-3 border border-gray-300 dark:border-dark-border rounded-lg text-gray-700 dark:text-dark-text font-medium hover:bg-gray-50 dark:hover:bg-dark-bg transition">
                            Cancel
                        </button>
                        <button onclick="saveStaffAssignments(${sessionId})" class="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition shadow-lg shadow-red-500/20">
                            Save Assignments
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Attach filter function to window for the inline onclick/onkeyup to work comfortably without unsafe-inline csp issues if strict, 
        // but here it's cleaner to just attach event listener or use global. 
        // Using global for simplicity in this context.
        window.filterStaffList = function (query) {
            const term = query.toLowerCase();
            const list = document.getElementById('staffList');
            if (!list) return;
            const items = list.children; // div wrappers
            for (let item of items) {
                if (item.tagName !== 'DIV') continue; // Skip messages
                const nameEl = item.querySelector('p.font-medium');
                if (nameEl) {
                    const name = nameEl.innerText.toLowerCase();
                    item.style.display = name.includes(term) ? 'flex' : 'none';
                }
            }
        };

    } catch (error) {
        console.error('Error opening assign staff modal:', error);
        showNotification('Failed to open assign staff modal', 'error');
    }
};

window.saveStaffAssignments = async function (sessionId) {
    if (!(await window.ensureSessionActive(sessionId))) return;
    const checkboxes = document.querySelectorAll('#staffList input[type="checkbox"]:checked');
    const selectedUserIds = Array.from(checkboxes).map(cb => cb.value);

    try {
        const response = await fetch('../api/api_sessions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'assign_staff',
                session_id: sessionId,
                staff_ids: selectedUserIds
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Staff assignments updated successfully', 'success');
            document.getElementById('assignStaffModal').remove();

            // Refresh session view
            if (window.cachedSessions) {
                window.cachedSessions = window.cachedSessions.filter(s => parseInt(s.session_id || s.id) !== parseInt(sessionId));
            }
            if (typeof viewSessionDetails === 'function') {
                viewSessionDetails(sessionId);
            }
        } else {
            showNotification(result.message || 'Failed to update assignments', 'error');
        }
    } catch (error) {
        console.error('Error saving assignments:', error);
        showNotification('An error occurred while saving assignments', 'error');
    }
};

// Send Reminder Function
window.sendSessionReminder = async function (sessionId) {
    try {
        if (!(await window.ensureSessionActive(sessionId))) return;
        const response = await fetch(`../api/api_sessions.php?id=${sessionId}&_t=${new Date().getTime()}`);
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Invalid JSON response from sendSessionReminder:', text);
            throw new Error('Invalid JSON response');
        }

        if (!data.success || !data.session) {
            showNotification('Failed to load session details', 'error');
            return;
        }

        const session = data.session;
        const modalId = 'sendReminderModal';

        const modalHtml = `
            <div id="${modalId}" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-sm">
                <div class="relative p-6 border dark:border-dark-border w-full max-w-md shadow-2xl rounded-2xl bg-white dark:bg-dark-card animate-fade-in-up m-4">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Send Reminder</h3>
                        <button onclick="document.getElementById('${modalId}').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                            <i class="bi bi-x-lg text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                         <h4 class="font-bold text-red-800 dark:text-red-300 mb-1">${session.title}</h4>
                         <p class="text-sm text-red-600 dark:text-red-400">${new Date(session.session_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    
                    <p class="text-gray-600 dark:text-dark-text mb-6">
                        This will send a reminder to all administrators, staff, and assigned users for this session.
                    </p>

                    <div class="flex gap-3">
                        <button onclick="document.getElementById('${modalId}').remove()" class="flex-1 px-6 py-3 border border-gray-300 dark:border-dark-border rounded-lg text-gray-700 dark:text-dark-text font-medium hover:bg-gray-50 dark:hover:bg-dark-bg transition">
                            Cancel
                        </button>
                        <button onclick="confirmSendReminder(${sessionId})" class="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition shadow-lg shadow-red-500/20">
                            Send Reminder
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

    } catch (error) {
        console.error('Error opening reminder modal:', error);
        showNotification('Failed to open reminder modal', 'error');
    }
};

window.confirmSendReminder = async function (sessionId) {
    try {
        if (!(await window.ensureSessionActive(sessionId))) return;
        const response = await fetch('../api/api_sessions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'send_reminder',
                session_id: sessionId
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Reminder sent successfully', 'success');
            const modal = document.getElementById('sendReminderModal');
            if (modal) modal.remove();
        } else {
            showNotification(result.message || 'Failed to send reminder', 'error');
        }
    } catch (error) {
        console.error('Error sending reminder:', error);
        showNotification('An error occurred while sending reminder', 'error');
    }
};

window.deleteSessionMinutes = async function (sessionId) {
    if (!(await window.ensureSessionActive(sessionId))) return;
    const confirmed = await window.showConfirmModal({
        title: 'Delete Minutes?',
        message: 'Are you sure you want to delete these meeting minutes?',
        description: 'This action cannot be undone.',
        confirmText: 'Delete Minutes',
        type: 'danger'
    });
    if (!confirmed) return;

    const passwordOk = await window.promptPasswordConfirmation({
        title: 'Confirm Delete Minutes',
        message: 'Enter your password to delete these meeting minutes.',
        confirmText: 'Confirm Delete'
    });
    if (!passwordOk) return;

    try {
        const response = await fetch('../api/api_sessions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete_minutes',
                session_id: sessionId
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Meeting minutes deleted successfully', 'success');

            // Refresh session view
            if (window.cachedSessions) {
                window.cachedSessions = window.cachedSessions.filter(s => parseInt(s.session_id || s.id) !== parseInt(sessionId));
            }
            if (typeof viewSessionDetails === 'function') {
                viewSessionDetails(sessionId);
            }
        } else {
            showNotification(result.message || 'Failed to delete minutes', 'error');
        }
    } catch (error) {
        console.error('Error deleting minutes:', error);
        showNotification('An error occurred while deleting minutes', 'error');
    }
};

window.deleteSessionAttendance = async function (sessionId) {
    if (!(await window.ensureSessionActive(sessionId))) return;
    const confirmed = await window.showConfirmModal({
        title: 'Clear Attendance?',
        message: 'Are you sure you want to clear all attendance records for this session?',
        description: 'This action cannot be undone.',
        confirmText: 'Clear Attendance',
        type: 'danger'
    });
    if (!confirmed) return;

    const passwordOk = await window.promptPasswordConfirmation({
        title: 'Confirm Clear Attendance',
        message: 'Enter your password to clear all attendance records for this session.',
        confirmText: 'Confirm Clear'
    });
    if (!passwordOk) return;

    try {
        const response = await fetch('../api/api_sessions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete_attendance',
                session_id: sessionId
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Attendance records cleared successfully', 'success');

            // Refresh session view
            if (window.cachedSessions) {
                window.cachedSessions = window.cachedSessions.filter(s => parseInt(s.session_id || s.id) !== parseInt(sessionId));
            }
            if (typeof viewSessionDetails === 'function') {
                viewSessionDetails(sessionId);
            }
        } else {
            showNotification(result.message || 'Failed to clear attendance', 'error');
        }
    } catch (error) {
        console.error('Error clearing attendance:', error);
        showNotification('An error occurred while clearing attendance', 'error');
    }
};

window.changeDocumentPermission = async function (documentId, sessionId, currentState) {
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
        const response = await fetch('../api/api_sessions.php', {
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
            if (window.cachedSessions) {
                window.cachedSessions = window.cachedSessions.filter(s => parseInt(s.session_id || s.id) !== parseInt(sessionId));
            }
            if (typeof viewSessionDetails === 'function') {
                viewSessionDetails(sessionId);
            }
        } else {
            showNotification(result.message || 'Failed to update permission', 'error');
        }
    } catch (e) {
        showNotification('Error updating permission', 'error');
    }
};
