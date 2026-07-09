// Calendar Module for LACS
// Contains the enhanced calendar functionality with notes feature
// Intended to be loaded after main-features.js

// ==============================
// CALENDAR MODULE - ENHANCED VERSION
// ==============================

// Electoral term bounds: June 30, 2025 – June 30, 2028
const CALENDAR_TERM_START = new Date(2025, 5, 30);
const CALENDAR_TERM_END = new Date(2028, 5, 30);
const CALENDAR_TERM_MIN_YEAR = 2025;
const CALENDAR_TERM_MAX_YEAR = 2028;

function clampCalendarToTerm(date) {
    const d = date instanceof Date ? new Date(date) : new Date(date);
    if (d < CALENDAR_TERM_START) return new Date(CALENDAR_TERM_START);
    if (d > CALENDAR_TERM_END) return new Date(CALENDAR_TERM_END);
    return d;
}

function applyCalendarTermClamp() {
    if (!(calendarCurrentDate instanceof Date)) {
        calendarCurrentDate = clampCalendarToTerm(new Date());
    } else {
        calendarCurrentDate = clampCalendarToTerm(calendarCurrentDate);
    }
    window.currentCalendarMonth = calendarCurrentDate.getMonth() + 1;
    window.currentCalendarYear = calendarCurrentDate.getFullYear();
}

function wrapCalendarDateSetter(fnName) {
    const original = window[fnName];
    if (typeof original !== 'function') return;
    window[fnName] = function (...args) {
        original.apply(this, args);
        const before = calendarCurrentDate instanceof Date ? calendarCurrentDate.getTime() : 0;
        applyCalendarTermClamp();
        if (calendarCurrentDate.getTime() !== before && typeof renderCalendar === 'function') {
            renderCalendar();
        }
    };
}

// Calendar Helper Functions
function getCurrentCalendarMeta() {
    const base = calendarCurrentDate instanceof Date ? calendarCurrentDate : new Date();
    const monthIndex = base.getMonth(); // 0-11
    const year = base.getFullYear();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthShortNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return {
        monthIndex,
        year,
        daysInMonth,
        monthName: monthNames[monthIndex],
        monthShort: monthShortNames[monthIndex],
        todayDate: base.getDate()
    };
}

function getCurrentWeekBounds(calendarMeta) {
    // Use calendarCurrentDate to determine which week to show
    const baseDate = calendarCurrentDate || new Date();
    const dayOfWeek = baseDate.getDay(); // 0-6 (0 = Sunday)

    // Calculate start of week (Sunday)
    const startDate = new Date(baseDate);
    startDate.setDate(baseDate.getDate() - dayOfWeek);
    startDate.setHours(0, 0, 0, 0);

    // Calculate end of week (Saturday)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
}

// ============================================
// FIXED FUNCTIONAL CALENDAR WITH NOTES
// ============================================

// Initialize calendar state within electoral term
applyCalendarTermClamp();
if (!window.currentCalendarMonth) {
    window.currentCalendarMonth = calendarCurrentDate.getMonth() + 1;
    window.currentCalendarYear = calendarCurrentDate.getFullYear();
}

window.calendarSessions = [];
window.renderCalendar = () => window.renderCalendarEnhanced();
window.renderAdminCalendar = () => window.renderCalendarEnhanced();
window.renderStaffCalendar = () => window.renderCalendarEnhanced();

window.navigateCalendar = function (direction) {
    const base = calendarCurrentDate instanceof Date ? new Date(calendarCurrentDate) : new Date();
    if (direction === 'prev') {
        if (calendarView === 'week') {
            base.setDate(base.getDate() - 7);
        } else if (calendarView === 'day') {
            base.setDate(base.getDate() - 1);
        } else {
            base.setMonth(base.getMonth() - 1);
        }
    } else if (direction === 'next') {
        if (calendarView === 'week') {
            base.setDate(base.getDate() + 7);
        } else if (calendarView === 'day') {
            base.setDate(base.getDate() + 1);
        } else {
            base.setMonth(base.getMonth() + 1);
        }
    } else if (direction === 'today') {
        base.setTime(new Date().getTime());
    }

    calendarCurrentDate = clampCalendarToTerm(base);
    window.currentCalendarMonth = calendarCurrentDate.getMonth() + 1;
    window.currentCalendarYear = calendarCurrentDate.getFullYear();
    renderCalendarEnhanced();
};

[
    'calendarPrev',
    'calendarNext',
    'onCalendarJumpChange',
    'selectMonthYear',
    'selectYearFromInput',
    'selectWeekFromDate',
    'selectDayFromCalendar',
    'selectDayYearFromInput',
    'setCalendarView'
].forEach(wrapCalendarDateSetter);

window.renderCalendarEnhanced = async function () {
    applyCalendarTermClamp();
    // Guard: Only render if calendar is the active section
    if (window.activeSection && window.activeSection !== 'calendar') {
        console.log('Skipping calendar render: active section is ' + window.activeSection);
        return;
    }
    // Fetch sessions & notes for calendar
    try {
        const [sessionsRes, notesRes] = await Promise.all([
            fetch('../api/api_sessions.php'),
            fetch('../api/api_user_notes.php')
        ]);

        const sessionsData = await sessionsRes.json();
        const notesData = await notesRes.json();

        console.log('Calendar Data Loaded:', {
            sessionCount: (sessionsData.sessions || []).length,
            noteCount: (notesData.notes || []).length,
            notes: notesData.notes
        });

        window.calendarSessions = sessionsData.sessions || [];

        // Convert notes array to date-keyed object for easy lookup
        const notesMap = {};
        if (notesData.success && notesData.notes) {
            notesData.notes.forEach(n => {
                if (!n.note_date) return;
                // robust date extraction: YYYY-MM-DD
                const datePart = n.note_date.match(/^\d{4}-\d{2}-\d{2}/);
                const dateKey = datePart ? datePart[0] : n.note_date.split(' ')[0];

                if (!notesMap[dateKey]) notesMap[dateKey] = [];
                notesMap[dateKey].push(n);
            });
        }
        window.calendarNotes = notesMap;
        console.log('Processed Notes Map:', window.calendarNotes);
    } catch (e) {
        console.error('Error loading calendar data:', e);
    }

    // Keep legacy month/year state in sync with calendarCurrentDate
    if (!calendarCurrentDate) {
        const fallback = new Date(window.currentCalendarYear || new Date().getFullYear(), (window.currentCalendarMonth || new Date().getMonth() + 1) - 1, 1);
        calendarCurrentDate = fallback;
    }

    const calendarMeta = getCurrentCalendarMeta();
    window.currentCalendarMonth = calendarMeta.monthIndex + 1;
    window.currentCalendarYear = calendarMeta.year;

    // Determine header range label based on view
    const monthNamesTitle = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    let rangeLabel = `${monthNamesTitle[calendarMeta.monthIndex]} ${calendarMeta.year}`;
    if (calendarView === 'week') {
        const { startDate, endDate } = getCurrentWeekBounds(calendarMeta);
        if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
            rangeLabel = `${startDate.getDate()}-${endDate.getDate()} ${monthNamesTitle[startDate.getMonth()]} ${startDate.getFullYear()}`;
        } else {
            rangeLabel = `${startDate.getDate()} ${monthNamesTitle[startDate.getMonth()]} ${startDate.getFullYear()} â€“ ${endDate.getDate()} ${monthNamesTitle[endDate.getMonth()]} ${endDate.getFullYear()}`;
        }
    } else if (calendarView === 'day') {
        rangeLabel = `${monthNamesTitle[calendarMeta.monthIndex]} ${calendarMeta.todayDate}, ${calendarMeta.year}`;
    }

    const html = `
   <div  class="space-y-6 animate-fade-in-up"> 
        <!-- Premium Header -->
       <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-8 shadow-xl">
           <div class="absolute inset-0 bg-black opacity-10"></div>
           <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
           <div class="relative z-10">
               <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   <div class="text-white">
                        <h1 class="text-3xl font-bold mb-2">Calendar (Versions)</h1>
                        <p class="text-red-100 text-sm">View Versions / Sessions and manage your notes</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Calendar Container -->
       <div class="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden transition-colors">
            <!-- Calendar Header -->
           <div class="bg-gradient-to-r from-gray-50 to-white dark:from-dark-bg/50 dark:to-dark-card px-6 py-4 border-b border-gray-200 dark:border-dark-border">
               <div class="flex flex-col gap-3">
                   <div class="flex items-center justify-between">
                       <div class="flex items-center gap-3">
                            <button onclick="navigateCalendar('prev')" class="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg transition">
                                <i class="bi bi-chevron-left text-gray-600 dark:text-dark-muted"></i>
                            </button>
                           <div class="relative">
                                <button onclick="${calendarView === 'month' ? 'toggleMonthYearPicker()' : calendarView === 'week' ? 'toggleWeekPicker()' : calendarView === 'day' ? 'toggleDayPicker()' : 'void(0)'}" class="text-xl font-bold text-gray-900 dark:text-white min-w-[200px] text-center px-4 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg border border-transparent hover:border-gray-200 dark:hover:border-dark-border transition flex items-center justify-center gap-2 ${calendarView === 'month' || calendarView === 'week' || calendarView === 'day' ? 'cursor-pointer' : 'cursor-default'}">
                                    <span>${rangeLabel}</span>
                                    ${calendarView === 'month' || calendarView === 'week' || calendarView === 'day' ? '<i class="bi bi-caret-down-fill text-xs text-gray-400"></i>' : ''}
                                </button>
                                ${calendarView === 'month' ? `
                               <div id="monthYearPickerBackdrop" onclick="closeMonthYearPicker()" class="fixed inset-0 bg-transparent z-40 hidden"></div>
                               <div id="monthYearPicker" onclick="event.stopPropagation()" class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-dark-card rounded-lg shadow-xl border border-gray-200 dark:border-dark-border p-4 z-50 hidden" style="min-width: 280px;">
                                   <div class="flex items-center justify-between mb-4">
                                        <button onclick="changeYearInPicker(-1)" class="p-1 text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-bg rounded transition">
                                            <i class="bi bi-chevron-left"></i>
                                        </button>
                                        <span class="text-lg font-semibold text-gray-800 dark:text-white" id="pickerYear">${calendarMeta.year}</span>
                                        <button onclick="changeYearInPicker(1)" class="p-1 text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-bg rounded transition">
                                            <i class="bi bi-chevron-right"></i>
                                        </button>
                                    </div>
                                   <div class="grid grid-cols-3 gap-2">
                                        ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => `
                                            <button onclick="selectMonthYear(${idx}, ${calendarMeta.year})" 
                                                    class="px-3 py-2 text-sm font-medium rounded-md transition ${idx === calendarMeta.monthIndex ? 'bg-red-600 text-white' : 'text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg'}">
                                                ${month.substring(0, 3)}
                                            </button>
                                        `).join('')}
                                    </div>
                                   <div class="mt-4 flex items-center justify-between">
                                        <input type="number" id="pickerYearInput" value="${calendarMeta.year}" 
                                               class="w-24 px-3 py-1.5 bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border text-gray-800 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                               min="${CALENDAR_TERM_MIN_YEAR}" max="${CALENDAR_TERM_MAX_YEAR}"
                                               onchange="selectYearFromInput(this.value)">
                                        <button onclick="closeMonthYearPicker()" class="px-4 py-1.5 bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-white rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                                            Close
                                        </button>
                                    </div>
                                </div>
                                ` : ''}
                                ${calendarView === 'week' ? (() => {
            const { startDate } = getCurrentWeekBounds(calendarMeta);
            const weekStartDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
            return `
                               <div id="weekPickerBackdrop" onclick="closeWeekPicker()" class="fixed inset-0 bg-transparent z-40 hidden"></div>
                               <div id="weekPicker" onclick="event.stopPropagation()" class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-dark-card rounded-lg shadow-xl border border-gray-200 dark:border-dark-border p-4 z-50 hidden" style="min-width: 280px;">
                                   <div>
                                        <label class="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">Select a date to jump to that week</label>
                                        <input type="date" id="weekDateInput" value="${weekStartDate}" 
                                               min="2025-06-30" max="2028-06-30"
                                               class="w-full px-3 py-2 bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border text-gray-800 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                               onchange="selectWeekFromDate(this.value)">
                                    </div>
                                </div>
                                `;
        })() : ''}
                                ${calendarView === 'day' ? (() => {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return `
                               <div id="dayPickerBackdrop" onclick="closeDayPicker()" class="fixed inset-0 bg-transparent z-40 hidden"></div>
                               <div id="dayPicker" class="fixed bg-white dark:bg-dark-card rounded-lg shadow-xl border border-gray-200 dark:border-dark-border p-4 z-50 hidden" style="min-width: 300px; max-height: 600px; overflow-y: auto;" onclick="event.stopPropagation();">
                                   <div class="flex items-center justify-between mb-4 relative">
                                        <button onclick="changeDayPickerMonth(-1); event.stopPropagation();" class="p-1 text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-bg rounded transition z-10">
                                            <i class="bi bi-chevron-left"></i>
                                        </button>
                                       <div class="text-center relative z-10">
                                            <button onclick="toggleDayPickerMonthSelector(); event.stopPropagation();" class="text-lg font-semibold text-gray-800 dark:text-white hover:text-red-600 transition cursor-pointer" id="dayPickerMonth">${monthNames[calendarMeta.monthIndex]}</button>
                                            <button onclick="toggleDayPickerYearSelector(); event.stopPropagation();" class="text-sm font-semibold text-gray-600 dark:text-dark-muted hover:text-red-600 transition cursor-pointer block mx-auto mt-1" id="dayPickerYear">${calendarMeta.year}</button>
                                        </div>
                                        <button onclick="changeDayPickerMonth(1); event.stopPropagation();" class="p-1 text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-bg rounded transition z-10">
                                            <i class="bi bi-chevron-right"></i>
                                        </button>
                                        
                                        <!-- Month Selector Dropdown -->
                                       <div id="dayPickerMonthSelector" onclick="event.stopPropagation()" class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border p-3 z-[100] hidden" style="min-width: 200px;">
                                           <div class="grid grid-cols-3 gap-2">
                                                ${monthNames.map((month, idx) => `
                                                    <button onclick="selectDayPickerMonth(${idx}); event.stopPropagation();" 
                                                            class="px-3 py-2 text-xs font-medium rounded-md transition ${idx === calendarMeta.monthIndex ? 'bg-red-600 text-white' : 'text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg'}">
                                                        ${month.substring(0, 3)}
                                                    </button>
                                                `).join('')}
                                            </div>
                                        </div>
                                        
                                        <!-- Year Selector Dropdown -->
                                       <div id="dayPickerYearSelector" onclick="event.stopPropagation()" class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border p-3 z-[100] hidden" style="min-width: 150px;">
                                           <div class="flex items-center justify-between mb-2">
                                                <button onclick="changeDayPickerYear(-1); event.stopPropagation();" class="p-1 text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-bg rounded transition">
                                                    <i class="bi bi-chevron-left text-xs"></i>
                                                </button>
                                                <span class="text-sm font-semibold text-gray-800 dark:text-white" id="dayPickerYearDisplay">${calendarMeta.year}</span>
                                                <button onclick="changeDayPickerYear(1); event.stopPropagation();" class="p-1 text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-bg rounded transition">
                                                    <i class="bi bi-chevron-right text-xs"></i>
                                                </button>
                                            </div>
                                            <input type="number" id="dayPickerYearInputQuick" value="${calendarMeta.year}" 
                                                   class="w-full px-3 py-1.5 bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-center text-gray-800 dark:text-white"
                                                   min="${CALENDAR_TERM_MIN_YEAR}" max="${CALENDAR_TERM_MAX_YEAR}"
                                                   onchange="selectDayPickerYear(parseInt(this.value)); event.stopPropagation();"
                                                   onclick="event.stopPropagation();"
                                                   placeholder="Enter year">
                                        </div>
                                    </div>
                               <div id="dayPickerCalendar">
                                    ${generateDayPickerCalendar(calendarMeta.year, calendarMeta.monthIndex)}
                                </div>
                               <div class="mt-4 flex items-center justify-between">
                                    <input type="number" id="dayPickerYearInput" value="${calendarMeta.year}" 
                                           class="w-24 px-3 py-1.5 bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border text-gray-800 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                           min="${CALENDAR_TERM_MIN_YEAR}" max="${CALENDAR_TERM_MAX_YEAR}"
                                           onchange="selectDayYearFromInput(this.value)">
                                    <button onclick="navigateCalendar('today'); closeDayPicker();" ${isCurrentlyOnToday() ? 'disabled' : ''} class="px-4 py-1.5 ${isCurrentlyOnToday() ? 'bg-gray-100 dark:bg-dark-bg text-gray-400 dark:text-dark-muted cursor-not-allowed' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'} rounded-md text-sm transition font-medium">
                                        Today
                                    </button>
                                    <button onclick="closeDayPicker()" class="px-4 py-1.5 bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-white rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                                        Close
                                    </button>
                                </div>
                                </div>
                                `;
        })() : ''}
                            </div>
                            <button onclick="navigateCalendar('next')" class="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg transition">
                                <i class="bi bi-chevron-right text-gray-600 dark:text-dark-muted"></i>
                            </button>
                            <button onclick="navigateCalendar('today')" ${calendarView === 'week' ? (isCurrentlyOnCurrentWeek() ? 'disabled' : '') : (isCurrentlyOnToday() ? 'disabled' : '')} class="px-3 py-2 text-sm ${calendarView === 'week' ? (isCurrentlyOnCurrentWeek() ? 'bg-gray-100 dark:bg-dark-bg text-gray-400 dark:text-dark-muted cursor-not-allowed' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30') : (isCurrentlyOnToday() ? 'bg-gray-100 dark:bg-dark-bg text-gray-400 dark:text-dark-muted cursor-not-allowed' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30')} rounded-lg transition font-medium">
                                ${calendarView === 'week' ? 'This Week' : 'Today'}
                            </button>
                        </div>
   <div class="flex items-center gap-4 flex-wrap">
       <div class="flex items-center gap-2 text-sm">
           <div class="w-3 h-3 rounded-full bg-blue-500"></div>
            <span class="text-gray-600 dark:text-dark-muted">Regular</span>
        </div>
       <div class="flex items-center gap-2 text-sm">
           <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span class="text-gray-600 dark:text-dark-muted">Special</span>
        </div>
       <div class="flex items-center gap-2 text-sm">
           <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <span class="text-gray-600 dark:text-dark-muted">Emergency</span>
        </div>
       <div class="flex items-center gap-2 text-sm">
           <div class="w-3 h-3 rounded-full bg-purple-500"></div>
            <span class="text-gray-600 dark:text-dark-muted">Notes</span>
        </div>
    </div>
                    </div>
   <div class="flex items-center justify-between flex-wrap gap-3">
       <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600 dark:text-dark-muted">View:</label>
            <select id="calendarViewFilter" onchange="setCalendarView(this.value)" class="input-field dark:bg-dark-bg dark:border-dark-border dark:text-white py-1.5 text-sm w-auto">
                <option value="month" ${calendarView === 'month' ? 'selected' : ''}>Monthly</option>
                <option value="week" ${calendarView === 'week' ? 'selected' : ''}>Weekly</option>
                <option value="day" ${calendarView === 'day' ? 'selected' : ''}>Daily</option>
            </select>
        </div>
       <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600 dark:text-dark-muted font-medium">Filter by Session Type:</label>
            <select id="sessionTypeFilter" onchange="window.filterCalendarBySessionType(this.value)" class="input-field dark:bg-dark-bg dark:border-dark-border dark:text-white py-1.5 text-sm w-auto">
                <option value="all" ${window.selectedSessionType === 'all' ? 'selected' : ''}>All</option>
                <option value="regular" ${window.selectedSessionType === 'regular' ? 'selected' : ''}>Regular</option>
                <option value="special" ${window.selectedSessionType === 'special' ? 'selected' : ''}>Special</option>
                <option value="emergency" ${window.selectedSessionType === 'emergency' ? 'selected' : ''}>Emergency</option>
            </select>
        </div>
    </div>
                </div>
            </div>

   <div class="p-6">
       <div id="calendarGrid"></div>
    </div>
        </div>
    </div>
    `;

    document.getElementById('content-area').innerHTML = html;
    renderCalendarGrid();
};

// Initialize filter state
window.selectedSessionType = window.selectedSessionType || 'all';

window.filterCalendarBySessionType = function (type) {
    window.selectedSessionType = type;
    renderCalendarGrid();
};

// Helper function to get session color classes based on type
function getSessionColorClass(sessionType) {
    const typeColors = {
        'Regular Session': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        'Special Session': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
        'Emergency Session': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        'regular': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        'special': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
        'emergency': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    };
    return typeColors[sessionType] || 'bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-dark-muted';
}

window.renderCalendarGrid = function () {
    const gridContainer = document.getElementById('calendarGrid');
    if (!gridContainer) return;

    const calendarMeta = getCurrentCalendarMeta();
    const month = calendarMeta.monthIndex + 1;
    const year = calendarMeta.year;
    const today = new Date();
    const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear();

    if (calendarView === 'week') {
        const { startDate } = getCurrentWeekBounds(calendarMeta);
        let gridHTML = '<div class="grid grid-cols-7 gap-2">';
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 0; i < 7; i++) {
            const dateObj = new Date(startDate);
            dateObj.setDate(startDate.getDate() + i);
            const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
            const isToday = dateObj.toDateString() === today.toDateString();

            // Filter sessions by type
            const sessionsOnDate = window.calendarSessions.filter(s => {
                const matchesDate = s.session_date === dateKey;
                if (!matchesDate) return false;
                if (!window.selectedSessionType || window.selectedSessionType === 'all') return true;

                const type = s.session_type.toLowerCase();
                return type.includes(window.selectedSessionType.toLowerCase());
            });
            const dayNotes = window.calendarNotes && window.calendarNotes[dateKey] || [];
            const hasNote = dayNotes.length > 0;

            gridHTML += `
    <div onclick="openDateModal('${dateKey}', ${dateObj.getDate()}, '${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}')"
class="p-3 border-2 ${isToday ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-dark-border'} rounded-lg min-h-[140px] hover:border-red-400 dark:hover:border-red-900 hover:shadow-md transition-all cursor-pointer group">
                   <div class="flex items-center justify-between mb-2">
                       <div>
                           <div class="text-xs text-gray-500 dark:text-dark-muted">${dayNames[dateObj.getDay()]}</div>
                           <div class="font-bold ${isToday ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'} group-hover:text-red-600 dark:group-hover:text-red-400">${dateObj.getDate()}</div>
                        </div>
                    </div>
                   <div class="space-y-1">
                        ${hasNote ? `
                           <div class="text-[11px] px-2 py-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900/30 text-purple-700 dark:text-purple-400 rounded truncate" title="${dayNotes[0].note}">
                                ${dayNotes[0].note.substring(0, 16)}${dayNotes[0].note.length > 16 ? '...' : ''}
                            </div>
                        ` : ''}
                        ${sessionsOnDate.slice(0, hasNote ? 2 : 3).map(s => `
                           <div class="text-[11px] px-2 py-1 ${getSessionColorClass(s.session_type)} rounded truncate" title="${s.title}">
                                ${s.title.substring(0, 18)}${s.title.length > 18 ? '...' : ''}
                            </div>
                        `).join('')}
                        ${sessionsOnDate.length > (hasNote ? 2 : 3) ? `<div class="text-[11px] text-gray-500 dark:text-dark-muted">+${sessionsOnDate.length - (hasNote ? 2 : 3)} more</div>` : ''}
                    </div>
                </div>
    `;
        }

        gridHTML += '</div>';
        gridContainer.innerHTML = gridHTML;
        return;
    }

    if (calendarView === 'day') {
        const day = calendarMeta.todayDate;
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const user = getCurrentUser();
        const role = user ? user.role : 'User';
        const isToday = new Date().toDateString() === new Date(calendarMeta.year, calendarMeta.monthIndex, day).toDateString();

        const [py, pm, pd] = dateKey.split('-').map(Number);
        const targetDate = new Date(py, pm - 1, pd);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isPast = targetDate < today;

        // Filter sessions by type
        const sessionsOnDate = window.calendarSessions.filter(s => {
            const matchesDate = s.session_date === dateKey;
            if (!matchesDate) return false;
            if (!window.selectedSessionType || window.selectedSessionType === 'all') return true;

            const type = s.session_type.toLowerCase();
            return type.includes(window.selectedSessionType.toLowerCase());
        });
        const dayNotes = window.calendarNotes && window.calendarNotes[dateKey] || [];
        const hasNote = dayNotes.length > 0;

        gridContainer.innerHTML = `
   <div class="border border-gray-200 dark:border-dark-border rounded-lg p-4 ${isToday ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-dark-card'}" >
               <div class="flex items-center justify-between mb-3">
                   <div>
                       <div class="text-sm text-gray-500 dark:text-dark-muted">${new Date(dateKey).toLocaleDateString('en-US', { weekday: 'long' })}</div>
                       <div class="text-2xl font-bold ${isToday ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}">${new Date(dateKey).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                </div>
                <div class="space-y-3">
                    ${dayNotes.map(n => `
                       <div class="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900/30 rounded-lg mb-2">
                           <div class="flex items-center justify-between mb-1">
                                <div class="font-semibold text-purple-900 dark:text-purple-400">Note</div>
                            <div class="flex items-center gap-1">
                                <button onclick="openEditNoteModal('${dateKey}', ${day}, '${year}-${String(month).padStart(2, '0')}', ${n.note_id})" class="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded" title="Edit note">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button onclick="saveEditNote('${dateKey}', ${n.note_id}, 'delete')" class="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title="Delete note">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                           </div>
                           <div class="text-sm text-purple-700 dark:text-purple-300">${n.note}</div>
                        </div>
                    `).join('')}
                    ${sessionsOnDate.length > 0 ? sessionsOnDate.map(s => {
            const sessionTypeColors = {
                'Regular Session': 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30',
                'Special Session': 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/30',
                'Emergency Session': 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30',
                'regular': 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30',
                'special': 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/30',
                'emergency': 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30'
            };
            const bgColor = sessionTypeColors[s.session_type] || 'bg-gray-50 dark:bg-dark-bg border-gray-200 dark:border-dark-border';
            return `
                       <div class="p-3 ${bgColor} border rounded-lg">
                           <div class="font-semibold text-gray-900 dark:text-white mb-1">${s.title}</div>
                           <div class="text-sm text-gray-600 dark:text-dark-muted flex items-center gap-2">
                                <i class="bi bi-clock"></i> ${s.start_time || 'All day'}
                            </div>
                        </div>
                    `;
        }).join('') : (!hasNote ? '<div class="text-gray-500 dark:text-dark-muted text-sm">No sessions for this day.</div>' : '')}
                </div>
               <div class="mt-4">
                    ${!isPast && role !== 'User - Committee' ? `
                    <button onclick="openCreateSessionModal('${dateKey}')" class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center justify-center gap-2">
                        <i class="bi bi-plus-lg"></i> Add New Session
                    </button>
                    ` : ''}
                </div>
            </div>
    `;
        return;
    }

    // Default: Month view
    const daysInMonth = calendarMeta.daysInMonth;
    const firstDay = new Date(year, month - 1, 1).getDay();

    let gridHTML = '<div class="grid grid-cols-7 gap-2">';

    // Day headers
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    dayNames.forEach(day => {
        gridHTML += `<div class="p-3 text-center font-bold text-gray-700 dark:text-dark-text text-sm">${day}</div>`;
    });

    for (let i = 0; i < firstDay; i++) {
        gridHTML += '<div class="aspect-square"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = isCurrentMonth && day === today.getDate();

        // Filter sessions by type
        const sessionsOnDate = window.calendarSessions.filter(s => {
            const matchesDate = s.session_date === dateKey;
            if (!matchesDate) return false;
            if (!window.selectedSessionType || window.selectedSessionType === 'all') return true;

            const type = s.session_type.toLowerCase();
            return type.includes(window.selectedSessionType.toLowerCase());
        });
        const dayNotes = window.calendarNotes && window.calendarNotes[dateKey] || [];
        const hasNote = dayNotes.length > 0;

        gridHTML += `
    <div onclick="openDateModal('${dateKey}', ${day}, '${year}-${String(month).padStart(2, '0')}')"
class="aspect-square border-2 ${isToday ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-dark-border'} rounded-lg p-2 hover:border-red-400 dark:hover:border-red-900 hover:shadow-md transition-all cursor-pointer group">
   <div class="h-full flex flex-col">
       <div class="flex items-center justify-between mb-1">
            <span class="font-bold ${isToday ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'} group-hover:text-red-600 dark:group-hover:text-red-400">${day}</span>
        </div>
       <div class="flex-1 overflow-hidden space-y-1">
            ${hasNote ? `
                           <div class="text-[10px] px-1 py-0.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900/30 text-purple-700 dark:text-purple-400 rounded truncate" title="${dayNotes[0].note}">
                                ${dayNotes[0].note.substring(0, 12)}${dayNotes[0].note.length > 12 ? '...' : ''}
                            </div>
                            ${dayNotes.length > 1 ? `<div class="text-[9px] text-purple-400 dark:text-purple-500 font-medium ml-1">+${dayNotes.length - 1} more notes</div>` : ''}
                        ` : ''}
            ${sessionsOnDate.slice(0, hasNote ? 1 : 2).map(s => `
                           <div class="text-[10px] px-1 py-0.5 ${getSessionColorClass(s.session_type)} rounded truncate" title="${s.title}">
                                ${s.title.substring(0, 15)}${s.title.length > 15 ? '...' : ''}
                            </div>
                        `).join('')}
            ${sessionsOnDate.length > (hasNote ? 1 : 2) ? `<div class="text-[10px] text-gray-500 dark:text-dark-muted">+${sessionsOnDate.length - (hasNote ? 1 : 2)} more</div>` : ''}
        </div>
    </div>
            </div>
    `;
    }

    gridHTML += '</div>';
    gridContainer.innerHTML = gridHTML;
};

window.openDateModal = function (dateKey, day, yearMonth) {
    const user = getCurrentUser();
    const role = user ? user.role : 'User';
    const sessionsOnDate = window.calendarSessions.filter(s => s.session_date === dateKey);
    const dayNotes = window.calendarNotes[dateKey] || [];
    console.log(`Opening Date Modal for ${dateKey}`, {
        availableNotes: window.calendarNotes,
        foundNotesForDate: dayNotes
    });
    const dateObj = new Date(dateKey);
    const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const [py, pm, pd] = dateKey.split('-').map(Number);
    const targetDate = new Date(py, pm - 1, pd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = targetDate < today;

    const modalHtml = `
    <div id="dateModal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-sm">
       <div class="relative p-6 border dark:border-dark-border w-full max-w-2xl shadow-2xl rounded-2xl bg-white dark:bg-dark-card animate-fade-in-up m-4 max-h-[90vh] overflow-y-auto">
           <div class="flex justify-between items-center mb-6">
               <div>
                    <h3 class="text-2xl font-bold text-red-800 dark:text-red-400">${formattedDate}</h3>
                    <p class="text-sm text-gray-500 dark:text-red-300 mt-1">Sessions and notes for this date</p>
                </div>
                <button onclick="document.getElementById('dateModal').remove()" class="text-gray-400 dark:text-dark-muted hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg p-2 transition">
                    <i class="bi bi-x-lg text-xl"></i>
                </button>
            </div>

           <div class="space-y-6">
                <!-- Sessions on this date -->
               <div>
                    <h4 class="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                        <i class="bi bi-calendar-event text-red-600"></i>
                        Versions / Sessions (${sessionsOnDate.length})
                    </h4>
                    ${sessionsOnDate.length > 0 ? `
                           <div class="space-y-2">
                                ${sessionsOnDate.map(s => {
        const sessionTypeBgColors = {
            'Regular Session': 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30',
            'Special Session': 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/30',
            'Emergency Session': 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30',
            'regular': 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30',
            'special': 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/30',
            'emergency': 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30'
        };
        const sessionTypeBadgeColors = {
            'Regular Session': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
            'Special Session': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
            'Emergency Session': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
            'regular': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
            'special': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
            'emergency': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        };
        const bgColor = sessionTypeBgColors[s.session_type] || 'bg-gray-50 dark:bg-dark-bg border-gray-200 dark:border-dark-border';
        const badgeColor = sessionTypeBadgeColors[s.session_type] || 'bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-dark-muted';
        return `
                                   <div class="p-4 ${bgColor} border rounded-lg">
                                       <div class="flex items-start justify-between">
                                           <div class="flex-1">
                                                <h5 class="font-semibold text-gray-900 dark:text-white mb-1">${s.title}</h5>
                                                <div class="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-dark-muted">
                                                    <span class="flex items-center gap-1">
                                                        <i class="bi bi-clock"></i>
                                                        ${(s.start_time || s.end_time) ? `${s.start_time || '??'} - ${s.end_time || '??'}` : 'Time not set'}
                                                    </span>
                                                    ${s.venue ? `
                                                    <span class="flex items-center gap-1">
                                                        <i class="bi bi-geo-alt"></i>
                                                        ${s.venue}
                                                    </span>
                                                    ` : ''}
                                                    <span class="flex items-center gap-1">
                                                        <i class="bi bi-person text-red-500"></i>
                                                        ${s.creator_name || 'System'}
                                                    </span>
                                                </div>
                                                ${s.assigned_staff_names && s.assigned_staff_names.length > 0 ? `
                                                <div class="mt-2 flex flex-wrap gap-1">
                                                    <i class="bi bi-people text-blue-500 text-xs"></i>
                                                    <span class="text-[10px] text-gray-500 dark:text-dark-muted font-medium">Assigned: ${s.assigned_staff_names.join(', ')}</span>
                                                </div>
                                                ` : ''}
                                            </div>
                                            <div class="flex flex-col items-end gap-2">
                                                <span class="px-2 py-1 ${badgeColor} rounded-full text-xs font-medium">
                                                    ${s.status}
                                                </span>
                                                <button onclick="document.getElementById('dateModal').remove(); showSection('sessions').then(() => { if (window.viewSessionDetails) window.viewSessionDetails(${s.session_id}); })" 
                                                        class="px-3 py-1 bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-white rounded-lg hover:border-red-400 dark:hover:border-red-900 hover:text-red-600 transition text-xs font-semibold flex items-center gap-1 shadow-sm">
                                                    <i class="bi bi-eye"></i> View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `;
    }).join('')}
                            </div>
                           <div class="mt-3">
                                ${!isPast && role !== 'User - Committee' ? `
                                <button onclick="document.getElementById('dateModal').remove(); openCreateSessionModal('${dateKey}')" 
                                        class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center justify-center gap-2">
                                    <i class="bi bi-plus-lg"></i> Add New Session
                                </button>
                                ` : ''}
                            </div>
                        ` : `
                            <div class="p-4 bg-gray-50 dark:bg-dark-bg/50 border border-gray-200 dark:border-dark-border rounded-lg text-center">
                                 <i class="bi bi-calendar-x text-2xl mb-2 text-gray-400 dark:text-dark-muted"></i>
                                 <p class="text-sm text-gray-500 dark:text-dark-muted mb-3">No sessions scheduled for this date</p>
                                 ${!isPast && role !== 'User - Committee' ? `
                                 <button onclick="document.getElementById('dateModal').remove(); openCreateSessionModal('${dateKey}')" 
                                         class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center gap-2 mx-auto">
                                     <i class="bi bi-plus-lg"></i> Add New Session
                                 </button>
                                 ` : ''}
                             </div>
                        `}
                </div>

                <!-- Notes Section -->
               <div>
                    <h4 class="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                        <i class="bi bi-sticky text-purple-600"></i>
                        Personal Notes (${dayNotes.length})
                    </h4>
                    <div class="space-y-3 mb-4">
                        ${dayNotes.map(n => `
                            <div class="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900/30 rounded-lg relative group">
                                <p class="text-sm text-purple-700 dark:text-purple-300 whitespace-pre-wrap">${n.note}</p>
                                <div class="absolute top-2 right-2 flex items-center gap-1">
                                    <button onclick="document.getElementById('dateModal').remove(); openEditNoteModal('${dateKey}', ${day}, '${yearMonth}', ${n.note_id})" class="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition" title="Edit Note">
                                        <i class="bi bi-pencil-square"></i>
                                    </button>
                                    <button onclick="saveEditNote('${dateKey}', ${n.note_id}, 'delete')" class="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title="Delete Note">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <button onclick="document.getElementById('dateModal').remove(); openEditNoteModal('${dateKey}', ${day}, '${yearMonth}')" class="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg text-gray-500 dark:text-dark-muted hover:border-purple-400 dark:hover:border-purple-600 hover:text-purple-600 dark:hover:text-purple-400 transition flex items-center justify-center gap-2">
                        <i class="bi bi-plus-lg"></i> Add Note
                    </button>
                </div>
            </div>
        </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.openEditNoteModal = function (dateKey, day, yearMonth, noteId = null) {
    let currentNoteText = '';
    if (noteId) {
        const dayNotes = window.calendarNotes[dateKey] || [];
        const noteFound = dayNotes.find(n => n.note_id == noteId);
        currentNoteText = noteFound ? noteFound.note : '';
    }
    const dateObj = new Date(dateKey);
    const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const modalHtml = `
    <div id="editNoteModal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-sm">
       <div class="relative p-6 border dark:border-dark-border w-full max-w-2xl shadow-2xl rounded-2xl bg-white dark:bg-dark-card animate-fade-in-up m-4">
           <div class="flex justify-between items-center mb-6">
               <div>
                    <h3 class="text-2xl font-bold text-red-800 dark:text-red-400">Edit Note</h3>
                    <p class="text-sm text-gray-500 dark:text-red-300 mt-1">${formattedDate}</p>
                </div>
                <button onclick="document.getElementById('editNoteModal').remove()" class="text-gray-400 dark:text-dark-muted hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg p-2 transition">
                    <i class="bi bi-x-lg text-xl"></i>
                </button>
            </div>

           <div class="space-y-6">
               <div>
                    <h4 class="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                        <i class="bi bi-sticky text-purple-600"></i>
                        Personal Notes
                    </h4>
                    <textarea id="editDateNote" rows="6" placeholder="Add your notes for this date..."
                        class="w-full px-4 py-3 bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none">${currentNoteText}</textarea>
                </div>

               <div class="flex gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                    ${noteId ? `
                    <button onclick="saveEditNote('${dateKey}', ${noteId}, 'delete')" class="px-4 py-3 border border-red-300 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition">
                        Delete
                    </button>
                    ` : ''}
                    <button onclick="saveEditNote('${dateKey}', ${noteId})" class="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition text-center">
                        <i class="bi bi-check-lg mr-2"></i> ${noteId ? 'Update Note' : 'Add Note'}
                    </button>
                </div>
            </div>
        </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.saveEditNote = async function (dateKey, noteId = null, action = 'save') {
    const noteTextElement = document.getElementById('editDateNote') || document.getElementById('dateNote');
    const noteText = noteTextElement ? noteTextElement.value.trim() : '';

    if (action === 'delete') {
        const confirmed = await confirm('Are you sure you want to delete this note? This action cannot be undone.');
        if (!confirmed) return;
    }

    try {
        const response = await fetch('../api/api_user_notes.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                note_id: noteId,
                note_date: dateKey,
                note: noteText,
                action: action
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', errorText);
            throw new Error(`Server returned ${response.status}: ${errorText.substring(0, 50)}...`);
        }

        const result = await response.json();
        if (result.success) {
            showNotification(result.message, 'success');
            // Remove modals
            const editModal = document.getElementById('editNoteModal');
            if (editModal) editModal.remove();
            const dateModal = document.getElementById('dateModal');
            if (dateModal) dateModal.remove();

            // Refresh calendar data and grid
            renderCalendarEnhanced();
        } else {
            showNotification(result.message || 'Error saving note', 'error');
        }
    } catch (e) {
        console.error('Error saving note:', e);
        showNotification('Note Error: ' + e.message, 'error');
    }
};

window.saveDateNote = function (dateKey) {
    saveEditNote(dateKey);
};

// Final ensure global pointers are set
window.renderCalendar = window.renderCalendarEnhanced;
window.renderAdminCalendar = window.renderCalendarEnhanced;
window.renderStaffCalendar = window.renderCalendarEnhanced;