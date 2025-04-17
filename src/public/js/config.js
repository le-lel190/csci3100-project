document.addEventListener('DOMContentLoaded', () => {
    // Initialize the configuration page
    loadUserInfo();
    setupLogout();
    setupTabNavigation();
    loadSavedSettings();
    setupSettingsSaving();
    setupDataManagement();
    setupEmailVerification();
});

/**
 * Load and display user information
 */
function loadUserInfo() {
    const usernameElement = document.getElementById('userUsername');
    
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
        if (data && data.user && data.user.username && usernameElement) {
            usernameElement.textContent = data.user.username;
            
            // Load user profile information if available
            const profileEmailEl = document.getElementById('profile-email');
            const profileNameEl = document.getElementById('profile-name');
            
            if (data.user.email && profileEmailEl) {
                profileEmailEl.value = data.user.email;
            }
            if (data.user.fullName && profileNameEl) {
                profileNameEl.value = data.user.fullName;
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
    const logoutButton = document.getElementById('logoutBtn');
    
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
    const defaultViewEl = document.getElementById('default-view');
    if (defaultView && defaultViewEl) {
        defaultViewEl.value = defaultView;
    }
    
    const use24Hour = localStorage.getItem('use24Hour') === 'true';
    const use24HourEl = document.getElementById('24h-time');
    if (use24HourEl) {
        use24HourEl.checked = use24Hour;
    }
    
    const enableAlerts = localStorage.getItem('enableAlerts') === 'true';
    const enableAlertsEl = document.getElementById('enable-alerts');
    if (enableAlertsEl) {
        enableAlertsEl.checked = enableAlerts;
    }
    
    // Appearance Settings
    const theme = localStorage.getItem('theme');
    const themeSelectEl = document.getElementById('theme-select');
    if (theme && themeSelectEl) {
        themeSelectEl.value = theme;
    }
    
    const fontSize = localStorage.getItem('fontSize');
    const fontSizeEl = document.getElementById('font-size');
    if (fontSize && fontSizeEl) {
        fontSizeEl.value = fontSize;
    }
    
    const showCodes = localStorage.getItem('showCodes') === 'true';
    const showCodesEl = document.getElementById('show-codes');
    if (showCodesEl) {
        showCodesEl.checked = showCodes;
    }
    
    const compactMode = localStorage.getItem('compactMode') === 'true';
    const compactModeEl = document.getElementById('compact-mode');
    if (compactModeEl) {
        compactModeEl.checked = compactMode;
    }
    
    // Academic Settings
    const studyProgram = localStorage.getItem('studyProgram');
    const studyProgramEl = document.getElementById('study-program');
    if (studyProgram && studyProgramEl) {
        studyProgramEl.value = studyProgram;
    }
    
    const academicYear = localStorage.getItem('academicYear');
    const academicYearEl = document.getElementById('academic-year');
    if (academicYear && academicYearEl) {
        academicYearEl.value = academicYear;
    }
    
    const expectedGraduation = localStorage.getItem('expectedGraduation');
    const expectedGradEl = document.getElementById('expected-graduation');
    if (expectedGraduation && expectedGradEl) {
        expectedGradEl.value = expectedGraduation;
    }
}

/**
 * Set up event listeners for saving settings
 */
function setupSettingsSaving() {
    // General Settings
    const saveGeneralBtn = document.getElementById('save-general');
    if (saveGeneralBtn) {
        saveGeneralBtn.addEventListener('click', () => {
            const defaultViewEl = document.getElementById('default-view');
            const use24HourEl = document.getElementById('24h-time');
            const enableAlertsEl = document.getElementById('enable-alerts');
            
            const defaultView = defaultViewEl ? defaultViewEl.value : '';
            const use24Hour = use24HourEl ? use24HourEl.checked : false;
            const enableAlerts = enableAlertsEl ? enableAlertsEl.checked : false;
            
            localStorage.setItem('defaultView', defaultView);
            localStorage.setItem('use24Hour', use24Hour);
            localStorage.setItem('enableAlerts', enableAlerts);
            
            showSaveConfirmation('general-settings');
        });
    }
    
    // Appearance Settings
    const saveAppearanceBtn = document.getElementById('save-appearance');
    if (saveAppearanceBtn) {
        saveAppearanceBtn.addEventListener('click', () => {
            const themeSelectEl = document.getElementById('theme-select');
            const fontSizeEl = document.getElementById('font-size');
            const showCodesEl = document.getElementById('show-codes');
            const compactModeEl = document.getElementById('compact-mode');
            
            const theme = themeSelectEl ? themeSelectEl.value : 'light';
            const fontSize = fontSizeEl ? fontSizeEl.value : 'medium';
            const showCodes = showCodesEl ? showCodesEl.checked : false;
            const compactMode = compactModeEl ? compactModeEl.checked : false;
            
            localStorage.setItem('theme', theme);
            localStorage.setItem('fontSize', fontSize);
            localStorage.setItem('showCodes', showCodes);
            localStorage.setItem('compactMode', compactMode);
            
            // Apply theme immediately
            applyTheme(theme);
            
            showSaveConfirmation('appearance-settings');
        });
    }
    
    // Profile Settings
    const saveProfileBtn = document.getElementById('save-profile');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => {
            const emailEl = document.getElementById('profile-email');
            const nameEl = document.getElementById('profile-name');
            
            const email = emailEl ? emailEl.value : '';
            const name = nameEl ? nameEl.value : '';
            
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
    }
    
    // Academic Settings
    const saveAcademicBtn = document.getElementById('save-academic');
    if (saveAcademicBtn) {
        saveAcademicBtn.addEventListener('click', () => {
            const studyProgramEl = document.getElementById('study-program');
            const academicYearEl = document.getElementById('academic-year');
            const expectedGradEl = document.getElementById('expected-graduation');
            
            const studyProgram = studyProgramEl ? studyProgramEl.value : '';
            const academicYear = academicYearEl ? academicYearEl.value : '';
            const expectedGraduation = expectedGradEl ? expectedGradEl.value : '';
            
            localStorage.setItem('studyProgram', studyProgram);
            localStorage.setItem('academicYear', academicYear);
            localStorage.setItem('expectedGraduation', expectedGraduation);
            
            showSaveConfirmation('academic-settings');
        });
    }
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
    const exportDataBtn = document.getElementById('export-data');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => {
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
    }
    
    // Import data
    const importFileEl = document.getElementById('import-file');
    if (importFileEl) {
        importFileEl.addEventListener('change', (event) => {
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
    }
    
    // Clear all data
    const clearDataBtn = document.getElementById('clear-data');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all saved data? This action cannot be undone.')) {
                localStorage.clear();
                alert('All data has been cleared. The page will now reload.');
                window.location.reload();
            }
        });
    }
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

/**
 * Set up email verification functionality
 */
function setupEmailVerification() {
    const verifyTokenBtn = document.getElementById('verify-token-btn');
    const resendVerificationBtn = document.getElementById('resend-verification-btn');
    const verificationToken = document.getElementById('verification-token');
    const statusMessageDiv = document.getElementById('verification-status-message');
    const verificationSection = document.getElementById('emailVerificationSection');
    
    // Check if user's email is already verified
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
        if (data && data.user && data.user.isEmailVerified) {
            // Email is already verified, hide or update section
            statusMessageDiv.textContent = 'Your email has already been verified!';
            statusMessageDiv.className = 'verification-status-success';
            verificationToken.disabled = true;
            verifyTokenBtn.disabled = true;
            resendVerificationBtn.disabled = true;
        } else {
            // Email needs verification
            statusMessageDiv.textContent = 'Please verify your email address to access all features.';
            statusMessageDiv.className = 'verification-status-warning';
        }
    })
    .catch(error => {
        console.error('Error checking verification status:', error);
    });
    
    // Handle token verification
    verifyTokenBtn.addEventListener('click', () => {
        const token = verificationToken.value.trim();
        
        if (!token) {
            statusMessageDiv.textContent = 'Please enter a verification token';
            statusMessageDiv.className = 'verification-status-error';
            return;
        }
        
        // Show processing state
        verifyTokenBtn.disabled = true;
        verifyTokenBtn.textContent = 'Verifying...';
        
        // Make API request to verify token
        fetch(`/api/auth/verify-email/${token}`, {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => {
            verifyTokenBtn.disabled = false;
            verifyTokenBtn.textContent = 'Verify Token';
            
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Failed to verify token');
                });
            }
            
            // Success
            statusMessageDiv.textContent = 'Email verified successfully!';
            statusMessageDiv.className = 'verification-status-success';
            verificationToken.disabled = true;
            verifyTokenBtn.disabled = true;
            resendVerificationBtn.disabled = true;
            
            // After success, reload user info to update verification status
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        })
        .catch(error => {
            statusMessageDiv.textContent = error.message || 'Failed to verify your email. Please try again.';
            statusMessageDiv.className = 'verification-status-error';
            console.error('Verification error:', error);
        });
    });
    
    // Handle resend verification
    resendVerificationBtn.addEventListener('click', () => {
        // Show processing state
        resendVerificationBtn.disabled = true;
        resendVerificationBtn.textContent = 'Sending...';
        
        // Make API request to resend verification email
        fetch('/api/auth/resend-verification', {
            method: 'POST',
            credentials: 'include'
        })
        .then(response => {
            resendVerificationBtn.disabled = false;
            resendVerificationBtn.textContent = 'Resend Verification Email';
            
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Failed to resend verification email');
                });
            }
            
            return response.json();
        })
        .then(data => {
            statusMessageDiv.textContent = 'Verification email sent! Please check your inbox.';
            statusMessageDiv.className = 'verification-status-success';
        })
        .catch(error => {
            statusMessageDiv.textContent = error.message || 'Failed to send verification email. Please try again.';
            statusMessageDiv.className = 'verification-status-error';
            console.error('Resend verification error:', error);
        });
    });
}
