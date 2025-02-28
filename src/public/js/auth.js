document.addEventListener('DOMContentLoaded', () => {
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
                    email: document.getElementById('loginEmail').value,
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
                window.location.href = '/timetable';
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
}

function showAuthForms() {
    document.querySelector('.auth-container').style.display = 'block';
    document.querySelector('.dashboard').style.display = 'none';
} 