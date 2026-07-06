<?php
// directory.php
session_start();

// Get the type of content to display
$type = isset($_GET['type']) ? $_GET['type'] : 'projects';
$title = ($type === 'news') ? 'City News & Updates' : 'Infrastructure Projects';
?>
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LACS -
        <?php echo $title; ?>
    </title>

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet">

    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">

    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                    },
                    colors: {
                        brand: {
                            50: '#fef2f2',
                            100: '#fee2e2',
                            200: '#fecaca',
                            300: '#fca5a5',
                            400: '#f87171',
                            500: '#ef4444',
                            600: '#dc2626',
                            700: '#b91c1c',
                            800: '#991b1b',
                            900: '#7f1d1d',
                        }
                    }
                }
            }
        }
    </script>
    <script>
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    </script>

    <style>
        .glass-effect {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
        }

        .dark .glass-effect {
            background: rgba(30, 41, 59, 0.95);
        }
    </style>
</head>

<body
    class="font-sans text-gray-800 antialiased bg-gray-50 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">

    <!-- Navigation -->
    <nav class="fixed w-full z-50 glass-effect border-b border-gray-100 dark:border-gray-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-20">
                <a href="index.php" class="flex items-center space-x-3 group">
                    <img src="images/logo.png" alt="Logo"
                        class="w-10 h-10 object-contain group-hover:scale-105 transition-transform">
                    <div class="text-left">
                        <span
                            class="text-xl font-bold text-gray-900 dark:text-white tracking-tight block leading-none">LACS</span>
                        <span class="text-xs text-brand-600 dark:text-brand-400 font-medium tracking-wide">VALENZUELA
                            CITY</span>
                    </div>
                </a>
                <div class="flex items-center gap-6">
                    <a href="index.php"
                        class="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-600 transition-colors flex items-center gap-2">
                        <i class="bi bi-arrow-left"></i> Back to Home
                    </a>
                    <button id="theme-toggle"
                        class="text-gray-500 dark:text-gray-400 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <i id="theme-toggle-dark-icon" class="bi bi-moon-stars hidden"></i>
                        <i id="theme-toggle-light-icon" class="bi bi-sun hidden"></i>
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <main class="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-12">
            <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
                <?php echo $title; ?>
            </h1>
            <p class="text-lg text-gray-600 dark:text-gray-400">Complete archive of city government
                <?php echo ($type === 'news') ? 'announcements and updates' : 'infrastructure developments and initiatives'; ?>.
            </p>
        </div>

        <?php if ($type === 'projects'): ?>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                <!-- Project 1 -->
                <div
                    class="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 group">
                    <div class="aspect-video overflow-hidden">
                        <img src="images/peoples-park.jpg" alt="People's Park"
                            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    </div>
                    <div class="p-8">
                        <div class="flex items-center gap-3 mb-4">
                            <span
                                class="px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-bold rounded-full uppercase">Recreation</span>
                            <span class="text-xs text-gray-500">Completed 2015</span>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Valenzuela People's Park</h3>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">A 1.5-hectare urban park featuring
                            a mini-zoo, dancing fountain, children's playground, and ample green space for families and
                            fitness enthusiasts.</p>
                        <ul class="space-y-2 mb-8 text-sm text-gray-600 dark:text-gray-400">
                            <li class="flex items-center gap-2"><i class="bi bi-check-circle-fill text-green-500"></i>
                                Interactive Fountain</li>
                            <li class="flex items-center gap-2"><i class="bi bi-check-circle-fill text-green-500"></i>
                                Amphitheater</li>
                            <li class="flex items-center gap-2"><i class="bi bi-check-circle-fill text-green-500"></i> Aero
                                Circle</li>
                        </ul>
                        <button onclick="openDirectoryModal('proj_peoples_park')"
                            class="px-6 py-2 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition-colors">View
                            Details</button>
                    </div>
                </div>

                <!-- Project 2 -->
                <div
                    class="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 group">
                    <div class="aspect-video overflow-hidden">
                        <img src="images/housing.jpg" alt="Disiplina Village"
                            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    </div>
                    <div class="p-8">
                        <div class="flex items-center gap-3 mb-4">
                            <span
                                class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full uppercase">Housing</span>
                            <span class="text-xs text-gray-500">Ongoing Phase</span>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Disiplina Village Bignay</h3>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">The country's biggest in-city
                            resettlement site, providing safe and decent homes to thousands of families previously living in
                            danger zones.</p>
                        <ul class="space-y-2 mb-8 text-sm text-gray-600 dark:text-gray-400">
                            <li class="flex items-center gap-2"><i class="bi bi-check-circle-fill text-green-500"></i> 100+
                                Buildings</li>
                            <li class="flex items-center gap-2"><i class="bi bi-check-circle-fill text-green-500"></i>
                                School & Health Centers</li>
                            <li class="flex items-center gap-2"><i class="bi bi-check-circle-fill text-green-500"></i>
                                Livelihood Training Center</li>
                        </ul>
                        <button onclick="openDirectoryModal('proj_disiplina_village')"
                            class="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">View
                            Details</button>
                    </div>
                </div>

                <!-- Project 3 -->
                <div
                    class="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 group">
                    <div class="aspect-video overflow-hidden">
                        <img src="images/city-hall.jpg" alt="Legislative Building"
                            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    </div>
                    <div class="p-8">
                        <div class="flex items-center gap-3 mb-4">
                            <span
                                class="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-full uppercase">Government</span>
                            <span class="text-xs text-gray-500">Modernized</span>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">New Legislative Building</h3>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">A modern facility housing the
                            sessions of the City Council, providing a transparent and efficient environment for local
                            legislation.</p>
                        <button onclick="openDirectoryModal('proj_legislative_building')"
                            class="px-6 py-2 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors">View
                            Details</button>
                    </div>
                </div>

                <!-- Project 4: Paspas Flood Control -->
                <div
                    class="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 group">
                    <div class="aspect-video overflow-hidden">
                        <img src="images/flood_control.png" alt="Flood Control"
                            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    </div>
                    <div class="p-8">
                        <div class="flex items-center gap-3 mb-4">
                            <span
                                class="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-xs font-bold rounded-full uppercase">Infrastructure</span>
                            <span class="text-xs text-gray-500">Resilience</span>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Paspas Flood Control</h3>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">Series of pumping stations and
                            drainage upgrades across low-lying barangays to significantly reduce flooding during rainy
                            seasons.</p>
                        <button onclick="openDirectoryModal('proj_flood_control')"
                            class="px-6 py-2 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-colors">View
                            Details</button>
                    </div>
                </div>

                <!-- Project 5: Polo Riverwalk -->
                <div
                    class="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 group">
                    <div class="aspect-video overflow-hidden">
                        <img src="images/polo-park.jpg" alt="Polo Riverwalk"
                            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    </div>
                    <div class="p-8">
                        <div class="flex items-center gap-3 mb-4">
                            <span
                                class="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full uppercase">Tourism</span>
                            <span class="text-xs text-gray-500">New Opening</span>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Polo Riverwalk Phase 1</h3>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">A 6-kilometer linear park featuring
                            walking paths and cycle lanes along the Polo River, connecting multiple barangays.</p>
                        <button onclick="openDirectoryModal('proj_polo_riverwalk')"
                            class="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors">View
                            Details</button>
                    </div>
                </div>

                <!-- Project 6: Sentro Health Hubs -->
                <div
                    class="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 group">
                    <div class="aspect-video overflow-hidden">
                        <img src="images/health.jpg" alt="Sentro Health Hub"
                            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    </div>
                    <div class="p-8">
                        <div class="flex items-center gap-3 mb-4">
                            <span
                                class="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-full uppercase">Healthcare</span>
                            <span class="text-xs text-gray-500">Inaugurated</span>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Sentro Health Hubs</h3>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">State-of-the-art community health
                            centers in Karuhatan and Canumay West offering specialized diagnostic services.</p>
                        <button onclick="openDirectoryModal('proj_health_hubs')"
                            class="px-6 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-colors">View
                            Details</button>
                    </div>
                </div>
            </div>

        <?php elseif ($type === 'news'): ?>
            <div class="space-y-8">
                <!-- News Item 1 -->
                <article
                    class="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-8 items-start">
                    <div class="w-full md:w-64 h-48 rounded-2xl overflow-hidden flex-shrink-0">
                        <img src="images/oro-inidoro.png" alt="Oro Inodoro Award" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-grow">
                        <div class="flex items-center gap-4 mb-4">
                            <span class="text-brand-600 font-bold text-sm tracking-widest uppercase">November 12,
                                2025</span>
                            <span
                                class="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 text-[10px] font-bold rounded tracking-wide">AWARDS</span>
                        </div>
                        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Valenzuela City Receives Oro
                            Inodoro Award</h2>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">Acknowledged for its exceptional
                            environmental sanitation management, Valenzuela City was honored as the grand champion in
                            Maynilad's search for cities with best sanitation practices.</p>
                        <button onclick="openDirectoryModal('news_oro_inidoro')"
                            class="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">Read
                            Full Article</button>
                    </div>
                </article>

                <!-- News Item 2 -->
                <article
                    class="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-8 items-start">
                    <div class="w-full md:w-64 h-48 rounded-2xl overflow-hidden flex-shrink-0">
                        <img src="images/housing.jpg" alt="Housing Assistance" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-grow">
                        <div class="flex items-center gap-4 mb-4">
                            <span class="text-brand-600 font-bold text-sm tracking-widest uppercase">January 15, 2026</span>
                            <span
                                class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-[10px] font-bold rounded tracking-wide">HOUSING</span>
                        </div>
                        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">P14M Housing Assistance for Wawang
                            Pulo</h2>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">The SHFC has officially turned over
                            checks amounting to Php 14,025,000 to members of the Wawang Pulo Homeowners' Association,
                            marking a new chapter for 117 families.</p>
                        <button onclick="openDirectoryModal('news_housing')"
                            class="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">Read
                            Full Article</button>
                    </div>
                </article>

                <!-- News Item 3 -->
                <article
                    class="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-8 items-start">
                    <div class="w-full md:w-64 h-48 rounded-2xl overflow-hidden flex-shrink-0">
                        <img src="images/flood_control.png" alt="Flood Control" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-grow">
                        <div class="flex items-center gap-4 mb-4">
                            <span class="text-brand-600 font-bold text-sm tracking-widest uppercase">August 28, 2025</span>
                            <span
                                class="px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-600 text-[10px] font-bold rounded tracking-wide">SAFETY</span>
                        </div>
                        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">PANATAG Flood Control Launch</h2>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">The city government partners with
                            UPRI to launch PANATAG, a digital flood monitoring and warning system designed to enhance
                            disaster preparedness.</p>
                        <button onclick="openDirectoryModal('news_panatag')"
                            class="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">Read
                            Full Article</button>
                    </div>
                </article>

                <!-- News Item 4: Business One-Stop Shop -->
                <article
                    class="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-8 items-start">
                    <div class="w-full md:w-64 h-48 rounded-2xl overflow-hidden flex-shrink-0">
                        <img src="images/trade-industry.jpg" alt="Business One Stop Shop"
                            class="w-full h-full object-cover">
                    </div>
                    <div class="flex-grow">
                        <div class="flex items-center gap-4 mb-4">
                            <span class="text-brand-600 font-bold text-sm tracking-widest uppercase">January 05, 2026</span>
                            <span
                                class="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 text-[10px] font-bold rounded tracking-wide">ECONOMY</span>
                        </div>
                        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Valenzuela Launches 2026 BOSS</h2>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">City Government kicks off the 2026
                            Business One-Stop Shop (BOSS) to streamline permit renewals and encourage online transactions.
                        </p>
                        <button onclick="openDirectoryModal('news_boss_2026')"
                            class="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">Read
                            Full Article</button>
                    </div>
                </article>

                <!-- News Item 5: Inclusive Summit -->
                <article
                    class="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-8 items-start">
                    <div class="w-full md:w-64 h-48 rounded-2xl overflow-hidden flex-shrink-0">
                        <img src="images/education.jpg" alt="Inclusive Education" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-grow">
                        <div class="flex items-center gap-4 mb-4">
                            <span class="text-brand-600 font-bold text-sm tracking-widest uppercase">January 22, 2026</span>
                            <span
                                class="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 text-[10px] font-bold rounded tracking-wide">EDUCATION</span>
                        </div>
                        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">1st Inclusive Education Summit
                        </h2>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">Valenzuela holds its first
                            Inclusive Summit, celebrating a decade of progress in providing accessible education for
                            children with special needs.</p>
                        <button onclick="openDirectoryModal('news_inclusive_summit')"
                            class="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">Read
                            Full Article</button>
                    </div>
                </article>
            </div>
        <?php endif; ?>
    </main>

    <footer class="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <p class="text-sm">© 2026 City Government of Valenzuela. All rights reserved.</p>
        </div>
    </footer>

    <!-- Directory Article/Project Modal -->
    <div id="directory-modal" class="fixed inset-0 z-[60] hidden overflow-y-auto" aria-labelledby="modal-title"
        role="dialog" aria-modal="true">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <!-- Background backdrop -->
            <div class="fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity"
                onclick="closeDirectoryModal()"></div>

            <!-- Modal Panel -->
            <div
                class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full animate-fade-in-up">
                <div class="relative h-[400px]">
                    <img id="modal-image" src="" alt="" class="w-full h-full object-cover">
                    <button onclick="closeDirectoryModal()"
                        class="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all duration-200">
                        <i class="bi bi-x-lg"></i>
                    </button>
                    <div class="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent">
                    </div>
                    <div class="absolute bottom-8 left-8 right-8 text-white">
                        <span id="modal-badge"
                            class="px-3 py-1 bg-brand-600 text-white text-xs font-bold rounded-full uppercase tracking-widest mb-4 inline-block"></span>
                        <h2 id="modal-title" class="text-3xl md:text-4xl font-extrabold leading-tight"></h2>
                    </div>
                </div>
                <div class="p-8 md:p-12">
                    <div class="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100 dark:border-gray-700">
                        <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                            <i class="bi bi-calendar3"></i>
                            <span id="modal-date"></span>
                        </div>
                        <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                            <i class="bi bi-geo-alt"></i>
                            <span>Valenzuela City</span>
                        </div>
                    </div>
                    <div id="modal-content"
                        class="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed text-lg space-y-6">
                        <!-- Content will be injected here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Theme toggle logic
        const themeToggleBtn = document.getElementById('theme-toggle');
        const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
        const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

        function updateIcons() {
            if (document.documentElement.classList.contains('dark')) {
                themeToggleDarkIcon.classList.add('hidden');
                themeToggleLightIcon.classList.remove('hidden');
            } else {
                themeToggleDarkIcon.classList.remove('hidden');
                themeToggleLightIcon.classList.add('hidden');
            }
        }
        updateIcons();

        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateIcons();
        });

        // Modal Content Data Map
        const directoryData = {
            'proj_peoples_park': {
                title: "Valenzuela People's Park",
                badge: "Recreation",
                date: "Established 2015",
                image: "images/peoples_park.png",
                content: `
                    <p>The Valenzuela People's Park is a premier 1.5-hectare urban park that has become a symbol of the city's commitment to providing quality outdoor spaces for its citizens. Since its opening in 2015, it has served as the "green lung" of the city center.</p>
                    <p>The park includes a variety of attractions designed for all ages, including an interactive dancing fountain, an aero-sports circle for fitness enthusiasts, and a mini-zoo with local wildlife. For children, the safe and colorful playground offers a perfect environment for play.</p>
                    <p>The amphitheater regularly hosts community events, concerts, and cultural performances, fostering a vibrant local culture. The park is fully accessible and maintained with the highest standards of safety and cleanliness.</p>
                `
            },
            'proj_disiplina_village': {
                title: "Disiplina Village Bignay",
                badge: "Housing",
                date: "Completed Phase 2024",
                image: "images/disiplina_village.png",
                content: `
                    <p>Disiplina Village Bignay represents the crowning jewel of Valenzuela City's social housing program. As the largest in-city resettlement project in the Philippines, it provides more than just apartments; it provides a complete community for families displaced from danger zones.</p>
                    <p>The village features modular 3-story buildings designed for durability and comfort. Beyond housing, the site includes its own elementary and high school buildings, health centers, a community police precinct, and a fire substation.</p>
                    <p>Economic sustainability is integrated into the village through its Livelihood Training Center, where residents can learn new skills and find employment opportunities within the city's thriving industrial landscape.</p>
                `
            },
            'proj_legislative_building': {
                title: "New Legislative Building",
                badge: "Government",
                date: "Modernized 2023",
                image: "images/legislative_building.png",
                content: `
                    <p>The New Legislative Building stands as a testament to the transparency and efficiency of local governance in Valenzuela. This state-of-the-art facility was designed to host the sessions of the Sangguniang Panlungsod in a modern, professional environment.</p>
                    <p>Equipped with advanced audio-visual systems and paperless legislative technology, the building allows for more efficient tracking of ordinances and resolutions. The gallery is open to the public, encouraging citizen participation in the legislative process.</p>
                    <p>The building also houses offices for the City Councilors and the Vice Mayor, creating a centralized hub for policy-making and constituent service.</p>
                `
            },
            'proj_flood_control': {
                title: "Paspas Flood Control Infrastructure",
                badge: "Infrastructure",
                date: "Ongoing Resilience",
                image: "images/flood_control.png",
                content: `
                    <p>The City Government has prioritized flood mitigation through massive infrastructure upgrades across low-lying barangays. The "Paspas Flood Control" initiative involves the construction of several large-scale pumping stations and the modernization of drainage systems.</p>
                    <p>By integrating technology with civil engineering, the city has significantly reduced the time it takes for floodwaters to recede after heavy rainfall. These projects specifically target flood-prone areas like Wawang Pulo, Balangkas, and Arkong Bato.</p>
                    <p>The infrastructure is complemented by the PANATAG digital monitoring system, which provides real-time data to help the city respond more effectively to climate-related challenges.</p>
                `
            },
            'news_oro_inidoro': {
                title: "Valenzuela Wins Maynilad's Oro Inodoro 2025",
                badge: "Awards",
                date: "November 12, 2025",
                image: "images/oro-inidoro.png",
                content: `
                    <p>Valenzuela City emerged as the grand champion in Maynilad Water Services, Inc.’s Oro Inodoro Awards, a biennial search for the best environmental sanitation management practices among local government units in the West Zone.</p>
                    <p>The award recognizes the city's significant strides in septage management, sewer connections, and public awareness campaigns about clean water and sanitation. This victory highlights Valenzuela's commitment to the United Nations Sustainable Development Goal on Clean Water and Sanitation.</p>
                    <p>Mayor Wes Gatchalian credited the victory to the city's multi-sectoral approach, involving local health offices, barangay leaders, and the cooperation of every Valenzuelano.</p>
                `
            },
            'news_housing': {
                title: "P14M Housing Assistance Granted to 117 Families",
                badge: "Housing",
                date: "January 15, 2026",
                image: "images/housing.jpg",
                content: `
                    <p>The Social Housing Finance Corporation (SHFC) turned over checks amounting to a total of Php 14,025,000 to the Wawang Pulo Homeowners Association, Inc. in a ceremony held this week.</p>
                    <p>This financial support is dedicated to land acquisition and site development for the city's latest socialized housing project, which will benefit 117 families who previously lived in informal settlements. The project is part of the city's continuing mission to ensure zero informal settlers by 2030.</p>
                    <p>Residents expressed their gratitude for the opportunity to have their own titles and live in a safe, legal, and dignified environment.</p>
                `
            },
            'news_panatag': {
                title: "City Launches PANATAG Digital Flood Warning System",
                badge: "Safety",
                date: "August 28, 2025",
                image: "images/flood_control.png",
                content: `
                    <p>With the launch of the PANATAG system, Valenzuela City takes a giant leap forward in disaster resillience. Developed in partnership with the UP Resilience Institute (UPRI), PANATAG is a web-based flood monitoring and early warning platform.</p>
                    <p>The system utilizes sensors placed in critical waterways around the city to provide real-time updates on water levels. This data is shared with the City Disaster Risk Reduction and Management Office (CDRRMO) and the public through mobile alerts and social media.</p>
                    <p>This proactive approach allows for faster evacuations and better-allocated resources during typhoons and heavy monsoon rains, ultimately saving lives and protecting property.</p>
                `
            },
            'proj_polo_riverwalk': {
                title: "Polo Riverwalk Transformation",
                badge: "Park & Recreation",
                date: "Phase 1 Opened 2026",
                image: "images/polo-park.jpg",
                content: `
                    <p>The Polo Riverwalk is a visionary urban planning project that transforms once-neglected flood control structures into a vibrant linear park. Phase 1, stretching alongside the historic Polo district, provides residents with a safe and beautiful space for walking, jogging, and cycling.</p>
                    <p>The development features landscaped riverbanks, efficient LED lighting for night-time use, and dedicated lanes for micro-mobility. It serves as both a recreational hub and a functional green corridor connecting various barangays.</p>
                    <p>Upon its full completion, the riverwalk will extend over 6 kilometers, becoming one of the longest linear parks in the country and a major boost to local tourism and environmental conservation.</p>
                `
            },
            'proj_health_hubs': {
                title: "Sentro Health: Specialized Diagnostic Hubs",
                badge: "Health",
                date: "Inaugurated October 2025",
                image: "images/health.jpg",
                content: `
                    <p>The "Sentro Health" hubs in Karuhatan and Canumay West are Valenzuela's answer to the need for accessible, modern diagnostic services at the community level. These hubs are equipped with high-end medical equipment typically found only in major hospitals.</p>
                    <p>Services offered include X-ray, Ultrasound, ECG, and comprehensive laboratory tests, all provided for free or at highly subsidized rates for Valenzuelanos. The digital integration allows for faster results and better patient record management.</p>
                    <p>This project is part of a city-wide effort to decentralize specialized healthcare, ensuring that every citizen has access to life-saving diagnostic tools near their homes.</p>
                `
            },
            'news_boss_2026': {
                title: "Valenzuela Kicks Off 2026 Business One-Stop Shop",
                badge: "Government",
                date: "January 05, 2026",
                image: "images/trade-industry.jpg",
                content: `
                    <p>Valenzuela City has officially launched its 2026 Business One-Stop Shop (BOSS), reinforcing its reputation as one of the most business-friendly cities in the Philippines. The initiative aims to make permit renewals and tax payments faster and more convenient.</p>
                    <p>This year's BOSS focuses heavily on digital transformation, with an enhanced Paspas Permit online portal that allows business owners to complete their transactions from the comfort of their offices. For those preferring in-person visits, the city hall has set up streamlined thermal-paper processing and digital queuing systems.</p>
                    <p>Mayor Wes Gatchalian emphasized that the ease of doing business in Valenzuela is a key driver for local economic growth and job creation.</p>
                `
            },
            'news_inclusive_summit': {
                title: "City Celebrates 1st Inclusive Education Summit",
                badge: "Education",
                date: "January 22, 2026",
                image: "images/education.jpg",
                content: `
                    <p>Marking a significant milestone in local education, Valenzuela City held its inaugural Inclusive Education Summit. The event gathered educators, parents, and advocates to celebrate a decade of progress in the city's special education (SPED) programs.</p>
                    <p>The summit showcased the success stories of students who have benefited from the city's Valenzuela Special Education Center (ValSPED) and various inclusive classrooms in public schools. Discussions focused on further expanding the curriculum and improving facilities for students with diverse learning needs.</p>
                    <p>The city government reaffirmed its commitment to ensuring that no child is left behind, pledging more resources for teacher training and assistive technology.</p>
                `
            }
        };

        function openDirectoryModal(id) {
            const data = directoryData[id];
            if (!data) return;

            document.getElementById('modal-image').src = data.image;
            document.getElementById('modal-title').innerText = data.title;
            document.getElementById('modal-badge').innerText = data.badge;
            document.getElementById('modal-date').innerText = data.date;
            document.getElementById('modal-content').innerHTML = data.content;

            const modal = document.getElementById('directory-modal');
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        function closeDirectoryModal() {
            const modal = document.getElementById('directory-modal');
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeDirectoryModal();
        });
    </script>
</body>

</html>