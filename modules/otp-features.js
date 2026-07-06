/**
 * otp-features.js
 * Handles the OTP verification UI and logic
 */

window.openOtpModal = function (userId, email) {
    // Remove existing if any
    const existing = document.getElementById('otp-modal');
    if (existing) existing.remove();

    const modalHtml = `
    <div id="otp-modal" class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-fade-in">
        <div class="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 m-4 border border-gray-100 dark:border-slate-700 animate-fade-in-up">
            <!-- Close Button -->
            <button onclick="document.getElementById('otp-modal').remove()" class="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                <i class="bi bi-x-lg text-xl"></i>
            </button>

            <!-- Header -->
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 mb-6 shadow-inner ring-1 ring-red-100 dark:ring-red-900/30">
                    <i class="bi bi-shield-lock text-4xl"></i>
                </div>
                <h3 class="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Two-Step Verification</h3>
                <p class="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">
                    We've sent a 6-digit code to <br>
                    <span class="font-bold text-gray-900 dark:text-white">${email}</span>
                </p>
            </div>

            <!-- OTP Input Group -->
            <div class="flex justify-between gap-2 mb-8" id="otp-inputs">
                <input type="text" maxlength="1" onkeyup="handleOtpKeyUp(event, 0)" class="otp-input w-12 h-16 text-center text-2xl font-black text-red-600 dark:text-red-400 bg-gray-50 dark:bg-slate-700/50 border-2 border-transparent rounded-xl focus:border-red-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all shadow-sm">
                <input type="text" maxlength="1" onkeyup="handleOtpKeyUp(event, 1)" class="otp-input w-12 h-16 text-center text-2xl font-black text-red-600 dark:text-red-400 bg-gray-50 dark:bg-slate-700/50 border-2 border-transparent rounded-xl focus:border-red-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all shadow-sm">
                <input type="text" maxlength="1" onkeyup="handleOtpKeyUp(event, 2)" class="otp-input w-12 h-16 text-center text-2xl font-black text-red-600 dark:text-red-400 bg-gray-50 dark:bg-slate-700/50 border-2 border-transparent rounded-xl focus:border-red-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all shadow-sm">
                <input type="text" maxlength="1" onkeyup="handleOtpKeyUp(event, 3)" class="otp-input w-12 h-16 text-center text-2xl font-black text-red-600 dark:text-red-400 bg-gray-50 dark:bg-slate-700/50 border-2 border-transparent rounded-xl focus:border-red-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all shadow-sm">
                <input type="text" maxlength="1" onkeyup="handleOtpKeyUp(event, 4)" class="otp-input w-12 h-16 text-center text-2xl font-black text-red-600 dark:text-red-400 bg-gray-50 dark:bg-slate-700/50 border-2 border-transparent rounded-xl focus:border-red-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all shadow-sm">
                <input type="text" maxlength="1" onkeyup="handleOtpKeyUp(event, 5)" class="otp-input w-12 h-16 text-center text-2xl font-black text-red-600 dark:text-red-400 bg-gray-50 dark:bg-slate-700/50 border-2 border-transparent rounded-xl focus:border-red-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all shadow-sm">
            </div>

            <!-- Action Buttons -->
            <div class="space-y-4">
                <button id="verify-otp-btn" onclick="verifyOtp(${userId})" class="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-500/30 hover:shadow-red-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2">
                    Verify Code
                </button>
                
                <div class="text-center">
                    <p class="text-sm text-gray-500 dark:text-slate-400">
                        Didn't receive code? 
                        <button onclick="resendOtp(${userId}, '${email}')" id="resend-otp-btn" class="text-red-600 dark:text-red-400 font-bold hover:underline">Resend</button>
                    </p>
                </div>
            </div>
            
            <!-- Error Area -->
            <div id="otp-error" class="mt-4 text-center text-red-500 text-sm font-bold hidden animate-shake"></div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Auto focus first input
    setTimeout(() => {
        document.querySelectorAll('.otp-input')[0].focus();
    }, 100);

    // Initial send
    resendOtp(userId, email, true);
};

window.handleOtpKeyUp = function (e, index) {
    const inputs = document.querySelectorAll('.otp-input');
    const input = inputs[index];

    // Auto focus next
    if (input.value.length === 1 && index < 5) {
        inputs[index + 1].focus();
    }

    // Backspace
    if (e.key === 'Backspace' && index > 0 && input.value.length === 0) {
        inputs[index - 1].focus();
    }

    // Enter key triggers verification
    if (e.key === 'Enter') {
        const fullOtp = Array.from(inputs).map(i => i.value).join('');
        if (fullOtp.length === 6) {
            document.getElementById('verify-otp-btn').click();
        }
    }
};

window.verifyOtp = async function (userId) {
    const inputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(inputs).map(i => i.value).join('');
    const errDiv = document.getElementById('otp-error');
    const btn = document.getElementById('verify-otp-btn');

    if (otp.length < 6) {
        errDiv.textContent = "Please enter all 6 digits";
        errDiv.classList.remove('hidden');
        return;
    }

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-arrow-repeat animate-spin"></i> Verifying...';
        errDiv.classList.add('hidden');

        const response = await fetch('api/api_otp_verify.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, otp: otp })
        });

        const data = await response.json();

        if (data.success) {
            btn.innerHTML = '<i class="bi bi-check-lg"></i> Verified!';
            btn.classList.replace('from-red-600', 'from-green-600');
            btn.classList.replace('to-red-700', 'to-green-700');

            // Store user data locally if needed (same as login would)
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            localStorage.setItem('isLoggedIn', 'true');

            // Show themed loading transition from parent if available
            if (window.showMainLoading) {
                window.showMainLoading('Signing you in...');
            }

            setTimeout(() => {
                window.location.href = 'modules/main.php';
            }, 2000);
        } else {
            throw new Error(data.message);
        }
    } catch (e) {
        btn.disabled = false;
        btn.innerHTML = 'Verify Code';
        errDiv.textContent = e.message || "Invalid or expired code";
        errDiv.classList.remove('hidden');
    }
};

window.resendOtp = async function (userId, email, silent = false) {
    const btn = document.getElementById('resend-otp-btn');
    const errDiv = document.getElementById('otp-error');

    try {
        if (!silent) {
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Sending...';
        }

        const response = await fetch('api/api_otp_send.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });

        const data = await response.json();

        if (data.success) {
            if (!silent) {
                btn.textContent = 'Sent!';
                setTimeout(() => {
                    btn.disabled = false;
                    btn.textContent = 'Resend';
                }, 30000); // 30s cooldown
            }
        } else {
            throw new Error(data.message);
        }
    } catch (e) {
        if (!silent) {
            btn.disabled = false;
            btn.textContent = 'Resend';
            errDiv.textContent = "Failed to resend code: " + e.message;
            errDiv.classList.remove('hidden');
        }
    }
};
