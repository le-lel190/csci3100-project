document.addEventListener('DOMContentLoaded', () => {
    // Initialize the configuration page
    loadUserInfo();
    setupLogout();
    setupTabNavigation();
    loadSavedSettings();
    setupSettingsSaving();
    setupDataManagement();
});

/**
 * Load and display user information
 */
function loadUserInfo() {
    const usernameElement = document.getElementById('username');
    
    fetch('/api/auth/login', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Not authenticated');
        }
        return response.json();
    })
    .then(data => {
        if (data && data.username) {
            usernameElement.textContent = data.username;
            
            // Load user profile information if available
            if (data.email) {
                document.getElementById('profile-email').value = data.email;
            }
            if (data.fullName) {
                document.getElementById('profile-name').value = data.fullName;
            }
        }
    })
    .catch(error => {
        console.error('Error loading user info:', error);
        // Redirect to login if not authenticated
        window.location.href = '/login.html';
    });
}

/**
 * Set up the logout functionality
 */
function setupLogout() {
    const logoutButton = document.getElementById('logout-btn');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            })
            .then(response => {
                if (response.ok) {
                    window.location.href = '/index.html';
                } else {
                    throw new Error('Logout failed');
                }
            })
            .catch(error => {
                console.error('Error during logout:', error);
                alert('Failed to logout. Please try again.');
            });
        });
    }
}

/**
 * Set up the tab navigation for the sidebar
 */
function setupTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const configSections = document.querySelectorAll('.config-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all nav items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            
            // Add active class to clicked nav item
            item.classList.add('active');
            
            // Hide all configuration sections
            configSections.forEach(section => section.classList.remove('active'));
            
            // Show the section that corresponds to the clicked nav item
            const targetId = item.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
}

/**
 * Load saved settings from localStorage
 */
function loadSavedSettings() {
    // General Settings
    const defaultView = localStorage.getItem('defaultView');
    if (defaultView) {
        document.getElementById('default-view').value = defaultView;
    }
    
    const use24Hour = localStorage.getItem('use24Hour') === 'true';
    document.getElementById('24h-time').checked = use24Hour;
    
    const enableAlerts = localStorage.getItem('enableAlerts') === 'true';
    document.getElementById('enable-alerts').checked = enableAlerts;
    
    // Appearance Settings
    const theme = localStorage.getItem('theme');
    if (theme) {
        document.getElementById('theme-select').value = theme;
    }
    
    const fontSize = localStorage.getItem('fontSize');
    if (fontSize) {
        document.getElementById('font-size').value = fontSize;
    }
    
    const showCodes = localStorage.getItem('showCodes') === 'true';
    document.getElementById('show-codes').checked = showCodes;
    
    const compactMode = localStorage.getItem('compactMode') === 'true';
    document.getElementById('compact-mode').checked = compactMode;
    
    // Academic Settings
    const studyProgram = localStorage.getItem('studyProgram');
    if (studyProgram) {
        document.getElementById('study-program').value = studyProgram;
    }
    
    const academicYear = localStorage.getItem('academicYear');
    if (academicYear) {
        document.getElementById('academic-year').value = academicYear;
    }
    
    const expectedGraduation = localStorage.getItem('expectedGraduation');
    if (expectedGraduation) {
        document.getElementById('expected-graduation').value = expectedGraduation;
    }
}

/**
 * Set up event listeners for saving settings
 */
function setupSettingsSaving() {
    // General Settings
    document.getElementById('save-general').addEventListener('click', () => {
        const defaultView = document.getElementById('default-view').value;
        const use24Hour = document.getElementById('24h-time').checked;
        const enableAlerts = document.getElementById('enable-alerts').checked;
        
        localStorage.setItem('defaultView', defaultView);
        localStorage.setItem('use24Hour', use24Hour);
        localStorage.setItem('enableAlerts', enableAlerts);
        
        showSaveConfirmation('general-settings');
    });
    
    // Appearance Settings
    document.getElementById('save-appearance').addEventListener('click', () => {
        const theme = document.getElementById('theme-select').value;
        const fontSize = document.getElementById('font-size').value;
        const showCodes = document.getElementById('show-codes').checked;
        const compactMode = document.getElementById('compact-mode').checked;
        
        localStorage.setItem('theme', theme);
        localStorage.setItem('fontSize', fontSize);
        localStorage.setItem('showCodes', showCodes);
        localStorage.setItem('compactMode', compactMode);
        
        // Apply theme immediately
        applyTheme(theme);
        
        showSaveConfirmation('appearance-settings');
    });
    
    // Profile Settings
    document.getElementById('save-profile').addEventListener('click', () => {
        const email = document.getElementById('profile-email').value;
        const name = document.getElementById('profile-name').value;
        
        // Save to localStorage as backup
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', name);
        
        // Send to server (if API available)
        fetch('/api/user/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                fullName: name
            }),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update profile');
            }
            return response.json();
        })
        .then(data => {
            showSaveConfirmation('profile-settings');
        })
        .catch(error => {
            console.error('Error updating profile:', error);
            showSaveConfirmation('profile-settings', false);
        });
    });
    
    // Academic Settings
    document.getElementById('save-academic').addEventListener('click', () => {
        const studyProgram = document.getElementById('study-program').value;
        const academicYear = document.getElementById('academic-year').value;
        const expectedGraduation = document.getElementById('expected-graduation').value;
        
        localStorage.setItem('studyProgram', studyProgram);
        localStorage.setItem('academicYear', academicYear);
        localStorage.setItem('expectedGraduation', expectedGraduation);
        
        showSaveConfirmation('academic-settings');
    });
}

/**
 * Apply the selected theme to the page
 */
function applyTheme(theme) {
    // Remove any existing theme classes
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-contrast');
    
    // Add the selected theme class
    document.body.classList.add(`theme-${theme}`);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#663399');
    }
}

/**
 * Show a confirmation message after saving settings
 */
function showSaveConfirmation(containerId, isSuccess = true) {
    const container = document.getElementById(containerId);
    
    // Create message element if it doesn't exist
    let messageElement = container.querySelector('.save-message');
    
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.className = 'save-message';
        container.appendChild(messageElement);
    }
    
    // Set message content based on success or failure
    if (isSuccess) {
        messageElement.textContent = 'Settings saved successfully!';
        messageElement.style.color = 'var(--success-color)';
    } else {
        messageElement.textContent = 'Failed to save settings. Please try again.';
        messageElement.style.color = 'var(--danger-color)';
    }
    
    // Show the message
    messageElement.style.display = 'block';
    
    // Hide the message after 3 seconds
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 3000);
}

/**
 * Set up data management functions (import/export)
 */
function setupDataManagement() {
    // Export data
    document.getElementById('export-data').addEventListener('click', () => {
        // Collect all data from localStorage
        const data = {};
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data[key] = localStorage.getItem(key);
        }
        
        // Create a JSON file for download
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = `course-planner-settings-${new Date().toISOString().slice(0, 10)}.json`;
        
        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    });
    
    // Import data
    document.getElementById('import-file').addEventListener('change', (event) => {
        const file = event.target.files[0];
        
        if (file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Import all settings to localStorage
                    for (const key in data) {
                        if (data.hasOwnProperty(key)) {
                            localStorage.setItem(key, data[key]);
                        }
                    }
                    
                    // Reload settings to apply changes
                    loadSavedSettings();
                    
                    // Show success message
                    alert('Settings imported successfully! Reload the page to see all changes.');
                } catch (error) {
                    console.error('Error importing settings:', error);
                    alert('Failed to import settings. Please make sure the file is valid.');
                }
            };
            
            reader.readAsText(file);
        }
    });
    
    // Clear all data
    document.getElementById('clear-data').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all saved data? This action cannot be undone.')) {
            localStorage.clear();
            alert('All data has been cleared. The page will now reload.');
            window.location.reload();
        }
    });
}

/**
 * Set up notification preferences
 */
function setupNotifications() {
    const emailNotifs = localStorage.getItem('emailNotifications') === 'true';
    document.getElementById('email-notifications').checked = emailNotifs;
    
    const browserNotifs = localStorage.getItem('browserNotifications') === 'true';
    document.getElementById('browser-notifications').checked = browserNotifs;
    
    // Save notification settings
    document.getElementById('save-notifications').addEventListener('click', () => {
        const emailNotifications = document.getElementById('email-notifications').checked;
        const browserNotifications = document.getElementById('browser-notifications').checked;
        
        localStorage.setItem('emailNotifications', emailNotifications);
        localStorage.setItem('browserNotifications', browserNotifications);
        
        // Request browser notification permission if enabled
        if (browserNotifications && "Notification" in window) {
            Notification.requestPermission();
        }
        
        showSaveConfirmation('notification-settings');
    });
}
