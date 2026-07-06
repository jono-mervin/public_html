<?php
// forgot-password.php
// Forgot Password page
session_start();
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
    <meta name="theme-color" content="#dc2626">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>Forgot Password - LACS | City of Valenzuela</title>

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

        /* Custom focus styles */
        .input-field:focus {
            box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
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
            <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Forgot Password</h1>
            <p class="text-sm text-gray-500 font-medium mt-1">Enter your email to reset your password</p>
        </div>

        <!-- Alert Messages -->
        <div id="alert-container" class="mb-6 hidden">
            <div id="alert-message" class="px-4 py-3 rounded-lg flex items-center text-sm shadow-sm">
                <i class="bi mr-2 text-lg" id="alert-icon"></i>
                <span id="alert-text" class="font-medium"></span>
            </div>
        </div>

        <!-- Form -->
        <form id="forgot-form" class="space-y-6" onsubmit="handleForgot(event)">
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
            </div>

            <!-- Submit Button -->
            <button type="submit" id="submit-btn"
                class="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 rounded-xl transition-all duration-200 ease-in-out shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center ring-offset-2 focus:ring-2 focus:ring-red-500">
                <span id="submit-btn-text">Reset Password</span>
                <i class="bi bi-arrow-right ml-2 text-lg" id="submit-btn-icon"></i>
            </button>
        </form>

        <!-- Back to Login -->
        <div class="mt-8 text-center">
            <a href="../index.php?showLogin=true"
                class="text-sm text-gray-600 hover:text-red-600 font-semibold transition-colors flex items-center justify-center gap-2 group">
                <i class="bi bi-arrow-left group-hover:-translate-x-1 transition-transform"></i> Back to Login
            </a>
        </div>
    </div>

    <script>
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
            }
        }

        function hideAlert() {
            document.getElementById('alert-container').classList.add('hidden');
        }

        function handleForgot(event) {
            event.preventDefault();
            const email = document.getElementById('email').value.trim();
            const submitBtn = document.getElementById('submit-btn');
            const submitBtnText = document.getElementById('submit-btn-text');
            const submitBtnIcon = document.getElementById('submit-btn-icon');
            const form = document.getElementById('forgot-form');

            hideAlert();

            if (!email) {
                showAlert('Please enter your email address', 'error');
                return;
            }

            // Show loading state
            submitBtn.disabled = true;
            submitBtnText.textContent = 'Sending...';
            submitBtnIcon.classList.remove('bi-arrow-right');
            submitBtnIcon.classList.add('spinner');
            submitBtnIcon.innerHTML = '';

            fetch('api_forgot_password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showAlert(data.message, 'success');
                        form.reset();
                    } else {
                        showAlert(data.message, 'error');
                        form.classList.add('animate-shake');
                        setTimeout(() => form.classList.remove('animate-shake'), 500);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showAlert('An error occurred. Please try again later.', 'error');
                })
                .finally(() => {
                    submitBtn.disabled = false;
                    submitBtnText.textContent = 'Reset Password';
                    submitBtnIcon.classList.remove('spinner');
                    submitBtnIcon.classList.add('bi-arrow-right');
                    submitBtnIcon.innerHTML = '';
                });
        }

        document.getElementById('email').focus();
    </script>
</body>

</html>