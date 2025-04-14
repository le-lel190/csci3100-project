document.addEventListener('DOMContentLoaded', () => {
    // Check for verification success message
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
        showMessage('Your email has been verified successfully. You can now log in.', 'success');
    }
    
    // Check for session timeout parameter
    if (urlParams.get('timeout') === 'true') {
        showMessage('Your session has timed out. Please login again.', 'warning');
    }

    // Check if user is already logged in
    checkAuthStatus();

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show corresponding form
            authForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${tabName}Form`) {
                    form.classList.add('active');
                }
            });

            // Clear error messages when switching tabs
            document.querySelectorAll('.error-message').forEach(error => {
                error.textContent = '';
            });
        });
    });

    // Password toggle functionality
    document.querySelectorAll('.toggle-password').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });

    // Form submissions
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const resendVerificationBtn = document.getElementById('resendVerificationBtn');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = loginForm.querySelector('.submit-btn');
        const errorElement = document.getElementById('loginError');
        
        try {
            // Disable submit button and show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            errorElement.textContent = '';

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    identifier: document.getElementById('loginIdentifier').value,
                    password: document.getElementById('loginPassword').value
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                window.location.href = '/timetable';
            } else {
                errorElement.textContent = data.message;
            }
        } catch (error) {
            errorElement.textContent = 'An error occurred. Please try again.';
        } finally {
            // Re-enable submit button and restore original text
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = registerForm.querySelector('.submit-btn');
        const errorElement = document.getElementById('registerError');
        
        try {
            // Disable submit button and show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
            errorElement.textContent = '';

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: document.getElementById('registerUsername').value,
                    email: document.getElementById('registerEmail').value,
                    password: document.getElementById('registerPassword').value
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                // Show verification message instead of redirecting
                showMessage(`Account created successfully! Please check your email to verify your account. ${!data.verificationEmailSent ? 'There was an issue sending the verification email. Please request a new one after logging in.' : ''}`, 'success');
                
                // Switch to login tab
                document.querySelector('.tab-btn[data-tab="login"]').click();
            } else {
                errorElement.textContent = data.message;
            }
        } catch (error) {
            errorElement.textContent = 'An error occurred. Please try again.';
        } finally {
            // Re-enable submit button and restore original text
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        }
    });

    // Resend verification email
    if (resendVerificationBtn) {
        resendVerificationBtn.addEventListener('click', async () => {
            try {
                resendVerificationBtn.disabled = true;
                resendVerificationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                
                const response = await fetch('/api/auth/resend-verification', {
                    method: 'POST'
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    showMessage('Verification email sent successfully. Please check your inbox.', 'success');
                } else {
                    showMessage(data.message || 'Failed to send verification email. Please try again later.', 'error');
                }
            } catch (error) {
                showMessage('An error occurred. Please try again.', 'error');
            } finally {
                resendVerificationBtn.disabled = false;
                resendVerificationBtn.innerHTML = 'Resend Verification Email';
            }
        });
    }

    logoutBtn?.addEventListener('click', async () => {
        const originalText = logoutBtn.innerHTML;
        
        try {
            logoutBtn.disabled = true;
            logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';

            const response = await fetch('/api/auth/logout', {
                method: 'POST'
            });

            if (response.ok) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            logoutBtn.disabled = false;
            logoutBtn.innerHTML = originalText;
        }
    });
});

async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'GET'
        });

        if (response.ok) {
            window.location.href = '/timetable';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }
}

function showDashboard(user) {
    document.querySelector('.auth-container').style.display = 'none';
    const dashboard = document.querySelector('.dashboard');
    dashboard.style.display = 'block';
    document.getElementById('userUsername').textContent = user.username;
    document.getElementById('userEmail').textContent = user.email;
    
    // Show verification status and button if needed
    const verificationStatus = document.getElementById('verificationStatus');
    const resendVerificationBtn = document.getElementById('resendVerificationBtn');
    
    if (verificationStatus && resendVerificationBtn) {
        if (user.isEmailVerified) {
            verificationStatus.textContent = 'Verified';
            verificationStatus.className = 'verified';
            resendVerificationBtn.style.display = 'none';
        } else {
            verificationStatus.textContent = 'Not Verified';
            verificationStatus.className = 'not-verified';
            resendVerificationBtn.style.display = 'block';
        }
    }
}

function showAuthForms() {
    document.querySelector('.auth-container').style.display = 'block';
    document.querySelector('.dashboard').style.display = 'none';
}

// Helper function to show messages
function showMessage(message, type = 'info') {
    const messageContainer = document.querySelector('.message-container') || createMessageContainer();
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => messageElement.remove());
    messageElement.appendChild(closeBtn);
    
    messageContainer.appendChild(messageElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.remove();
        }
    }, 5000);
}

function createMessageContainer() {
    const container = document.createElement('div');
    container.className = 'message-container';
    document.body.appendChild(container);
    return container;
} 