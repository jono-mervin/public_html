// Public Portal Module for LACS
// Contains the public portal functionality
// Intended to be loaded after main-features.js

// ==============================
// PUBLIC PORTAL MODULE
// ==============================
function renderPublicPortal(view = 'home') {
    try {
        // This function renders the public-facing side of the application
        // It purposefully replaces the entire #content-area to simulate a separate portal experience
        // In a real app, this might be a separate HTML file or route

        const contentArea = document.getElementById('content-area');

        // Ensure theme is initialized
        initializeTheme();

        // Portal Header/Nav - Matching admin side design
        const getPageTitle = (view) => {
            const titles = {
                'home': 'Public Portal',
                'sessions': 'Legislative Sessions',
                'agendas': 'Agendas & Minutes',
                'documents': 'Document Archive',
                'announcements': 'City Announcements',
                'about': 'About the Portal'
            };
            return titles[view] || 'Public Portal';
        };

        const portalHeader = `
        <nav class="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors duration-300">
            <div class="px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <!-- Left Side: Logo and Title -->
                    <div class="flex items-center">
                        <!-- Logo -->
                        <div class="flex items-center space-x-3 cursor-pointer" onclick="renderPublicPortal('home')">
                            <div class="bg-white dark:bg-gray-700 rounded-full p-1.5 shadow-md">
                                <img src="images/logo.png" alt="Valenzuela Logo" class="w-8 h-8 object-contain">
                            </div>
                            <div class="hidden md:block">
                                <h2 class="text-base md:text-xl font-bold text-gray-800 dark:text-white">${getPageTitle(view)}</h2>
                                <nav class="hidden md:flex text-sm text-gray-600 dark:text-gray-400 mt-0.5" aria-label="Breadcrumb">
                                    <a href="#" onclick="renderPublicPortal('home'); return false;" class="hover:text-red-600 dark:hover:text-red-400">Home</a>
                                    ${view !== 'home' ? `
                                        <i class="bi bi-chevron-right mx-2 text-xs"></i>
                                        <span class="text-gray-800 dark:text-gray-200 font-medium">${getPageTitle(view)}</span>
                                    ` : ''}
                                </nav>
                            </div>
                        </div>
                    </div>

                    <!-- Right Side Actions -->
                    <div class="flex items-center space-x-1 md:space-x-4">
                        <!-- Live Date & Time -->
                        <div id="portal-navbar-datetime" class="flex flex-col items-end mr-2 leading-tight text-xs">
                            <span id="portal-navbar-date" class="font-medium text-gray-700 dark:text-gray-300"></span>
                            <span id="portal-navbar-time" class="font-mono text-gray-500 dark:text-gray-400"></span>
                        </div>

                        <!-- Quick Search Icon -->
                        <button onclick="openPortalSearch()" class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition inline-flex" title="Quick search">
                            <i class="bi bi-search text-lg"></i>
                        </button>

                        <!-- Dark Mode Toggle -->
                        <button onclick="window.toggleTheme(); updatePortalDateTime();" class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition" title="Toggle dark mode">
                            <i class="bi bi-moon-fill text-lg md:text-xl dark-mode-icon"></i>
                            <i class="bi bi-sun-fill text-xl light-mode-icon hidden"></i>
                        </button>

                        ${getCurrentUser() ? `
                            <!-- User Profile -->
                            <div class="relative">
                                <button onclick="togglePortalProfile()" class="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                                    <div class="bg-red-600 rounded-full w-8 h-8 flex items-center justify-center text-white">
                                        <i class="bi bi-person-fill text-sm"></i>
                                    </div>
                                    <div class="hidden sm:block text-left">
                                        <p class="text-sm font-medium text-gray-800 dark:text-white truncate max-w-[120px]">${getCurrentUser().name.split(' ')[0]}</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">Public User</p>
                                    </div>
                                </button>
                            </div>
                        ` : `
                            <button onclick="logout()" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition">
                                Sign In
                            </button>
                        `}
                    </div>
                </div>
            </div>
        </nav>
    `;

        // Portal Footer
        const portalFooter = `
        <footer class="bg-gray-800 dark:bg-gray-950 text-white pt-12 pb-6 mt-auto transition-colors duration-300">
            <div class="container mx-auto px-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <div class="flex items-center gap-2 mb-4">
                            <img src="images/logo.png" alt="Logo" class="h-8 w-8 brightness-0 invert">
                            <span class="font-bold text-lg">Valenzuela City</span>
                        </div>
                        <p class="text-gray-400 text-sm mb-4">Promoting transparency and public participation in local governance.</p>
                        <div class="flex gap-3">
                            <a href="#" class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-red-600 transition"><i class="bi bi-facebook"></i></a>
                            <a href="#" class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-blue-400 transition"><i class="bi bi-twitter"></i></a>
                            <a href="#" class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-red-500 transition"><i class="bi bi-youtube"></i></a>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-bold mb-4">Quick Links</h4>
                        <ul class="space-y-2 text-sm text-gray-400">
                            <li><a href="#" onclick="renderPublicPortal('sessions')" class="hover:text-white">Legislative Sessions</a></li>
                            <li><a href="#" onclick="renderPublicPortal('documents')" class="hover:text-white">Ordinances & Resolutions</a></li>
                            <li><a href="#" onclick="renderPublicPortal('agendas')" class="hover:text-white">Download Agendas</a></li>
                            <li><a href="#" onclick="renderPublicPortal('about')" class="hover:text-white">About the Council</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-bold mb-4">Contact Us</h4>
                        <ul class="space-y-2 text-sm text-gray-400">
                            <li class="flex gap-2"><i class="bi bi-geo-alt"></i> MacArthur Highway, Karuhatan, Valenzuela City</li>
                            <li class="flex gap-2"><i class="bi bi-telephone"></i> (02) 8352-1000</li>
                            <li class="flex gap-2"><i class="bi bi-envelope"></i> info@valenzuela.gov.ph</li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-bold mb-4">Subscription</h4>
                        <p class="text-gray-400 text-sm mb-3">Get the latest updates directly in your inbox.</p>
                        <div class="flex gap-2">
                            <input type="email" placeholder="Your email" class="bg-gray-700 border-none text-white text-sm rounded px-3 py-2 flex-grow focus:ring-1 focus:ring-red-500">
                            <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium">Subscribe</button>
                        </div>
                    </div>
                </div>
                <div class="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
                    <p>&copy; 2025 City Government of Valenzuela. All rights reserved.</p>
                    <div class="flex gap-4 mt-2 md:mt-0">
                        <a href="#" class="hover:text-white">Privacy Policy</a>
                        <a href="#" class="hover:text-white">Terms of Use</a>
                        <a href="#" class="hover:text-white">Accessibility</a>
                    </div>
                </div>
            </div>
        </footer>
    `;

        // Render Content based on View
        let mainContent = '';
        switch (view) {
            case 'home': mainContent = renderPublicHome(); break;
            case 'sessions': mainContent = renderPublicSessions(); break;
            case 'agendas': mainContent = renderPublicAgendas(); break;
            case 'documents': mainContent = renderPublicDocuments(); break;
            case 'announcements': mainContent = renderPublicAnnouncements(); break;
            case 'about': mainContent = renderPublicAbout(); break;
            default: mainContent = renderPublicHome();
        }

        // Assemble Full Page
        // We override the layout completely for the public portal
        // Assemble Full Page with Smooth Transition
        const existingRoot = document.getElementById('public-portal-root');

        // The HTML content to render with Dark Mode body classes
        const newBodyHTML = `
        <div id="public-portal-root" class="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 font-sans transition-opacity duration-300 ease-in-out opacity-0 transition-colors duration-300">
            ${portalHeader}
            <main class="flex-grow bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                ${mainContent}
            </main>
            ${portalFooter}
        </div>
    `;;

        if (existingRoot) {
            // Transitioning between portal pages: Fade Out -> Swap -> Fade In
            existingRoot.classList.add('opacity-0');

            setTimeout(() => {
                document.body.innerHTML = newBodyHTML;
                window.scrollTo(0, 0);

                // Trigger reflow/wait for render then Fade In
                requestAnimationFrame(() => {
                    const newRoot = document.getElementById('public-portal-root');
                    if (newRoot) newRoot.classList.remove('opacity-0');
                    updatePortalDateTime();
                });
            }, 300); // 300ms matches the duration-300 class
        } else {
            // Initial Load or Fallback: Immediate force render
            // Eliminate usage of opacity-0 on first paint to guarantee visibility
            const fallbackHTML = `
            <div id="public-portal-root" class="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 font-sans transition-colors duration-300">
                ${portalHeader}
                <main class="flex-grow bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                    ${mainContent}
                </main>
                ${portalFooter}
            </div>
        `;;
            document.body.innerHTML = fallbackHTML;
            updatePortalDateTime();
        }

        // Initialize date/time update for portal
        if (!window.portalDateTimeInterval) {
            window.portalDateTimeInterval = setInterval(updatePortalDateTime, 1000);
        }

        // URL Hash update
        // window.location.hash = `portal/${view}`;

    } catch (error) {
        console.error("Portal Render Error:", error);
        // Fallback: If fancy render fails, just show a basic error or force reload
        document.body.innerHTML = `<div class="p-8 text-center"><h1 class="text-2xl text-red-600">Error Loading Portal</h1><p>${error.message}</p><button onclick="location.reload()" class="mt-4 px-4 py-2 bg-gray-200 rounded">Reload</button></div>`;
    }
}

function renderPublicHome() {
    const user = getCurrentUser();
    return `
        <div class="container mx-auto px-4 py-6 min-h-full">
            <div class="flex flex-col lg:flex-row gap-6">
                
                <!-- Left Sidebar: Profile & Navigation -->
                <aside class="lg:w-1/4 space-y-6 hidden lg:block">
                    <!-- User Profile Card -->
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div class="h-20 bg-gradient-to-br from-red-600 via-red-700 to-red-800"></div>
                        <div class="px-6 pb-6 -mt-10 text-center">
                            <div class="inline-block p-1 bg-white dark:bg-gray-700 rounded-2xl shadow-md mb-3">
                                <div class="w-20 h-20 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-3xl font-black shadow-inner">
                                    ${user ? user.name.charAt(0) : 'G'}
                                </div>
                            </div>
                            <h3 class="text-lg font-black text-gray-900 dark:text-white">${user ? user.name : 'Guest User'}</h3>
                            <p class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">${user ? 'Citizen Account' : 'Public Access'}</p>
                            
                            <div class="mt-6 pt-6 border-t border-gray-50 dark:border-gray-700 grid grid-cols-2 gap-4">
                                <div>
                                    <p class="text-lg font-black text-red-600 dark:text-red-500">12</p>
                                    <p class="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter">Saved Docs</p>
                                </div>
                                <div>
                                    <p class="text-lg font-black text-red-600 dark:text-red-500">5</p>
                                    <p class="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter">Followed</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Navigation -->
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                        <nav class="space-y-1">
                            <a href="#" onclick="renderPublicPortal('home')" class="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-bold transition-all">
                                <i class="bi bi-house-door-fill text-xl"></i>
                                <span>Feed</span>
                            </a>
                            <a href="#" onclick="renderPublicPortal('sessions')" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 transition-all">
                                <i class="bi bi-people text-xl"></i>
                                <span>Sessions</span>
                            </a>
                            <a href="#" onclick="renderPublicPortal('documents')" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 transition-all">
                                <i class="bi bi-file-earmark-text text-xl"></i>
                                <span>Documents</span>
                            </a>
                            <a href="#" onclick="renderPublicPortal('announcements')" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 transition-all">
                                <i class="bi bi-megaphone text-xl"></i>
                                <span>Announcements</span>
                            </a>
                        </nav>
                    </div>

                    <!-- Portal Stats Widget -->
                    <div class="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-red-600 opacity-20 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                        <h4 class="text-xs font-black uppercase tracking-widest text-red-500 mb-4">Portal Impact</h4>
                        <div class="space-y-4">
                            <div class="flex justify-between items-end">
                                <span class="text-xs text-gray-400">Total Ordinances</span>
                                <span class="text-xl font-black">1,240</span>
                            </div>
                            <div class="flex justify-between items-end">
                                <span class="text-xs text-gray-400">Public Sessions</span>
                                <span class="text-xl font-black">452</span>
                            </div>
                        </div>
                    </div>
                </aside>

                <!-- Center Column: Main Feed -->
                <main class="lg:w-1/2 space-y-6">
                    <!-- Create Post Placeholder (Social Media Style) -->
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                        <div class="flex gap-3">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-800/20 flex items-center justify-center p-1.5 shadow-inner border border-red-200/50 dark:border-red-700/30">
                                <img src="images/logo.png" alt="Logo" class="w-full h-full object-contain">
                            </div>
                            <button class="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full px-5 text-left text-gray-500 dark:text-gray-400 text-sm transition-colors font-medium">
                                Search for legislative updates...
                            </button>
                        </div>
                        <div class="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-around">
                            <button class="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-xl transition-all">
                                <i class="bi bi-file-earmark-pdf text-red-500 text-lg"></i>
                                <span>Ordinances</span>
                            </button>
                            <button class="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-xl transition-all">
                                <i class="bi bi-calendar-check text-blue-500 text-lg"></i>
                                <span>Sessions</span>
                            </button>
                            <button class="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-xl transition-all">
                                <i class="bi bi-megaphone text-orange-500 text-lg"></i>
                                <span>News</span>
                            </button>
                        </div>
                    </div>

                    <!-- Feed Items -->
                    <div class="space-y-6">
                        <!-- Announcements Feed -->
                        ${getAnnouncements().slice(0, 5).filter(a => a.published).map(a => `
                            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                                <!-- Post Header -->
                                <div class="p-4 flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm">
                                            <i class="bi bi-megaphone-fill text-xl"></i>
                                        </div>
                                        <div>
                                            <h4 class="text-sm font-black text-gray-900 dark:text-white">City Secretariat</h4>
                                            <div class="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                                                <span>${a.date}</span>
                                                <span>•</span>
                                                <span class="text-red-500 dark:text-red-400">${a.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button class="text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 p-2"><i class="bi bi-three-dots"></i></button>
                                </div>

                                <!-- Post Content -->
                                <div class="px-4 pb-4">
                                    <h3 class="text-lg font-black text-gray-900 dark:text-white mb-2 leading-tight hover:text-red-600 dark:hover:text-red-400 cursor-pointer" onclick="viewAnnouncementDetails(${a.id})">${a.title}</h3>
                                    <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">${a.content}</p>
                                    ${a.image ? `
                                        <div class="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 mb-4">
                                            <img src="${a.image}" class="w-full h-auto object-cover max-h-96" alt="Post Image">
                                        </div>
                                    ` : ''}
                                </div>

                                <!-- Post Actions (Social Media Style) -->
                                <div class="px-4 py-3 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                                    <div class="flex gap-1">
                                        <button class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all group">
                                            <i class="bi bi-heart group-hover:scale-110 transition-transform"></i>
                                            <span class="text-xs font-bold">Helpful</span>
                                        </button>
                                        <button class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all group">
                                            <i class="bi bi-chat group-hover:scale-110 transition-transform"></i>
                                            <span class="text-xs font-bold">Discuss</span>
                                        </button>
                                    </div>
                                    <button class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all">
                                        <i class="bi bi-share"></i>
                                        <span class="text-xs font-bold">Share</span>
                                    </button>
                                </div>
                            </div>
                        `).join('')}

                        <!-- Featured Session Card -->
                        <div class="bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
                            <div class="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full -mr-24 -mt-24"></div>
                            <div class="relative z-10">
                                <div class="flex justify-between items-start mb-6">
                                    <div>
                                        <span class="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">Upcoming Session</span>
                                        <h3 class="text-2xl font-black mt-3">14th Regular Session</h3>
                                    </div>
                                    <div class="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                                        <i class="bi bi-calendar-event text-2xl"></i>
                                    </div>
                                </div>
                                <div class="flex flex-wrap gap-6 mb-8">
                                    <div class="flex items-center gap-2">
                                        <i class="bi bi-clock text-red-200"></i>
                                        <span class="text-sm font-bold">Dec 18, 2025 · 2:00 PM</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <i class="bi bi-geo-alt text-red-200"></i>
                                        <span class="text-sm font-bold">Session Hall</span>
                                    </div>
                                </div>
                                <div class="flex gap-3">
                                    <button class="flex-1 py-3 bg-white text-red-700 rounded-xl font-black text-sm hover:bg-red-50 transition-all shadow-lg">View Agenda</button>
                                    <button class="px-4 py-3 bg-red-900/40 hover:bg-red-900/60 rounded-xl transition-all border border-white/10">
                                        <i class="bi bi-bell-fill"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <!-- Right Sidebar: Widgets -->
                <aside class="lg:w-1/4 space-y-6">
                    <!-- Trending Documents -->
                    <!-- Trending Documents -->
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <h4 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center justify-between">
                            <span>Trending Docs</span>
                            <i class="bi bi-graph-up-arrow text-red-500"></i>
                        </h4>
                        <div class="space-y-5">
                            <div class="flex gap-3 group cursor-pointer">
                                <div class="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 font-black text-sm flex-shrink-0 group-hover:bg-red-600 group-hover:text-white transition-all">1</div>
                                <div>
                                    <h5 class="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">Ord. No. 2025-142: Traffic Code Amendments</h5>
                                    <p class="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mt-1">1.2k views</p>
                                </div>
                            </div>
                            <div class="flex gap-3 group cursor-pointer">
                                <div class="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 font-black text-sm flex-shrink-0 group-hover:bg-red-600 group-hover:text-white transition-all">2</div>
                                <div>
                                    <h5 class="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">Res. No. 2025-089: Police Commendation</h5>
                                    <p class="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mt-1">850 views</p>
                                </div>
                            </div>
                            <div class="flex gap-3 group cursor-pointer">
                                <div class="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 font-black text-sm flex-shrink-0 group-hover:bg-red-600 group-hover:text-white transition-all">3</div>
                                <div>
                                    <h5 class="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">Annual Budget 2026 Proposal</h5>
                                    <p class="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mt-1">620 views</p>
                                </div>
                            </div>
                        </div>
                        <button class="w-full mt-6 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" onclick="renderPublicPortal('documents')">View All Documents</button>
                    </div>

                    <!-- Upcoming Events Widget -->
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <h4 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center justify-between">
                            <span>Calendar</span>
                            <i class="bi bi-calendar3 text-red-500"></i>
                        </h4>
                        <div class="space-y-4">
                            <div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 shadow-sm flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700">
                                        <span class="text-[8px] font-black text-red-600 dark:text-red-400 uppercase">Dec</span>
                                        <span class="text-sm font-black text-gray-900 dark:text-white">18</span>
                                    </div>
                                    <div>
                                        <h5 class="text-xs font-bold text-gray-800 dark:text-gray-200">Regular Session</h5>
                                        <p class="text-[10px] text-gray-500 dark:text-gray-400">2:00 PM · Session Hall</p>
                                    </div>
                                </div>
                            </div>
                            <div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 shadow-sm flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700">
                                        <span class="text-[8px] font-black text-red-600 dark:text-red-400 uppercase">Dec</span>
                                        <span class="text-sm font-black text-gray-900 dark:text-white">20</span>
                                    </div>
                                    <div>
                                        <h5 class="text-xs font-bold text-gray-800 dark:text-gray-200">Committee Hearing</h5>
                                        <p class="text-[10px] text-gray-500 dark:text-gray-400">9:00 AM · Room 302</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button class="w-full mt-6 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" onclick="renderPublicPortal('sessions')">Full Calendar</button>
                    </div>

                    <!-- Footer Links (Social Media Style) -->
                    <div class="px-4 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest space-y-2">
                        <div class="flex flex-wrap gap-x-4 gap-y-2">
                            <a href="#" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">Privacy</a>
                            <a href="#" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">Terms</a>
                            <a href="#" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">Cookies</a>
                            <a href="#" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">Accessibility</a>
                        </div>
                        <p class="pt-2">© 2025 LACS Valenzuela</p>
                    </div>
                </aside>

            </div>
        </div>
    `;
}

function renderPublicSessions() {
    return `
        <div class="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-300">
            <div class="container mx-auto px-4 py-8">
                <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Legislative <span class="text-red-600">Sessions</span></h2>
                        <nav class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-2">
                            <a href="#" onclick="renderPublicPortal('home')" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">Home</a>
                            <i class="bi bi-chevron-right text-[8px]"></i>
                            <span class="text-red-600 dark:text-red-400">Sessions</span>
                        </nav>
                    </div>
                </div>
            </div>
        </div>

        <div class="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
             <!-- Sidebar Filters -->
            <aside class="w-full lg:w-64 flex-shrink-0 space-y-6">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 class="font-black text-gray-900 dark:text-white mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
                        <i class="bi bi-filter-left text-red-600 dark:text-red-400 text-lg"></i>
                        Filter Sessions
                    </h3>
                    <div class="space-y-4">
                        <div>
                            <label class="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 mb-2 block">Session Type</label>
                            <div class="space-y-2">
                                <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group">
                                    <input type="checkbox" checked class="w-4 h-4 text-red-600 border-gray-300 dark:border-gray-600 rounded focus:ring-red-500">
                                    <span class="text-sm font-bold text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">Regular</span>
                                </label>
                                <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group">
                                    <input type="checkbox" checked class="w-4 h-4 text-red-600 border-gray-300 dark:border-gray-600 rounded focus:ring-red-500">
                                    <span class="text-sm font-bold text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">Special</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="pt-4 border-t border-gray-50 dark:border-gray-700">
                            <label class="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 mb-2 block">Timeframe</label>
                            <div class="space-y-2">
                                 <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group">
                                    <input type="radio" name="sess_date" checked class="w-4 h-4 text-red-600 border-gray-300 dark:border-gray-600 focus:ring-red-500">
                                    <span class="text-sm font-bold text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">Upcoming</span>
                                </label>
                                 <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group">
                                    <input type="radio" name="sess_date" class="w-4 h-4 text-red-600 border-gray-300 dark:border-gray-600 focus:ring-red-500">
                                    <span class="text-sm font-bold text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">Past</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <!-- Sessions List -->
            <div class="flex-1 space-y-6">
                <!-- Session Card 1 -->
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all group">
                    <div class="p-6 flex flex-col md:flex-row gap-6">
                        <div class="flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-800/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-700 shadow-inner group-hover:from-red-600 group-hover:to-red-800 group-hover:text-white transition-all duration-500">
                            <span class="text-[10px] font-black uppercase tracking-widest mb-1">DEC</span>
                            <span class="text-4xl font-black">18</span>
                        </div>
                        <div class="flex-grow">
                            <div class="flex justify-between items-start mb-2">
                                 <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-[10px] font-black uppercase tracking-wider rounded">Regular Session</span>
                                        <span class="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] font-black uppercase tracking-wider rounded">Confirmed</span>
                                    </div>
                                    <h3 class="text-xl font-black text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">14th Regular Session</h3>
                                 </div>
                            </div>
                            <div class="flex flex-wrap gap-4 text-xs font-bold text-gray-500 dark:text-gray-400 mb-4">
                                <span class="flex items-center gap-1.5"><i class="bi bi-clock text-red-500 dark:text-red-400"></i> 2:00 PM</span>
                                <span class="flex items-center gap-1.5"><i class="bi bi-geo-alt text-red-500 dark:text-red-400"></i> Session Hall</span>
                            </div>
                            <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">The agenda will include the second reading of the Proposed Budget Ordinance for 2026 and discussions on local infrastructure projects.</p>
                            <div class="flex gap-3">
                                <button class="px-6 py-2.5 bg-red-600 dark:bg-red-700 text-white rounded-xl text-xs font-black hover:bg-red-700 dark:hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all">View Agenda</button>
                                <button class="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-black hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">Details</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderPublicAgendas() {
    return `
        <div class="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-300">
            <div class="container mx-auto px-4 py-8">
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Agendas & <span class="text-red-600">Minutes</span></h2>
                <nav class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-2">
                    <a href="#" onclick="renderPublicPortal('home')" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">Home</a>
                    <i class="bi bi-chevron-right text-[8px]"></i>
                    <span class="text-red-600 dark:text-red-400">Agendas</span>
                </nav>
            </div>
        </div>

        <div class="container mx-auto px-4 py-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <!-- Agenda Card -->
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all group">
                    <div class="flex justify-between mb-6">
                        <div class="w-14 h-14 rounded-xl bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center text-3xl shadow-inner group-hover:bg-red-600 group-hover:text-white transition-all duration-500">
                            <i class="bi bi-list-check"></i>
                        </div>
                        <button class="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-all"><i class="bi bi-download"></i></button>
                    </div>
                    <h3 class="font-black text-gray-900 dark:text-white mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">Agenda: 13th Regular Session</h3>
                    <p class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Dec 11, 2025</p>
                    <div class="space-y-3 mb-8">
                        <div class="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300">
                            <div class="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            <span>15 Legislative Items</span>
                        </div>
                        <div class="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300">
                            <div class="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                            <span>Published Dec 08</span>
                        </div>
                    </div>
                    <button class="w-full py-3 bg-gray-900 dark:bg-gray-950 text-white rounded-xl text-xs font-black hover:bg-red-600 dark:hover:bg-red-700 shadow-lg transition-all">View Full Agenda</button>
                </div>
            </div>
        </div>
    `;
}

function renderPublicDocuments() {
    return `
         <div class="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-300">
            <div class="container mx-auto px-4 py-8">
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Document <span class="text-red-600">Archive</span></h2>
                 <nav class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-2 mb-8">
                    <a href="#" onclick="renderPublicPortal('home')" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">Home</a>
                    <i class="bi bi-chevron-right text-[8px]"></i>
                    <span class="text-red-600 dark:text-red-400">Documents</span>
                </nav>
                
                <div class="max-w-3xl relative group">
                    <input type="text" placeholder="Search by keyword, ordinance number, or description..." class="w-full pl-14 pr-4 py-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all">
                    <i class="bi bi-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-red-600 dark:group-focus-within:text-red-400 text-xl transition-colors"></i>
                    <button class="absolute right-2 top-2 bottom-2 px-8 bg-red-600 dark:bg-red-700 text-white rounded-xl hover:bg-red-700 dark:hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all font-black text-sm">Search</button>
                </div>
                
                <div class="flex flex-wrap gap-4 mt-6">
                    <label class="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/40 hover:border-red-200 dark:hover:border-red-700 transition-all group">
                        <input type="checkbox" checked class="w-4 h-4 text-red-600 border-gray-300 dark:border-gray-600 rounded focus:ring-red-500">
                        <span class="text-sm font-bold text-gray-600 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400">Ordinances</span>
                    </label>
                    <label class="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/40 hover:border-red-200 dark:hover:border-red-700 transition-all group">
                        <input type="checkbox" checked class="w-4 h-4 text-red-600 border-gray-300 dark:border-gray-600 rounded focus:ring-red-500">
                        <span class="text-sm font-bold text-gray-600 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400">Resolutions</span>
                    </label>
                    <label class="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/40 hover:border-red-200 dark:hover:border-red-700 transition-all group">
                        <input type="checkbox" class="w-4 h-4 text-red-600 border-gray-300 dark:border-gray-600 rounded focus:ring-red-500">
                        <span class="text-sm font-bold text-gray-600 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400">Executive Orders</span>
                    </label>
                </div>
            </div>
        </div>

        <div class="container mx-auto px-4 py-8 space-y-6">
            <!-- Doc Result -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group">
                <div class="flex items-start gap-6">
                    <div class="flex-shrink-0 w-14 h-14 bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center text-3xl shadow-inner group-hover:bg-red-600 group-hover:text-white transition-all duration-500">
                        <i class="bi bi-file-earmark-pdf"></i>
                    </div>
                    <div class="flex-grow">
                        <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                             <div>
                                <h3 class="text-xl font-black text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors cursor-pointer">Ordinance No. 2025-142</h3>
                                <p class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1 mb-4">Published Dec 10, 2025 · Transport Committee</p>
                                <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">An ordinance appropriating funds for the construction of the new multi-purpose hall in Barangay Karuhatan, including provisions for equipment procurement.</p>
                             </div>
                             <div class="flex-shrink-0">
                                <button class="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-black transition-all flex items-center gap-2">
                                    <i class="bi bi-download"></i> Download PDF
                                </button>
                             </div>
                        </div>
                        
                        <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-[10px] font-black uppercase tracking-wider rounded-lg border border-red-100 dark:border-red-900/30">
                            <i class="bi bi-stars"></i> AI Summary: Allocates ₱15M for infrastructure project.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderPublicAnnouncements() {
    const announcements = getAnnouncements().filter(a => a.published);
    return `
        <div class="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-300">
            <div class="container mx-auto px-4 py-8">
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">City <span class="text-red-600">Announcements</span></h2>
                <nav class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-2">
                    <a href="#" onclick="renderPublicPortal('home')" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">Home</a>
                    <i class="bi bi-chevron-right text-[8px]"></i>
                    <span class="text-red-600 dark:text-red-400">Announcements</span>
                </nav>
            </div>
        </div>

        <div class="container mx-auto px-4 py-8">
             <!-- Featured Announcement -->
              ${announcements.length > 0 ? (() => {
            const latest = announcements[0];
            return `
                 <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col lg:flex-row mb-12 hover:shadow-xl transition-all duration-500 group">
                    <div class="w-full lg:w-1/2 h-64 lg:h-auto bg-gray-100 dark:bg-gray-700 overflow-hidden relative">
                        <img src="${latest.image || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Featured">
                        <div class="absolute top-6 left-6">
                            <span class="px-4 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">${latest.category}</span>
                        </div>
                    </div>
                    <div class="p-8 lg:p-12 flex-1 flex flex-col justify-center">
                        <div class="flex items-center gap-3 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                            <i class="bi bi-calendar3 text-red-600 dark:text-red-400"></i>
                            <span>${latest.date}</span>
                        </div>
                        <h3 class="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white mb-6 leading-tight group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors cursor-pointer" onclick="viewAnnouncementDetails(${latest.id})">${latest.title}</h3>
                        <p class="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8 line-clamp-3">${latest.content}</p>
                        <div class="flex items-center justify-between mt-auto">
                            <button onclick="viewAnnouncementDetails(${latest.id})" class="px-8 py-3 bg-gray-900 dark:bg-gray-950 text-white rounded-2xl text-sm font-black hover:bg-red-600 dark:hover:bg-red-700 shadow-lg transition-all">Read Full Story</button>
                            <div class="flex gap-2">
                                <button class="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition-all"><i class="bi bi-share"></i></button>
                            </div>
                        </div>
                    </div>
                 </div>
                 `;
        })() : '<div class="text-gray-500 italic p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">No announcements found at this time.</div>'}
             
             <!-- Other Announcements Grid -->
             <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                ${announcements.slice(1).map(a => `
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all group">
                    <div class="h-48 bg-gray-100 overflow-hidden">
                        <img src="${a.image || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Post">
                    </div>
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <span class="text-[10px] font-black text-red-600 uppercase tracking-widest">${a.category}</span>
                            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${a.date}</span>
                        </div>
                        <h3 class="text-lg font-black text-gray-900 mb-3 line-clamp-2 group-hover:text-red-600 transition-colors cursor-pointer" onclick="viewAnnouncementDetails(${a.id})">${a.title}</h3>
                        <p class="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3">${a.content}</p>
                        <button onclick="viewAnnouncementDetails(${a.id})" class="text-xs font-black text-gray-900 hover:text-red-600 transition-colors flex items-center gap-2">
                            READ MORE <i class="bi bi-arrow-right"></i>
                        </button>
                    </div>
                </div>
                `).join('')}
             </div>
        </div>
        <!-- Modal Placeholder -->
        <div id="announcement-modal"></div>
    `;
}

function viewAnnouncementDetails(id) {
    const item = getAnnouncements().find(a => a.id === id);
    if (!item) return;

    const modalHtml = `
        <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in" onclick="this.remove()">
            <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-slide-up relative" onclick="event.stopPropagation()">
                <button onclick="document.getElementById('announcement-modal').innerHTML = ''" class="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 dark:bg-white/10 hover:bg-white/40 dark:hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all">
                    <i class="bi bi-x-lg"></i>
                </button>
                
                <div class="h-64 bg-gray-200 dark:bg-gray-700 relative">
                    <img src="${item.image || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8">
                         <div>
                            <span class="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg mb-3 inline-block">${item.category}</span>
                            <h2 class="text-3xl font-black text-white leading-tight">${item.title}</h2>
                         </div>
                    </div>
                </div>
                
                <div class="p-8 lg:p-10">
                    <div class="flex items-center gap-6 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-8 border-b border-gray-50 dark:border-gray-700 pb-6">
                        <div class="flex items-center gap-2">
                            <i class="bi bi-calendar3 text-red-600 dark:text-red-400"></i>
                            <span>${item.date}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="bi bi-person-circle text-red-600 dark:text-red-400"></i>
                            <span>City Information Office</span>
                        </div>
                    </div>
                    
                    <div class="prose prose-red dark:prose-invert max-w-none">
                        <p class="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-6">
                            ${item.content.replace(/\n/g, '<br>')}
                        </p>
                    </div>
                    
                    <div class="mt-10 pt-8 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
                        <div class="flex gap-2">
                            <button class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition-all"><i class="bi bi-heart"></i></button>
                            <button class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center transition-all"><i class="bi bi-share"></i></button>
                        </div>
                        <button onclick="document.getElementById('announcement-modal').innerHTML = ''" class="px-8 py-3 bg-gray-900 dark:bg-gray-950 text-white rounded-2xl text-sm font-black hover:bg-red-600 dark:hover:bg-red-700 transition-all">Close Article</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('announcement-modal').innerHTML = modalHtml;
}

function renderPublicAbout() {
    return `
        <div class="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-300">
            <div class="container mx-auto px-4 py-8">
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">About the <span class="text-red-600">Portal</span></h2>
                <nav class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-2">
                    <a href="#" onclick="renderPublicPortal('home')" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">Home</a>
                    <i class="bi bi-chevron-right text-[8px]"></i>
                    <span class="text-red-600 dark:text-red-400">About Us</span>
                </nav>
            </div>
        </div>

        <div class="container mx-auto px-4 py-16 max-w-4xl">
            <div class="text-center mb-16">
                <div class="inline-block p-6 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl border border-gray-50 dark:border-gray-700 mb-8 transform hover:scale-105 transition-transform duration-500">
                    <img src="images/logo.png" alt="Logo" class="h-24 w-24 object-contain">
                </div>
                <h3 class="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 leading-tight tracking-tighter">Empowering Citizens through <br><span class="text-red-600">Digital Transparency</span></h3>
                <p class="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                    The Valenzuela City Legislative Portal is a digital initiative aimed at fostering transparency, accountability, and public participation in local governance. This platform provides citizens with easy access to ordinances, resolutions, session schedules, and agenda items of the Sangguniang Panlungsod.
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group">
                    <div class="w-14 h-14 bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-red-600 group-hover:text-white transition-all duration-500 shadow-inner">
                        <i class="bi bi-eye text-3xl"></i>
                    </div>
                    <h4 class="text-xl font-black text-gray-900 dark:text-white mb-3">Transparency</h4>
                    <p class="text-gray-600 dark:text-gray-400 leading-relaxed">Making legislative documents accessible to the public to ensure open governance and informed decision-making.</p>
                </div>
                 <div class="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group">
                    <div class="w-14 h-14 bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-red-600 group-hover:text-white transition-all duration-500 shadow-inner">
                        <i class="bi bi-people text-3xl"></i>
                    </div>
                    <h4 class="text-xl font-black text-gray-900 dark:text-white mb-3">Participation</h4>
                    <p class="text-gray-600 dark:text-gray-400 leading-relaxed">Empowering citizens to stay informed and engage with their elected representatives through real-time updates.</p>
                </div>
            </div>

            <div class="mt-16 p-8 bg-gradient-to-br from-gray-900 to-black rounded-3xl text-white text-center relative overflow-hidden">
                <div class="absolute top-0 right-0 w-64 h-64 bg-red-600 opacity-10 rounded-full -mr-32 -mt-32"></div>
                <h4 class="text-2xl font-black mb-4 relative z-10">Need more information?</h4>
                <p class="text-gray-400 mb-8 relative z-10">Our secretariat is ready to assist you with inquiries regarding legislative documents and schedules.</p>
                <button class="px-8 py-3 bg-red-600 text-white rounded-2xl text-sm font-black hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all relative z-10">Contact Secretariat</button>
            </div>
        </div>
    `;
}
