<?php
// index.php
session_start();

if (isset($_SESSION['is_logged_in']) && $_SESSION['is_logged_in'] === true) {
    header("Location: modules/main.php");
    exit;
}

// Handle initial view state to prevent flickering
$initialView = 'landing';
if (isset($_GET['logout']) && $_GET['logout'] === 'success') {
    $initialView = 'login';
    // Deeply clear session to prevent redirect loops
    session_unset();
    session_destroy();
    session_start();
} elseif (isset($_GET['showLogin']) && $_GET['showLogin'] === 'true') {
    $initialView = 'login';
}
?>
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LACS - Legislative Agenda and Calendar System</title>
    <meta name="description" content="Legislative Agenda and Calendar System for Valenzuela City">

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
                        },
                        dark: {
                            bg: '#0f172a',
                            card: '#1e293b',
                            border: '#334155',
                            text: '#e2e8f0',
                            muted: '#94a3b8',
                        }
                    },
                    animation: {
                        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
                        'fade-in': 'fadeIn 1s ease-out forwards',
                        'bounce-slow': 'bounce 3s infinite',
                    },
                    keyframes: {
                        fadeInUp: {
                            '0%': { opacity: '0', transform: 'translateY(20px)' },
                            '100%': { opacity: '1', transform: 'translateY(0)' },
                        },
                        fadeIn: {
                            '0%': { opacity: '0' },
                            '100%': { opacity: '1' },
                        }
                    }
                }
            }
        }
    </script>
    <script>
        // Prevent dark mode flicker - must run before page renders
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    </script>

    <style>
        /* Hide native browser password reveal/clear controls (Edge/IE) so only our custom eye shows */
        input::-ms-reveal,
        input::-ms-clear {
            display: none !important;
        }

        /* Hide autofill/credential UI decorations that can overlap custom icons (Chromium/WebKit) */
        input::-webkit-contacts-auto-fill-button,
        input::-webkit-credentials-auto-fill-button {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
            position: absolute !important;
            right: 0 !important;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
        }

        ::-webkit-scrollbar-track {
            background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }

        .glass-effect {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
        }

        .dark .glass-effect {
            background: rgba(30, 41, 59, 0.95);
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
            object-contain: contain;
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
            transition: width 0.2s ease-out;
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

        .status-dot {
            display: inline-block;
            width: 4px;
            height: 4px;
            background-color: currentColor;
            border-radius: 50%;
            margin-left: 2px;
            animation: dot-pulse 1.4s infinite;
        }

        @keyframes dot-pulse {

            0%,
            100% {
                opacity: 0.2;
            }

            50% {
                opacity: 1;
            }
        }

        /* Seamless View Transitions */
        .view-transition {
            transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            will-change: opacity, transform;
        }

        .view-hidden {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }

        .view-visible {
            display: flex !important;
            opacity: 1 !important;
            pointer-events: auto !important;
        }

        #main-content.view-visible {
            display: block !important;
        }
    </style>
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="images/logo.png">
    <link rel="apple-touch-icon" href="images/logo.png">
</head>

<body
    class="font-sans text-gray-800 antialiased bg-gray-50 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300 selection:bg-brand-100 selection:text-brand-900">

    <!-- Navigation -->
    <nav
        class="fixed w-full z-50 transition-all duration-300 glass-effect dark:bg-gray-900/95 dark:border-gray-800 border-b border-gray-100">
        <div class="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
            <div class="flex justify-between items-center h-20">
                <button onclick="showLandingView()"
                    class="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none group">
                    <div class="p-1">
                        <img src="images/logo.png" alt="Logo"
                            class="w-10 h-10 object-contain group-hover:scale-105 transition-transform duration-200">
                    </div>
                    <div class="text-left">
                        <span
                            class="text-xl font-bold text-gray-900 dark:text-white tracking-tight block leading-none">LACS</span>
                        <span class="text-xs text-brand-600 dark:text-brand-400 font-medium tracking-wide">VALENZUELA
                            CITY</span>
                    </div>
                </button>
                <div class="hidden xl:flex items-center space-x-10">
                    <a href="#features" <?= $initialView === 'login' ? 'style="display: none;"' : '' ?>
                        class="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Features</a>
                    <a href="#officials" <?= $initialView === 'login' ? 'style="display: none;"' : '' ?>
                        class="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Officials</a>
                    <a href="#history" <?= $initialView === 'login' ? 'style="display: none;"' : '' ?>
                        class="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">History</a>
                    <a href="#programs" <?= $initialView === 'login' ? 'style="display: none;"' : '' ?>
                        class="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Programs</a>
                    <a href="#awards" <?= $initialView === 'login' ? 'style="display: none;"' : '' ?>
                        class="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Awards</a>
                    <a href="#safety" <?= $initialView === 'login' ? 'style="display: none;"' : '' ?>
                        class="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Safety</a>
                    <a href="#projects" <?= $initialView === 'login' ? 'style="display: none;"' : '' ?>
                        class="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Projects</a>
                    <a href="#landmarks" <?= $initialView === 'login' ? 'style="display: none;"' : '' ?>
                        class="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Landmarks</a>
                    <a href="#news" <?= $initialView === 'login' ? 'style="display: none;"' : '' ?>
                        class="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">News</a>

                    <!-- Digital Clock (Aligned with main.php) -->
                    <div id="header-clock" <?= $initialView === 'login' ? 'style="display: none;"' : '' ?>
                        class="flex flex-col items-end leading-tight border-l border-gray-200 dark:border-gray-700 pl-8 ml-4 mr-2">
                        <span id="digital-date" class="text-xs font-medium text-gray-700 dark:text-gray-300">Jan 01,
                            2024</span>
                        <span id="digital-clock"
                            class="text-sm font-mono text-gray-500 dark:text-gray-400">00:00:00</span>
                    </div>


                    <!-- Dark Mode Toggle -->
                    <button id="theme-toggle" type="button"
                        class="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5">
                        <i id="theme-toggle-dark-icon" class="bi bi-moon-stars hidden"></i>
                        <i id="theme-toggle-light-icon" class="bi bi-sun hidden"></i>
                    </button>


                    <button onclick="showTermsGate()" id="nav-signin-btn"
                        class="px-5 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                        Sign In
                    </button>
                </div>
                <!-- Mobile menu button -->
                <div class="md:hidden flex items-center gap-4">
                    <button id="theme-toggle-mobile" type="button"
                        class="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5">
                        <i class="bi bi-circle-half"></i>
                    </button>
                    <button onclick="showTermsGate()" id="nav-signin-btn-mobile" <?= $initialView === 'login' ? 'style="display: none;"' : '' ?>
                        class="text-brand-600 dark:text-brand-400 font-semibold text-sm mr-4">Sign
                        In</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content Container -->
    <div id="main-content" class="<?= $initialView === 'login' ? 'view-hidden' : '' ?>" <?= $initialView === 'login' ? 'style="display: none;"' : '' ?>>
        <!-- Hero Section -->
        <section class="relative min-h-screen flex items-center overflow-hidden">
            <div class="absolute inset-0 z-0">
                <div
                    class="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
                </div>
                <!-- Decorative blobs -->
                <div
                    class="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-50 dark:bg-brand-900/20 blur-3xl opacity-50">
                </div>
                <div
                    class="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-50 dark:bg-blue-900/20 blur-3xl opacity-50">
                </div>
            </div>

            <div class="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 w-full">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    <!-- Hero Content -->
                    <div class="animate-fade-in-up text-center lg:text-left">
                        <h1
                            class="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6 leading-tight">
                            Legislative Agenda <br>
                            <span
                                class="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-800 dark:from-brand-400 dark:to-brand-600">
                                & Calendar System
                            </span>
                        </h1>
                        <p
                            class="mt-4 max-w-2xl mx-auto lg:mx-0 text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
                            Streamlining legislative processes for the City Government of Valenzuela.
                            Efficiently manage agendas, calendars, and documents in one secure platform.
                        </p>
                        <div class="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                            <button onclick="showTermsGate()"
                                class="px-8 py-4 text-base font-bold text-white bg-brand-600 rounded-xl shadow-lg hover:bg-brand-700 hover:shadow-brand-500/30 transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2">
                                Access System <i class="bi bi-arrow-right"></i>
                            </button>
                            <a href="#features"
                                class="px-8 py-4 text-base font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transform hover:-translate-y-1 transition-all duration-200">
                                Learn More
                            </a>
                        </div>
                    </div>

                    <!-- Hero Image / Mockup Slideshow -->
                    <div class="relative animate-fade-in opacity-0"
                        style="animation-delay: 0.3s; animation-fill-mode: forwards;">
                        <div
                            class="rounded-2xl bg-gray-900 p-2 shadow-2xl ring-1 ring-gray-900/10 dark:ring-white/10 relative overflow-hidden group">

                            <!-- Slides Container (Fading Transition) -->
                            <div id="hero-slides-container" class="relative w-full overflow-hidden">
                                <!-- Slide 1: Light Mode (Relative defines the height) -->
                                <div
                                    class="hero-slide relative transition-opacity duration-1000 ease-in-out opacity-100 z-10">
                                    <img src="images/preview-light.png" alt="Dashboard Light Mode"
                                        class="rounded-xl w-full h-auto object-cover shadow-inner block">
                                </div>
                                <!-- Slide 2: Dark Mode (Absolute) -->
                                <div
                                    class="hero-slide absolute inset-0 transition-opacity duration-1000 ease-in-out opacity-0 z-0">
                                    <img src="images/preview-dark.png" alt="Dashboard Dark Mode"
                                        class="rounded-xl w-full h-auto object-cover shadow-inner block">
                                </div>
                            </div>

                            <!-- Navigation Dots -->
                            <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-30">
                                <button onclick="goToHeroSlide(0)"
                                    class="hero-dot w-6 h-2 rounded-full bg-white transition-all duration-300"
                                    data-index="0"></button>
                                <button onclick="goToHeroSlide(1)"
                                    class="hero-dot w-2 h-2 rounded-full bg-white/40 hover:bg-white transition-all duration-300"
                                    data-index="1"></button>
                            </div>

                            <!-- Manual Navigation Arrows -->
                            <button onclick="prevHeroSlide()"
                                class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-md z-40">
                                <i class="bi bi-chevron-left"></i>
                            </button>
                            <button onclick="nextHeroSlide()"
                                class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-md z-40">
                                <i class="bi bi-chevron-right"></i>
                            </button>
                        </div>

                        <script>
                            let currentHeroSlide = 0;
                            const heroSlides = document.querySelectorAll('.hero-slide');
                            const heroDots = document.querySelectorAll('.hero-dot');
                            const totalHeroSlides = heroSlides.length;

                            function updateHeroSlider() {
                                heroSlides.forEach((slide, idx) => {
                                    if (idx === currentHeroSlide) {
                                        slide.classList.add('opacity-100', 'z-10');
                                        slide.classList.remove('opacity-0', 'z-0');
                                    } else {
                                        slide.classList.add('opacity-0', 'z-0');
                                        slide.classList.remove('opacity-100', 'z-10');
                                    }
                                });

                                heroDots.forEach((dot, idx) => {
                                    if (idx === currentHeroSlide) {
                                        dot.classList.add('bg-white', 'w-6');
                                        dot.classList.remove('bg-white/40', 'w-2');
                                    } else {
                                        dot.classList.remove('bg-white', 'w-6');
                                        dot.classList.add('bg-white/40', 'w-2');
                                    }
                                });
                            }

                            function nextHeroSlide() {
                                currentHeroSlide = (currentHeroSlide + 1) % totalHeroSlides;
                                updateHeroSlider();
                            }

                            function prevHeroSlide() {
                                currentHeroSlide = (currentHeroSlide - 1 + totalHeroSlides) % totalHeroSlides;
                                updateHeroSlider();
                            }

                            function goToHeroSlide(index) {
                                currentHeroSlide = index;
                                updateHeroSlider();
                            }

                            // Auto Play
                            let heroInterval = setInterval(nextHeroSlide, 5000);

                            // Pause on hover
                            const heroMockup = document.getElementById('hero-slides-container')?.parentElement;
                            if (heroMockup) {
                                heroMockup.addEventListener('mouseenter', () => clearInterval(heroInterval));
                                heroMockup.addEventListener('mouseleave', () => {
                                    clearInterval(heroInterval);
                                    heroInterval = setInterval(nextHeroSlide, 5000);
                                });
                            }

                            // Initial state
                            updateHeroSlider();
                        </script>
                    </div>

                </div>
            </div>
        </section>

        <!-- Features Grid -->
        <section id="features" class="py-24 bg-white dark:bg-gray-950 transition-colors duration-300">
            <div class="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
                <div class="text-center max-w-3xl mx-auto mb-16">
                    <h2 class="text-brand-600 dark:text-brand-400 font-bold tracking-wide uppercase text-sm mb-3">System
                        Capabilities</h2>
                    <h3 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Everything you need to
                        manage legislative work</h3>
                    <p class="text-gray-600 dark:text-gray-400 text-lg">Comprehensive tools designed specifically for
                        the
                        needs of the City Council and legislative staff.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <!-- Features Loop -->
                    <div
                        class="group p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800">
                        <div
                            class="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                            <i class="bi bi-calendar-week"></i>
                        </div>
                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Calendar Management</h4>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed">Centralized master calendar for all
                            legislative activities, ensuring no conflicts and seamless organization.</p>
                    </div>

                    <div
                        class="group p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800">
                        <div
                            class="w-14 h-14 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                            <i class="bi bi-clock-history"></i>
                        </div>
                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Session Scheduling</h4>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed">Efficiently schedule regular and
                            special
                            sessions with automated notifications for all attendees.</p>
                    </div>

                    <div
                        class="group p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800">
                        <div
                            class="w-14 h-14 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                            <i class="bi bi-list-check"></i>
                        </div>
                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Agenda Creation</h4>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed">Streamlined agenda builder with
                            drag-and-drop functionality and automatic document linking.</p>
                    </div>

                    <div
                        class="group p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800">
                        <div
                            class="w-14 h-14 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                            <i class="bi bi-hourglass-split"></i>
                        </div>
                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Deadline Tracking</h4>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed">Monitor critical deadlines for
                            ordinances and resolutions with real-time status updates.</p>
                    </div>

                    <div
                        class="group p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800">
                        <div
                            class="w-14 h-14 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                            <i class="bi bi-bell"></i>
                        </div>
                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Reminder System</h4>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed">Automated alerts and notifications
                            to
                            ensure no task, meeting, or deadline is ever missed.</p>
                    </div>

                    <div
                        class="group p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800">
                        <div
                            class="w-14 h-14 bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                            <i class="bi bi-stars"></i>
                        </div>
                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-3">AI Document Classification</h4>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed">Smart categorization of legislative
                            documents using advanced AI to improve search and retrieval.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- City Officials Section -->
        <section id="officials" class="py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div class="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
                <div class="text-center mb-16">
                    <h2 class="text-brand-600 dark:text-brand-400 font-bold tracking-wide uppercase text-sm mb-3">
                        Leadership
                    </h2>
                    <h3 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">City Officials</h3>
                    <p class="text-gray-600 dark:text-gray-400 text-lg">Meet the dedicated leaders serving Valenzuela
                        City.
                    </p>
                </div>

                <!-- Mayor & Vice Mayor -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 justify-center">

                    <!-- Mayor -->
                    <div
                        class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 text-center transform hover:-translate-y-2 transition-all duration-300">
                        <div
                            class="relative w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden ring-4 ring-brand-100 dark:ring-brand-900">
                            <img src="images/mayor_wes.png?v=<?php echo time(); ?>" alt="Mayor Wes Gatchalian"
                                class="w-full h-full object-cover">
                        </div>
                        <h4 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">Wes Gatchalian</h4>
                        <p class="text-brand-600 dark:text-brand-400 font-medium uppercase tracking-wider text-sm mb-4">
                            City
                            Mayor</p>
                        <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
                            Leading Valenzuela City towards a progressive and livable future through innovative
                            governance
                            and compassionate public service.
                        </p>
                    </div>

                    <!-- Vice Mayor -->
                    <div
                        class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 text-center transform hover:-translate-y-2 transition-all duration-300">
                        <div
                            class="relative w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden ring-4 ring-gray-100 dark:ring-gray-700 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <img src="images/vice_marlon.png?v=<?php echo time(); ?>"
                                alt="Vice Mayor Marlon Alejandrino" class="w-full h-full object-cover">
                        </div>
                        <h4 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">Marlon Alejandrino</h4>
                        <p class="text-brand-600 dark:text-brand-400 font-medium uppercase tracking-wider text-sm mb-4">
                            Vice
                            Mayor</p>
                        <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
                            Presiding over the City Council with a focus on legislative excellence and community
                            empowerment.
                        </p>
                    </div>
                </div>

                <!-- Councilors -->
                <div class="text-center mb-10">
                    <h4 class="text-xl font-bold text-gray-900 dark:text-white">City Councilors</h4>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                    <!-- Councilor 1 -->
                    <div
                        class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex items-center space-x-4 hover:shadow-lg transition-shadow">
                        <div
                            class="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                            <img src="images/ramon-encarnacion.jpg" alt="RE" class="w-full h-full object-cover">
                        </div>
                        <div>
                            <h5 class="font-bold text-gray-900 dark:text-white">Ramon Encarnacion</h5>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">District 1 Councilor</p>
                            <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">Advocate for youth
                                development
                                and sports programs across the district.</p>
                        </div>
                    </div>

                    <!-- Councilor 2 -->
                    <div
                        class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex items-center space-x-4 hover:shadow-lg transition-shadow">
                        <div
                            class="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                            <img src="images/ricardo-enriquez.jpg" alt="RE" class="w-full h-full object-cover">
                        </div>
                        <div>
                            <h5 class="font-bold text-gray-900 dark:text-white">Ricardo Enriquez</h5>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">District 1 Councilor</p>
                            <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">Championing environmental
                                sustainability and urban greening projects.</p>
                        </div>
                    </div>

                    <!-- Councilor 3 -->
                    <div
                        class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex items-center space-x-4 hover:shadow-lg transition-shadow">
                        <div
                            class="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                            <img src="images/cristina-marie.jpg" alt="CF" class="w-full h-full object-cover">
                        </div>
                        <div>
                            <h5 class="font-bold text-gray-900 dark:text-white">Cristina Marie Feliciano</h5>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">District 1 Councilor</p>
                            <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">Focused on healthcare
                                accessible and women's welfare initiatives.</p>
                        </div>
                    </div>

                    <!-- Councilor 4 -->
                    <div
                        class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex items-center space-x-4 hover:shadow-lg transition-shadow">
                        <div
                            class="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                            <img src="images/ghogo-deato.jpg" alt="GL" class="w-full h-full object-cover">
                        </div>
                        <div>
                            <h5 class="font-bold text-gray-900 dark:text-white">Ghogo Deato Lee</h5>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">District 1 Councilor</p>
                            <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">Supporting local businesses
                                and
                                economic growth in the community.</p>
                        </div>
                    </div>

                    <!-- Councilor 5 -->
                    <div
                        class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex items-center space-x-4 hover:shadow-lg transition-shadow">
                        <div
                            class="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                            <img src="images/louie-nolasco.jpg" alt="LN" class="w-full h-full object-cover">
                        </div>
                        <div>
                            <h5 class="font-bold text-gray-900 dark:text-white">Louie Nolasco</h5>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">District 2 Councilor</p>
                            <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">Dedicated to education
                                reform
                                and scholarship programs for students.</p>
                        </div>
                    </div>

                    <!-- Councilor 6 -->
                    <div
                        class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex items-center space-x-4 hover:shadow-lg transition-shadow">
                        <div
                            class="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                            <img src="images/chiqui-carreon.jpg" alt="CC" class="w-full h-full object-cover">
                        </div>
                        <div>
                            <h5 class="font-bold text-gray-900 dark:text-white">Chiqui Carreon</h5>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">District 2 Councilor</p>
                            <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">Promoting culture, arts,
                                and
                                tourism in Valenzuela City.</p>
                        </div>
                    </div>

                </div>
            </div>
        </section>

        <!-- History Section -->
        <section id="history" class="py-24 bg-white dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
            <div class="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div class="relative">
                        <div
                            class="absolute -top-10 -left-10 w-40 h-40 bg-brand-100 dark:bg-brand-900/30 rounded-full blur-3xl opacity-60">
                        </div>
                        <div class="relative rounded-2xl overflow-hidden shadow-2xl">
                            <img src="images/city_hall.png" alt="Historical Valenzuela"
                                class="w-full h-96 object-cover">
                            <div class="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent"></div>
                            <div class="absolute bottom-6 left-6 text-white">
                                <p class="text-sm font-medium opacity-80 uppercase tracking-widest mb-1">Established</p>
                                <p class="text-3xl font-bold">1623</p>
                            </div>
                        </div>
                        <!-- Video Link / Lightbox trigger -->
                        <div
                            class="mt-8 flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div
                                class="w-12 h-12 bg-brand-600 rounded-lg flex items-center justify-center text-white text-xl">
                                <i class="bi bi-play-fill"></i>
                            </div>
                            <div>
                                <h5 class="font-bold text-gray-900 dark:text-white">Watch City History</h5>
                                <a href="https://www.youtube.com/watch?v=IBUCnYd6CaQ&pp=ygUaaGlzdG9yeSBvZiB2YWxlbnp1ZWxhIGNpdHk%3D"
                                    target="_blank"
                                    class="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline">View
                                    on YouTube <i class="bi bi-box-arrow-up-right ml-1"></i></a>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 class="text-brand-600 dark:text-brand-400 font-bold tracking-wide uppercase text-sm mb-3">
                            Our Roots</h2>
                        <h3 class="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">The
                            Story of Valenzuela</h3>
                        <div class="space-y-4 text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                            <p>
                                Originally known as <span
                                    class="text-gray-900 dark:text-white font-semibold">Polo</span>, derived from the
                                Tagalog word "pulo" meaning island, our city's journey began in 1623. What started as a
                                small settlement of fishermen has evolved into the industrial powerhouse it is today.
                            </p>
                            <div class="my-6 rounded-xl overflow-hidden shadow-lg h-40">
                                <img src="images/arkong-bato.jpg" alt="Arkong Bato" class="w-full h-full object-cover">
                            </div>
                            <p>
                                Renamed in honor of <span class="text-gray-900 dark:text-white font-semibold">Dr. Pio
                                    Valenzuela</span>, a physician and a prominent figure in the Katipunan, the city
                                embodies a legacy of patriotism and service.
                            </p>
                            <div class="my-6 flex items-center gap-6">
                                <img src="images/pio-valenzuela.jpg" alt="Dr. Pio Valenzuela"
                                    class="w-24 h-24 rounded-full object-cover border-4 border-brand-100 shadow-md">
                                <p class="text-sm italic">"Dr. Pio Valenzuela was a Filipino physician and revolutionary
                                    who was a principal member of the Katipunan."</p>
                            </div>
                            <div class="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div class="flex gap-4">
                                    <div
                                        class="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/30 flex-shrink-0 flex items-center justify-center text-brand-600">
                                        <i class="bi bi-bank"></i>
                                    </div>
                                    <div>
                                        <h6 class="font-bold text-gray-900 dark:text-white">San Diego Church</h6>
                                        <p class="text-sm">One of the city's oldest landmarks and a symbol of faith and
                                            history.</p>
                                    </div>
                                </div>
                                <div class="flex gap-4">
                                    <div
                                        class="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/30 flex-shrink-0 flex items-center justify-center text-brand-600">
                                        <i class="bi bi-geo-alt"></i>
                                    </div>
                                    <div>
                                        <h6 class="font-bold text-gray-900 dark:text-white">Arkong Bato</h6>
                                        <p class="text-sm">The historic stone arch that serves as the boundary and
                                            gateway.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Programs Section -->
        <section id="programs" class="py-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div class="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
                <div class="text-center max-w-3xl mx-auto mb-16">
                    <h2 class="text-brand-600 dark:text-brand-400 font-bold tracking-wide uppercase text-sm mb-3">
                        Governance</h2>
                    <h3 class="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Five Pillars of
                        Progress</h3>
                    <p class="text-gray-600 dark:text-gray-400 text-lg">Our comprehensive programs are built upon five
                        core pillars dedicated to improving every Valenzuelano's life.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <!-- Education -->
                    <div
                        class="group bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300">
                        <div
                            class="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                            <i class="bi bi-book text-2xl"></i>
                        </div>
                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Education</h4>
                        <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm">Building state-of-the-art schools and
                            providing free supplies through the Education 360 Degrees Investment Program.</p>
                        <img src="images/education.jpg" alt="Education"
                            class="w-full h-32 object-cover rounded-xl mt-4">
                    </div>

                    <div
                        class="group bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300">
                        <div
                            class="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 text-red-600 dark:text-red-400">
                            <i class="bi bi-heart-pulse text-2xl"></i>
                        </div>
                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Health</h4>
                        <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm">Expanding healthcare with VCares and
                            the new Valenzuela City Eye Center for specialized care.</p>
                        <img src="images/health.jpg" alt="Health" class="w-full h-32 object-cover rounded-xl mt-4">
                    </div>

                    <div
                        class="group bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300">
                        <div
                            class="w-14 h-14 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
                            <i class="bi bi-house-door text-2xl"></i>
                        </div>
                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Housing</h4>
                        <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm">Providing dignified homes through
                            Disiplina Village, the largest in-city resettlement project in the Philippines.</p>
                        <img src="images/housing.jpg" alt="Housing" class="w-full h-32 object-cover rounded-xl mt-4">
                    </div>
                    <div
                        class="group bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300">
                        <div
                            class="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mb-6 text-orange-600 dark:text-orange-400">
                            <i class="bi bi-briefcase text-2xl"></i>
                        </div>
                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Trade & Industry</h4>
                        <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm">Simplifying business processes through
                            the Paspas Permit and supporting the Pamilyang Valenzuelano program.</p>
                        <img src="images/trade-industry.jpg" alt="Trade"
                            class="w-full h-32 object-cover rounded-xl mt-4">
                    </div>

                    <div
                        class="group bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300">
                        <div
                            class="w-14 h-14 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center mb-6 text-teal-600 dark:text-teal-400">
                            <i class="bi bi-tree text-2xl"></i>
                        </div>
                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Livelihood</h4>
                        <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm">Empowering Valenzuelanos through
                            skills training and sustainable employment opportunities.</p>
                        <img src="images/livelihood.jpg" alt="Livelihood"
                            class="w-full h-32 object-cover rounded-xl mt-4">
                    </div>
                </div>
            </div>
        </section>

        <!-- Awards Section -->
        <section id="awards" class="py-24 bg-white dark:bg-gray-950 transition-colors duration-300">
            <div class="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
                <div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div class="max-w-2xl">
                        <h2 class="text-brand-600 dark:text-brand-400 font-bold tracking-wide uppercase text-sm mb-3">
                            Recognition</h2>
                        <h3 class="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">A Legacy
                            of Excellence</h3>
                    </div>
                </div>

                <div class="relative overflow-hidden py-10">
                    <div id="awards-track" class="flex gap-6 animate-cinema-roll hover:pause-animation">
                        <!-- Award 1 -->
                        <div
                            class="min-w-[280px] sm:min-w-[320px] bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                            <div class="h-44 overflow-hidden bg-gray-100 dark:bg-gray-700">
                                <img src="images/galing-pook.jpg" alt="Galing Pook"
                                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                            </div>
                            <div class="p-6 text-center">
                                <div class="mb-2 text-yellow-500 text-2xl"><i class="bi bi-trophy-fill"></i></div>
                                <h5 class="font-bold text-gray-900 dark:text-white mb-1">Galing Pook Award</h5>
                                <p
                                    class="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-semibold text-brand-600 dark:text-brand-400">
                                    2024 Winner</p>
                                <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed px-2">National
                                    recognition for excellence in local governance and child protection.</p>
                            </div>
                        </div>
                        <!-- ... (Repeat others) ... -->
                        <!-- Award 1 -->
                        <div
                            class="min-w-[280px] sm:min-w-[320px] snap-start bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                            <div class="h-44 overflow-hidden bg-gray-100 dark:bg-gray-700">
                                <img src="images/galing-pook.jpg" alt="Galing Pook"
                                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                            </div>
                            <div class="p-6 text-center">
                                <div class="mb-2 text-yellow-500 text-2xl">
                                    <i class="bi bi-trophy-fill"></i>
                                </div>
                                <h5 class="font-bold text-gray-900 dark:text-white mb-1">Galing Pook Award</h5>
                                <p
                                    class="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-semibold text-brand-600 dark:text-brand-400">
                                    2024 Winner</p>
                                <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed px-2">National
                                    recognition for excellence in local governance and child protection.</p>
                            </div>
                        </div>

                        <!-- Award 2 -->
                        <div
                            class="min-w-[280px] sm:min-w-[320px] snap-start bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                            <div class="h-44 overflow-hidden bg-gray-100 dark:bg-gray-700">
                                <img src="images/seal-sglg.jpg" alt="SGLG"
                                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                            </div>
                            <div class="p-6 text-center">
                                <div class="mb-2 text-blue-500 text-2xl">
                                    <i class="bi bi-patch-check-fill"></i>
                                </div>
                                <h5 class="font-bold text-gray-900 dark:text-white mb-1">Seal of SGLG</h5>
                                <p
                                    class="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-semibold text-brand-600 dark:text-brand-400">
                                    2024 Recipient</p>
                                <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed px-2">Seal of Good
                                    Local
                                    Governance for transparency and accountability.</p>
                            </div>
                        </div>

                        <!-- Award 3 -->
                        <div
                            class="min-w-[280px] sm:min-w-[320px] snap-start bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                            <div class="h-44 overflow-hidden bg-gray-100 dark:bg-gray-700">
                                <img src="images/good-education.jpeg" alt="Education Award"
                                    class="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500">
                            </div>
                            <div class="p-6 text-center">
                                <div class="mb-2 text-brand-600 text-2xl">
                                    <i class="bi bi-shield-check"></i>
                                </div>
                                <h5 class="font-bold text-gray-900 dark:text-white mb-1">Good Education</h5>
                                <p
                                    class="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-semibold text-brand-600 dark:text-brand-400">
                                    2025 SyCip Award</p>
                                <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed px-2">6th time
                                    receiving
                                    the Seal of Good Education Governance.</p>
                            </div>
                        </div>

                        <!-- Award 4 -->
                        <div
                            class="min-w-[280px] sm:min-w-[320px] snap-start bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                            <div class="h-44 overflow-hidden bg-gray-100 dark:bg-gray-700">
                                <img src="images/oro-inidoro.png" alt="Oro Inodoro"
                                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                            </div>
                            <div class="p-6 text-center">
                                <div class="mb-2 text-teal-500 text-2xl">
                                    <i class="bi bi-droplet-fill"></i>
                                </div>
                                <h5 class="font-bold text-gray-900 dark:text-white mb-1">Oro Inodoro Award</h5>
                                <p
                                    class="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-semibold text-brand-600 dark:text-brand-400">
                                    2025 Grand Champion</p>
                                <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed px-2">National Grand
                                    Champion for Best Sanitation Practices.</p>
                            </div>
                        </div>

                        <!-- Award 5 -->
                        <div
                            class="min-w-[280px] sm:min-w-[320px] snap-start bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                            <div class="h-44 overflow-hidden bg-gray-100 dark:bg-gray-700">
                                <img src="images/housekeeping.jpg" alt="Financial Housekeeping"
                                    class="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500">
                            </div>
                            <div class="p-6 text-center">
                                <div class="mb-2 text-green-500 text-2xl">
                                    <i class="bi bi-bank2"></i>
                                </div>
                                <h5 class="font-bold text-gray-900 dark:text-white mb-1">Good Housekeeping</h5>
                                <p
                                    class="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-semibold text-brand-600 dark:text-brand-400">
                                    2024 DILG Passer</p>
                                <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed px-2">Consistently
                                    passing the Seal of Good Financial Housekeeping.</p>
                            </div>
                        </div>

                        <!-- Award 6 -->
                        <div
                            class="min-w-[280px] sm:min-w-[320px] snap-start bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                            <div class="h-44 overflow-hidden bg-gray-100 dark:bg-gray-700">
                                <img src="images/trade-industry.jpg" alt="Most Competitive City"
                                    class="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500">
                            </div>
                            <div class="p-6 text-center">
                                <div class="mb-2 text-indigo-500 text-2xl">
                                    <i class="bi bi-graph-up-arrow"></i>
                                </div>
                                <h5 class="font-bold text-gray-900 dark:text-white mb-1">Most Competitive</h5>
                                <p
                                    class="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-semibold text-brand-600 dark:text-brand-400">
                                    2023 DTI Top 3</p>
                                <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed px-2">Top rank in
                                    Economic Dynamism and Government Efficiency.</p>
                            </div>
                        </div>

                        <!-- Award 7 -->
                        <div
                            class="min-w-[280px] sm:min-w-[320px] snap-start bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                            <div class="h-44 overflow-hidden bg-gray-100 dark:bg-gray-700">
                                <img src="images/clean-tourist.jpg" alt="Clean City"
                                    class="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500">
                            </div>
                            <div class="p-6 text-center">
                                <div class="mb-2 text-emerald-500 text-2xl">
                                    <i class="bi bi-stars"></i>
                                </div>
                                <h5 class="font-bold text-gray-900 dark:text-white mb-1">Clean Tourist City</h5>
                                <p
                                    class="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-semibold text-brand-600 dark:text-brand-400">
                                    ASEAN Standard</p>
                                <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed px-2">Asean Clean
                                    Tourist
                                    City Standard compliance for sustainability.</p>
                            </div>
                        </div>
                    </div>
                </div>
        </section>

        <!-- Safety & Advisory Section -->
        <section id="safety" class="py-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div class="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <!-- Hotlines Column -->
                    <div class="lg:col-span-1">
                        <div class="sticky top-24">
                            <h2
                                class="text-brand-600 dark:text-brand-400 font-bold tracking-wide uppercase text-sm mb-3">
                                Emergency</h2>
                            <h3 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Hotline Numbers</h3>
                            <p class="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">Keeping Valenzuelanos safe
                                24/7. Save these numbers for immediate assistance.</p>

                            <div class="space-y-3">
                                <div
                                    class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
                                    <div class="flex items-center gap-4">
                                        <div
                                            class="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-500">
                                            <i class="bi bi-telephone-fill"></i>
                                        </div>
                                        <span class="font-bold text-gray-900 dark:text-white">Main Line</span>
                                    </div>
                                    <span class="text-brand-600 font-mono font-bold">8352-1000</span>
                                </div>
                                <div
                                    class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
                                    <div class="flex items-center gap-4">
                                        <div
                                            class="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                                            <i class="bi bi-shield-shaded"></i>
                                        </div>
                                        <span class="font-bold text-gray-900 dark:text-white">City Police</span>
                                    </div>
                                    <span class="text-brand-600 font-mono font-bold">8352-4000</span>
                                </div>
                                <div
                                    class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
                                    <div class="flex items-center gap-4">
                                        <div
                                            class="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                                            <i class="bi bi-exclamation-triangle-fill"></i>
                                        </div>
                                        <span class="font-bold text-gray-900 dark:text-white">VCDRRMO/ALERT</span>
                                    </div>
                                    <span class="text-brand-600 font-mono font-bold">8352-5000</span>
                                </div>
                                <div
                                    class="mt-6 flex items-center justify-center gap-4 p-4 bg-brand-600 text-white rounded-xl shadow-lg font-bold">
                                    <div class="flex flex-col items-center">
                                        <span class="text-xs opacity-80 uppercase tracking-widest mb-1">National
                                            Emergency</span>
                                        <div class="flex items-center gap-3 text-2xl">
                                            <i class="bi bi-telephone-outbound"></i>
                                            <span>911</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Advisory Column -->
                    <div class="lg:col-span-2">
                        <div class="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                            <div>
                                <h2
                                    class="text-brand-600 dark:text-brand-400 font-bold tracking-wide uppercase text-sm mb-2">
                                    Public Notice</h2>
                                <h3 class="text-3xl font-bold text-gray-900 dark:text-white">Safety Advisories</h3>
                            </div>
                            <span
                                class="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">Updated:
                                Feb 08, 2026</span>
                        </div>

                        <div class="space-y-6">
                            <!-- Weather Advisory -->
                            <div
                                class="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-shadow">
                                <div class="p-6">
                                    <div class="flex items-center justify-between mb-4">
                                        <span
                                            class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-bold rounded-full uppercase">Weather</span>
                                        <span class="text-xs text-gray-500 dark:text-gray-400">Today</span>
                                    </div>
                                    <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-2">February 2026
                                        Forecast</h4>
                                    <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                                        Fair weather with occasional thunderstorms. Average temperature: <span
                                            class="text-brand-600 font-bold">24°C - 33°C</span>. Stay hydrated and carry
                                        umbrellas for sudden rains.
                                    </p>
                                </div>
                            </div>

                            <!-- Traffic Notice -->
                            <div
                                class="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-shadow">
                                <div class="p-6">
                                    <div class="flex items-center justify-between mb-4">
                                        <span
                                            class="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300 text-xs font-bold rounded-full uppercase">Traffic</span>
                                        <span class="text-xs text-gray-500 dark:text-gray-400">Regular</span>
                                    </div>
                                    <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Number Coding
                                        Reminder</h4>
                                    <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                        Uniform Vehicle Volume Reduction Program in effect: <span class="font-bold">7:00
                                            AM - 10:00 AM</span> and <span class="font-bold">5:00 PM - 8:00 PM</span>.
                                        Plan your travels accordingly.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Featured Projects Section -->
        <section id="projects" class="py-24 bg-white dark:bg-gray-950 transition-colors duration-300">
            <div class="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
                <div class="text-center mb-16">
                    <h2 class="text-brand-600 dark:text-brand-400 font-bold tracking-wide uppercase text-sm mb-3">
                        Infrastructure</h2>
                    <h3 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Featured Projects</h3>
                    <p class="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">Valenzuela City is committed
                        to
                        continuous development through sustainable infrastructure and community-centered projects.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    <!-- Project 1: People's Park -->
                    <div
                        class="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 h-96">
                        <img src="images/peoples-park.jpg" alt="Valenzuela People's Park"
                            class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700">
                        <div
                            class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80 lg:opacity-60 lg:group-hover:opacity-80 transition-opacity">
                        </div>
                        <div class="absolute bottom-0 left-0 p-8 w-full">
                            <span
                                class="inline-block px-3 py-1 bg-brand-600 text-white text-xs font-bold rounded-full mb-3">Recreation</span>
                            <h4 class="text-2xl font-bold text-white mb-2">Valenzuela People's Park</h4>
                            <p
                                class="text-gray-200 text-sm opacity-0 lg:group-hover:opacity-100 transform lg:translate-y-4 lg:group-hover:translate-y-0 transition-all duration-300">
                                1.5 hectare interactive public space with state-of-the-art amenities for families.
                            </p>
                        </div>
                    </div>

                    <!-- Project 2: Disiplina Village -->
                    <div
                        class="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 h-96">
                        <img src="images/housing.jpg" alt="Disiplina Village"
                            class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700">
                        <div
                            class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80 lg:opacity-60 lg:group-hover:opacity-80 transition-opacity">
                        </div>
                        <div class="absolute bottom-0 left-0 p-8 w-full">
                            <span
                                class="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full mb-3">Housing</span>
                            <h4 class="text-2xl font-bold text-white mb-2">Disiplina Village</h4>
                            <p
                                class="text-gray-200 text-sm opacity-0 lg:group-hover:opacity-100 transform lg:translate-y-4 lg:group-hover:translate-y-0 transition-all duration-300">
                                A benchmark for in-city relocation, providing safe and decent housing for informal
                                settler
                                families.
                            </p>
                        </div>
                    </div>

                    <!-- Project 3: Legislative Building -->
                    <div
                        class="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 h-96">
                        <img src="images/city-hall.jpg" alt="New Legislative Building"
                            class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700">
                        <div
                            class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80 lg:opacity-60 lg:group-hover:opacity-80 transition-opacity">
                        </div>
                        <div class="absolute bottom-0 left-0 p-8 w-full">
                            <span
                                class="inline-block px-3 py-1 bg-gray-600 text-white text-xs font-bold rounded-full mb-3">Government</span>
                            <h4 class="text-2xl font-bold text-white mb-2">New Legislative Building</h4>
                            <p
                                class="text-gray-200 text-sm opacity-0 lg:group-hover:opacity-100 transform lg:translate-y-4 lg:group-hover:translate-y-0 transition-all duration-300">
                                Modernizing governance facilities to better serve the people of Valenzuela.
                            </p>
                        </div>
                    </div>

                    <!-- Project 4: Flood Control -->
                    <div
                        class="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 h-96">
                        <img src="images/flood_control.png" alt="Flood Control Project"
                            class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700">
                        <div
                            class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80 lg:opacity-60 lg:group-hover:opacity-80 transition-opacity">
                        </div>
                        <div class="absolute bottom-0 left-0 p-8 w-full">
                            <span
                                class="inline-block px-3 py-1 bg-teal-600 text-white text-xs font-bold rounded-full mb-3">Resilience</span>
                            <h4 class="text-2xl font-bold text-white mb-2">Flood Control Infrastructure</h4>
                            <p
                                class="text-gray-200 text-sm opacity-0 lg:group-hover:opacity-100 transform lg:translate-y-4 lg:group-hover:translate-y-0 transition-all duration-300">
                                Advanced pumping stations and catchment basins to mitigate flooding and ensure safety.
                            </p>
                        </div>
                    </div>

                </div>

                <div class="text-center mt-12">
                    <a href="directory.php?type=projects"
                        class="inline-flex items-center text-brand-600 dark:text-brand-400 font-semibold hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
                        View All Infrastructure Projects <i class="bi bi-arrow-right ml-2"></i>
                    </a>
                </div>
            </div>
        </section>

        <!-- City Landmarks Section (Enhanced Slideshow) -->
        <section id="landmarks" class="py-24 bg-white dark:bg-gray-950 transition-colors duration-300">
            <div class="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
                <div class="text-center max-w-3xl mx-auto mb-16">
                    <h2 class="text-brand-600 dark:text-brand-400 font-bold tracking-wide uppercase text-sm mb-3">
                        Heritage & Progress</h2>
                    <h3 class="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">City Landmarks</h3>
                    <p class="text-gray-600 dark:text-gray-400 text-lg">Discover the historical sites and modern
                        infrastructures that define Valenzuela City.</p>
                </div>

                <?php
                $landmarks = [
                    ["title" => "Museo ni Dr. Pio Valenzuela", "desc" => "The ancestral home and commemorative museum of our city's namesake.", "img" => "images/museo-ni-pio.jpg"],
                    ["title" => "Bell Tower of San Diego De Alcala Church", "desc" => "A 17th-century historical belfry standing as a witness to the city's rich past.", "img" => "images/bell-tower.jpg"],
                    ["title" => "Museo ng Valenzuela", "desc" => "Repository of the city's historical and cultural heritage.", "img" => "images/museo-val.jpg"],
                    ["title" => "Arkong Bato Park", "desc" => "Centuries-old stone arch gateway connecting Valenzuela and Malabon.", "img" => "images/arkong-bato.jpg"],
                    ["title" => "National Shrine of Our Lady of Fatima", "desc" => "A major pilgrimage site and the home of the National Pilgrim Image of Our Lady of Fatima.", "img" => "images/nat-shrine.jpg"],
                    ["title" => "Valenzuela City Social Hall", "desc" => "Central venue for city government events and community gatherings.", "img" => "images/social-hall.jpg"],
                    ["title" => "Valenzuela City People's Park", "desc" => "An interactive 1.5-hectare urban park for families and fitness.", "img" => "images/peoples-park.jpg"],
                    ["title" => "Valenzuela City Family Park", "desc" => "Nature-themed recreational space featuring a playground and green canopy.", "img" => "images/family-park.jpg"],
                    ["title" => "Polo Mini Park", "desc" => "A historical plaza at the heart of the city's oldest district.", "img" => "images/polo-park.jpg"],
                    ["title" => "WES Arena", "desc" => "State-of-the-art sports and multi-purpose indoor facility.", "img" => "images/wes-arena.jpg?v=1.1"],
                    ["title" => "ALERT Center", "desc" => "The city's disaster preparedness and emergency response command center.", "img" => "images/alert-center.jpg"]
                ];
                ?>

                <div class="relative group max-w-6xl mx-auto">
                    <!-- Slideshow Container - Increased Size -->
                    <div class="relative h-[450px] md:h-[700px] overflow-hidden rounded-[2.5rem] shadow-2xl">
                        <?php foreach ($landmarks as $index => $landmark): ?>
                            <!-- Slide <?php echo $index + 1; ?> -->
                            <div
                                class="slideshow-item absolute inset-0 transition-opacity duration-1000 <?php echo $index === 0 ? 'opacity-100' : 'opacity-0'; ?>">
                                <div
                                    class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent z-10">
                                </div>
                                <img src="<?php echo $landmark['img']; ?>" alt="<?php echo $landmark['title']; ?>"
                                    class="w-full h-full object-cover">
                                <div class="absolute bottom-12 left-8 md:left-12 z-20 text-white max-w-2xl">
                                    <h4 class="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
                                        <?php echo $landmark['title']; ?>
                                    </h4>
                                    <p class="text-brand-100 text-lg md:text-xl font-medium opacity-90">
                                        <?php echo $landmark['desc']; ?>
                                    </p>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <!-- Layout Controls -->
                    <button id="prevSlide"
                        class="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl text-white flex items-center justify-center hover:bg-brand-600 transition-all opacity-0 group-hover:opacity-100 z-30 shadow-lg">
                        <i class="bi bi-chevron-left text-2xl"></i>
                    </button>
                    <button id="nextSlide"
                        class="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl text-white flex items-center justify-center hover:bg-brand-600 transition-all opacity-0 group-hover:opacity-100 z-30 shadow-lg">
                        <i class="bi bi-chevron-right text-2xl"></i>
                    </button>

                    <!-- Indicators -->
                    <div class="absolute bottom-8 right-12 z-30 flex gap-3">
                        <?php foreach ($landmarks as $index => $landmark): ?>
                            <div
                                class="slide-indicator w-10 h-1.5 <?php echo $index === 0 ? 'bg-white' : 'bg-white/30'; ?> rounded-full transition-all duration-300">
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        </section>

        <!-- Latest News -->
        <section id="news" class="py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div class="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
                <div class="flex justify-between items-end mb-12">
                    <div>
                        <h2 class="text-brand-600 dark:text-brand-400 font-bold tracking-wide uppercase text-sm mb-3">
                            Updates</h2>
                        <h3 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Latest News</h3>
                    </div>
                    <a href="directory.php?type=news"
                        class="hidden md:inline-flex items-center text-brand-600 dark:text-brand-400 font-semibold hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
                        Read All News <i class="bi bi-arrow-right ml-2"></i>
                    </a>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <!-- News Item 1 -->
                    <div
                        class="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group ring-1 ring-gray-100 dark:ring-gray-700">
                        <div class="h-48 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                            <div
                                class="absolute inset-0 bg-brand-600 mix-blend-multiply opacity-0 group-hover:opacity-20 transition-opacity duration-300">
                            </div>
                            <img src="images/oro-inidoro.png" alt="Oro Inodoro Award"
                                class="w-full h-full object-cover">
                        </div>
                        <div class="p-6">
                            <span
                                class="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide mb-2 block">Nov
                                2025</span>
                            <h4
                                class="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                Maynilad's 2025 Oro Inodoro Award</h4>
                            <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">Valenzuela City wins prestigious
                                award
                                for environmental sanitation management.</p>

                        </div>
                    </div>

                    <!-- News Item 2 -->
                    <div
                        class="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group ring-1 ring-gray-100 dark:ring-gray-700">
                        <div class="h-48 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                            <img src="images/housing.jpg" alt="Housing Assistance" class="w-full h-full object-cover">
                        </div>
                        <div class="p-6">
                            <span
                                class="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide mb-2 block">Jan
                                2026</span>
                            <h4
                                class="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                P14M Housing Assistance Granted</h4>
                            <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">SHFC grants over Php 14 Million for
                                Wawang Pulo Homeowners' Association.</p>

                        </div>
                    </div>

                    <!-- News Item 3 -->
                    <div
                        class="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group ring-1 ring-gray-100 dark:ring-gray-700">
                        <div class="h-48 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                            <img src="images/flood_control.png" alt="Flood Control" class="w-full h-full object-cover">
                        </div>
                        <div class="p-6">
                            <span
                                class="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide mb-2 block">Aug
                                2025</span>
                            <h4
                                class="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                PANATAG Flood Control Launch</h4>
                            <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">City launches comprehensive flood
                                control resilience initiatives with UPRI.</p>

                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- City At A Glance (Replaces Stats) -->
        <section class="relative py-24 bg-brand-900 text-white overflow-hidden">
            <div class="absolute inset-0 z-0">
                <img src="images/city_hall.png" alt="Valenzuela City Hall"
                    class="w-full h-full object-cover opacity-20 mix-blend-overlay">
                <div class="absolute inset-0 bg-gradient-to-t from-brand-900 via-brand-900/80 to-transparent"></div>
            </div>

            <div class="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 text-center">
                <h2 class="text-3xl md:text-5xl font-bold mb-6">Valenzuela City At A Glance</h2>
                <p class="max-w-2xl mx-auto text-xl text-brand-100 mb-10 leading-relaxed">
                    A highly urbanized city in Metro Manila, known for its industrial prowess, vibrant culture, and
                    responsive local government.
                </p>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div class="p-4 border border-brand-700/50 rounded-xl bg-brand-800/30 backdrop-blur-sm">
                        <div class="text-4xl font-bold mb-2 text-white">33</div>
                        <div class="text-brand-200 text-sm font-medium uppercase tracking-wide">Barangays</div>
                    </div>
                    <div class="p-4 border border-brand-700/50 rounded-xl bg-brand-800/30 backdrop-blur-sm">
                        <div class="text-4xl font-bold mb-2 text-white">400k+</div>
                        <div class="text-brand-200 text-sm font-medium uppercase tracking-wide">Population</div>
                    </div>
                    <div class="p-4 border border-brand-700/50 rounded-xl bg-brand-800/30 backdrop-blur-sm">
                        <div class="text-4xl font-bold mb-2 text-white">1st</div>
                        <div class="text-brand-200 text-sm font-medium uppercase tracking-wide">Class City</div>
                    </div>
                    <div class="p-4 border border-brand-700/50 rounded-xl bg-brand-800/30 backdrop-blur-sm">
                        <div class="text-4xl font-bold mb-2 text-white">1623</div>
                        <div class="text-brand-200 text-sm font-medium uppercase tracking-wide">Founded</div>
                    </div>
                </div>
            </div>
        </section>


        <!-- Footer -->
        <footer class="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div class="col-span-1 md:col-span-2">
                        <button onclick="showLandingView()"
                            class="flex items-center space-x-3 mb-6 hover:opacity-80 transition-opacity focus:outline-none group">
                            <div class="bg-white/10 p-2 rounded-lg group-hover:bg-white/20 transition-colors">
                                <img src="images/logo.png" alt="Logo" class="w-8 h-8 object-contain">
                            </div>
                            <span class="text-xl font-bold text-white tracking-tight">LACS</span>
                        </button>
                        <p class="text-sm leading-relaxed max-w-md">
                            The Legislative Agenda and Calendar System is a proprietary software solution developed for
                            the
                            City Government of Valenzuela to modernize and streamline legislative operations.
                        </p>
                    </div>

                    <div>
                        <h5 class="text-white font-bold mb-4">Quick Links</h5>
                        <ul class="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                            <li><a href="#" class="hover:text-white transition-colors">Home</a></li>
                            <li><a href="#features" class="hover:text-white transition-colors">Features</a></li>
                            <li><a href="#officials" class="hover:text-white transition-colors">Officials</a></li>
                            <li><a href="#history" class="hover:text-white transition-colors">History</a></li>
                            <li><a href="#programs" class="hover:text-white transition-colors">Programs</a></li>
                            <li><a href="#awards" class="hover:text-white transition-colors">Awards</a></li>
                            <li><a href="#safety" class="hover:text-white transition-colors">Safety</a></li>
                            <li><a href="#projects" class="hover:text-white transition-colors">Projects</a></li>
                            <li><a href="#landmarks" class="hover:text-white transition-colors">Landmarks</a></li>
                            <li><a href="#news" class="hover:text-white transition-colors">News</a></li>
                        </ul>
                    </div>

                    <div>
                        <h5 class="text-white font-bold mb-4">Contact</h5>
                        <ul class="space-y-3 text-sm">
                            <li class="flex items-start"><i class="bi bi-geo-alt mt-1 mr-2"></i> Valenzuela City
                                Hall,<br>MacArthur Highway, Karuhatan</li>
                            <li class="flex items-center"><i class="bi bi-envelope mr-2"></i> support@valenzuela.gov.ph
                            </li>
                            <li class="flex items-center"><i class="bi bi-telephone mr-2"></i> (02) 8352-1000</li>
                        </ul>
                    </div>
                </div>

                <div class="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div class="text-sm">
                        &copy; 2025 City Government of Valenzuela. All rights reserved.
                    </div>
                    <div class="text-sm flex items-center gap-4">
                        <span class="px-2 py-1 bg-gray-800 rounded text-xs font-mono">v1.1.0</span>
                    </div>
                </div>
            </div>
        </footer>
    </div>
    <!-- End Main Content Container -->

    <!-- Login View Container -->
    <div id="login-content"
        class="<?= $initialView === 'login' ? 'view-visible' : 'hidden' ?> min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <div class="w-full max-w-md">
            <!-- Login Card -->
            <div
                class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 animate-fade-in-up border border-gray-200 dark:border-gray-700">
                <!-- Logo Section -->
                <div class="text-center mb-5">
                    <div class="inline-block p-2 rounded-full bg-red-50 dark:bg-red-900/20 mb-3">
                        <img src="images/logo.png" alt="City Government of Valenzuela" class="w-16 h-16 object-contain">
                    </div>
                    <h1 class="text-xl font-bold text-gray-900 dark:text-white tracking-tight">LACS</h1>
                    <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Legislative Agenda & Calendar System
                    </p>
                </div>

                <!-- Alert Messages -->
                <div id="login-alert-container" class="mb-4 hidden">
                    <div id="login-alert-message"
                        class="px-3 py-2 rounded-lg flex items-center text-sm shadow-sm border">
                        <i class="bi mr-2 text-base" id="login-alert-icon"></i>
                        <span id="login-alert-text" class="font-medium"></span>
                    </div>
                </div>

                <!-- Login Form -->
                <form id="login-form" class="space-y-4" onsubmit="handleLogin(event)">
                    <!-- Username Field -->
                    <div>
                        <label for="login-email"
                            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Username
                        </label>
                        <div class="relative group">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i
                                    class="bi bi-person text-gray-400 dark:text-gray-500 group-focus-within:text-brand-600 transition-colors"></i>
                            </div>
                            <input type="text" id="login-email" name="email" required placeholder="Enter your username"
                                class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 text-sm">
                        </div>
                        <span class="text-red-500 text-xs hidden mt-1 font-medium" id="login-email-error"></span>
                    </div>

                    <!-- Password Field -->
                    <div>
                        <label for="login-password"
                            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Password
                        </label>
                        <div class="relative group">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i
                                    class="bi bi-lock text-gray-400 dark:text-gray-500 group-focus-within:text-brand-600 transition-colors"></i>
                            </div>
                            <input type="password" id="login-password" name="password" required
                                placeholder="Enter your password"
                                class="w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 text-sm">
                            <button type="button" id="login-toggle-password"
                                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                <i class="bi bi-eye text-base" id="login-eye-icon"></i>
                            </button>
                        </div>
                        <span class="text-red-500 text-xs hidden mt-1 font-medium" id="login-password-error"></span>
                    </div>

                    <!-- Forgot Password -->
                    <div class="flex items-center justify-end">
                        <button type="button" onclick="showForgotPasswordView()"
                            class="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-500 font-semibold transition-colors hover:underline decoration-2 underline-offset-2">
                            Forgot password?
                        </button>
                    </div>

                    <!-- Submit Button -->
                    <button type="submit" id="login-btn"
                        class="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 dark:from-brand-700 dark:to-brand-800 text-white font-bold py-2.5 rounded-xl transition-all duration-200 ease-in-out shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center ring-offset-2 focus:ring-2 focus:ring-brand-500 text-sm">
                        <span id="login-btn-text">Sign In</span>
                        <i class="bi bi-arrow-right ml-2 text-base" id="login-btn-icon"></i>
                    </button>
                </form>

                <!-- Back to Home Button -->
                <div class="mt-6 pt-2">
                    <button onclick="showLandingView()"
                        class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] group shadow-sm">
                        <i class="bi bi-arrow-left transition-transform group-hover:-translate-x-1"></i>
                        <span>Back to Home</span>
                    </button>
                </div>

                <!-- Footer Links -->
                <div
                    class="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
                    <div class="flex justify-center space-x-4 mb-2">
                        <button onclick="openInfoModal('privacy-modal')"
                            class="hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium">Privacy
                            Policy</button>
                        <span class="text-gray-300 dark:text-gray-600">&bull;</span>
                        <button onclick="openInfoModal('terms-modal')"
                            class="hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium">Terms
                            of Service</button>
                        <span class="text-gray-300 dark:text-gray-600">&bull;</span>
                        <button onclick="openInfoModal('help-modal')"
                            class="hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium">Help</button>
                    </div>
                    <p>&copy; 2025 City Government of Valenzuela</p>
                </div>
            </div>
        </div>
    </div>
    <!-- End Login View Container -->
    </div>

    <!-- Forgot Password View Container -->
    <div id="forgot-password-content"
        class="hidden min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 shadow-2xl">
        <div class="w-full max-w-md animate-fade-in-up">
            <div
                class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 p-8">

                <!-- Logo/Header -->
                <div class="text-center mb-8">
                    <div
                        class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-50 dark:bg-brand-900/30 mb-4 shadow-inner ring-1 ring-brand-100 dark:ring-brand-800">
                        <img src="images/logo.png" alt="LACS Logo" class="w-14 h-14 object-contain">
                    </div>
                    <h1 class="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Forgot Password</h1>
                    <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Enter your email to reset your
                        password</p>
                </div>

                <!-- Alert Messages -->
                <div id="forgot-alert-container" class="mb-4 hidden">
                    <div id="forgot-alert-message"
                        class="px-3 py-2 rounded-lg flex items-center text-sm shadow-sm border">
                        <i class="bi mr-2 text-base" id="forgot-alert-icon"></i>
                        <span id="forgot-alert-text" class="font-medium"></span>
                    </div>
                </div>

                <!-- Forgot Form -->
                <form id="forgot-form" class="space-y-4" onsubmit="handleForgotPassword(event)">
                    <!-- Email Field -->
                    <div>
                        <label for="forgot-email"
                            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Email Address or Username
                        </label>
                        <div class="relative group">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i
                                    class="bi bi-envelope text-gray-400 dark:text-gray-500 group-focus-within:text-brand-600 transition-colors"></i>
                            </div>
                            <input type="text" id="forgot-email" name="email" required
                                placeholder="Enter your email or username"
                                class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 text-sm">
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <button type="submit" id="forgot-btn"
                        class="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 dark:from-brand-700 dark:to-brand-800 text-white font-bold py-2.5 rounded-xl transition-all duration-200 ease-in-out shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center ring-offset-2 focus:ring-2 focus:ring-brand-500 text-sm">
                        <span id="forgot-btn-text">Reset Password</span>
                        <i class="bi bi-arrow-right ml-2 text-base" id="forgot-btn-icon"></i>
                    </button>
                </form>

                <!-- Back to Login Button -->
                <div class="mt-6 pt-2">
                    <button onclick="hideForgotPasswordView()"
                        class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] group shadow-sm">
                        <i class="bi bi-arrow-left transition-transform group-hover:-translate-x-1"></i>
                        <span>Back to Login</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
    <!-- End Forgot Password View Container -->

    <!-- Pre-Login Terms & Privacy Gate Modal -->
    <div id="terms-gate-modal" class="fixed inset-0 z-[65] hidden overflow-y-auto" aria-labelledby="terms-gate-title"
        role="dialog" aria-modal="true">
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-900/40 backdrop-blur-md transition-opacity" aria-hidden="true"
                onclick="closeInfoModal('terms-gate-modal')"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div
                class="inline-block align-bottom bg-white dark:bg-slate-800 rounded-[2.5rem] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100 dark:border-slate-700 animate-fade-in-up">

                <!-- Header -->
                <div class="bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-6">
                    <div class="flex items-center gap-4">
                        <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-3 shadow-inner ring-1 ring-white/20">
                            <i class="bi bi-shield-check text-white text-2xl"></i>
                        </div>
                        <div>
                            <h3 id="terms-gate-title" class="text-xl font-black text-white tracking-tight">
                                Terms of Service &amp; Privacy Policy
                            </h3>
                            <p class="text-brand-100/80 text-sm mt-0.5">Required review before accessing the LACS portal
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Body -->
                <div class="px-8 pt-6 pb-4 bg-white dark:bg-slate-800">
                    <!-- Scroll progress bar -->
                    <div
                        class="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 mb-4 overflow-hidden shadow-inner">
                        <div id="terms-gate-scroll-bar"
                            class="bg-gradient-to-r from-brand-500 to-brand-600 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                            style="width:0%"></div>
                    </div>

                    <div id="terms-gate-scroll-body"
                        class="max-h-[30rem] overflow-y-auto text-sm text-gray-600 dark:text-slate-400 space-y-4 pr-3 custom-scrollbar"
                        onscroll="handleModalScroll('terms-gate')">

                        <div
                            class="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-2xl shadow-sm">
                            <p class="text-blue-700 dark:text-blue-400 text-xs font-semibold flex items-center gap-2">
                                <i class="bi bi-info-circle-fill text-lg"></i>
                                Notice: You must scroll to the bottom and accept these terms to proceed to the secure
                                login area.
                            </p>
                        </div>

                        <!-- ===== Terms of Service Section ===== -->
                        <div class="pt-2 px-1">
                            <div class="flex items-center gap-2 mb-1">
                                <div class="w-1 h-5 bg-brand-600 rounded-full"></div>
                                <p class="font-black text-gray-900 dark:text-white text-sm tracking-wide uppercase">
                                    TERMS OF SERVICE</p>
                            </div>
                            <p class="text-[10px] text-gray-400 dark:text-slate-500 font-bold ml-3">LAST UPDATED:
                                JANUARY 1, 2025</p>
                        </div>

                        <div class="grid gap-3">
                            <div
                                class="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors">
                                <p class="font-bold text-gray-800 dark:text-white mb-2 text-sm">1. Acceptance of Terms
                                </p>
                                <p class="text-xs leading-relaxed">By accessing LACS, you confirm you are an authorized
                                    official/employee of Valenzuela City. Your use of this system constitutes immediate
                                    agreement to these terms.</p>
                            </div>

                            <div
                                class="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors">
                                <p class="font-bold text-gray-800 dark:text-white mb-2 text-sm">2. Authorized Use &
                                    Integrity</p>
                                <p class="text-xs leading-relaxed mb-2">LACS contains official government records.
                                    Falsification or unauthorized tampering is subject to RA 9470 and criminal
                                    prosecution.</p>
                                <ul class="space-y-1.5 ml-1">
                                    <li class="flex items-start gap-2 text-[11px]"><i
                                            class="bi bi-check2 text-brand-500"></i> No unauthorized data access</li>
                                    <li class="flex items-start gap-2 text-[11px]"><i
                                            class="bi bi-check2 text-brand-500"></i> No sharing of credentials/OTPs</li>
                                    <li class="flex items-start gap-2 text-[11px]"><i
                                            class="bi bi-check2 text-brand-500"></i> Log out when leaving station</li>
                                </ul>
                            </div>

                            <div
                                class="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                                <p class="font-bold text-gray-800 dark:text-white mb-2 text-sm">3. Security Monitoring
                                </p>
                                <p class="text-xs leading-relaxed">Activities are logged and audited. Multiple failed
                                    logins trigger automatic lockout. Violations follow CSC disciplinary and RA 10175
                                    protocols.</p>
                            </div>
                        </div>

                        <!-- ===== Privacy Policy Section ===== -->
                        <div class="pt-4 px-1">
                            <div class="flex items-center gap-2 mb-1">
                                <div class="w-1 h-5 bg-brand-600 rounded-full"></div>
                                <p class="font-black text-gray-900 dark:text-white text-sm tracking-wide uppercase">
                                    PRIVACY POLICY</p>
                            </div>
                            <p class="text-[10px] text-gray-400 dark:text-slate-500 font-bold ml-3">COMPLIANCE: RA 10173
                                (DPA 2012)</p>
                        </div>

                        <div class="grid gap-3 pb-4">
                            <div
                                class="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                                <p class="font-bold text-gray-800 dark:text-white mb-2 text-sm">4. Data Rights &
                                    Security</p>
                                <p class="text-xs leading-relaxed mb-3">We only collect data necessary for legislative
                                    workflows. Your information is protected via encryption and role-based access.</p>
                                <div class="grid grid-cols-2 gap-2">
                                    <div
                                        class="bg-white/50 dark:bg-slate-800/50 p-2 rounded-xl border border-gray-100 dark:border-slate-700 text-[10px] font-bold text-center">
                                        ACCESS & RECTIFY</div>
                                    <div
                                        class="bg-white/50 dark:bg-slate-800/50 p-2 rounded-xl border border-gray-100 dark:border-slate-700 text-[10px] font-bold text-center">
                                        ERASURE RIGHTS</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- Footer -->
                <div
                    class="bg-gray-50/80 dark:bg-slate-700/20 px-8 py-6 border-t border-gray-100 dark:border-slate-700/50 backdrop-blur-sm">
                    <label id="terms-gate-agree-label"
                        class="flex items-start gap-4 mb-6 cursor-not-allowed opacity-50 transition-all group"
                        title="Scroll to the bottom to enable">
                        <div class="relative flex items-center mt-1">
                            <input type="checkbox" id="terms-gate-agree-check" disabled
                                class="w-5 h-5 text-brand-600 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-brand-500 transition-all cursor-pointer disabled:cursor-not-allowed"
                                onchange="updateModalAcceptBtn('terms-gate')">
                        </div>
                        <span class="text-xs text-gray-600 dark:text-slate-300 leading-relaxed font-medium">
                            I have read, understood, and agree to the <strong>Terms of Service</strong> and
                            <strong>Privacy Policy</strong>. I acknowledge that my activities will be logged for
                            security purposes.
                        </span>
                    </label>
                    <div class="flex justify-end gap-3">
                        <button type="button" onclick="closeInfoModal('terms-gate-modal')"
                            class="px-6 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm">
                            Cancel
                        </button>
                        <button type="button" id="terms-gate-accept-btn" disabled
                            onclick="localStorage.setItem('termsAccepted', 'true'); closeInfoModal('terms-gate-modal'); showLoginView();"
                            class="px-8 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 text-white text-sm font-black opacity-50 cursor-not-allowed transition-all shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 flex items-center gap-2 active:scale-95">
                            <i class="bi bi-box-arrow-in-right text-lg"></i> Proceed to Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Info Modals (Privacy, Terms, Help) -->
    <!-- Privacy Policy Modal -->
    <div id="privacy-modal" class="fixed inset-0 z-[60] hidden overflow-y-auto" aria-labelledby="privacy-modal-title"
        role="dialog" aria-modal="true">
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-900/40 backdrop-blur-md transition-opacity" aria-hidden="true"
                onclick="closeInfoModal('privacy-modal')"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div
                class="inline-block align-bottom bg-white dark:bg-slate-800 rounded-[2.5rem] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100 dark:border-slate-700 animate-fade-in-up">

                <!-- Header -->
                <div class="bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-6">
                    <div class="flex items-center gap-4">
                        <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-3 shadow-inner ring-1 ring-white/20">
                            <i class="bi bi-shield-lock text-white text-2xl"></i>
                        </div>
                        <div>
                            <h3 id="privacy-modal-title" class="text-xl font-black text-white tracking-tight">
                                Privacy Policy
                            </h3>
                            <p class="text-brand-100/80 text-sm mt-0.5">In compliance with RA 10173 (DPA 2012)</p>
                        </div>
                    </div>
                </div>

                <div class="px-8 pt-6 pb-4 bg-white dark:bg-slate-800">
                    <div
                        class="max-h-[32rem] overflow-y-auto text-sm text-gray-600 dark:text-slate-400 space-y-4 pr-3 custom-scrollbar">

                        <div
                            class="bg-gray-50/50 dark:bg-slate-700/20 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                            <p class="font-bold text-gray-800 dark:text-white mb-2 uppercase tracking-wide text-xs">1.
                                Introduction</p>
                            <p class="text-xs leading-relaxed">The City Government of Valenzuela is committed to
                                protecting your privacy. This policy outlines how we collect, use, and safeguard
                                personal information within the Legislative Agenda and Calendar System (LACS).</p>
                        </div>

                        <div
                            class="bg-gray-50/50 dark:bg-slate-700/20 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                            <p class="font-bold text-gray-800 dark:text-white mb-2 uppercase tracking-wide text-xs">2.
                                Data We Collect</p>
                            <ul class="space-y-2 ml-1">
                                <li class="flex items-start gap-2 text-[11px]"><i
                                        class="bi bi-dot text-brand-500 text-xl leading-none"></i> Identification (Name,
                                    Position, ID Number)</li>
                                <li class="flex items-start gap-2 text-[11px]"><i
                                        class="bi bi-dot text-brand-500 text-xl leading-none"></i> Contact (Official
                                    Email, Number for OTP)</li>
                                <li class="flex items-start gap-2 text-[11px]"><i
                                        class="bi bi-dot text-brand-500 text-xl leading-none"></i> System Logs (IP,
                                    Activity, Timestamps)</li>
                            </ul>
                        </div>

                        <div
                            class="bg-gray-50/50 dark:bg-slate-700/20 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                            <p class="font-bold text-gray-800 dark:text-white mb-2 uppercase tracking-wide text-xs">3.
                                Your Data Rights</p>
                            <p class="text-xs leading-relaxed mb-3">Under the Data Privacy Act, you have the right to
                                access, rectify, or request deletion of your information, subject to government
                                retention laws.</p>
                            <div
                                class="p-3 bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30 rounded-xl text-center">
                                <p class="text-[10px] font-bold text-brand-700 dark:text-brand-400">Request access via
                                    support@valenzuela.gov.ph</p>
                            </div>
                        </div>

                        <div class="px-1 py-1">
                            <p class="text-[10px] text-gray-400 dark:text-slate-500 italic">
                                For full legal details, please consult the City MIS Office.
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    class="bg-gray-50/80 dark:bg-slate-700/20 px-8 py-6 border-t border-gray-100 dark:border-slate-700/50 backdrop-blur-sm flex justify-end">
                    <button type="button" onclick="closeInfoModal('privacy-modal')"
                        class="px-8 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 text-white text-sm font-black transition-all shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 active:scale-95 leading-none">
                        Close
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Terms of Service Modal -->
    <div id="terms-modal" class="fixed inset-0 z-[60] hidden overflow-y-auto" aria-labelledby="terms-modal-title"
        role="dialog" aria-modal="true">
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-900/40 backdrop-blur-md transition-opacity" aria-hidden="true"
                onclick="closeInfoModal('terms-modal')"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div
                class="inline-block align-bottom bg-white dark:bg-slate-800 rounded-[2.5rem] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100 dark:border-slate-700 animate-fade-in-up">

                <!-- Header -->
                <div class="bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-6">
                    <div class="flex items-center gap-4">
                        <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-3 shadow-inner ring-1 ring-white/20">
                            <i class="bi bi-file-text-fill text-white text-2xl"></i>
                        </div>
                        <div>
                            <h3 id="terms-modal-title" class="text-xl font-black text-white tracking-tight">
                                Terms of Service
                            </h3>
                            <p class="text-brand-100/80 text-sm mt-0.5">Effective Date: January 1, 2025</p>
                        </div>
                    </div>
                </div>

                <div class="px-8 pt-6 pb-4 bg-white dark:bg-slate-800">
                    <div
                        class="max-h-[32rem] overflow-y-auto text-sm text-gray-600 dark:text-slate-400 space-y-4 pr-3 custom-scrollbar">

                        <div
                            class="bg-gray-50/50 dark:bg-slate-700/20 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors">
                            <p class="font-bold text-gray-800 dark:text-white mb-2 uppercase tracking-wide text-xs">1.
                                System Access</p>
                            <p class="text-xs leading-relaxed">Access to LACS is strictly for authorized personnel of
                                Valenzuela City. Unauthorized access attempts are monitored and will be prosecuted under
                                RA 10175.</p>
                        </div>

                        <div
                            class="bg-gray-50/50 dark:bg-slate-700/20 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors">
                            <p class="font-bold text-gray-800 dark:text-white mb-2 uppercase tracking-wide text-xs">2.
                                User Responsibilities</p>
                            <p class="text-xs leading-relaxed mb-2">Users are responsible for all actions taken under
                                their credentials. You must maintain the integrity of legislative records.</p>
                            <ul class="grid grid-cols-2 gap-2 mt-2">
                                <li
                                    class="bg-white/50 dark:bg-slate-800/50 p-2 rounded-xl border border-gray-100 dark:border-slate-700 text-[10px] font-bold flex items-center gap-1">
                                    <i class="bi bi-shield-check text-brand-600"></i> NO SHARING
                                </li>
                                <li
                                    class="bg-white/50 dark:bg-slate-800/50 p-2 rounded-xl border border-gray-100 dark:border-slate-700 text-[10px] font-bold flex items-center gap-1">
                                    <i class="bi bi-shield-check text-brand-600"></i> LOG OUT
                                </li>
                            </ul>
                        </div>

                        <div
                            class="bg-gray-50/50 dark:bg-slate-700/20 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                            <p class="font-bold text-gray-800 dark:text-white mb-2 uppercase tracking-wide text-xs">3.
                                Legal Compliance</p>
                            <p class="text-xs leading-relaxed">This system complies with the Cybercrime Prevention Act
                                and individual City government protocols. Violations lead to CSC disciplinary actions.
                            </p>
                        </div>

                    </div>
                </div>

                <div
                    class="bg-gray-50/80 dark:bg-slate-700/20 px-8 py-6 border-t border-gray-100 dark:border-slate-700/50 backdrop-blur-sm flex justify-end">
                    <button type="button" onclick="closeInfoModal('terms-modal')"
                        class="px-8 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 text-white text-sm font-black transition-all shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 active:scale-95 leading-none">
                        Close
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- First-Time User Agreement Modal -->
    <div id="agreement-modal" class="fixed inset-0 z-[70] hidden overflow-y-auto"
        aria-labelledby="agreement-modal-title" role="dialog" aria-modal="true">
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-900/40 backdrop-blur-md transition-opacity" aria-hidden="true"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div
                class="inline-block align-bottom bg-white dark:bg-slate-800 rounded-[2.5rem] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100 dark:border-slate-700 animate-fade-in-up">

                <!-- Header -->
                <div class="bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-6">
                    <div class="flex items-center gap-4">
                        <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-3 shadow-inner ring-1 ring-white/20">
                            <i class="bi bi-shield-lock-fill text-white text-2xl"></i>
                        </div>
                        <div>
                            <h3 id="agreement-modal-title" class="text-xl font-black text-white tracking-tight">
                                Welcome to LACS — Final Step
                            </h3>
                            <p class="text-brand-100/80 text-sm mt-0.5">First-time login: Review and accept to continue
                            </p>
                        </div>
                    </div>
                </div>

                <div class="px-8 pt-6 pb-4 bg-white dark:bg-slate-800">
                    <!-- Scroll progress bar -->
                    <div
                        class="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 mb-4 overflow-hidden shadow-inner">
                        <div id="agreement-scroll-bar"
                            class="bg-gradient-to-r from-brand-500 to-brand-600 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                            style="width:0%"></div>
                    </div>

                    <div id="agreement-scroll-body"
                        class="max-h-[28rem] overflow-y-auto text-sm text-gray-600 dark:text-slate-400 space-y-4 pr-3 custom-scrollbar"
                        onscroll="handleModalScroll('agreement')">

                        <div
                            class="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-2xl shadow-sm">
                            <p class="text-amber-800 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
                                <i class="bi bi-info-circle-fill text-lg"></i>
                                Professional Conduct: You are required to accept the system protocols before proceeding.
                            </p>
                        </div>

                        <div class="grid gap-3">
                            <!-- Summary Cards -->
                            <div
                                class="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                                <p class="font-bold text-gray-800 dark:text-white mb-2 text-sm flex items-center gap-2">
                                    <i class="bi bi-file-text text-brand-600"></i> Terms of Service — Summary
                                </p>
                                <ul class="space-y-1.5 ml-1">
                                    <li class="flex items-start gap-2 text-[11px]"><i
                                            class="bi bi-dot text-brand-500 text-xl leading-none"></i> For authorized
                                        Valenzuela City personnel only</li>
                                    <li class="flex items-start gap-2 text-[11px]"><i
                                            class="bi bi-dot text-brand-500 text-xl leading-none"></i> Personally
                                        responsible for account safety</li>
                                    <li class="flex items-start gap-2 text-[11px]"><i
                                            class="bi bi-dot text-brand-500 text-xl leading-none"></i> Data tampering is
                                        a criminal offense</li>
                                </ul>
                            </div>

                            <div
                                class="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                                <p class="font-bold text-gray-800 dark:text-white mb-2 text-sm flex items-center gap-2">
                                    <i class="bi bi-shield-check text-brand-600"></i> Privacy Policy — Summary
                                </p>
                                <ul class="space-y-1.5 ml-1">
                                    <li class="flex items-start gap-2 text-[11px]"><i
                                            class="bi bi-dot text-brand-500 text-xl leading-none"></i> Compliant with
                                        Data Privacy Act of 2012</li>
                                    <li class="flex items-start gap-2 text-[11px]"><i
                                            class="bi bi-dot text-brand-500 text-xl leading-none"></i> Data used only
                                        for legislative workflows</li>
                                    <li class="flex items-start gap-2 text-[11px]"><i
                                            class="bi bi-dot text-brand-500 text-xl leading-none"></i> You have the
                                        right to access and correct data</li>
                                </ul>
                            </div>

                            <div
                                class="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                                <p class="font-bold text-gray-800 dark:text-white mb-2 text-sm flex items-center gap-2">
                                    <i class="bi bi-person-check text-brand-600"></i> Your Responsibilities
                                </p>
                                <p class="text-[11px] leading-relaxed mb-2">Report unauthorized access within 24 hours.
                                    Use the system only for official Valenzuela City Council functions. Do not attempt
                                    to bypass role security.</p>
                            </div>
                        </div>

                        <div class="px-1 py-2">
                            <p class="text-[11px] text-gray-400 dark:text-slate-500 italic text-center">
                                Full documents are always available in the login page footer.
                            </p>
                        </div>

                    </div>
                </div>

                <!-- Footer -->
                <div
                    class="bg-gray-50/80 dark:bg-slate-700/20 px-8 py-6 border-t border-gray-100 dark:border-slate-700/50 backdrop-blur-sm">
                    <label id="agreement-agree-label"
                        class="flex items-start gap-4 mb-6 cursor-not-allowed opacity-50 transition-all group"
                        title="Scroll to the bottom to enable">
                        <div class="relative flex items-center mt-1">
                            <input type="checkbox" id="agreement-agree-check" disabled
                                class="w-5 h-5 text-brand-600 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-brand-500 transition-all cursor-pointer disabled:cursor-not-allowed"
                                onchange="updateModalAcceptBtn('agreement')">
                        </div>
                        <span class="text-xs text-gray-700 dark:text-slate-300 leading-snug font-medium">
                            I have read and understood the Terms of Service and Privacy Policy of the Legislative Agenda
                            and Calendar System (LACS). I agree to abide by all stated policies and accept
                            responsibility for my actions within this system.
                        </span>
                    </label>
                    <div class="flex justify-end">
                        <button type="button" id="agreement-accept-btn" disabled onclick="submitAgreement()"
                            class="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 text-white text-sm font-black opacity-50 cursor-not-allowed transition-all shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 flex items-center gap-2 active:scale-95">
                            <i class="bi bi-check2-circle text-lg"></i> Accept &amp; Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Help & Support Modal -->
    <div id="help-modal" class="fixed inset-0 z-[60] hidden overflow-y-auto" aria-labelledby="help-modal-title"
        role="dialog" aria-modal="true">
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-900/40 backdrop-blur-md transition-opacity" aria-hidden="true"
                onclick="closeInfoModal('help-modal')"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div
                class="inline-block align-bottom bg-white dark:bg-slate-800 rounded-[2.5rem] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100 dark:border-slate-700 animate-fade-in-up">

                <!-- Header -->
                <div class="bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-6">
                    <div class="flex items-center gap-4">
                        <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-3 shadow-inner ring-1 ring-white/20">
                            <i class="bi bi-question-circle-fill text-white text-2xl"></i>
                        </div>
                        <div>
                            <h3 id="help-modal-title" class="text-xl font-black text-white tracking-tight">
                                Help & Support
                            </h3>
                            <p class="text-brand-100/80 text-sm mt-0.5">LACS System Assistance</p>
                        </div>
                    </div>
                </div>

                <div class="px-8 pt-6 pb-4 bg-white dark:bg-slate-800">
                    <div
                        class="max-h-[28rem] overflow-y-auto text-sm text-gray-600 dark:text-slate-400 space-y-4 pr-3 custom-scrollbar">

                        <div
                            class="bg-gray-50/50 dark:bg-slate-700/20 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors">
                            <p class="font-bold text-gray-800 dark:text-white mb-1 uppercase tracking-wide text-xs">1.
                                Authentication & OTP</p>
                            <p class="text-xs leading-relaxed">Use your official city credentials. An OTP will be sent
                                to your registered contact point for secure login.</p>
                        </div>

                        <div
                            class="bg-gray-50/50 dark:bg-slate-700/20 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors">
                            <p class="font-bold text-gray-800 dark:text-white mb-1 uppercase tracking-wide text-xs">2.
                                Managing Records</p>
                            <p class="text-xs leading-relaxed">Authorized staff can manage legislative items via the
                                specific modules. Ensure PDF format for all document uploads.</p>
                        </div>

                        <div
                            class="bg-gray-50/50 dark:bg-slate-700/20 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors">
                            <p class="font-bold text-gray-800 dark:text-white mb-1 uppercase tracking-wide text-xs">3.
                                Technical Support</p>
                            <p class="text-xs leading-relaxed">For glitches or account lockouts, contact the MIS
                                Helpdesk at:</p>
                            <div class="mt-3 flex flex-col gap-2">
                                <a href="mailto:support@valenzuela.gov.ph"
                                    class="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold hover:underline">
                                    <i class="bi bi-envelope-fill"></i> support@valenzuela.gov.ph
                                </a>
                                <div class="flex items-center gap-2 text-gray-500 dark:text-slate-400 font-medium">
                                    <i class="bi bi-telephone-fill"></i> (02) 8352-1000
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div
                    class="bg-gray-50/80 dark:bg-slate-700/20 px-8 py-6 border-t border-gray-100 dark:border-slate-700/50 backdrop-blur-sm flex justify-end">
                    <button type="button" onclick="closeInfoModal('help-modal')"
                        class="px-8 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 text-white text-sm font-black transition-all shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 active:scale-95 leading-none">
                        Close
                    </button>
                </div>
            </div>
        </div>
    </div>
    </div>

    <!-- Dark Mode Script -->
    <script>
        // Standardized theme initialization
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        var themeToggleBtn = document.getElementById('theme-toggle');
        var themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
        var themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
        var themeToggleMobile = document.getElementById('theme-toggle-mobile');

        // Update icons based on current mode
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

        function toggleTheme() {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateIcons();
        }

        themeToggleBtn.addEventListener('click', toggleTheme);
        if (themeToggleMobile) themeToggleMobile.addEventListener('click', toggleTheme);

        // View Switching Functions
        function showTermsGate() {
            // Skip gate if user has already accepted terms
            if (localStorage.getItem('termsAccepted') === 'true') {
                showLoginView();
                return;
            }
            openInfoModal('terms-gate-modal');
        }

        function showLoginView() {
            const mainContent = document.getElementById('main-content');
            const loginContent = document.getElementById('login-content');

            // Start fade out of main
            mainContent.classList.add('view-transition');
            mainContent.style.opacity = '0';

            setTimeout(() => {
                mainContent.classList.add('view-hidden');
                mainContent.classList.remove('view-visible');

                // Show login
                loginContent.classList.remove('view-hidden');
                loginContent.classList.add('view-transition', 'opacity-0');

                // Trigger reflow
                loginContent.offsetHeight;
                loginContent.classList.add('view-visible');
                loginContent.classList.remove('opacity-0');

                // Update navigation
                document.querySelectorAll('nav a[href^="#"]').forEach(link => {
                    link.style.display = 'none';
                });
                const headerClock = document.getElementById('header-clock');
                if (headerClock) headerClock.style.display = 'none';

                window.scrollTo({ top: 0, behavior: 'smooth' });

                setTimeout(() => {
                    document.getElementById('login-email').focus();
                }, 100);
            }, 300);
        }

        function showLandingView() {
            // Clear URL parameters
            if (window.location.search.indexOf('showLogin=true') !== -1 || window.location.search.indexOf('logout=success') !== -1) {
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            }

            const loginContent = document.getElementById('login-content');
            const mainContent = document.getElementById('main-content');

            // Start fade out of login
            loginContent.classList.add('view-transition');
            loginContent.style.opacity = '0';

            setTimeout(() => {
                loginContent.classList.add('view-hidden');
                loginContent.classList.remove('view-visible');

                // Show main
                mainContent.classList.remove('view-hidden');
                mainContent.classList.add('view-transition', 'opacity-0');

                // Update navigation
                document.querySelectorAll('nav a[href^="#"]').forEach(link => {
                    link.style.display = '';
                });
                const headerClock = document.getElementById('header-clock');
                if (headerClock) headerClock.style.display = '';

                // Trigger reflow
                mainContent.offsetHeight;
                mainContent.classList.add('view-visible');
                mainContent.classList.remove('opacity-0');

                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 300);

            // Reset form
            document.getElementById('login-form').reset();
            hideLoginAlert();
        }

        function showForgotPasswordView() {
            const loginContent = document.getElementById('login-content');
            const forgotContent = document.getElementById('forgot-password-content');

            // Start fade out of login
            loginContent.classList.add('view-transition');
            loginContent.style.opacity = '0';

            setTimeout(() => {
                loginContent.classList.add('hidden');
                loginContent.classList.remove('view-visible');

                // Show forgot password
                forgotContent.classList.remove('hidden');
                forgotContent.classList.add('view-transition', 'opacity-0');

                // Trigger reflow
                forgotContent.offsetHeight;
                forgotContent.classList.add('view-visible');
                forgotContent.classList.remove('opacity-0');

                window.scrollTo({ top: 0, behavior: 'smooth' });

                setTimeout(() => {
                    document.getElementById('forgot-email').focus();
                }, 100);
            }, 300);
        }

        function hideForgotPasswordView() {
            const loginContent = document.getElementById('login-content');
            const forgotContent = document.getElementById('forgot-password-content');

            // Start fade out of forgot content
            forgotContent.classList.add('view-transition');
            forgotContent.style.opacity = '0';

            setTimeout(() => {
                forgotContent.classList.add('hidden');
                forgotContent.classList.remove('view-visible');

                // Show login
                loginContent.classList.remove('hidden');
                loginContent.classList.add('view-transition', 'opacity-0');

                // Trigger reflow
                loginContent.offsetHeight;
                loginContent.classList.add('view-visible');
                loginContent.classList.remove('opacity-0');

                window.scrollTo({ top: 0, behavior: 'smooth' });

                setTimeout(() => {
                    document.getElementById('login-email').focus();
                }, 100);
            }, 300);

            // Reset form
            document.getElementById('forgot-form').reset();
            hideForgotAlert();
        }

        // Handle forgot password form submission
        function handleForgotPassword(event) {
            event.preventDefault();

            const emailInput = document.getElementById('forgot-email');
            const email = emailInput.value.trim();
            const forgotBtn = document.getElementById('forgot-btn');
            const forgotBtnText = document.getElementById('forgot-btn-text');
            const forgotBtnIcon = document.getElementById('forgot-btn-icon');
            const form = document.getElementById('forgot-form');

            // Clear previous errors
            hideForgotAlert();

            // Basic validation
            if (!email) {
                showForgotAlert('Please enter your email or username', 'error');
                emailInput.focus();
                form.classList.add('animate-shake');
                setTimeout(() => form.classList.remove('animate-shake'), 500);
                return;
            }

            // Show loading state
            forgotBtn.disabled = true;
            forgotBtnText.textContent = 'Sending...';
            forgotBtnIcon.classList.remove('bi-arrow-right');
            forgotBtnIcon.classList.add('spinner');
            forgotBtnIcon.innerHTML = '';

            // Send request to server
            fetch('api/api_forgot_password.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showForgotAlert(data.message, 'success');
                        form.reset();
                    } else {
                        showForgotAlert(data.message || 'Request failed. Please try again.', 'error');
                        form.classList.add('animate-shake');
                        setTimeout(() => form.classList.remove('animate-shake'), 500);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showForgotAlert('An error occurred. Please try again later.', 'error');
                    form.classList.add('animate-shake');
                    setTimeout(() => form.classList.remove('animate-shake'), 500);
                })
                .finally(() => {
                    forgotBtn.disabled = false;
                    forgotBtnText.textContent = 'Reset Password';
                    forgotBtnIcon.classList.remove('spinner');
                    forgotBtnIcon.classList.add('bi-arrow-right');
                    forgotBtnIcon.innerHTML = '';
                });
        }

        // Show/Hide forgot alert
        function showForgotAlert(message, type = 'error') {
            const container = document.getElementById('forgot-alert-container');
            const alertMessage = document.getElementById('forgot-alert-message');
            const alertIcon = document.getElementById('forgot-alert-icon');
            const alertText = document.getElementById('forgot-alert-text');

            if (!container || !alertMessage || !alertIcon || !alertText) return;

            container.classList.remove('hidden');
            alertText.textContent = message;

            // Reset classes
            alertMessage.className = 'px-4 py-3 rounded-lg flex items-center text-sm shadow-sm border';
            alertIcon.className = 'bi mr-2 text-lg';

            if (type === 'success') {
                alertMessage.classList.add('bg-green-50', 'dark:bg-green-900/20', 'border-green-200', 'dark:border-green-800', 'text-green-700', 'dark:text-green-400');
                alertIcon.classList.add('bi-check-circle-fill');
            } else if (type === 'error') {
                alertMessage.classList.add('bg-red-50', 'dark:bg-red-900/20', 'border-red-200', 'dark:border-red-800', 'text-red-700', 'dark:text-red-400');
                alertIcon.classList.add('bi-exclamation-circle-fill');
            }
        }

        function hideForgotAlert() {
            const container = document.getElementById('forgot-alert-container');
            if (container) container.classList.add('hidden');
        }

        // Info Modal Functions
        function openInfoModal(modalId) {
            const modal = document.getElementById(modalId);
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';

            // Reset scroll-to-unlock state each time modal opens
            const prefix = modalId.replace('-modal', '');
            const scrollBody = document.getElementById(prefix + '-scroll-body');
            const scrollBar = document.getElementById(prefix + '-scroll-bar');
            const agreeCheck = document.getElementById(prefix + '-agree-check');
            const acceptBtn = document.getElementById(prefix + '-accept-btn');
            const agreeLabel = document.getElementById(prefix + '-agree-label');
            if (scrollBody) scrollBody.scrollTop = 0;
            if (scrollBar) scrollBar.style.width = '0%';
            if (agreeCheck) { agreeCheck.checked = false; agreeCheck.disabled = true; }
            if (agreeLabel) { agreeLabel.classList.add('cursor-not-allowed', 'opacity-50'); agreeLabel.title = 'Scroll to the bottom to enable'; }
            if (acceptBtn) { acceptBtn.disabled = true; acceptBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
        }

        function closeInfoModal(modalId) {
            document.getElementById(modalId).classList.add('hidden');
            document.body.style.overflow = '';
        }

        // Scroll progress + checkbox unlock for Privacy / Terms modals
        function handleModalScroll(prefix) {
            const scrollBody = document.getElementById(prefix + '-scroll-body');
            const scrollBar = document.getElementById(prefix + '-scroll-bar');
            const agreeCheck = document.getElementById(prefix + '-agree-check');
            const agreeLabel = document.getElementById(prefix + '-agree-label');
            if (!scrollBody) return;

            const scrollTop = scrollBody.scrollTop;
            const scrollHeight = scrollBody.scrollHeight - scrollBody.clientHeight;
            const progress = scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 100;

            if (scrollBar) scrollBar.style.width = progress + '%';

            // Unlock checkbox when user reaches ≥95% of scroll
            if (progress >= 95 && agreeCheck && agreeCheck.disabled) {
                agreeCheck.disabled = false;
                if (agreeLabel) {
                    agreeLabel.classList.remove('cursor-not-allowed', 'opacity-50');
                    agreeLabel.title = '';
                }
            }
        }

        function updateModalAcceptBtn(prefix) {
            const agreeCheck = document.getElementById(prefix + '-agree-check');
            const acceptBtn = document.getElementById(prefix + '-accept-btn');
            if (!agreeCheck || !acceptBtn) return;
            if (agreeCheck.checked) {
                acceptBtn.disabled = false;
                acceptBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                acceptBtn.disabled = true;
                acceptBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }

        // First-time Agreement Modal
        let _agreementEmail = '', _agreementPassword = '';

        function showAgreementModal(email, password) {
            _agreementEmail = email;
            _agreementPassword = password;
            const modal = document.getElementById('agreement-modal');
            if (modal) {
                // Reset state
                const scrollBody = document.getElementById('agreement-scroll-body');
                const scrollBar = document.getElementById('agreement-scroll-bar');
                const agreeCheck = document.getElementById('agreement-agree-check');
                const acceptBtn = document.getElementById('agreement-accept-btn');
                const agreeLabel = document.getElementById('agreement-agree-label');
                if (scrollBody) scrollBody.scrollTop = 0;
                if (scrollBar) scrollBar.style.width = '0%';
                if (agreeCheck) { agreeCheck.checked = false; agreeCheck.disabled = true; }
                if (agreeLabel) { agreeLabel.classList.add('cursor-not-allowed', 'opacity-50'); }
                if (acceptBtn) { acceptBtn.disabled = true; acceptBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        }

        function submitAgreement() {
            const agreeCheck = document.getElementById('agreement-agree-check');
            if (!agreeCheck || !agreeCheck.checked) return;

            const modal = document.getElementById('agreement-modal');
            if (modal) { modal.classList.add('hidden'); document.body.style.overflow = ''; }

            // Re-submit login with agreed: true
            const loginBtn = document.getElementById('login-btn');
            const loginBtnText = document.getElementById('login-btn-text');
            const loginBtnIcon = document.getElementById('login-btn-icon');
            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtnText.textContent = 'Signing in...';
                loginBtnIcon.classList.remove('bi-arrow-right');
                loginBtnIcon.classList.add('spinner');
            }

            fetch('config/auth_login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: _agreementEmail, password: _agreementPassword, agreed: true })
            })
                .then(r => r.json())
                .then(data => {
                    if (data.success && !data.agreement_required) {
                        if (data.otp_required) {
                            showLoginAlert('Verification code required to continue.', 'success');
                            setTimeout(() => {
                                if (window.openOtpModal) window.openOtpModal(data.user.id, data.user.email);
                                if (loginBtn) {
                                    loginBtn.disabled = false;
                                    loginBtnText.textContent = 'Sign In';
                                    loginBtnIcon.classList.remove('spinner');
                                    loginBtnIcon.classList.add('bi-arrow-right');
                                }
                            }, 500);
                        } else {
                            sessionStorage.setItem('isLoggedIn', 'true');
                            sessionStorage.setItem('currentUser', JSON.stringify({ email: data.user.email, name: data.user.name, role: data.user.role, id: data.user.id }));
                            showMainLoading('Signing you in...');
                            setTimeout(() => { window.location.href = 'modules/main.php'; }, 2000);
                        }
                    } else {
                        if (loginBtn) {
                            loginBtn.disabled = false;
                            loginBtnText.textContent = 'Sign In';
                            loginBtnIcon.classList.remove('spinner');
                            loginBtnIcon.classList.add('bi-arrow-right');
                            loginBtnIcon.innerHTML = '';
                        }
                        showLoginAlert(data.message || 'Login failed. Please try again.', 'error');
                    }
                })
                .catch(() => {
                    if (loginBtn) {
                        loginBtn.disabled = false;
                        loginBtnText.textContent = 'Sign In';
                        loginBtnIcon.classList.remove('spinner');
                        loginBtnIcon.classList.add('bi-arrow-right');
                        loginBtnIcon.innerHTML = '';
                    }
                    showLoginAlert('An error occurred. Please try again later.', 'error');
                });
        }

        // Toggle password visibility
        document.getElementById('login-toggle-password')?.addEventListener('click', function () {
            const passwordField = document.getElementById('login-password');
            const eyeIcon = document.getElementById('login-eye-icon');

            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                eyeIcon.classList.remove('bi-eye');
                eyeIcon.classList.add('bi-eye-slash');
            } else {
                passwordField.type = 'password';
                eyeIcon.classList.remove('bi-eye-slash');
                eyeIcon.classList.add('bi-eye');
            }
        });

        // Show login alert message
        function showLoginAlert(message, type = 'error') {
            const container = document.getElementById('login-alert-container');
            const alertMessage = document.getElementById('login-alert-message');
            const alertIcon = document.getElementById('login-alert-icon');
            const alertText = document.getElementById('login-alert-text');

            container.classList.remove('hidden');
            alertText.textContent = message;

            // Reset classes
            alertMessage.className = 'px-4 py-3 rounded-lg flex items-center text-sm shadow-sm border';
            alertIcon.className = 'bi mr-2 text-lg';

            if (type === 'success') {
                alertMessage.classList.add('bg-green-50', 'dark:bg-green-900/20', 'border-green-200', 'dark:border-green-800', 'text-green-700', 'dark:text-green-400');
                alertIcon.classList.add('bi-check-circle-fill');
            } else if (type === 'error') {
                alertMessage.classList.add('bg-red-50', 'dark:bg-red-900/20', 'border-red-200', 'dark:border-red-800', 'text-red-700', 'dark:text-red-400');
                alertIcon.classList.add('bi-exclamation-circle-fill');
            } else if (type === 'warning') {
                alertMessage.classList.add('bg-yellow-50', 'dark:bg-yellow-900/20', 'border-yellow-200', 'dark:border-yellow-800', 'text-yellow-700', 'dark:text-yellow-400');
                alertIcon.classList.add('bi-exclamation-triangle-fill');
            }
        }

        // Hide login alert
        function hideLoginAlert() {
            document.getElementById('login-alert-container').classList.add('hidden');
        }

        // Handle login form submission
        function handleLogin(event) {
            event.preventDefault();

            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const loginBtn = document.getElementById('login-btn');
            const loginBtnText = document.getElementById('login-btn-text');
            const loginBtnIcon = document.getElementById('login-btn-icon');
            const form = document.getElementById('login-form');

            // Clear previous errors
            hideLoginAlert();
            document.getElementById('login-email-error').classList.add('hidden');
            document.getElementById('login-password-error').classList.add('hidden');

            // Basic validation
            if (!email) {
                showLoginAlert('Please enter your username', 'error');
                document.getElementById('login-email').focus();
                form.classList.add('animate-shake');
                setTimeout(() => form.classList.remove('animate-shake'), 500);
                return;
            }

            if (!password) {
                showLoginAlert('Please enter your password', 'error');
                document.getElementById('login-password').focus();
                form.classList.add('animate-shake');
                setTimeout(() => form.classList.remove('animate-shake'), 500);
                return;
            }



            // Show loading state
            loginBtn.disabled = true;
            loginBtnText.textContent = 'Signing in...';
            loginBtnIcon.classList.remove('bi-arrow-right');
            loginBtnIcon.classList.add('spinner');
            loginBtnIcon.innerHTML = '';

            // Send login request to server
            fetch('config/auth_login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // First-time user must accept the agreement
                        if (data.agreement_required) {
                            loginBtn.disabled = false;
                            loginBtnText.textContent = 'Sign In';
                            loginBtnIcon.classList.remove('spinner');
                            loginBtnIcon.classList.add('bi-arrow-right');
                            loginBtnIcon.innerHTML = '';
                            showAgreementModal(email, password);
                            return;
                        }

                        if (data.otp_required) {
                            // Launch OTP Modal instead of redirecting
                            showLoginAlert('Verification code required to continue.', 'success');
                            setTimeout(() => {
                                if (window.openOtpModal) {
                                    window.openOtpModal(data.user.id, data.user.email);
                                }

                                // Reset button state
                                loginBtn.disabled = false;
                                loginBtnText.textContent = 'Sign In';
                                loginBtnIcon.classList.remove('spinner');
                                loginBtnIcon.classList.add('bi-arrow-right');
                            }, 500);
                            return;
                        }

                        // Set login state
                        // Set login state
                        const userData = {
                            email: data.user.email,
                            name: data.user.name,
                            role: data.user.role,
                            id: data.user.id
                        };

                        // Always use sessionStorage (session-only, no persistent login)
                        sessionStorage.setItem('isLoggedIn', 'true');
                        sessionStorage.setItem('currentUser', JSON.stringify(userData));

                        // Show themed loading transition
                        showMainLoading('Signing you in...');
                        setTimeout(() => {
                            window.location.href = 'modules/main.php';
                        }, 2000);
                    } else {
                        // Reset button
                        loginBtn.disabled = false;
                        loginBtnText.textContent = 'Sign In';
                        loginBtnIcon.classList.remove('spinner');
                        loginBtnIcon.classList.add('bi-arrow-right');
                        loginBtnIcon.innerHTML = '';

                        showLoginAlert(data.message || 'Invalid username or password', 'error');
                        form.classList.add('animate-shake');
                        setTimeout(() => form.classList.remove('animate-shake'), 500);
                    }
                })
                .catch(error => {
                    // Reset button
                    loginBtn.disabled = false;
                    loginBtnText.textContent = 'Sign In';
                    loginBtnIcon.classList.remove('spinner');
                    loginBtnIcon.classList.add('bi-arrow-right');
                    loginBtnIcon.innerHTML = '';

                    console.error('Error:', error);
                    showLoginAlert('An error occurred. Please try again later.', 'error');
                    form.classList.add('animate-shake');
                    setTimeout(() => form.classList.remove('animate-shake'), 500);
                });
        }

        // Close modals on Escape key
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                // If login view is shown, go back to landing
                if (!document.getElementById('login-content').classList.contains('hidden')) {
                    showLandingView();
                }
                ['terms-gate-modal', 'privacy-modal', 'terms-modal', 'help-modal'].forEach(id => closeInfoModal(id));
            }
        });

        // Check for URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('logout') === 'success') {
            showLoginView();
            setTimeout(() => {
                showLoginAlert('You have been logged out successfully.', 'success');
            }, 300);
        } else if (urlParams.get('showLogin') === 'true') {
            showLoginView();
        }

        // Awards Cinema Roll Logic
        const awardsTrack = document.getElementById('awards-track');
        if (awardsTrack) {
            // Clone the content for infinite loop
            const trackContent = awardsTrack.innerHTML;
            awardsTrack.innerHTML = trackContent + trackContent;
        }

        // Slideshow Logic
        let currentSlide = 0;
        const slides = document.querySelectorAll('.slideshow-item');
        const indicators = document.querySelectorAll('.slide-indicator');

        function showSlide(n) {
            if (!slides.length) return;
            slides.forEach(slide => slide.classList.replace('opacity-100', 'opacity-0'));
            indicators.forEach(ind => ind.classList.replace('bg-white', 'bg-white/30'));

            currentSlide = (n + slides.length) % slides.length;

            slides[currentSlide].classList.replace('opacity-0', 'opacity-100');
            indicators[currentSlide].classList.replace('bg-white/30', 'bg-white');
        }

        document.getElementById('nextSlide')?.addEventListener('click', () => showSlide(currentSlide + 1));
        document.getElementById('prevSlide')?.addEventListener('click', () => showSlide(currentSlide - 1));

        // Auto slide
        if (slides.length) {
            setInterval(() => showSlide(currentSlide + 1), 5000);
        }
    </script>

    <style>
        /* Animation Keyframes */
        @keyframes shake {

            0%,
            100% {
                transform: translateX(0);
            }

            10%,
            30%,
            50%,
            70%,
            90% {
                transform: translateX(-5px);
            }

            20%,
            40%,
            60%,
            80% {
                transform: translateX(5px);
            }
        }

        .animate-shake {
            animation: shake 0.5s ease-in-out;
        }

        /* Loading spinner */
        .spinner {
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            0% {
                transform: rotate(0deg);
            }

            100% {
                transform: rotate(360deg);
            }
        }

        /* Custom Scrollbar for Modals */
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
        }

        .dark .custom-scrollbar::-webkit-scrollbar-track {
            background: #1f2937;
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4b5563;
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
        }

        /* Awards Cinema Roll Animation */
        @keyframes cinemaRoll {
            0% {
                transform: translateX(0);
            }

            100% {
                transform: translateX(-50%);
            }
        }

        .animate-cinema-roll {
            display: flex;
            width: max-content;
            animation: cinemaRoll 40s linear infinite;
        }

        .pause-animation:hover {
            animation-play-state: paused;
        }

        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
            -ms-overflow-style: none;
            /* IE and Edge */
            scrollbar-width: none;
            /* Firefox */
        }
    </style>
    <!-- Global Loading Overlay -->
    <div id="main-loading-overlay" class="hidden opacity-0">
        <div class="loader-content">
            <div class="logo-container">
                <div class="orbit-ring-outer"></div>
                <div class="orbit-ring"></div>
                <img src="images/logo.png" alt="LACS Logo" class="loader-logo">
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

            // Interaction: Dynamic message sequence
            const messages = [
                message,
                'Securing connection...',
                'Verifying identity...',
                'Finalizing setup...'
            ];
            let msgIdx = 0;

            msgEl.textContent = messages[0];
            progress.style.width = '0%';

            overlay.style.display = 'flex';
            overlay.style.pointerEvents = 'auto';
            overlay.classList.remove('hidden');

            // Animation triggers
            setTimeout(() => {
                overlay.classList.add('opacity-100');
                progress.style.width = '100%'; // Animate bar to 100% over the transition duration
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
    <script>
        function updateDigitalClock() {
            const clockEl = document.getElementById('digital-clock');
            const dateEl = document.getElementById('digital-date');

            if (!clockEl || !dateEl) return;

            const now = new Date();

            // Time string
            let hours = now.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            clockEl.textContent = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;

            // Date string
            const options = { month: 'short', day: '2-digit', year: 'numeric' };
            dateEl.textContent = now.toLocaleDateString('en-US', options);
        }

        // Update immediately and then every second
        setInterval(updateDigitalClock, 1000);
        updateDigitalClock();
    </script>
    <script src="modules/otp-features.js"></script>

</body>

</html>