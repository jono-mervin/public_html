<?php
// login.php
// Login page with database authentication
session_start();

if (isset($_SESSION['is_logged_in']) && $_SESSION['is_logged_in'] === true) {
    header("Location: ../modules/main.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
    <meta name="theme-color" content="#dc2626">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>Login - LACS | City of Valenzuela</title>

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="images/logo.png">
    <link rel="apple-touch-icon" href="images/logo.png">

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Google Fonts: Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
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
                        }
                    }
                }
            }
        }
    </script>

    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">

    <style>
        /* Animation Keyframes */
        @keyframes fade-in-up {
            from {
                opacity: 0;
                transform: translateY(20px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

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

        .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out forwards;
        }

        .animate-shake {
            animation: shake 0.5s ease-in-out;
        }

        /* Custom focus styles */
        .input-field:focus {
            box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
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

        /* Hide default browser password reveal / clear icons (Edge, IE) */
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
            display: none !important;
        }

        /* Hide autofill / decoration icons that can overlap the custom eye icon */
        input[type="password"]::-webkit-contacts-auto-fill-button,
        input[type="password"]::-webkit-credentials-auto-fill-button {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
            position: absolute !important;
            right: 0 !important;
        }
    </style>
</head>

<body class="bg-gray-100 min-h-screen flex items-center justify-center p-4 font-sans">

    <!-- Main Card -->
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 animate-fade-in-up">

        <!-- Logo Section -->
        <div class="text-center mb-8">
            <div class="inline-block p-3 rounded-full bg-red-50 mb-4">
                <img src="../images/logo.png" alt="City Government of Valenzuela" class="w-20 h-20 object-contain">
            </div>
            <h1 class="text-2xl font-bold text-gray-900 tracking-tight">LACS</h1>
            <p class="text-sm text-gray-500 font-medium">Legislative Agenda & Calendar System</p>
        </div>

        <!-- Alert Messages -->
        <div id="alert-container" class="mb-6 hidden">
            <div id="alert-message" class="px-4 py-3 rounded-lg flex items-center text-sm shadow-sm">
                <i class="bi mr-2 text-lg" id="alert-icon"></i>
                <span id="alert-text" class="font-medium"></span>
            </div>
        </div>

        <!-- Login Form -->
        <form id="login-form" class="space-y-5" onsubmit="handleLogin(event)">
            <!-- Email Field -->
            <div>
                <label for="email" class="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email Address
                </label>
                <div class="relative group">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i class="bi bi-envelope text-gray-400 group-focus-within:text-red-500 transition-colors"></i>
                    </div>
                    <input type="email" id="email" name="email" required placeholder="name@valenzuela.gov.ph"
                        class="input-field w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400">
                </div>
                <span class="text-red-500 text-xs hidden mt-1 font-medium" id="email-error"></span>
            </div>

            <!-- Password Field -->
            <div>
                <label for="password" class="block text-sm font-semibold text-gray-700 mb-1.5">
                    Password
                </label>
                <div class="relative group">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i class="bi bi-lock text-gray-400 group-focus-within:text-red-500 transition-colors"></i>
                    </div>
                    <input type="password" id="password" name="password" required placeholder="Enter your password"
                        class="input-field w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400">
                    <button type="button" id="toggle-password"
                        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100">
                        <i class="bi bi-eye text-lg" id="eye-icon"></i>
                    </button>
                </div>
                <span class="text-red-500 text-xs hidden mt-1 font-medium" id="password-error"></span>
            </div>

            <!-- Remember Me & Forgot Password -->
            <div class="flex items-center justify-between pt-1">
                <label class="flex items-center cursor-pointer group select-none">
                    <input type="checkbox" name="remember" id="remember"
                        class="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer transition">
                    <span class="ml-2 text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Remember
                        me</span>
                </label>
                <a href="forgot-password.php"
                    class="text-sm text-red-600 hover:text-red-700 font-semibold transition-colors hover:underline decoration-2 underline-offset-2">
                    Forgot password?
                </a>
            </div>

            <!-- Submit Button -->
            <button type="submit" id="login-btn"
                class="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 rounded-xl transition-all duration-200 ease-in-out shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center ring-offset-2 focus:ring-2 focus:ring-red-500">
                <span id="login-btn-text">Sign In</span>
                <i class="bi bi-arrow-right ml-2 text-lg" id="login-btn-icon"></i>
            </button>
        </form>

        <!-- Footer Links -->
        <div class="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
            <div class="flex justify-center space-x-4 mb-3">
                <button onclick="openModal('privacy-modal')"
                    class="hover:text-red-600 transition-colors font-medium">Privacy Policy</button>
                <span class="text-gray-300">&bull;</span>
                <button onclick="openModal('terms-modal')"
                    class="hover:text-red-600 transition-colors font-medium">Terms of Service</button>
                <span class="text-gray-300">&bull;</span>
                <button onclick="openModal('help-modal')"
                    class="hover:text-red-600 transition-colors font-medium">Help</button>
            </div>
            <p>&copy; 2025 City Government of Valenzuela</p>
        </div>
    </div>

    <!-- Modals -->
    <!-- Privacy Policy Modal -->
    <div id="privacy-modal" class="fixed inset-0 z-50 hidden overflow-y-auto" aria-labelledby="modal-title"
        role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm" aria-hidden="true"
                onclick="closeModal('privacy-modal')"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div
                class="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
                <div class="bg-white px-6 pt-6 pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                            <h3 class="text-xl leading-6 font-bold text-gray-900 mb-4 flex items-center gap-2"
                                id="modal-title">
                                <i class="bi bi-shield-lock text-red-600"></i> Privacy Policy
                            </h3>
                            <div
                                class="mt-2 max-h-80 overflow-y-auto text-sm text-gray-600 space-y-4 pr-2 custom-scrollbar">
                                <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p class="font-semibold text-gray-800 mb-1">1. Data Collection</p>
                                    <p>We collect information necessary for the Legislative Agenda and Calendar System
                                        (LACS), including names, email addresses, and system usage data.</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p class="font-semibold text-gray-800 mb-1">2. Use of Information</p>
                                    <p>Your data is used solely for system administration, authentication, and audit
                                        logging purposes within the City Government of Valenzuela.</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p class="font-semibold text-gray-800 mb-1">3. Data Protection</p>
                                    <p>We implement security measures to protect your personal information against
                                        unauthorized access and disclosure.</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p class="font-semibold text-gray-800 mb-1">4. Contact</p>
                                    <p>For privacy concerns, please contact the City MIS Office.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse border-t border-gray-100">
                    <button type="button"
                        class="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-5 py-2.5 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                        onclick="closeModal('privacy-modal')">Close</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Terms of Service Modal -->
    <div id="terms-modal" class="fixed inset-0 z-50 hidden overflow-y-auto" aria-labelledby="modal-title" role="dialog"
        aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm" aria-hidden="true"
                onclick="closeModal('terms-modal')"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div
                class="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
                <div class="bg-white px-6 pt-6 pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                            <h3 class="text-xl leading-6 font-bold text-gray-900 mb-4 flex items-center gap-2"
                                id="modal-title">
                                <i class="bi bi-file-text text-red-600"></i> Terms of Service
                            </h3>
                            <div
                                class="mt-2 max-h-80 overflow-y-auto text-sm text-gray-600 space-y-4 pr-2 custom-scrollbar">
                                <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p class="font-semibold text-gray-800 mb-1">1. Acceptance</p>
                                    <p>By accessing LACS, you agree to these terms and conditions.</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p class="font-semibold text-gray-800 mb-1">2. Authorized Use</p>
                                    <p>This system is for official use by authorized personnel of the City Government of
                                        Valenzuela only.</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p class="font-semibold text-gray-800 mb-1">3. User Responsibilities</p>
                                    <p>You are responsible for maintaining the confidentiality of your credentials and
                                        for all activities under your account.</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p class="font-semibold text-gray-800 mb-1">4. Termination</p>
                                    <p>Unauthorized use may result in account termination and legal action.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse border-t border-gray-100">
                    <button type="button"
                        class="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-5 py-2.5 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                        onclick="closeModal('terms-modal')">Close</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Help Modal -->
    <div id="help-modal" class="fixed inset-0 z-50 hidden overflow-y-auto" aria-labelledby="modal-title" role="dialog"
        aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm" aria-hidden="true"
                onclick="closeModal('help-modal')"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div
                class="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
                <div class="bg-white px-6 pt-6 pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                            <h3 class="text-xl leading-6 font-bold text-gray-900 mb-4 flex items-center gap-2"
                                id="modal-title">
                                <i class="bi bi-question-circle text-red-600"></i> Help & Support
                            </h3>
                            <div
                                class="mt-2 max-h-80 overflow-y-auto text-sm text-gray-600 space-y-4 pr-2 custom-scrollbar">
                                <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p class="font-semibold text-gray-800 mb-1">Login Issues</p>
                                    <p>If you cannot log in, ensure your caps lock is off and you are using your
                                        official email.</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p class="font-semibold text-gray-800 mb-1">Forgot Password</p>
                                    <p>Use the "Forgot password?" link to reset your credentials via email.</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p class="font-semibold text-gray-800 mb-1">System Access</p>
                                    <p>Contact your department head or the MIS Office to request access or report
                                        issues.</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p class="font-semibold text-gray-800 mb-1">Technical Support</p>
                                    <p>For technical assistance, please call local 1234 or email
                                        support@valenzuela.gov.ph.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse border-t border-gray-100">
                    <button type="button"
                        class="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-5 py-2.5 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                        onclick="closeModal('help-modal')">Close</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Toggle password visibility
        document.getElementById('toggle-password')?.addEventListener('click', function () {
            const passwordField = document.getElementById('password');
            const eyeIcon = document.getElementById('eye-icon');

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

        // Show alert message
        function showAlert(message, type = 'error') {
            const container = document.getElementById('alert-container');
            const alertMessage = document.getElementById('alert-message');
            const alertIcon = document.getElementById('alert-icon');
            const alertText = document.getElementById('alert-text');

            container.classList.remove('hidden');
            alertText.textContent = message;

            // Reset classes
            alertMessage.className = 'px-4 py-3 rounded-lg flex items-center text-sm shadow-sm border';
            alertIcon.className = 'bi mr-2 text-lg';

            if (type === 'success') {
                alertMessage.classList.add('bg-green-50', 'border-green-200', 'text-green-700');
                alertIcon.classList.add('bi-check-circle-fill');
            } else if (type === 'error') {
                alertMessage.classList.add('bg-red-50', 'border-red-200', 'text-red-700');
                alertIcon.classList.add('bi-exclamation-circle-fill');
            } else if (type === 'warning') {
                alertMessage.classList.add('bg-yellow-50', 'border-yellow-200', 'text-yellow-700');
                alertIcon.classList.add('bi-exclamation-triangle-fill');
            }
        }

        // Hide alert
        function hideAlert() {
            document.getElementById('alert-container').classList.add('hidden');
        }

        // Handle login form submission
        function handleLogin(event) {
            event.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const loginBtn = document.getElementById('login-btn');
            const loginBtnText = document.getElementById('login-btn-text');
            const loginBtnIcon = document.getElementById('login-btn-icon');
            const form = document.getElementById('login-form');

            // Clear previous errors
            hideAlert();
            document.getElementById('email-error').classList.add('hidden');
            document.getElementById('password-error').classList.add('hidden');

            // Basic validation
            if (!email) {
                showAlert('Please enter your email address', 'error');
                document.getElementById('email').focus();
                form.classList.add('animate-shake');
                setTimeout(() => form.classList.remove('animate-shake'), 500);
                return;
            }

            if (!password) {
                showAlert('Please enter your password', 'error');
                document.getElementById('password').focus();
                form.classList.add('animate-shake');
                setTimeout(() => form.classList.remove('animate-shake'), 500);
                return;
            }

            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showAlert('Please enter a valid email address', 'error');
                document.getElementById('email').focus();
                return;
            }

            // Show loading state
            loginBtn.disabled = true;
            loginBtnText.textContent = 'Signing in...';
            loginBtnIcon.classList.remove('bi-arrow-right');
            loginBtnIcon.classList.add('spinner');
            loginBtnIcon.innerHTML = '';

            // Send login request to server
            fetch('auth_login.php', {
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
                        // Set login state
                        const userData = {
                            email: data.user.email,
                            name: data.user.name,
                            role: data.user.role,
                            id: data.user.id
                        };

                        if (document.getElementById('remember').checked) {
                            localStorage.setItem('isLoggedIn', 'true');
                            localStorage.setItem('currentUser', JSON.stringify(userData));
                        } else {
                            sessionStorage.setItem('isLoggedIn', 'true');
                            sessionStorage.setItem('currentUser', JSON.stringify(userData));
                        }

                        showAlert('Login successful! Redirecting...', 'success');
                        setTimeout(() => {
                            window.location.href = '../modules/main.php';
                        }, 1000);
                    } else {
                        // Reset button
                        loginBtn.disabled = false;
                        loginBtnText.textContent = 'Sign In';
                        loginBtnIcon.classList.remove('spinner');
                        loginBtnIcon.classList.add('bi-arrow-right');
                        loginBtnIcon.innerHTML = '';

                        showAlert(data.message || 'Invalid email or password', 'error');
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
                    showAlert('An error occurred. Please try again later.', 'error');
                    form.classList.add('animate-shake');
                    setTimeout(() => form.classList.remove('animate-shake'), 500);
                });
        }

        // Check for logout parameter
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('logout') === 'success') {
            showAlert('You have been logged out successfully.', 'success');
        }

        // Auto-focus email field
        document.getElementById('email').focus();

        // Modal functions
        function openModal(modalId) {
            document.getElementById(modalId).classList.remove('hidden');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.add('hidden');
        }

        // Close modal on Escape key
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                ['privacy-modal', 'terms-modal', 'help-modal'].forEach(id => closeModal(id));
            }
        });
    </script>
</body>

</html>