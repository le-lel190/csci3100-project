/**
 * Session Manager
 * 
 * This script manages user session timeouts and activity tracking to maintain active sessions.
 * It intercepts unauthorized responses, refreshes sessions based on user activity,
 * and handles redirects when sessions expire.
 * 
 * Features:
 * - Intercepts 401 responses to detect session timeouts
 * - Monitors user activity to keep sessions alive
 * - Redirects to login page when a session expires
 * - Uses debouncing to prevent excessive session refresh calls
 */

document.addEventListener('DOMContentLoaded', () => {
    // Set up global AJAX error handler for session timeout
    setupAjaxErrorHandler();

    // Register user activity listeners
    registerActivityListeners();
});

/**
 * Sets up a global AJAX error handler by overriding the fetch API
 * to intercept 401 Unauthorized responses and check if they're due to session timeouts.
 * 
 * When a 401 response with a session expired message is detected,
 * it triggers the session timeout handler.
 */
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

/**
 * Registers event listeners for various user activities.
 * 
 * These listeners detect when a user is active and trigger session refreshes
 * to keep their session alive. A debounce function is used to prevent
 * too many refresh requests.
 */
function registerActivityListeners() {
    // Listen for user activity to keep the session alive
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
        document.addEventListener(event, debounce(refreshSession, 300), { passive: true });
    });
}

/**
 * Refreshes the user's session when activity is detected.
 * 
 * This function checks if the user is logged in by looking for the token cookie,
 * then makes a request to the login API endpoint to refresh the session token.
 * The server should extend the session timeout upon receiving this request.
 */
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

/**
 * Handles session timeout by redirecting the user to the login page.
 * 
 * When a session times out, this function redirects to the login page
 * with a timeout parameter that can be used to display an appropriate message.
 */
function handleSessionTimeout() {
    // Redirect to login page with timeout parameter
    window.location.href = '/?timeout=true';
}

/**
 * Utility function that limits how often a function can be called.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The time in milliseconds to wait before allowing the function to be called again
 * @returns {Function} A debounced version of the input function
 * 
 * When a debounced function is called multiple times within the wait period,
 * only the last call will be executed after the wait period ends.
 */
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