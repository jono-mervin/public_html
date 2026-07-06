<?php
// main.php
// Start PHP session to maintain authentication
session_start();

if (!isset($_SESSION['is_logged_in']) || $_SESSION['is_logged_in'] !== true) {
    header("Location: ../index.php?showLogin=true");
    exit;
}

// Maintenance Mode Check for Active Sessions
$m_file = '../config/maintenance_mode.json';
if (file_exists($m_file)) {
    $m_config = json_decode(file_get_contents($m_file), true);
    if (isset($m_config['maintenance_mode']) && $m_config['maintenance_mode'] === true) {
        $role = $_SESSION['user_role'] ?? 'User';
        $isRealAdmin = (strcasecmp($role, 'Admin') === 0 || strcasecmp($role, 'Administrator') === 0);
        if (!$isRealAdmin) {
            header("Location: ../maintenance.php");
            exit;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <meta name="theme-color" content="#dc2626">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="format-detection" content="telephone=no">
    <title>LACS - Legislative Agenda and Calendar System | City of Valenzuela</title>
    <meta name="description"
        content="Legislative Agenda and Calendar System - City Government of Valenzuela, Metropolitan Manila">
    <meta name="keywords" content="LACS, Valenzuela, Legislative Agenda, Calendar System">
    <link rel="icon" type="image/png" href="../images/logo.png">
    <link rel="apple-touch-icon" href="../images/logo.png">
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Google Fonts: Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
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
                            600: '#dc2626',
                            700: '#b91c1c',
                            800: '#991b1b',
                            900: '#7f1d1d',
                        },
                        dark: {
                            bg: '#0f172a',
                            card: '#1e293b',
                            border: '#334155',
                            text: '#e2e8f0',
                            muted: '#94a3b8',
                        }
                    }
                }
            }
        }
    </script>

    <!-- Prevent dark mode flicker - must run before page renders -->
    <script>
        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.classList.add('dark');
        }
    </script>


    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>



    <script>
        // Check if user is logged in (for demo purposes)
        // In production, this would check actual session/token
        if (!localStorage.getItem('isLoggedIn') && !sessionStorage.getItem('isLoggedIn')) {
            // Sync PHP session data to localStorage for JavaScript access
            // This ensures new tabs/windows have access to user data
            <?php if (isset($_SESSION['user_id'])): ?>
                const userData = {
                    id: <?php echo json_encode($_SESSION['user_id']); ?>,
                    name: <?php echo json_encode($_SESSION['user_name']); ?>,
                    email: <?php echo json_encode($_SESSION['username']); ?>,
                    role: <?php echo json_encode($_SESSION['user_role']); ?>
                };

                // Store in localStorage so it persists across tabs
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', JSON.stringify(userData));
            <?php endif; ?>
        }

        // ============================================
        // PERMISSION MAPPING HELPER
        // Maps roles to their effective permissions
        // ============================================
        window.getEffectiveRole = function (actualRole) {
            if (!actualRole) return 'User';

            const normalizedRole = actualRole.trim().toLowerCase();
            
            if (normalizedRole === 'administrator' || normalizedRole === 'admin') return 'Administrator';
            if (normalizedRole === 'staff') return 'Staff';
            if (normalizedRole === 'user') return 'User';

            return actualRole;
        };


        // Override getCurrentUser to return effective role
        const originalGetCurrentUser = window.getCurrentUser;
        window.getCurrentUser = function () {
            const user = originalGetCurrentUser ? originalGetCurrentUser() :
                JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || 'null');

            if (user && user.role) {
                // Store original role for reference
                user.originalRole = user.role;
                // Apply permission mapping
                user.role = getEffectiveRole(user.role);
            }
            return user;
        };
    </script>


    <!-- Dynamic Layout Styles -->
    <style>
        :root {
            --sidebar-width: 16rem;
            --sidebar-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-collapsed {
            --sidebar-width: 0rem !important;
        }

        /* Base Sidebar Styles */
        #sidebar {
            width: var(--sidebar-width) !important;
            transition: width var(--sidebar-transition), opacity var(--sidebar-transition) !important;
            overflow: hidden;
        }

        .sidebar-collapsed {
            opacity: 0;
            pointer-events: none;
        }

        .nav-item {
            display: flex;
            align-items: center;
            padding: 0.75rem 1rem;
            margin: 0.125rem 0.75rem;
            border-radius: 0.75rem;
            color: rgba(255, 255, 255, 0.8);
            text-decoration: none;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
            white-space: nowrap;
        }

        .nav-item:hover {
            background-color: rgba(255, 255, 255, 0.1);
            color: white;
            transform: translateX(4px);
        }

        .nav-item.active {
            background-color: white;
            color: #b91c1c;
            font-weight: 700;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .nav-item i {
            font-size: 1.25rem;
            margin-right: 0.75rem;
            width: 1.5rem;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .sidebar-text {
            white-space: nowrap;
            transition: opacity 0.2s;
        }

        /* Scrollbar styling for sidebar */
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }

        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }

        /* Premium Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(220, 38, 38, 0.2);
            border-radius: 10px;
            transition: all 0.3s;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(220, 38, 38, 0.4);
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(220, 38, 38, 0.3);
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(220, 38, 38, 0.5);
        }

        @media (min-width: 768px) {
            #sidebar {
                position: relative !important;
                display: flex !important;
                transform: none !important;
            }

            .desktop-toggle {
                display: flex !important;
            }

            .mobile-toggle,
            .mobile-only {
                display: none !important;
            }

            /* Global search overlay respects sidebar width */
            /* Global search overlay respects sidebar width */
            /* #global-search-overlay styles removed for centered modal redesign */
        }

        /* Mobile Adjustments */
        @media (max-width: 767px) {
            #sidebar {
                display: none !important;
            }

            .desktop-toggle {
                display: none !important;
            }

            .mobile-toggle {
                display: flex !important;
            }

            .mobile-only {
                display: flex !important;
            }
        }

        /* Premium Loading Overlay Styles */
        #main-loading-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: none;
            pointer-events: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px) saturate(180%);
            transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dark #main-loading-overlay {
            background: rgba(15, 23, 42, 0.8);
        }

        .loader-content {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .logo-container {
            position: relative;
            width: 100px;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 2rem;
        }

        .loader-logo {
            width: 60px;
            height: 60px;
            object-fit: contain;
            animation: pulse-logo 2s ease-in-out infinite;
            z-index: 2;
        }

        .orbit-ring {
            position: absolute;
            inset: 0;
            border: 3px solid transparent;
            border-top-color: #dc2626;
            border-radius: 50%;
            animation: orbit 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }

        .orbit-ring-outer {
            position: absolute;
            inset: -10px;
            border: 1px solid rgba(220, 38, 38, 0.2);
            border-radius: 50%;
        }

        @keyframes pulse-logo {

            0%,
            100% {
                transform: scale(1);
                filter: drop-shadow(0 0 0px rgba(220, 38, 38, 0));
            }

            50% {
                transform: scale(1.08);
                filter: drop-shadow(0 0 15px rgba(220, 38, 38, 0.4));
            }
        }

        @keyframes orbit {
            0% {
                transform: rotate(0deg);
            }

            100% {
                transform: rotate(360deg);
            }
        }

        .loading-progress-container {
            width: 240px;
            height: 4px;
            background: rgba(220, 38, 38, 0.1);
            border-radius: 2px;
            overflow: hidden;
            margin-top: 1.5rem;
        }

        #loading-progress-bar {
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #dc2626, #ef4444);
            transition: width 2s linear;
            box-shadow: 0 0 10px rgba(220, 38, 38, 0.3);
        }

        .loading-text {
            font-weight: 600;
            font-size: 1.125rem;
            color: #1e293b;
            letter-spacing: 0.05em;
            margin-top: 1rem;
            min-height: 1.5rem;
        }

        .dark .loading-text {
            color: #f8fafc;
        }
    </style>
</head>

<body
    class="bg-gray-100 dark:bg-dark-bg font-sans antialiased text-gray-900 dark:text-dark-text transition-colors duration-300"
    data-role="<?php echo $_SESSION['user_role'] ?? 'User'; ?>">
    <!-- Main App Container -->
    <div id="app-container">
        <!-- Mobile Sidebar Overlay -->
        <div id="sidebar-overlay"
            class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden opacity-0 pointer-events-none transition-all duration-300 ease-out">
        </div>

        <!-- Mobile Sidebar -->
        <div id="mobile-sidebar"
            class="fixed inset-y-0 left-0 transform -translate-x-full md:hidden w-72 bg-gradient-to-b from-red-800 to-red-900 text-white z-50 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden flex flex-col shadow-2xl">
            <!-- Mobile sidebar header -->
            <div class="p-4 border-b border-red-700/50 sidebar-header">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3 sidebar-logo">
                        <div class="bg-white rounded-full p-1.5 shadow-lg">
                            <img src="../images/logo.png" alt="Valenzuela Logo" class="w-9 h-9 object-contain">
                        </div>
                        <div>
                            <h1 class="text-lg font-bold tracking-tight">LACS</h1>
                            <p class="text-xs text-red-200">Legislative Agenda & Calendar</p>
                        </div>
                    </div>
                    <button id="close-mobile-sidebar"
                        class="text-white/80 p-2 hover:bg-red-700/50 hover:text-white rounded-lg transition-all duration-200 hover:rotate-90">
                        <i class="bi bi-x-lg text-xl"></i>
                    </button>
                </div>
            </div>

            <!-- Mobile Navigation Menu -->
            <nav id="mobile-nav-container" class="flex-1 py-4 px-3 overflow-y-auto no-scrollbar">
                <!-- Dynamic content will be injected here -->
            </nav>

            <!-- Mobile User Profile Section - Fixed at Bottom -->
            <div class="p-3 mt-auto border-t border-red-700/40">
                <!-- User Info -->
                <div class="flex items-center space-x-2.5 mb-2.5">
                    <div class="w-9 h-9 rounded-full bg-red-700 flex items-center justify-center">
                        <i class="bi bi-person-fill text-white text-sm"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p id="mobile-user-name" class="text-sm font-medium text-white truncate">Admin User</p>
                        <p id="mobile-user-role" class="text-xs text-red-300 truncate">Administrator</p>
                    </div>
                </div>

                <!-- Action Buttons - Side by Side -->
                <div class="flex gap-2">
                    <a href="#" onclick="showSection('settings')"
                        class="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors">
                        <i class="bi bi-gear"></i>
                        <span>Settings</span>
                    </a>
                    <a href="#" onclick="logout()"
                        class="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-red-950 hover:bg-red-900 text-red-200 rounded-lg transition-colors">
                        <i class="bi bi-box-arrow-right"></i>
                        <span>Logout</span>
                    </a>
                </div>
            </div>
        </div>

        <div class="flex h-screen overflow-hidden dark:bg-dark-bg">
            <!-- Desktop Sidebar -->
            <aside id="sidebar"
                class="sidebar sidebar-expanded bg-gradient-to-b from-red-800 to-red-900 text-white flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out h-screen fixed md:relative z-30 -translate-x-full md:translate-x-0 no-scrollbar overflow-hidden">
                <div class="flex flex-col h-full w-64">
                    <!-- Logo Section -->
                    <div class="p-6 border-b border-red-700 animate-fade-in sidebar-logo">
                        <a href="#" onclick="showSection('dashboard')"
                            class="flex items-center space-x-3 hover:opacity-80 transition-all duration-300 transform hover:scale-105 group">
                            <div class="bg-white rounded-full shadow-md flex items-center justify-center overflow-hidden transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                                style="width: 70px; height: 70px;">
                                <img src="../images/logo.png" alt="Valenzuela Logo" style="width: 100%; height: 100%;"
                                    class="object-contain dynamic-logo">
                            </div>
                            <div class="transform transition-all duration-300 group-hover:translate-x-1 sidebar-text">
                                <h1 class="text-lg font-bold dynamic-system-name">LACS</h1>
                                <p class="text-xs text-red-200 dynamic-org-name">City of Valenzuela</p>
                            </div>
                        </a>
                    </div>

                    <!-- Navigation Menu -->
                    <nav id="desktop-nav-container" class="flex-1 overflow-y-auto py-4 no-scrollbar">
                        <!-- Dynamic content will be injected here -->
                    </nav>

                    <!-- User Info -->
                    <div class="p-4 border-t border-red-700 sidebar-user">
                        <div class="flex items-center justify-center space-x-3">
                            <div
                                class="bg-white rounded-full p-1 w-10 h-10 flex items-center justify-center flex-shrink-0 shadow-md">
                                <img src="../images/logo.png" alt="Logo"
                                    class="w-full h-full object-contain rounded-full">
                            </div>
                            <div class="sidebar-text">
                                <p class="text-xs font-bold leading-tight text-white mb-0.5"
                                    style="white-space: normal;">Legislative Agenda</p>
                                <p class="text-[10px] text-red-200 leading-tight block" style="white-space: normal;">and
                                    Calendar System</p>
                            </div>
                        </div>
                    </div>
                </div>

            </aside>

            <!-- Main Content -->
            <div class="flex-1 flex flex-col overflow-hidden dark:bg-slate-800">
                <!-- Header / Navbar -->
                <nav
                    class="bg-white dark:bg-dark-card shadow-md border-b border-gray-200 dark:border-dark-border sticky top-0 z-40 transition-colors duration-300">
                    <div class="px-4 sm:px-6 lg:px-8">
                        <div class="flex justify-between items-center h-16">
                            <!-- Left Side: Toggle buttons and Logo -->
                            <div class="flex items-center">
                                <!-- Sidebar Toggle Button (Desktop) - Always visible on md+ screens -->
                                <button id="sidebar-toggle"
                                    class="desktop-toggle items-center justify-center w-10 h-10 rounded-lg text-gray-600 dark:text-dark-muted bg-gray-50 dark:bg-dark-card hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 focus:outline-none transition-all duration-200 border border-gray-200 dark:border-dark-border"
                                    title="Toggle Sidebar">
                                    <i class="bi bi-layout-sidebar-inset text-xl"></i>
                                </button>

                                <!-- Mobile Menu Button -->
                                <button id="mobile-menu-btn"
                                    class="mobile-toggle text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-white focus:outline-none p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200">
                                    <i class="bi bi-list text-2xl"></i>
                                </button>

                                <!-- Logo (Mobile) -->
                                <div class="mobile-only flex items-center ml-2">
                                    <img src="../images/logo.webp" alt="Valenzuela" class="w-10 h-10 object-contain">
                                </div>
                            </div>

                            <!-- Page Title & Breadcrumb -->
                            <div class="flex-1 flex items-center justify-center md:justify-start min-w-0">
                                <div class="ml-2 md:ml-4 min-w-0">
                                    <h2 id="page-title"
                                        class="text-base md:text-xl font-bold text-gray-800 dark:text-white">Dashboard
                                    </h2>
                                </div>
                            </div>

                            <!-- Right Side Actions -->
                            <div class="flex items-center space-x-1 md:space-x-4">
                                <!-- Live Date & Time -->
                                <div id="navbar-datetime" class="flex flex-col items-end mr-2 leading-tight text-xs">
                                    <span id="navbar-date"
                                        class="font-medium text-gray-700 dark:text-dark-muted"></span>
                                    <span id="navbar-time" class="font-mono text-gray-500 dark:text-gray-400"></span>
                                </div>

                                <!-- Dark Mode Toggle -->
                                <button id="theme-toggle" onclick="toggleTheme()"
                                    class="p-2 text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                                    title="Toggle dark mode">
                                    <i class="bi bi-moon-fill text-lg md:text-xl dark-mode-icon"></i>
                                    <i class="bi bi-sun-fill text-xl light-mode-icon hidden"></i>
                                </button>

                                <!-- Quick Search Icon (opens global search bar) -->
                                <button id="header-search-btn"
                                    class="p-2 text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition inline-flex"
                                    title="Quick search">
                                    <i class="bi bi-search text-lg"></i>
                                </button>





                                <!-- Notifications -->
                                <div class="relative">
                                    <button id="notifications-btn" onclick="toggleNotifications()"
                                        class="relative p-2 text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                                        <i class="bi bi-bell text-xl"></i>
                                        <span id="notification-badge"
                                            class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                    </button>

                                    <!-- Notifications Dropdown -->
                                    <div id="notifications-dropdown"
                                        class="hidden absolute right-0 mt-2 w-80 bg-white dark:bg-dark-card rounded-lg shadow-xl border border-gray-200 dark:border-dark-border z-50 animate-fade-in-up">
                                        <div
                                            class="p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
                                            <h3 class="text-sm font-semibold text-gray-800 dark:text-white">
                                                Notifications</h3>
                                            <button onclick="clearAllNotificationsFromBell()"
                                                class="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">Clear
                                                All</button>
                                        </div>
                                        <div class="max-h-96 overflow-y-auto" id="notifications-list">
                                            <div class="p-4 hover:bg-gray-50 border-b border-gray-100 cursor-pointer">
                                                <div class="flex items-start space-x-3">
                                                    <div class="bg-blue-100 rounded-full p-2">
                                                        <i class="bi bi-info-circle text-blue-600"></i>
                                                    </div>
                                                    <div class="flex-1">
                                                        <p class="text-sm text-gray-800 dark:text-white">Welcome to LACS tracking
                                                        </p>
                                                        <p class="text-xs text-gray-500 dark:text-dark-muted mt-1">Just
                                                            now</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="p-3 border-t border-gray-200 dark:border-dark-border text-center">
                                            <a href="#" onclick="showSection('notifications')" class="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium">View all notifications</a>
                                        </div>
                                    </div>
                                </div>

                                <!-- User Profile Dropdown -->
                                <div class="relative">
                                    <button id="profile-btn"
                                        class="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                                        <div
                                            class="bg-red-600 rounded-full w-8 h-8 flex items-center justify-center text-white">
                                            <i class="bi bi-person-fill"></i>
                                        </div>
                                        <div class="hidden sm:block text-left">
                                            <p id="navbar-user-name"
                                                class="text-sm font-medium text-gray-800 dark:text-dark-text truncate max-w-[120px] md:max-w-none">
                                                Admin User</p>
                                            <p id="navbar-user-role" class="text-xs text-gray-500 dark:text-dark-muted">
                                                Administrator</p>
                                        </div>
                                        <i
                                            class="bi bi-chevron-down text-gray-600 dark:text-dark-muted text-xs hidden sm:inline"></i>
                                    </button>

                                    <!-- Profile Dropdown -->
                                    <div id="profile-dropdown"
                                        class="hidden absolute right-0 mt-3 w-72 bg-white/95 dark:bg-dark-card/95 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/20 dark:border-dark-border z-50 animate-fade-in-up overflow-hidden">
                                        
                                        <!-- Mini Profile Header -->
                                        <div class="relative p-6 pb-4 bg-gradient-to-br from-gray-50 to-white dark:from-dark-card dark:to-dark-bg border-b border-gray-100 dark:border-dark-border">
                                            <div class="flex items-center space-x-4">
                                                <div class="relative group">
                                                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20 transform group-hover:rotate-6 transition-all duration-300">
                                                        <i class="bi bi-person-fill text-2xl"></i>
                                                    </div>
                                                    <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-dark-card rounded-full shadow-sm"></div>
                                                </div>
                                                <div class="flex-1 min-w-0">
                                                    <p id="dropdown-user-display-name" class="text-lg font-bold text-gray-900 dark:text-white truncate tracking-tight">Admin User</p>
                                                    <p id="dropdown-user-role-label" class="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-widest mt-0.5">Administrator</p>
                                                </div>
                                            </div>
                                            <div class="mt-4 space-y-2">
                                                <div class="flex items-center text-xs text-gray-500 dark:text-dark-muted">
                                                    <div class="w-6 h-6 rounded-lg bg-gray-100 dark:bg-dark-bg flex items-center justify-center mr-2">
                                                        <i class="bi bi-envelope"></i>
                                                    </div>
                                                    <span id="dropdown-user-email" class="truncate font-medium">admin@lgu.gov.ph</span>
                                                </div>
                                                <div class="flex items-center text-xs text-gray-500 dark:text-dark-muted">
                                                    <div class="w-6 h-6 rounded-lg bg-gray-100 dark:bg-dark-bg flex items-center justify-center mr-2">
                                                        <i class="bi bi-building"></i>
                                                    </div>
                                                    <span id="dropdown-user-office" class="font-medium tracking-tight">Legislative Office</span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Menu Sections -->
                                        <div class="p-2">
                                            <div class="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-400 dark:text-dark-muted uppercase tracking-[0.2em] select-none">Personal Account</div>
                                            <a href="#" onclick="showSection('profile'); return false;" class="group flex items-center px-4 py-3 text-sm text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200">
                                                <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                                    <i class="bi bi-person-circle text-base"></i>
                                                </div>
                                                <span class="flex-1 font-medium">My Profile</span>
                                                <i class="bi bi-chevron-right text-[10px] opacity-0 group-hover:opacity-100 transition-all"></i>
                                            </a>
                                            
                                            <?php if (isset($_SESSION['user_role']) && (strcasecmp($_SESSION['user_role'], 'Administrator') === 0 || strcasecmp($_SESSION['user_role'], 'Admin') === 0)): ?>
                                            <div class="px-3 pt-3 pb-1 text-[10px] font-bold text-gray-400 dark:text-dark-muted uppercase tracking-[0.2em] select-none">Administration</div>
                                            <a href="#" id="dropdown-settings" onclick="showSection('settings'); return false;" class="group flex items-center px-4 py-3 text-sm text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200">
                                                <div class="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                                    <i class="bi bi-gear-fill text-base"></i>
                                                </div>
                                                <span class="flex-1 font-medium">System Settings</span>
                                                <i class="bi bi-chevron-right text-[10px] opacity-0 group-hover:opacity-100 transition-all"></i>
                                            </a>
                                            <?php endif; ?>
                                        </div>

                                        <!-- Bottom Actions -->
                                        <div class="p-2 bg-gray-50/50 dark:bg-dark-bg/30 border-t border-gray-100 dark:border-dark-border">
                                            <a href="#" onclick="logout()" class="group flex items-center px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl font-bold transition-all duration-200">
                                                <div class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mr-3 group-hover:rotate-12 transition-all">
                                                    <i class="bi bi-box-arrow-right text-base"></i>
                                                </div>
                                                <span>Sign Out Account</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                </nav>

                <!-- Spotlight Search Modal -->
                <div id="global-search-overlay"
                    class="fixed inset-0 z-[100] flex items-start justify-center pt-6 opacity-0 pointer-events-none transition-all duration-300">
                    <!-- Backdrop -->
                    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onclick="closeGlobalSearch()"></div>

                    <!-- Search Container -->
                    <div id="global-search-container"
                        class="relative w-full max-w-4xl bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-border overflow-hidden transform scale-95 transition-all duration-300">

                        <!-- Input Bar -->
                        <div class="flex items-center gap-4 px-6 py-5 border-b border-gray-100 dark:border-dark-border">
                            <i class="bi bi-search text-gray-400 text-xl"></i>
                            <input type="text" id="global-search-input" placeholder="Search for everything..."
                                class="flex-1 bg-gray-50 dark:bg-dark-bg/50 border border-gray-200 dark:border-dark-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-gray-800 dark:text-white text-lg placeholder-gray-400 transition-all font-medium"
                                autocomplete="off">
                            <div class="flex items-center gap-3">
                                <kbd
                                    class="hidden md:inline-block px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700">ESC</kbd>
                                <button onclick="closeGlobalSearch()"
                                    class="text-gray-400 hover:text-red-500 transition-colors">
                                    <i class="bi bi-x-lg text-lg"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Results Area -->
                        <div id="global-search-results"
                            class="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar bg-gray-50/50 dark:bg-dark-bg/20 hidden">
                            <!-- Results will be injected here -->
                        </div>

                        <!-- Search Footer -->
                        <div
                            class="px-6 py-3 bg-gray-50 dark:bg-dark-bg/50 border-t border-gray-100 dark:border-dark-border flex items-center justify-between text-[10px] text-gray-400 dark:text-dark-muted">
                            <div class="flex gap-4">
                                <span><kbd
                                        class="bg-white dark:bg-dark-card px-1.5 py-0.5 rounded border border-gray-200 dark:border-dark-border shadow-sm mr-1">↵</kbd>
                                    Select</span>
                                <span><kbd
                                        class="bg-white dark:bg-dark-card px-1.5 py-0.5 rounded border border-gray-200 dark:border-dark-border shadow-sm mr-1">↑↓</kbd>
                                    Navigate</span>
                            </div>
                            <p>Legislative Agenda & Calendar System</p>
                        </div>
                    </div>
                </div>

                <!-- Main Content Area -->
                <main
                    class="flex-1 overflow-y-auto bg-gray-100 dark:bg-dark-bg p-4 sm:p-6 lg:p-8 relative flex flex-col transition-colors duration-300"
                    id="main-scroll-container">
                    <div id="content-area" class="flex-grow">
                        <!-- Content will be injected here via JavaScript -->
                    </div>

                    <!-- Admin/Staff Footer -->
                    <footer
                        class="mt-8 border-t border-gray-200 dark:border-dark-border pt-6 pb-2 text-center text-sm text-gray-500 dark:text-dark-muted">
                        <p>&copy; 2025 Legislative Agenda & Content System (LACS). City Government of Valenzuela.</p>
                        <div class="flex justify-center gap-4 mt-2 text-xs">
                            <a href="#" class="hover:text-red-700 dark:hover:text-red-400 transition">System Support</a>
                            <span>•</span>
                            <a href="#" class="hover:text-red-700 dark:hover:text-red-400 transition">User Manual</a>
                            <span>•</span>
                            <span class="text-gray-400 dark:text-dark-muted">v1.2.0</span>
                        </div>
                    </footer>
                </main>
            </div>
        </div>

        <!-- Scripts -->
        <script src="main-features.js?v=<?php echo time(); ?>"></script>
        <script src="calendar-features.js?v=<?php echo time(); ?>"></script>
        <script src="session-features.js?v=<?php echo time(); ?>"></script>
        <script src="session-actions.js?v=<?php echo time(); ?>"></script>
        <script src="agenda-features.js?v=<?php echo time(); ?>"></script>
        <script src="agenda-modal-new.js?v=<?php echo time(); ?>"></script>
        <script src="deadline-features.js?v=<?php echo time(); ?>"></script>
        <script src="reminders-features.js?v=<?php echo time(); ?>"></script>
        <script src="public-portal-features.js?v=<?php echo time(); ?>"></script>
        <script src="admin-modules.js?v=<?php echo time(); ?>"></script>
        <script src="staff-module.js?v=<?php echo time(); ?>"></script>
        <script src="user-moduule.js?v=<?php echo time(); ?>"></script>
        <script>
            // Toggle sidebar
            const sidebar = document.getElementById('sidebar');
            const sidebarToggle = document.getElementById('sidebar-toggle');
            const mobileMenuBtn = document.getElementById('mobile-menu-btn');
            const closeMobileSidebar = document.getElementById('close-mobile-sidebar');
            const mobileSidebar = document.getElementById('mobile-sidebar');
            const sidebarOverlay = document.getElementById('sidebar-overlay');

            // Desktop toggle
            sidebarToggle?.addEventListener('click', () => {
                sidebar.classList.toggle('sidebar-collapsed');
                sidebar.classList.toggle('sidebar-expanded');

                // Adjust main content margin if needed
                // The flex layout handles this automatically
            });

            // Mobile toggle
            function openMobileSidebar() {
                mobileSidebar.classList.remove('-translate-x-full');
                sidebarOverlay.classList.remove('opacity-0', 'pointer-events-none');
            }

            function closeMobileSidebarFunc() {
                mobileSidebar.classList.add('-translate-x-full');
                sidebarOverlay.classList.add('opacity-0', 'pointer-events-none');
            }
            window.closeMobileSidebar = closeMobileSidebarFunc;

            mobileMenuBtn?.addEventListener('click', openMobileSidebar);
            closeMobileSidebar?.addEventListener('click', closeMobileSidebarFunc);
            sidebarOverlay?.addEventListener('click', closeMobileSidebarFunc);

            // Close mobile sidebar on resize to desktop
            window.addEventListener('resize', () => {
                if (window.innerWidth >= 768) {
                    closeMobileSidebarFunc();
                }
            });



            // Global search overlay
            const headerSearchBtn = document.getElementById('header-search-btn');
            const globalSearchOverlay = document.getElementById('global-search-overlay');
            const globalSearchInput = document.getElementById('global-search-input');
            const globalSearchClose = document.getElementById('global-search-close');

            function openGlobalSearch() {
                const overlay = document.getElementById('global-search-overlay');
                const container = document.getElementById('global-search-container');
                const input = document.getElementById('global-search-input');

                if (!overlay || !container) return;

                overlay.classList.remove('opacity-0', 'pointer-events-none');
                container.classList.remove('scale-95');
                container.classList.add('scale-100');

                if (input) {
                    setTimeout(() => {
                        input.focus();
                        input.select();
                    }, 50);
                }
            }

            function closeGlobalSearch() {
                const overlay = document.getElementById('global-search-overlay');
                const container = document.getElementById('global-search-container');

                if (!overlay || !container) return;

                container.classList.remove('scale-100');
                container.classList.add('scale-95');
                overlay.classList.add('opacity-0', 'pointer-events-none');
            }

            // Wired up Search Logic
            globalSearchInput?.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    if (typeof performGlobalSearch === 'function') {
                        performGlobalSearch(query);
                    }
                } else {
                    const results = document.getElementById('global-search-results');
                    if (results) results.classList.add('hidden');
                }
            });

            headerSearchBtn?.addEventListener('click', (e) => {
                e.preventDefault();
                openGlobalSearch();
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                const overlay = document.getElementById('global-search-overlay');
                const container = document.getElementById('global-search-container');
                const btn = document.getElementById('header-search-btn');

                if (overlay && !overlay.classList.contains('opacity-0')) {
                    if (container && !container.contains(e.target) && btn && !btn.contains(e.target)) {
                        closeGlobalSearch();
                    }
                }
            });

            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeGlobalSearch();
                }
            });

            // Global System Settings Application
            window.systemSettings = {};
            
            // Centralized idle state to avoid duplication and help debugging
            window._idleState = {
                interval: null,
                lastActivity: Date.now(),
                isTracking: false
            };

            window.applySystemSettings = async function() {
                try {
                    const response = await fetch('../api/api_settings.php');
                    const data = await response.json();
                    if (data.success && data.settings) {
                        window.systemSettings = data.settings;
                        
                        // Apply System Identity
                        if (data.settings.system_name) {
                            document.title = data.settings.system_name + ' | LACS';
                            document.querySelectorAll('.dynamic-system-name').forEach(el => el.textContent = data.settings.system_name);
                        }
                        
                        if (data.settings.org_name) {
                            document.querySelectorAll('.dynamic-org-name').forEach(el => el.textContent = data.settings.org_name);
                        }
                        
                        // Apply Logo if provided
                        if (data.settings.system_logo_url) {
                            document.querySelectorAll('.dynamic-logo').forEach(img => img.src = data.settings.system_logo_url);
                        }

                        // Apply Session Timeout / Auto-lock
                        const isAutoLockEnabled = (data.settings.auto_lock_screen === 'true' || data.settings.auto_lock_screen === true || data.settings.auto_lock_screen === '1');
                        if (isAutoLockEnabled) {
                            startIdleTimer();
                        } else {
                            if (window._idleState.interval) clearInterval(window._idleState.interval);
                            window._idleState.isTracking = false;
                        }
                    }
                } catch (e) {
                    console.error('Failed to load system settings', e);
                }
            };

            function startIdleTimer() {
                if (window._idleState.interval) clearInterval(window._idleState.interval);
                
                // Only attach listeners once
                if (!window._idleState.isTracking) {
                    const resetTimer = () => {
                        window._idleState.lastActivity = Date.now();
                    };
                    
                    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'click'];
                    events.forEach(evt => document.addEventListener(evt, resetTimer, { passive: true }));
                    
                    // Capturing scroll to catch activity in sub-containers
                    window.addEventListener('scroll', resetTimer, { capture: true, passive: true });
                    
                    window._idleState.isTracking = true;
                    console.log('[Security] Activity tracking initialized.');
                }
                
                const timeoutMins = parseInt(window.systemSettings.session_timeout) || 30;
                console.log(`[Security] Session timeout monitor active: ${timeoutMins} minute(s).`);

                window._idleState.interval = setInterval(() => {
                    const timeoutMins = parseInt(window.systemSettings.session_timeout) || 30;
                    const timeoutMs = timeoutMins * 60 * 1000;
                    const idleTime = Date.now() - window._idleState.lastActivity;
                    
                    if (idleTime > timeoutMs) {
                        console.warn('[Security] Session idle timeout reached.');
                        clearInterval(window._idleState.interval);
                        
                        // Show premium alert modal first
                        showTimeoutModal();
                    }
                }, 10000); 
            }

            function showTimeoutModal() {
                const existing = document.getElementById('timeout-modal');
                if (existing) return;

                let countdown = 5;
                const modalHtml = `
                    <div id="timeout-modal" class="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                        <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-fade-in text-white/10 flex items-center justify-center select-none overflow-hidden pointer-events-none">
                            <div class="absolute inset-0 grid grid-cols-4 gap-4 rotate-12 scale-150 opacity-10">
                                ${Array(20).fill('<i class="bi bi-shield-slash text-9xl"></i>').join('')}
                            </div>
                        </div>
                        <div class="relative bg-white dark:bg-dark-card rounded-[32px] shadow-2xl border border-gray-100 dark:border-dark-border p-10 max-w-sm w-full animate-fade-in-up">
                            <div class="text-center">
                                <div class="w-24 h-24 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    <i class="bi bi-shield-lock-fill text-red-600 text-5xl"></i>
                                </div>
                                <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-3">Session Expired</h3>
                                <p class="text-gray-500 dark:text-dark-muted text-sm leading-relaxed mb-10 font-medium">
                                    For your security, your session has been terminated due to inactivity. You will be redirected to the login page shortly.
                                </p>
                                <button onclick="window.location.href = '../config/logout.php?reason=idle';" class="w-full py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black shadow-xl shadow-red-500/30 transition-all active:scale-95 flex items-center justify-center gap-3 group">
                                    <span>Sign In Again</span>
                                    <i class="bi bi-arrow-right transition-transform group-hover:translate-x-1"></i>
                                </button>
                                <p class="text-[10px] text-gray-400 mt-6 uppercase tracking-widest font-bold">Auto-redirecting in <span id="redir-countdown">5</span>s...</p>
                            </div>
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', modalHtml);
                document.body.style.overflow = 'hidden';

                // Live countdown timer
                const timer = setInterval(() => {
                    countdown--;
                    const span = document.getElementById('redir-countdown');
                    if (span) span.textContent = countdown;
                    
                    if (countdown <= 0) {
                        clearInterval(timer);
                        window.location.href = '../config/logout.php?reason=idle';
                    }
                }, 1000);
            }

            // Navbar real-time date & time
            const navbarDateEl = document.getElementById('navbar-date');
            const navbarTimeEl = document.getElementById('navbar-time');

            function updateNavbarDateTime() {
                if (!navbarDateEl || !navbarTimeEl) return;
                const now = new Date();
                
                // Get timezone from settings or default
                const tz = (window.systemSettings && window.systemSettings.system_timezone) ? window.systemSettings.system_timezone : 'Asia/Manila';
                
                try {
                    const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: tz };
                    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: tz };
                    
                    navbarDateEl.textContent = now.toLocaleDateString(undefined, dateOptions);
                    navbarTimeEl.textContent = now.toLocaleTimeString(undefined, timeOptions);
                } catch (err) {
                    // Fallback to local if invalid TZ
                    navbarDateEl.textContent = now.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
                    navbarTimeEl.textContent = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                }
            }

            // Bootstrap settings and clock
            (async () => {
                await applySystemSettings();
                updateNavbarDateTime();
                setInterval(updateNavbarDateTime, 1000);
            })();

            // Notifications toggle
            function toggleNotifications() {
                const dropdown = document.getElementById('notifications-dropdown');
                dropdown.classList.toggle('hidden');
            }

            // Close dropdowns when clicking outside
            document.addEventListener('click', (e) => {
                const notifBtn = document.getElementById('notifications-btn');
                const notifDropdown = document.getElementById('notifications-dropdown');
                const profileBtn = document.getElementById('profile-btn');
                const profileDropdown = document.getElementById('profile-dropdown');

                if (notifBtn && notifDropdown && !notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
                    notifDropdown.classList.add('hidden');
                }

                if (profileBtn && profileDropdown && !profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                    profileDropdown.classList.add('hidden');
                }
            });

            // Profile dropdown toggle
            document.getElementById('profile-btn')?.addEventListener('click', () => {
                const dropdown = document.getElementById('profile-dropdown');
                dropdown.classList.toggle('hidden');
            });

            // Logout function
            function logout() {
                // Show themed loading transition
                showMainLoading('Logging you out...');

                // Clear client-side storage
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('currentUser');
                sessionStorage.removeItem('isLoggedIn');
                sessionStorage.removeItem('currentUser');

                // Delay redirect for transition effect
                setTimeout(() => {
                    window.location.href = '../config/logout.php';
                }, 2000);
            }

            // Clear notifications for the current user (mark all as read on the server)
            async function clearAllNotifications() {
                try {
                    const reminders = window.latestNotifications || [];
                    const unread = reminders.filter(r => !r.is_read || r.is_read == 0);

                    if (unread.length > 0 && typeof window.markReminderAsRead === 'function') {
                        await Promise.all(unread.map(r => window.markReminderAsRead(r.reminder_id, true)));
                    }

                    // Refresh dropdown and badge from server
                    if (typeof window.populateNotifications === 'function') {
                        await window.populateNotifications();
                    } else {
                const list = document.getElementById('notifications-list');
                        const badge = document.getElementById('notification-badge');
                        if (list) {
                list.innerHTML = '<div class="p-4 text-center text-gray-500 text-sm">No new notifications</div>';
                        }
                        if (badge) {
                            badge.classList.add('hidden');
                        }
                    }
                } catch (e) {
                    console.error('Error clearing notifications:', e);
                }
            }

            // Theme toggle
            function toggleTheme() {
                const isDark = document.documentElement.classList.toggle('dark');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
                updateThemeIcons();
            }

            // Global initializeTheme proxy used by various modules
            function initializeTheme() {
                const isDark = localStorage.getItem('theme') === 'dark';
                if (isDark) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
                updateThemeIcons();
            }

            function updateThemeIcons() {
                const isDark = document.documentElement.classList.contains('dark');
                document.querySelector('.dark-mode-icon')?.classList.toggle('hidden', isDark);
                document.querySelector('.light-mode-icon')?.classList.toggle('hidden', !isDark);
            }

            // Initial icon sync
            updateThemeIcons();
        </script>
    </div> <!-- End of #app-container -->

    <!-- Global Loading Overlay -->
    <div id="main-loading-overlay" class="hidden opacity-0">
        <div class="loader-content">
            <div class="logo-container">
                <div class="orbit-ring-outer"></div>
                <div class="orbit-ring"></div>
                <img src="../images/logo.png" alt="LACS Logo" class="loader-logo">
            </div>

            <p id="loading-message" class="loading-text">Processing</p>

            <div class="loading-progress-container">
                <div id="loading-progress-bar"></div>
            </div>

            <p class="text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mt-8 font-bold">
                City Government of Valenzuela
            </p>
        </div>
    </div>

    <script>
        let loadingInterval;
        function showMainLoading(message = 'Processing') {
            const overlay = document.getElementById('main-loading-overlay');
            const msgEl = document.getElementById('loading-message');
            const progress = document.getElementById('loading-progress-bar');

            const messages = [
                message,
                'Sanitizing session data...',
                'Redirecting for security...',
                'Please wait...'
            ];
            let msgIdx = 0;

            msgEl.textContent = messages[0];
            progress.style.width = '0%';

            overlay.style.display = 'flex';
            overlay.style.pointerEvents = 'auto';
            overlay.classList.remove('hidden');

            setTimeout(() => {
                overlay.classList.add('opacity-100');
                progress.style.width = '100%';
            }, 10);

            loadingInterval = setInterval(() => {
                msgIdx = (msgIdx + 1) % messages.length;
                msgEl.style.opacity = '0';
                setTimeout(() => {
                    msgEl.textContent = messages[msgIdx];
                    msgEl.style.opacity = '1';
                }, 200);
            }, 600);

            document.body.style.overflow = 'hidden';
        }

        function hideMainLoading() {
            const overlay = document.getElementById('main-loading-overlay');
            clearInterval(loadingInterval);

            overlay.classList.remove('opacity-100');
            overlay.classList.add('opacity-0');
            overlay.style.pointerEvents = 'none';

            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.style.display = 'none';
                document.body.style.overflow = '';
            }, 400);
        }
    </script>
</body>

</html>