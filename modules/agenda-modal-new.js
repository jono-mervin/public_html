/**
 * Agenda Management Modal (New)
 * Handles creating and editing agendas with multiple items.
 */

window.agendaItemCounter = 0;
window.agendaItems = [];
window.deletedAgendaItems = [];

// Edit Agenda Functionality
window.openEditAgendaModal = async function (agendaId) {
    const existing = document.getElementById('createAgendaModal');
    if (existing) existing.remove();

    // Reset items
    window.agendaItemCounter = 0;
    window.agendaItems = [];
    window.deletedAgendaItems = [];

    // Loading state or fetch first
    try {
        // Fetch sessions for dropdown (needed for edit too)
        let sessions = window.cachedAgendasSessions || [];
        if (sessions.length === 0) {
            try {
                const resp = await fetch('../api/api_sessions.php');
                const d = await resp.json();
                if (d.success) {
                    sessions = d.sessions;
                    window.cachedAgendasSessions = sessions;
                }
            } catch (e) { }
        }

        // Fetch Agenda Details
        const response = await fetch(`../api/api_agendas.php?id=${agendaId}`);
        const data = await response.json();

        if (!data.success) {
            showNotification('Failed to load agenda details', 'error');
            return;
        }

        const agenda = data.agenda;

        // Render Modal
        const modalHtml = `
        <div id="createAgendaModal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-sm">
            <div class="relative p-6 border w-full max-w-3xl shadow-2xl rounded-2xl bg-white animate-fade-in-up m-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h3 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <i class="bi bi-pencil-square text-red-600"></i>
                            Edit Agenda
                        </h3>
                        <p class="text-sm text-gray-500 mt-1">Update agenda details and items</p>
                    </div>
                    <button type="button" onclick="document.getElementById('createAgendaModal').remove()" class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition">
                        <i class="bi bi-x-lg text-xl"></i>
                    </button>
                </div>
                <form onsubmit="window.updateAgenda(event, ${agendaId})" class="space-y-6">
                    <!-- Creating Agenda Panel -->
                    <div class="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
                        <div class="mb-4">
                            <h4 class="text-sm font-bold text-gray-500 uppercase tracking-wider">Agenda Details</h4>
                        </div>
                        <input type="hidden" name="session_id" value="${agenda.session_id}">
                        
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Agenda Title *</label>
                                <input type="text" name="agenda_title" value="${(agenda.agenda_title || '').replace(/"/g, '&quot;')}" required class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 transition text-sm">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Agenda Description</label>
                                <textarea name="agenda_description" rows="2" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 transition resize-none text-sm">${agenda.agenda_description}</textarea>
                            </div>
                        </div>
                    </div>
                    
                    <div class="hidden">
                        <div id="agenda-staff-container"></div>
                    </div>

                    <div class="flex gap-3 pt-4 border-t border-gray-200">
                        <button type="button" onclick="document.getElementById('createAgendaModal').remove()" class="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition">
                            Cancel
                        </button>
                        <button type="submit" disabled class="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-medium shadow-lg shadow-red-500/30 transition-all opacity-50 cursor-not-allowed">
                            <i class="bi bi-check-lg mr-2"></i>Update Agenda
                        </button>
                    </div>
                </form>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Change Detection Logic
        const form = document.querySelector('#createAgendaModal form');
        const updateBtn = form.querySelector('button[type="submit"]');
        const initialTitle = form.querySelector('[name="agenda_title"]').value;
        const initialDesc = form.querySelector('[name="agenda_description"]').value;

        const checkChanges = () => {
            const currentTitle = form.querySelector('[name="agenda_title"]').value;
            const currentDesc = form.querySelector('[name="agenda_description"]').value;

            if (currentTitle !== initialTitle || currentDesc !== initialDesc) {
                updateBtn.disabled = false;
                updateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                updateBtn.disabled = true;
                updateBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        };

        form.addEventListener('input', checkChanges);

        // No item population needed for edit-only modal

    } catch (e) {
        console.error('Error opening edit modal:', e);
        showNotification('Error loading agenda', 'error');
    }
};

// Update Agenda Function
window.updateAgenda = async function (event, agendaId) {
    event.preventDefault();
    const formData = new FormData(event.target);

    const agendaData = {
        agenda_id: agendaId,
        agenda_title: formData.get('agenda_title'),
        agenda_description: formData.get('agenda_description'),
        items: [], // No items in simplified edit
        deleted_items: [] // No deletions in simplified edit
    };

    try {
        const response = await fetch(`../api/api_agendas.php?action=update_agenda`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(agendaData)
        });
        const result = await response.json();

        if (result.success) {
            showNotification('Agenda updated successfully', 'success');
            document.getElementById('createAgendaModal').remove();

            // Refresh views
            const sId = parseInt(formData.get('session_id'));
            if (sId && typeof window.loadSessionHistory === 'function') {
                window.loadSessionHistory(sId);
            }

            if (window.renderSessionDetails && window.currentSessionId === sId) {
                window.renderSessionDetails(sId);
            } else if (typeof renderAgendas === 'function') {
                renderAgendas();
            } else if (typeof renderAgendasEnhanced === 'function') {
                renderAgendasEnhanced();
            }
        } else {
            showNotification(result.message || 'Failed to update agenda', 'error');
        }
    } catch (e) {
        console.error('Update error:', e);
        showNotification('Error updating agenda', 'error');
    }
};

// Add new agenda item field
window.addAgendaItemField = function (data = null, skipRefresh = false) {
    // Deprecated for Edit Agenda Modal but kept for potential Create compatibility
    const container = document.getElementById('agenda-items-container');
    if (!container) return; // fail gracefully

    const itemId = window.agendaItemCounter++;
    // ... existing logic ...
    // Simplified since this modal no longer uses items
};

// Remove agenda item
window.removeAgendaItem = function (itemId) {
    // Deprecated for Edit Agenda Modal
};

// Update item count
function updateItemCount() {
    // Deprecated for Edit Agenda Modal
}

// Override refreshAgendaStaffList for the new modal to handle multiple dropdowns
window.refreshAgendaStaffListForModal = async function (sessionId) {
    // Deprecated for Edit Agenda Modal
};
