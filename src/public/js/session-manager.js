// Session timeout manager

document.addEventListener('DOMContentLoaded', () => {
    // Set up global AJAX error handler for session timeout
    setupAjaxErrorHandler();

    // Register user activity listeners
    registerActivityListeners();
});

function setupAjaxErrorHandler() {
    // Add a global AJAX response interceptor
    const originalFetch = window.fetch;
    window.fetch = async function(url, options) {
        const response = await originalFetch(url, options);
        
        // Clone the response to avoid consuming the body
        const clonedResponse = response.clone();
        
        // If response is 401 Unauthorized, check if it's a session timeout
        if (response.status === 401) {
            try {
                const data = await clonedResponse.json();
                if (data.message === 'Session expired. Please login again.') {
                    handleSessionTimeout();
                }
            } catch (error) {
                // If not JSON or other error, just continue
                console.error('Error processing response:', error);
            }
        }
        
        return response;
    };
}

function registerActivityListeners() {
    // Listen for user activity to keep the session alive
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
        document.addEventListener(event, debounce(refreshSession, 300), { passive: true });
    });
}

// Refresh session when user is active
async function refreshSession() {
    // Only attempt to refresh if user is logged in
    if (document.cookie.includes('token=')) {
        try {
            // Make a request to any protected route to refresh the token
            await fetch('/api/auth/login', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error refreshing session:', error);
        }
    }
}

// Handle session timeout by redirecting to login page with message
function handleSessionTimeout() {
    // Redirect to login page with timeout parameter
    window.location.href = '/?timeout=true';
}

// Utility function to limit how often the refresh session function is called
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
} 