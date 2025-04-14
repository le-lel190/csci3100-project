document.addEventListener('DOMContentLoaded', () => {
    // Initialize timetable
    createTimetableGrid();
    initializeSemesterButtons();
    initializeSearch();
    loadUserInfo();
    setupLogout();
    setupDemoButton();
    setupTimetableActions();

    // Get the active semester
    const activeSemester = document.querySelector('.semester-btn.active');
    const semester = activeSemester ? activeSemester.dataset.semester : 'current';
    
    // Check if we have a saved timetable
    const savedTimetable = localStorage.getItem(`timetable_${semester}`);
    
    if (savedTimetable) {
        try {
            console.log(`Found saved timetable for ${semester}`);
            // Load course data first to get all available courses
            loadCourseData(semester);
        } catch (e) {
            console.error('Error loading saved timetable:', e);
            loadCourseData(semester);
        }
    } else {
        // Load course data from external file instead of hardcoding
        loadCourseData(semester);
    }
});

/**
 * Creates the timetable grid structure
 */
function createTimetableGrid() {
    const timetableGrid = document.getElementById('timetable-grid');
    timetableGrid.innerHTML = ''; // Clear any existing content
    
    // Create time slots (from 8:30 AM to 10:30 PM)
    const startHour = 8;
    const startMinute = 30;
    const endHour = 22;
    const endMinute = 30;
    const interval = 60; // 1-hour intervals
    
    // Calculate total minutes for start and end
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;
    
    // Create a row for each time slot
    for (let time = startTimeMinutes; time < endTimeMinutes; time += interval) {
        // Calculate hours and minutes for current time
        const hours = Math.floor(time / 60);
        const minutes = time % 60;
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        // Create time label cell
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.textContent = formattedTime;
        timetableGrid.appendChild(timeLabel);
        
        // Create time slots for each day of the week
        for (let day = 0; day < 7; day++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.dataset.time = formattedTime;
            timeSlot.dataset.day = day;
            timetableGrid.appendChild(timeSlot);
        }
    }
}

/**
 * Setup semester button functionality
 */
function initializeSemesterButtons() {
    const buttons = document.querySelectorAll('.semester-btn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            
            // Load semester-specific courses
            const semester = button.dataset.semester || 'current';
            
            loadTimetableFromServer(semester);
        });
    });
}

/**
 * Initialize search functionality
 */
function initializeSearch() {
    const searchInput = document.getElementById('courseSearch');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        // Get all course items from both sections
        const allCourseItems = document.querySelectorAll('.course-item');
        
        allCourseItems.forEach(item => {
            const courseText = item.textContent.toLowerCase();
            const courseId = item.querySelector('input[type="checkbox"]')?.id;
            
            // Find the corresponding course data to check schedules for class codes
            const courseData = window.coursesData?.find(c => c.id === courseId);
            
            // Standard search - check if text content contains the search term
            let isMatch = courseText.includes(searchTerm);
            
            // Check if the search term is purely numeric (likely a class code)
            if (!isMatch && /^\d+$/.test(searchTerm)) {
                // Search through schedules for class code matches
                isMatch = courseData?.schedules?.some(schedule => {
                    if (schedule.type) {
                        // Extract class code from type (format: "Type (CODE)")
                        const codeMatch = schedule.type.match(/\((\d+)\)/);
                        if (codeMatch && codeMatch[1]) {
                            return codeMatch[1].includes(searchTerm);
                        }
                    }
                    return false;
                }) || false;
            }
            
            // If still no match and potential course code (contains letters and numbers)
            if (!isMatch && /[a-z]+[0-9]+/.test(searchTerm)) {
                // Try matching with spaces removed
                const courseTextNoSpaces = courseText.replace(/\s+/g, '');
                const searchTermNoSpaces = searchTerm.replace(/\s+/g, '');
                
                // Try also to match with a space between letters and numbers
                // e.g., if user types "csci3100", also try "csci 3100"
                const searchTermWithSpace = searchTerm.replace(/([a-z]+)([0-9]+)/i, '$1 $2');
                
                isMatch = courseTextNoSpaces.includes(searchTermNoSpaces) || 
                          courseText.includes(searchTermWithSpace);
            }
            
            item.style.display = isMatch ? 'block' : 'none';
        });
        
        // Show/hide section headers based on whether they have any visible courses
        updateCourseListHeaders();
    });
}

/**
 * Update course list headers visibility based on search results
 */
function updateCourseListHeaders() {
    const selectedCourseItems = document.querySelector('.selected-course-items');
    const courseItems = document.querySelector('.course-items');
    
    // Get all headers in the course list
    const courseListHeaders = document.querySelectorAll('.course-list h3');
    
    // Check if there are any visible courses in the selected section
    const hasVisibleSelectedCourses = Array.from(selectedCourseItems.querySelectorAll('.course-item'))
        .some(item => item.style.display !== 'none');
    
    // Check if there are any visible courses in the all courses section
    const hasVisibleCourses = Array.from(courseItems.querySelectorAll('.course-item'))
        .some(item => item.style.display !== 'none');
    
    // Update visibility of headers - first header is Selected Courses, second is All Courses
    courseListHeaders[0].style.display = hasVisibleSelectedCourses ? 'block' : 'none';
    courseListHeaders[1].style.display = hasVisibleCourses ? 'block' : 'none';
}

/**
 * Setup timetable action buttons (export, save, etc)
 */
function setupTimetableActions() {
    const saveBtn = document.getElementById('saveBtn');
    const exportBtn = document.getElementById('exportTimetableBtn');
    const saveImageBtn = document.getElementById('saveImageBtn');

    // Save button functionality
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveTimetableToServer();
        });
    }

    // Export timetable button
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportTimetableToCsv();
        });
    }

    // Save image button
    if (saveImageBtn) {
        saveImageBtn.addEventListener('click', () => {
            captureAndSaveTimetable();
        });
    }
}

/**
 * Save timetable data to the server
 */
function saveTimetableToServer() {
    const activeSemester = document.querySelector('.semester-btn.active');
    const semesterName = activeSemester ? activeSemester.dataset.semester : 'current';
    
    // Get selected courses only
    const selectedCourses = window.coursesData ? 
        window.coursesData.filter(course => course.selected).map(course => course.id) : [];
    
    // Prepare data to send to server
    const timetableData = {
        semester: semesterName,
        selectedCourses
    };

    // Send to server
    fetch('/api/timetable', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(timetableData),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to save timetable');
        return response.json();
    })
    .then(data => {
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.style.position = 'fixed';
        successMessage.style.top = '20px';
        successMessage.style.left = '50%';
        successMessage.style.transform = 'translateX(-50%)';
        successMessage.style.padding = '12px 24px';
        successMessage.style.backgroundColor = 'rgba(102, 51, 153, 0.9)';
        successMessage.style.color = 'white';
        successMessage.style.borderRadius = '4px';
        successMessage.style.zIndex = '9999';
        successMessage.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
        successMessage.textContent = 'Timetable saved successfully!';
        document.body.appendChild(successMessage);

        setTimeout(() => {
            document.body.removeChild(successMessage);
        }, 3000);
    })
    .catch(error => {
        console.error('Error saving timetable:', error);
        alert('Failed to save your timetable. Please try again.');
    });
}

/**
 * Load timetable from server
 */
function loadTimetableFromServer(semester) {
    const semesterName = semester || 'current';
    
    fetch(`/api/timetable/${semesterName}`, {
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 404) {
                return [];
            }
            throw new Error('Failed to load timetable');
        }
        return response.json();
    })
    .then(selectedCourseIds => {
        if (window.coursesData) {
            // Update course selection state
            window.coursesData.forEach(course => {
                course.selected = selectedCourseIds.includes(course.id);
            });
            
            // Update UI
            populateCourseList(window.coursesData);
            updateTimetableDisplay(window.coursesData);
        }
    })
    .catch(error => {
        console.error('Error loading timetable:', error);
    });
}

/**
 * Save tentative schedule modifications to localStorage
 */
function saveTentativeSchedules() {
    if (!window.coursesData) return;
    
    // Get current semester
    const activeSemester = document.querySelector('.semester-btn.active');
    const semesterName = activeSemester ? activeSemester.dataset.semester : 'current';
    
    // Filter courses with isPlaceholder flag
    const tentativeCourses = window.coursesData
        .filter(course => course.isPlaceholder || course.schedules?.some(s => s.type?.includes('Placeholder')))
        .map(course => ({
            id: course.id,
            schedules: course.schedules
        }));
    
    if (tentativeCourses.length > 0) {
        localStorage.setItem(`tentative_schedules_${semesterName}`, JSON.stringify(tentativeCourses));
    }
}

/**
 * Load saved tentative schedules from localStorage
 */
function loadTentativeSchedules(semester) {
    const semesterName = semester || 'current';
    const savedTentative = localStorage.getItem(`tentative_schedules_${semesterName}`);
    
    if (savedTentative && window.coursesData) {
        try {
            const tentativeCourses = JSON.parse(savedTentative);
            
            // Update course data with saved tentative schedules
            tentativeCourses.forEach(savedCourse => {
                const courseIndex = window.coursesData.findIndex(c => c.id === savedCourse.id);
                if (courseIndex >= 0) {
                    window.coursesData[courseIndex].schedules = savedCourse.schedules;
                }
            });
            
            console.log(`Loaded ${tentativeCourses.length} tentative course schedules from localStorage`);
        } catch (e) {
            console.error('Error loading tentative schedules:', e);
        }
    }
}

/**
 * Export timetable to CSV for Google Calendar import
 */
function exportTimetableToCsv() {
            const selectedCourses = window.coursesData ? window.coursesData.filter(course => course.selected) : [];
            if (!selectedCourses.length) {
                alert('No courses selected to export.');
                return;
            }

            // Google Calendar CSV format headers - must keep these exact headers for import compatibility
            // https://support.google.com/calendar/answer/37118?hl=en
            const headers = ['Subject', 'Start Date', 'Start Time', 'End Date', 'End Time', 'All Day', 'Description', 'Location'];
            const csvRows = [headers.join(',')];

            // Map day names to date format for Google Calendar
            const dayMap = {
                'Monday': 1, 'Mon': 1,
                'Tuesday': 2, 'Tue': 2,
                'Wednesday': 3, 'Wed': 3,
                'Thursday': 4, 'Thu': 4,
                'Friday': 5, 'Fri': 5,
                'Saturday': 6, 'Sat': 6,
                'Sunday': 0, 'Sun': 0
            };

            // Get current year for date calculations
            const currentYear = new Date().getFullYear();
            
            // Add each course schedule as a row
            selectedCourses.forEach(course => {
                // console.log(course);
                if (course.schedules && course.schedules.length > 0) {
                    course.schedules.forEach(schedule => {
                        // Extract simplified session type (lecture or tutorial only)
                        let sessionType = "";
                        if (schedule.type) {
                            if (schedule.type.toLowerCase().includes('lec')) {
                                sessionType = "Lecture";
                            } else if (schedule.type.toLowerCase().includes('tut')) {
                                sessionType = "Tutorial";
                            } else {
                                sessionType = schedule.type;
                            }
                        }
                        
                        // Create description with course name and type only
                        const description = `${course.name}, ${sessionType}`;
                        
                        if (schedule.meetingDates && schedule.meetingDates.length > 0) {
                            // Create a separate calendar entry for each meeting date
                            schedule.meetingDates.forEach(meetingDate => {
                                // Check if the meeting date is in a date range format (like "02/09/2024 - 25/11/2024")
                                if (meetingDate.includes('-') && meetingDate.includes('/')) {
                                    // For now, skip date ranges as we'd need to generate all dates in between
                                    return;
                                }
                                
                                // Parse the date - format is "DD/MM" (European style)
                                let parts = meetingDate.split('/').map(Number);
                                let day, month, year;
                                
                                // Determine academic year based on semester name
                                const activeSemester = document.querySelector('.semester-btn.active');
                                let academicYear = currentYear;
                                
                                if (activeSemester) {
                                    const semesterText = activeSemester.textContent || '';
                                    // Extract year from term like "2024-25 Term 2"
                                    const yearMatch = semesterText.match(/(\d{4})-(\d{2})/);
                                    if (yearMatch) {
                                        const termYear = parseInt(yearMatch[1]);
                                        // For Term 2, dates are likely in the second year (2025 for "2024-25 Term 2")
                                        if (semesterText.includes('Term 2')) {
                                            academicYear = termYear + 1;
                                        } else {
                                            academicYear = termYear;
                                        }
                                    }
                                }
                                
                                // For dates like "6/1", interpret as day=6, month=1 (January 6)
                                if (parts.length === 2) {
                                    // In our course data, the format seems to be "DD/MM"
                                    day = parts[0];
                                    month = parts[1];
                                    year = academicYear;
                                    
                                    // Check if the date makes more sense as MM/DD (American style)
                                    // If day > 12, it must be DD/MM
                                    // If month > 12, it must be MM/DD
                                    if (parts[0] > 12 && parts[1] <= 12) {
                                        // It's DD/MM
                                        day = parts[0];
                                        month = parts[1];
                                    } else if (parts[0] <= 12 && parts[1] > 12) {
                                        // It's MM/DD
                                        month = parts[0];
                                        day = parts[1];
                                    } else if (parts[0] <= 12 && parts[1] <= 12) {
                                        // Both could be valid, guess based on the term
                                        // For academic terms, typically Jan-Apr is Term 2, Sep-Dec is Term 1
                                        // Assume dates are in chronological order, so early months (1-4) are likely Term 2
                                        if (parts[1] >= 1 && parts[1] <= 4) {
                                            // This is likely day=parts[0], month=parts[1] (January-April)
                                            day = parts[0];
                                            month = parts[1];
                                        } else {
                                            // For months 5-12, we need more context
                                            // Let's assume it's still DD/MM format as it's more common in academic contexts
                                            day = parts[0];
                                            month = parts[1];
                                        }
                                    }
                                }
                                
                                // Create a date object for this meeting
                                // Note: month is 0-indexed in JavaScript Date
                                const classDate = new Date(year, month - 1, day);
                                
                                // Format the date as MM/DD/YYYY for Google Calendar
                                const formattedDate = `${(classDate.getMonth() + 1).toString().padStart(2, '0')}/${classDate.getDate().toString().padStart(2, '0')}/${classDate.getFullYear()}`;
                                
                                const row = [
                                    `"${course.id}"`, // Subject = Course Code
                                    `"${formattedDate}"`, // Start Date
                                    `"${schedule.start}"`, // Start Time
                                    `"${formattedDate}"`, // End Date
                                    `"${schedule.end}"`, // End Time
                                    '"False"', // All Day
                                    `"${description}"`, // Description = Course name, type
                                    `"${schedule.location}"` // Location = Venue
                                ];
                                csvRows.push(row.join(','));
                            });
                        } else {
                            // Fallback to calculating dates based on day of week (for backward compatibility)
                            // Get next Monday's date as a starting point for the academic week
                            const today = new Date();
                            const nextMonday = new Date();
                            nextMonday.setDate(today.getDate() + ((7 - today.getDay()) % 7) + 1);
                            
                            // Calculate the date for this class based on the day of week
                            const classDate = new Date(nextMonday);
                            const dayOffset = (dayMap[schedule.day] - 1 + 7) % 7;
                            classDate.setDate(classDate.getDate() + dayOffset);
                            
                            // Format the date as MM/DD/YYYY for Google Calendar
                            const formattedDate = `${(classDate.getMonth() + 1).toString().padStart(2, '0')}/${classDate.getDate().toString().padStart(2, '0')}/${classDate.getFullYear()}`;
                            
                            // Create a semester's worth of events (14 weeks is common for academic semesters)
                            for (let week = 0; week < 14; week++) {
                                const weekDate = new Date(classDate);
                                weekDate.setDate(classDate.getDate() + (week * 7));
                                
                                const weekFormattedDate = `${(weekDate.getMonth() + 1).toString().padStart(2, '0')}/${weekDate.getDate().toString().padStart(2, '0')}/${weekDate.getFullYear()}`;
                                
                                const row = [
                                    `"${course.id}"`, // Subject = Course Code
                                    `"${weekFormattedDate}"`, // Start Date
                                    `"${schedule.start}"`, // Start Time
                                    `"${weekFormattedDate}"`, // End Date
                                    `"${schedule.end}"`, // End Time
                                    '"False"', // All Day
                                    `"${description}"`, // Description = Course name, type
                                    `"${schedule.location}"` // Location = Venue
                                ];
                                csvRows.push(row.join(','));
                            }
                        }
                    });
                }
            });

            // Create CSV content
            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            const activeSemester = document.querySelector('.semester-btn.active');
            const semesterName = activeSemester ? activeSemester.textContent.replace(/\s+/g, '_') : 'timetable';
            downloadLink.download = `${semesterName}_google_calendar.csv`;
            downloadLink.click();
            URL.revokeObjectURL(downloadLink.href);
}

/**
 * Capture and save timetable as image
 */
function captureAndSaveTimetable() {
    // Show loading indicator
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'loading-indicator';
    loadingMessage.textContent = 'Generating timetable image...';
    document.body.appendChild(loadingMessage);

    // Get the timetable elements
    const timetableElement = document.querySelector('.timetable');
    const timetableGridContainer = document.querySelector('.timetable-grid-container');
    const timetableGrid = document.querySelector('.timetable-grid');
    
    // Store original styles
    const originalStyles = {
        body: {
            overflow: document.body.style.overflow
        },
        timetable: {
            height: timetableElement.style.height,
            overflow: timetableElement.style.overflow,
            minHeight: timetableElement.style.minHeight
        },
        gridContainer: {
            overflow: timetableGridContainer.style.overflow,
            height: timetableGridContainer.style.height,
            maxHeight: timetableGridContainer.style.maxHeight
        }
    };
    
    // Create a clone of the timetable for capturing
    const timetableClone = timetableElement.cloneNode(true);
    timetableClone.id = 'timetable-clone';
    timetableClone.style.position = 'absolute';
    timetableClone.style.left = '-9999px';
    timetableClone.style.top = '0';
    timetableClone.style.width = timetableGrid.scrollWidth + 'px';
    timetableClone.style.height = 'auto';
    timetableClone.style.overflow = 'visible';
    timetableClone.style.minHeight = 'auto';
    timetableClone.style.transform = 'none';
    timetableClone.style.zIndex = '-9999';
    
    // Adjust clone's grid container to show everything
    const gridContainerClone = timetableClone.querySelector('.timetable-grid-container');
    if (gridContainerClone) {
        gridContainerClone.style.overflow = 'visible';
        gridContainerClone.style.height = 'auto';
        gridContainerClone.style.maxHeight = 'none';
    }
    
    // Adjust clone's grid to show everything
    const gridClone = timetableClone.querySelector('.timetable-grid');
    if (gridClone) {
        gridClone.style.height = 'auto';
    }
    
    // Add the clone to the body
    document.body.appendChild(timetableClone);
    
    // Use html2canvas on the clone with proper settings
    html2canvas(timetableClone, {
        scale: 2, // Higher resolution for better quality
        useCORS: true, // Handle cross-origin resources
        allowTaint: true, // Allow tainted canvas
        backgroundColor: '#ffffff', // Ensure white background
        width: timetableGrid.scrollWidth, // Capture full width
        height: timetableClone.scrollHeight, // Capture full height
        scrollX: 0,
        scrollY: 0,
        windowWidth: timetableGrid.scrollWidth,
        windowHeight: timetableClone.scrollHeight,
        logging: true, // Enable logging for debugging
        onclone: (clonedDoc) => {
            // Further adjustments to the clone if needed
            const finalClone = clonedDoc.getElementById('timetable-clone');
            if (finalClone) {
                const containers = finalClone.querySelectorAll('.timetable-grid-container, .timetable-grid');
                containers.forEach(container => {
                    container.style.overflow = 'visible';
                    container.style.height = 'auto';
                    container.style.maxHeight = 'none';
                });
            }
        }
    }).then(canvas => {
        // Convert canvas to data URL
        const imgData = canvas.toDataURL('image/png');
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = imgData;
        
        // Get the active semester name for the filename
        const activeSemester = document.querySelector('.semester-btn.active');
        const semesterName = activeSemester ? activeSemester.textContent.replace(/\s+/g, '_') : 'timetable';
        
        // Use semester name in the filename
        downloadLink.download = `${semesterName}_timetable.png`;
        
        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Remove the clone
        document.body.removeChild(timetableClone);
        
        // Remove loading indicator
        document.body.removeChild(loadingMessage);
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.style.position = 'fixed';
        successMessage.style.top = '20px';
        successMessage.style.left = '50%';
        successMessage.style.transform = 'translateX(-50%)';
        successMessage.style.padding = '12px 24px';
        successMessage.style.backgroundColor = 'rgba(102, 51, 153, 0.9)';
        successMessage.style.color = 'white';
        successMessage.style.borderRadius = '4px';
        successMessage.style.zIndex = '9999';
        successMessage.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
        successMessage.textContent = 'Timetable image saved successfully!';
        document.body.appendChild(successMessage);
        
        // Remove success message after 3 seconds
        setTimeout(() => {
            document.body.removeChild(successMessage);
        }, 3000);
    }).catch(error => {
        console.error('Error generating timetable image:', error);
        
        // Remove the clone
        if (document.getElementById('timetable-clone')) {
            document.body.removeChild(timetableClone);
        }
        
        // Remove loading indicator
        document.body.removeChild(loadingMessage);
        
        // Show error message
        alert('Failed to generate timetable image. Please try again.');
    });
}

/**
 * Setup demo button functionality
 */
function setupDemoButton() {
    const demoButton = document.getElementById('loadDemoButton');
    if (demoButton) {
        demoButton.addEventListener('click', () => {
            // Show loading text on the button
            demoButton.textContent = 'Loading Demo...';
            demoButton.disabled = true;
            
            // Reset semester buttons
            const semesterButtons = document.querySelectorAll('.semester-btn');
            semesterButtons.forEach(btn => btn.classList.remove('active'));
            semesterButtons[0].classList.add('active');
            
            // Load demo data
            loadDemoDataFromAPI()
                .finally(() => {
                    // Reset button text and enable it
                    demoButton.textContent = 'Load Demo Data';
                    demoButton.disabled = false;
                });
        });
    }
}

/**
 * Load user information
 */
function loadUserInfo() {
    fetch('/api/auth/login', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.user) {
            document.getElementById('userUsername').textContent = data.user.username;
        }
    })
    .catch(error => {
        console.error('Error loading user info:', error);
        window.location.href = '/';
    });
}

/**
 * Setup logout button
 */
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Logout failed:', error);
        }
    });
}

/**
 * Load course data for a specific semester
 */
function loadCourseData(semester = 'current') {
    // Show loading indicator
    const courseItems = document.querySelector('.course-items');
    courseItems.innerHTML = '<div class="loading-indicator">Loading courses...</div>';
    
    // First check if the course-data directory exists and is accessible
    fetch('/api/courses/check')
        .then(response => response.json())
        .then(data => {
            console.log('Course data directory check:', data);
            
            if (!data.exists) {
                // If directory doesn't exist, try to load demo data directly
                return loadDemoDataFromAPI();
            }
            
            // Directory exists, try to load semester data
            return loadSemesterData(semester);
        })
        .catch(error => {
            console.error('Error checking course data directory:', error);
            loadDemoDataFromAPI();
        });
}

/**
 * Load semester-specific course data
 */
function loadSemesterData(semester) {
    // Fetch course data from the server
    return fetch(`/api/courses/${semester}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${semester} semester data (${response.status}: ${response.statusText})`);
            }
            return response.json();
        })
        .then(courses => {
            // Process courses to extract class codes from section key
            courses.forEach(course => {
                if (course.schedules) {
                    course.schedules.forEach(schedule => {
                        // Check if the schedules were parsed from JSON with class codes in the type
                        // Usually in format like "--LEC (8137)"
                        if (!schedule.type && schedule.originalKey) {
                            schedule.type = schedule.originalKey;
                        }
                    });
                }
            });
            
            // Store courses globally for filtering
            window.coursesData = courses;
            
            // Load any saved tentative schedules from localStorage
            loadTentativeSchedules(semester);
            
            // Populate course list
            populateCourseList(courses);
            
            // Display selected courses on the timetable
            updateTimetableDisplay(courses);
        })
        .catch(error => {
            console.error('Error loading semester course data:', error);
            const courseItems = document.querySelector('.course-items');
            courseItems.innerHTML = `<div class="error-message">
                Failed to load ${semester} semester data: ${error.message}
                <button id="loadDemoData">Load Demo Data</button>
            </div>`;
            
            // Add event listener to load demo data
            document.getElementById('loadDemoData').addEventListener('click', () => {
                loadDemoDataFromAPI();
            });
        });
}

/**
 * Load demo data from the API
 */
function loadDemoDataFromAPI() {
    console.log('Loading demo data from API');
    return fetch('/api/courses/demo')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load demo data');
            }
            return response.json();
        })
        .then(courses => {
            // Process courses to ensure class codes are preserved
            courses.forEach(course => {
                if (course.schedules) {
                    course.schedules.forEach(schedule => {
                        // Check if the schedules were parsed from JSON with class codes in the type
                        if (!schedule.type && schedule.originalKey) {
                            schedule.type = schedule.originalKey;
                        }
                    });
                }
            });
            
            // Store courses globally for filtering
            window.coursesData = courses;
            
            // Populate course list
            populateCourseList(courses);
            
            // Display selected courses on the timetable
            updateTimetableDisplay(courses);
        })
        .catch(error => {
            console.error('Error loading demo data from API:', error);
        });
}

/**
 * Populate the course list sidebar with course items
 */
function populateCourseList(courses) {
    const courseItems = document.querySelector('.course-items');
    const selectedCourseItems = document.querySelector('.selected-course-items');
    
    // Clear both sections
    courseItems.innerHTML = '';
    selectedCourseItems.innerHTML = '';
    
    // Separate courses into selected and unselected
    const selectedCourses = courses.filter(course => course.selected);
    const unselectedCourses = courses.filter(course => !course.selected);

    // Helper function to create course items
    const createCourseItem = (course) => {
        const courseItem = document.createElement('div');
        courseItem.className = 'course-item';
        
        // Add a placeholder indicator if this course has placeholder schedules
        if (course.isPlaceholder) {
            courseItem.classList.add('placeholder-course');
        }
        
        // Check if the course has multiple lecture or tutorial sections
        const hasMultipleSections = checkForMultipleSections(course);
        
        // Create checkbox inside a label
        const checkboxLabel = document.createElement('label');
        checkboxLabel.className = 'course-checkbox-label';
        checkboxLabel.htmlFor = course.id;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = course.id;
        checkbox.checked = course.selected || false;
        
        const courseInfo = document.createElement('div');
        courseInfo.className = 'course-info';
        
        // Ensure course ID is displayed without extra spacing
        const courseId = document.createElement('div');
        courseId.className = 'course-id';
        courseId.textContent = course.id;
        
        const courseName = document.createElement('div');
        courseName.className = 'course-name';
        courseName.textContent = course.name;
        
        courseInfo.appendChild(courseId);
        courseInfo.appendChild(courseName);
        
        // Extract and display class codes
        if (course.schedules && course.schedules.length > 0) {
            const classCodes = new Set();
            course.schedules.forEach(schedule => {
                if (schedule.type) {
                    const codeMatch = schedule.type.match(/\((\d+)\)/);
                    if (codeMatch && codeMatch[1]) {
                        classCodes.add(codeMatch[1]);
                    }
                }
            });
            
            // if (classCodes.size > 0) {
            //     const classCodeElement = document.createElement('div');
            //     // classCodeElement.className = 'course-class-code';
            //     // classCodeElement.textContent = `Class Code: ${Array.from(classCodes).join(', ')}`;
            //     courseInfo.appendChild(classCodeElement);
            // }
        }
        
        if (course.isPlaceholder) {
            const placeholderIndicator = document.createElement('div');
            placeholderIndicator.className = 'placeholder-indicator';
            placeholderIndicator.textContent = '(Schedule TBA)';
            courseInfo.appendChild(placeholderIndicator);
        }
        
        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(courseInfo);
        courseItem.appendChild(checkboxLabel);
        
        let sectionSelectors = '';
        if (hasMultipleSections) {
            sectionSelectors = generateSectionSelectors(course);
            const sectionSelectorsDiv = document.createElement('div');
            sectionSelectorsDiv.className = 'section-selectors';
            sectionSelectorsDiv.innerHTML = sectionSelectors;
            courseItem.appendChild(sectionSelectorsDiv);
        }
        
        // Add event listeners for section selectors if they exist
        if (hasMultipleSections) {
            addSectionSelectorEventListeners(courseItem, course);
        }
        
        // Add hover event to show course details
        courseItem.addEventListener('mouseenter', () => {
            showCourseDetails(course);
            
            // Preview this course on the timetable if not already selected
            if (!course.selected) {
                previewCourseOnTimetable(course);
            }
        });
        
        // Remove preview when mouse leaves
        courseItem.addEventListener('mouseleave', () => {
            // If the course is not selected, remove it from preview
            if (!course.selected) {
                removePreviewFromTimetable();
                // Restore the timetable with only selected courses
                updateTimetableDisplay(courses);
            }
        });
        
        // Add course selection handler - this handles conflict checking
        handleCourseSelection(checkbox, course);
        
        return courseItem;
    };

    // Populate selected courses
    selectedCourses.forEach(course => {
        const courseItem = createCourseItem(course);
        selectedCourseItems.appendChild(courseItem);
    });
    
    // Populate unselected courses
    unselectedCourses.forEach(course => {
        const courseItem = createCourseItem(course);
        courseItems.appendChild(courseItem);
    });
    
    // Show/hide the "Selected Courses" header based on whether there are any selected courses
    const courseListHeaders = document.querySelectorAll('.course-list h3');
    courseListHeaders[0].style.display = selectedCourses.length > 0 ? 'block' : 'none';
}

/**
 * Check if a course has multiple sections for the same type (lecture, tutorial, etc.)
 */
function checkForMultipleSections(course) {
    // Normalize section types to group lectures and tutorials
    const sectionTypes = {};
    
    if (!course.schedules || course.schedules.length === 0) {
        return false;
    }
    
    for (const schedule of course.schedules) {
        // Normalize type to basic categories (Lecture, Tutorial)
        const baseType = normalizeSessionType(schedule.type);
        
        if (!sectionTypes[baseType]) {
            sectionTypes[baseType] = new Set();
        }
        
        // Extract the section identifier (A, B, AT01, BT01, etc.)
        const sectionId = extractSectionId(schedule.type);
        if (sectionId) {
            sectionTypes[baseType].add(sectionId);
        }
    }
    
    // Return true if any type has more than 1 section
    return Object.values(sectionTypes).some(sections => sections.size > 1);
}

/**
 * Normalize session type to basic categories (Lecture, Tutorial)
 */
function normalizeSessionType(type) {
    if (type.toLowerCase().includes('lec')) {
        return 'Lecture';
    } else if (type.toLowerCase().includes('tut')) {
        return 'Tutorial';
    }
    return type; // Return original for other types
}

/**
 * Extract section identifier from type string
 */
function extractSectionId(type) {
    // Extract section identifier like A, B, AT01, BT01
    const lecMatch = type.match(/([A-Z])-?LEC/i);
    if (lecMatch) return lecMatch[1];
    
    const tutMatch = type.match(/([A-Z]T\d+)-?TUT/i);
    if (tutMatch) return tutMatch[1];
    
    // Try to match other common tutorial patterns like T01, T02
    const simpleTutMatch = type.match(/T(\d+)/i);
    if (simpleTutMatch) return simpleTutMatch[0];
    
    return null;
}

/**
 * Group schedules by section
 */
function groupSchedulesBySection(course) {
    // First, normalize all schedules by section
    const sections = {};
    
    course.schedules.forEach((schedule, index) => {
        const baseType = normalizeSessionType(schedule.type);
        let sectionId = extractSectionId(schedule.type);
        
        // If no section ID found but it's a tutorial, use day+time+location as a section identifier
        if (!sectionId && baseType === 'Tutorial') {
            sectionId = `${schedule.day}-${schedule.start}-${schedule.location.substring(0, 10)}`;
        }
        
        // Create a key that combines base type and section ID
        const sectionKey = `${baseType}-${sectionId || 'Default'}`;
        
        if (!sections[sectionKey]) {
            sections[sectionKey] = {
                type: baseType,
                sectionId: sectionId || 'Default',
                schedules: [],
                baseType
            };
        }
        
        // Add this schedule to the section with its index
        sections[sectionKey].schedules.push({...schedule, index});
    });
    
    return sections;
}

/**
 * Generate HTML for section selection dropdowns
 */
function generateSectionSelectors(course) {
    // Group schedules by section
    const sections = groupSchedulesBySection(course);
    
    // Group sections by base type (Lecture, Tutorial)
    const sectionsByType = {};
    Object.values(sections).forEach(section => {
        if (!sectionsByType[section.baseType]) {
            sectionsByType[section.baseType] = [];
        }
        sectionsByType[section.baseType].push(section);
    });
    
    // Only create selectors for types with multiple options
    let selectorHTML = '';
    
    for (const [baseType, typeSections] of Object.entries(sectionsByType)) {
        if (typeSections.length > 1) {
            selectorHTML += `
                <div class="section-selector">
                    <div class="section-label">${baseType}:</div>
                    <select class="section-dropdown" data-type="${baseType}">
            `;
            
            // If no section is selected yet, select the first one by default
            if (!course.selectedSections) {
                course.selectedSections = {};
            }
            
            // Default selection
            if (!course.selectedSections[baseType]) {
                course.selectedSections[baseType] = typeSections[0].sectionId;
            }
            
            typeSections.forEach(section => {
                const isSelected = course.selectedSections[baseType] === section.sectionId;
                
                // Generate a display name for this section
                const displayTimes = section.schedules.map(s => 
                    `${s.day} ${s.start}-${s.end}`
                ).join(', ');
                
                const location = section.schedules[0].location;
                
                selectorHTML += `
                    <option value="${section.sectionId}" ${isSelected ? 'selected' : ''}>
                        Section ${section.sectionId}: ${displayTimes} (${location})
                    </option>
                `;
            });
            
            selectorHTML += `
                    </select>
        </div>
    `;
        }
    }
    
    return selectorHTML;
}

/**
 * Add event listeners for section selector dropdowns
 */
function addSectionSelectorEventListeners(courseItem, course) {
    const selectors = courseItem.querySelectorAll('.section-dropdown');
    
    selectors.forEach(selector => {
        selector.addEventListener('change', (e) => {
            const baseType = e.target.dataset.type;
            const selectedSectionId = e.target.value;
            
            // Update the selected section for this type
            if (!course.selectedSections) {
                course.selectedSections = {};
            }
            
            course.selectedSections[baseType] = selectedSectionId;
            
            // Update the display if the course is currently selected
            if (course.selected) {
                updateTimetableDisplay(window.coursesData);
            }
        });
    });
}

/**
 * Update timetable display with selected courses
 */
function updateTimetableDisplay(courses) {
    // Store courses globally for filtering
    window.coursesData = courses;
    
    // Clear existing course events
    clearTimetable();
    
    // Only display selected courses
    const selectedCourses = courses.filter(course => course.selected);
    displayCoursesOnTimetable(selectedCourses);
}

/**
 * Clear all course events from the timetable
 */
function clearTimetable() {
    const courseEvents = document.querySelectorAll('.course-event');
    courseEvents.forEach(event => event.remove());
}

/**
 * Display courses on the timetable
 */
function displayCoursesOnTimetable(courses) {
    const timetableGrid = document.getElementById('timetable-grid');
    const startHour = 8;
    const startMinute = 30;
    
    // Create a mapping for days to indices
    const dayMap = {
        'Monday': 0, 'Mon': 0, 
        'Tuesday': 1, 'Tue': 1, 
        'Wednesday': 2, 'Wed': 2, 
        'Thursday': 3, 'Thu': 3, 
        'Friday': 4, 'Fri': 4, 
        'Saturday': 5, 'Sat': 5, 
        'Sunday': 6, 'Sun': 6
    };

    // Sort courses by start time to display earlier classes first
    const sortedCourses = [...courses].sort((a, b) => {
        if (!a.schedules || !a.schedules.length) return 1;
        if (!b.schedules || !b.schedules.length) return -1;
        
        const aStartTime = Math.min(...a.schedules.map(s => timeToMinutes(s.start)));
        const bStartTime = Math.min(...b.schedules.map(s => timeToMinutes(s.start)));
        return aStartTime - bStartTime;
    });

    sortedCourses.forEach(course => {
        // Skip if no schedules or not selected (unless it's a preview)
        if (!course.schedules || course.schedules.length === 0) return;
        if (!course.selected && !course.isPreview) return;
        
        // Determine which schedules to display
        let schedulesToDisplay = [];
        
        // If we have section selections, use those
        if (course.selectedSections) {
            const sections = groupSchedulesBySection(course);
            
            // For each type, add only the schedules from the selected section
            for (const [sectionKey, section] of Object.entries(sections)) {
                const baseType = section.baseType;
                const sectionId = section.sectionId;
                
                // If this is the selected section for this type, or if there's only one section of this type
                if (sectionId === course.selectedSections[baseType] || 
                    !course.selectedSections[baseType]) {
                    schedulesToDisplay = schedulesToDisplay.concat(section.schedules);
                }
            }
        } else {
            // No selections, display all schedules
            schedulesToDisplay = course.schedules.map((schedule, index) => ({...schedule, index}));
        }
        
        // Sort schedules to ensure earlier ones render first
        const sortedSchedules = [...schedulesToDisplay].sort((a, b) => {
            return timeToMinutes(a.start) - timeToMinutes(b.start);
        });
        
        // Process each schedule
        sortedSchedules.forEach(schedule => {
            const dayIndex = dayMap[schedule.day];
            
            // Calculate start and end times in minutes
            const startTimeMinutes = timeToMinutes(schedule.start);
            const endTimeMinutes = timeToMinutes(schedule.end);
            
            // Find the appropriate time slot
            const startMinute = startTimeMinutes % 60;
            
            // Calculate position and height for the course event
            const timeSlots = document.querySelectorAll(`.time-slot[data-day="${dayIndex}"]`);
            
            // Find the starting time slot
            let startSlot;
            for (const slot of timeSlots) {
                const slotTime = slot.dataset.time;
                const [slotHour, slotMinute] = slotTime.split(':').map(Number);
                const slotTimeMinutes = slotHour * 60 + slotMinute;
                
                // Find the closest time slot
                if (slotTimeMinutes <= startTimeMinutes && (!startSlot || slotTimeMinutes > timeToMinutes(startSlot.dataset.time))) {
                    startSlot = slot;
                }
            }
            
            if (!startSlot) return; // Skip if no suitable slot found
            
            // Calculate the height based on duration
            const durationMinutes = endTimeMinutes - startTimeMinutes;
            const hourHeight = 8; // Height of one hour in rem (matching the CSS)
            const heightPercentage = (durationMinutes / 60) * 100; // Height as percentage of hour slot
            
            // Create course event element
            const courseEvent = document.createElement('div');
            courseEvent.className = 'course-event';
            courseEvent.dataset.courseId = course.id;
            
            if (course.isPlaceholder || schedule.type?.includes('Placeholder')) {
                courseEvent.classList.add('placeholder-event');
                
                // Add a data attribute to track if this is a tentative course
                courseEvent.dataset.tentative = 'true';
                courseEvent.dataset.scheduleIndex = schedule.index;
            }
            
            // Add preview class if this is a preview course
            if (course.isPreview) {
                courseEvent.classList.add('preview-event');
            }
            
            // Add conflict class if this schedule has a conflict
            if (course.hasConflicts && schedule.hasConflict) {
                courseEvent.classList.add('conflict-event');
            }
            
            // Set style for positioning
            courseEvent.style.backgroundColor = course.color || getRandomColor(course.id);
            courseEvent.style.top = `${(startMinute / 60) * 100}%`;
            
            // Calculate absolute height if the course spans multiple hours
            if (durationMinutes > 60) {
                const totalRems = (durationMinutes / 60) * hourHeight;
                courseEvent.style.height = `${totalRems}rem`;
            } else {
                courseEvent.style.height = `${heightPercentage}%`;
            }
            
            // Get the formatted type (keeping the original format with class code)
            const formattedType = schedule.type || '';
            
            // Add content
            courseEvent.innerHTML = `
                <div class="course-event-title">${course.id}</div>
                <div class="course-event-type section-type-code">${formattedType}</div>
                <div class="course-event-time">${schedule.start} - ${schedule.end}</div>
                <div class="course-event-location">${schedule.location || 'TBA'}</div>
                ${(course.isPlaceholder || schedule.type?.includes('Placeholder')) ? 
                    '<button class="edit-tentative-btn"><i class="fas fa-edit"></i></button>' : 
                    ''}
            `;
            
            // Add hover effect for details
            courseEvent.addEventListener('mouseenter', () => {
                // Highlight this course in the course list
                highlightCourseInList(course.id);
                
                // Show detailed info
                showCourseScheduleDetails(course, schedule);
            });
            
            // Add edit functionality for tentative courses
            if (course.isPlaceholder || schedule.type?.includes('Placeholder')) {
                const editBtn = courseEvent.querySelector('.edit-tentative-btn');
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showTentativeEditPopup(course, schedule, courseEvent);
                });
            }
            
            // Add to the time slot
            startSlot.appendChild(courseEvent);
        });
    });
}

/**
 * Generate a random color based on course ID for consistent coloring
 */
function getRandomColor(courseId) {
    // Simple hash function to generate a consistent color for a course ID
    let hash = 0;
    for (let i = 0; i < courseId.length; i++) {
        hash = courseId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate HSL color with good saturation and lightness
    const h = hash % 360;
    const s = 70 + (hash % 20); // 70-90%
    const l = 80 + (hash % 15); // 80-95%
    
    return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Highlight a course in the course list
 */
function highlightCourseInList(courseId) {
    // Look in both selected and unselected course lists
    const allCourseItems = document.querySelectorAll('.course-item');
    
    allCourseItems.forEach(item => {
        const itemCheckbox = item.querySelector('input[type="checkbox"]');
        if (itemCheckbox && itemCheckbox.id === courseId) {
            item.classList.add('highlighted');
        } else {
            item.classList.remove('highlighted');
        }
    });
}

/**
 * Show course details in the details panel
 */
function showCourseDetails(course) {
    const detailsContent = document.querySelector('.details-content');
    
    // Group schedules by section
    const sections = groupSchedulesBySection(course);
    
    // Group sections by base type (Lecture, Tutorial)
    const sectionsByType = {};
    Object.values(sections).forEach(section => {
        if (!sectionsByType[section.baseType]) {
            sectionsByType[section.baseType] = [];
        }
        sectionsByType[section.baseType].push(section);
    });
    
    // Generate HTML for each schedule group
    let schedulesHTML = '';
    Object.entries(sectionsByType).forEach(([baseType, typeSections]) => {
        schedulesHTML += `<div class="schedule-item">`;
        
        // Check if this type has multiple sections
        const hasMultipleSections = typeSections.length > 1;
        
        typeSections.forEach(section => {
            // Determine if this section is selected
            let isSelected = !hasMultipleSections; // If only one section, it's always selected
            
            // For multiple sections, check if it's the selected one
            if (hasMultipleSections && course.selectedSections && 
                course.selectedSections[baseType] === section.sectionId) {
                isSelected = true;
            }
            
            // Add a selected indicator for the current selection
            const selectedClass = isSelected ? 'selected-section' : '';
            const selectedIndicator = isSelected && hasMultipleSections ? 
                '<span class="selected-indicator">Selected</span>' : '';
            
            // Extract class code for this section
            let classCode = '';
            if (section.schedules[0] && section.schedules[0].type) {
                const codeMatch = section.schedules[0].type.match(/\((\d+)\)/);
                if (codeMatch) {
                    classCode = section.schedules[0].type;
                }
            }
            
            // Show type with class code in the heading
            schedulesHTML += `<strong class="section-type-code">${classCode || baseType}</strong>`;
            
            // Section header with id and class code
            schedulesHTML += `
                <div class="schedule-detail ${selectedClass}">
                    <div class="section-header">Section ${section.sectionId} ${selectedIndicator}</div>`;
            
            // Display all the sessions for this section
            section.schedules.forEach(schedule => {
                schedulesHTML += `
                    <p>${schedule.day} ${schedule.start} - ${schedule.end}</p>`;
            });
            
            // Display the location (usually the same for all sessions in a section)
            schedulesHTML += `
                    <div class="location">${section.schedules[0].location || 'Location TBA'}</div>
                </div>`;
        });
        
        schedulesHTML += `</div>`;
    });
    
    // Display placeholder warning if applicable
    const placeholderWarning = course.isPlaceholder ? 
        '<p class="placeholder-warning">Note: Schedule information is not yet available. Times shown are placeholders.</p>' : '';
    
    detailsContent.innerHTML = `
        <h4>${course.id}</h4>
        <p class="course-name-details">${course.name}</p>
        ${placeholderWarning}
        <div class="course-schedule">
            <h3>Schedule Details</h3>
            ${schedulesHTML}
        </div>
    `;
}

/**
 * Show specific schedule details in the details panel
 */
function showCourseScheduleDetails(course, schedule) {
    const detailsContent = document.querySelector('.details-content');
    
    // Get the original class type and format
    const classType = schedule.type || '';
    
    // Find all sessions that belong to this section
    const baseType = normalizeSessionType(schedule.type);
    const sectionId = extractSectionId(schedule.type) || '';
    let allSessions = [];
    const sections = groupSchedulesBySection(course);
    
    // Find the matching section
    for (const [key, section] of Object.entries(sections)) {
        if (section.baseType === baseType && section.sectionId === sectionId) {
            allSessions = section.schedules;
            break;
        }
    }
    
    // Generate session list HTML
    let sessionsHTML = '';
    if (allSessions.length > 1) {
        sessionsHTML = '<div class="all-sessions">';
        sessionsHTML += '<p class="sessions-header">All sessions for this section:</p>';
        
        allSessions.forEach(s => {
            sessionsHTML += `
                <p class="session-item">• ${s.day} ${s.start} - ${s.end}</p>
            `;
        });
        
        sessionsHTML += '</div>';
    }
    
    // Generate course instructor and term information if available
    const instructorInfo = schedule.instructor ? 
        `<p class="instructor"><strong>Instructor:</strong> ${schedule.instructor}</p>` : '';
    
    const termInfo = schedule.term ? 
        `<p class="term"><strong>Term:</strong> ${schedule.term}</p>` : '';
    
    // Display placeholder warning if applicable
    const placeholderWarning = course.isPlaceholder || schedule.type?.includes('Placeholder') ? 
        '<p class="placeholder-warning">Note: Schedule information is not yet finalized. Times shown are tentative.</p>' : '';
    
    detailsContent.innerHTML = `
        <h4>${course.id}</h4>
        <p class="course-name-details">${course.name}</p>
        ${placeholderWarning}
        <div class="course-schedule">
            <h3>Schedule Details</h3>
            <div class="schedule-item">
                <strong class="section-type-code">${classType}</strong>
                <div class="schedule-detail selected-section">
                    <div class="section-header">Selected Session</div>
                    <p>${schedule.day} ${schedule.start} - ${schedule.end}</p>
                    <div class="location">${schedule.location || 'Location TBA'}</div>
                    ${instructorInfo}
                    ${termInfo}
                    ${allSessions.length > 1 ? sessionsHTML : ''}
        </div>
            </div>
        </div>
    `;
}

/**
 * Check if two schedules conflict with each other
 * @param {Object} schedule1 - First schedule to check
 * @param {Object} schedule2 - Second schedule to check
 * @returns {Boolean} - True if there's a conflict
 */
function schedulesConflict(schedule1, schedule2) {
    // Check if schedules are on the same day
    if (schedule1.day !== schedule2.day) {
        return false;
    }
    
    // Convert times to minutes for easier comparison
    const start1 = timeToMinutes(schedule1.start);
    const end1 = timeToMinutes(schedule1.end);
    const start2 = timeToMinutes(schedule2.start);
    const end2 = timeToMinutes(schedule2.end);
    
    // Check if times overlap
    return (start1 < end2 && start2 < end1);
}

/**
 * Find all schedule conflicts between a course and existing selected courses
 * @param {Object} courseToCheck - The course to check for conflicts
 * @param {Array} existingCourses - Array of existing courses to check against
 * @returns {Array} - Array of conflict objects with details
 */
function findScheduleConflicts(courseToCheck, existingCourses) {
    const conflicts = [];
    
    // Get only the relevant schedules for the course to check (different sections for tut/lec)
    let schedulesToCheck = [];
    
    // If we have section selections, use only those schedules
    if (courseToCheck.selectedSections) {
        const sections = groupSchedulesBySection(courseToCheck);
        
        // For each type, add only the schedules from the selected section
        for (const [sectionKey, section] of Object.entries(sections)) {
            const baseType = section.baseType;
            const sectionId = section.sectionId;
            
            // If this is the selected section for this type, or if there's only one section of this type
            if (sectionId === courseToCheck.selectedSections[baseType] || 
                !courseToCheck.selectedSections[baseType]) {
                schedulesToCheck = schedulesToCheck.concat(section.schedules);
            }
        }
    } else {
        // No selections, use all schedules
        schedulesToCheck = courseToCheck.schedules || [];
    }
    
    // Loop through existing courses
    for (const existingCourse of existingCourses) {
        // Skip if it's the same course or not selected
        if (existingCourse.id === courseToCheck.id || !existingCourse.selected) {
            continue;
        }
        
        // Get only the relevant schedules for the existing course
        let existingSchedules = [];
        
        // If we have section selections, use only those schedules
        if (existingCourse.selectedSections) {
            const sections = groupSchedulesBySection(existingCourse);
            
            // For each type, add only the schedules from the selected section
            for (const [sectionKey, section] of Object.entries(sections)) {
                const baseType = section.baseType;
                const sectionId = section.sectionId;
                
                // If this is the selected section for this type, or if there's only one section of this type
                if (sectionId === existingCourse.selectedSections[baseType] || 
                    !existingCourse.selectedSections[baseType]) {
                    existingSchedules = existingSchedules.concat(section.schedules);
                }
            }
        } else {
            // No selections, use all schedules
            existingSchedules = existingCourse.schedules || [];
        }
        
        // Check each schedule combination for conflicts
        for (const schedule1 of schedulesToCheck) {
            for (const schedule2 of existingSchedules) {
                if (schedulesConflict(schedule1, schedule2)) {
                    conflicts.push({
                        course1: courseToCheck,
                        course2: existingCourse,
                        schedule1: schedule1,
                        schedule2: schedule2
                    });
                }
            }
        }
    }
    
    return conflicts;
}

/**
 * Show a conflict popup message that fades out after a few seconds
 * @param {Array} conflicts - Array of conflicts to display
 */
function showConflictPopup(conflicts) {
    // Create popup element if it doesn't exist
    let popup = document.getElementById('conflict-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'conflict-popup';
        document.body.appendChild(popup);
    }
    
    // Generate message for all conflicts
    let message = '<strong>Course Conflicts Detected:</strong><br>';
    const uniqueConflicts = new Set();
    
    conflicts.forEach(conflict => {
        const conflictText = `${conflict.course1.id} conflicts with ${conflict.course2.id}`;
        if (!uniqueConflicts.has(conflictText)) {
            uniqueConflicts.add(conflictText);
            message += `• ${conflictText}<br>`;
        }
    });
    
    // Set popup content and show it
    popup.innerHTML = message;
    popup.classList.add('active');
    
    // Automatically hide after 3 seconds
    setTimeout(() => {
        popup.classList.remove('active');
    }, 3000);
}

/**
 * Preview a course on the timetable without selecting it
 */
function previewCourseOnTimetable(course) {
    // Save current timetable state
    const previewedCourse = { ...course };
    
    // Mark as preview for styling
    previewedCourse.isPreview = true;
    
    // Clear existing preview if any
    removePreviewFromTimetable();
    
    // Check for conflicts with existing courses
    const conflicts = findScheduleConflicts(previewedCourse, window.coursesData.filter(c => c.selected));
    
    // Mark preview course schedules that have conflicts
    if (conflicts.length > 0) {
        previewedCourse.hasConflicts = true;
        
        // Mark specific schedules with conflicts
        if (previewedCourse.schedules) {
            previewedCourse.schedules = previewedCourse.schedules.map(schedule => {
                // Check if this schedule has a conflict
                const hasConflict = conflicts.some(conflict => 
                    conflict.schedule1.day === schedule.day && 
                    conflict.schedule1.start === schedule.start && 
                    conflict.schedule1.end === schedule.end
                );
                
                return { ...schedule, hasConflict };
        });
    }
}

    // Display the course with preview styling
    displayCoursesOnTimetable([...window.coursesData.filter(c => c.selected), previewedCourse]);
}

/**
 * Remove any preview courses from the timetable
 */
function removePreviewFromTimetable() {
    const previewEvents = document.querySelectorAll('.course-event.preview-event');
    previewEvents.forEach(event => event.remove());
}

/**
 * Handle course selection
 */
function handleCourseSelection(checkbox, course) {
    checkbox.addEventListener('change', (e) => {
        // If trying to select the course
        if (e.target.checked) {
            // Check for conflicts with existing selected courses
            const conflicts = findScheduleConflicts(course, window.coursesData.filter(c => c.selected));
            
            // If conflicts exist, show popup and prevent selection
            if (conflicts.length > 0) {
                e.preventDefault();
                e.target.checked = false;
                course.selected = false;
                showConflictPopup(conflicts);
                return;
            }
        }
        
        // If not prevented, proceed with selection
        course.selected = e.target.checked;
        
        // Update the timetable display
        updateTimetableDisplay(window.coursesData);
        
        // Refresh the course list to move the course to the appropriate section
        populateCourseList(window.coursesData);
    });
}

/**
 * Convert time string to minutes
 * @param {String} timeStr - Time string in format "HH:MM"
 * @returns {Number} - Total minutes
 */
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Shows a popup to edit tentative course schedule
 */
function showTentativeEditPopup(course, schedule, courseEvent) {
    // Remove any existing popups
    const existingPopup = document.getElementById('tentative-edit-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create popup container
    const popup = document.createElement('div');
    popup.id = 'tentative-edit-popup';
    popup.className = 'tentative-edit-popup';
    
    // Generate valid time options
    const validStartTimes = [];
    const validEndTimes = [];
    
    for (let hour = 8; hour <= 19; hour++) {
        const formattedHour = hour.toString().padStart(2, '0');
        validStartTimes.push(`${formattedHour}:30`);
        validEndTimes.push(`${formattedHour}:15`);
    }
    
    // Create popup content
    popup.innerHTML = `
        <div class="popup-header">
            <h3>Edit Tentative Schedule</h3>
            <button class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="popup-content">
            <div class="course-info">
                <div class="popup-course-id">${course.id}</div>
                <div class="popup-course-name">${course.name}</div>
                <div class="popup-course-type">${schedule.type || 'Class'}</div>
            </div>
            
            <div class="schedule-edit-form">
                <div class="form-group">
                    <label for="day-select">Day:</label>
                    <select id="day-select">
                        <option value="Monday" ${schedule.day === 'Monday' ? 'selected' : ''}>Monday</option>
                        <option value="Tuesday" ${schedule.day === 'Tuesday' ? 'selected' : ''}>Tuesday</option>
                        <option value="Wednesday" ${schedule.day === 'Wednesday' ? 'selected' : ''}>Wednesday</option>
                        <option value="Thursday" ${schedule.day === 'Thursday' ? 'selected' : ''}>Thursday</option>
                        <option value="Friday" ${schedule.day === 'Friday' ? 'selected' : ''}>Friday</option>
                        <option value="Saturday" ${schedule.day === 'Saturday' ? 'selected' : ''}>Saturday</option>
                        <option value="Sunday" ${schedule.day === 'Sunday' ? 'selected' : ''}>Sunday</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="start-time-select">Start Time (XX:30):</label>
                    <select id="start-time-select" class="time-select">
                        ${validStartTimes.map(time => 
                            `<option value="${time}" ${time === schedule.start ? 'selected' : ''}>${time}</option>`
                        ).join('')}
                    </select>
                    <div class="time-format-hint">Must be in format XX:30 (8:30 AM to 7:30 PM)</div>
                </div>
                
                <div class="form-group">
                    <label for="end-time-select">End Time (XX:15):</label>
                    <select id="end-time-select" class="time-select">
                        ${validEndTimes.map(time => 
                            `<option value="${time}" ${time === schedule.end ? 'selected' : ''}>${time}</option>`
                        ).join('')}
                    </select>
                    <div class="time-format-hint">Must be in format XX:15 (8:15 AM to 7:15 PM)</div>
                </div>
                
                <div class="form-group">
                    <label for="location-input">Location:</label>
                    <input type="text" id="location-input" value="${schedule.location || 'TBA'}">
                </div>
                
                <div id="validation-error" class="validation-error"></div>
            </div>
            
            <div class="popup-actions">
                <button class="cancel-btn">Cancel</button>
                <button class="save-btn">Save Changes</button>
            </div>
        </div>
    `;
    
    // Add the popup to the document
    document.body.appendChild(popup);
    
    // Position the popup near the course event
    positionPopup(popup, courseEvent);
    
    // Add event listeners
    const closeBtn = popup.querySelector('.close-btn');
    const cancelBtn = popup.querySelector('.cancel-btn');
    const saveBtn = popup.querySelector('.save-btn');
    const startTimeSelect = document.getElementById('start-time-select');
    const endTimeSelect = document.getElementById('end-time-select');
    const validationError = document.getElementById('validation-error');
    
    // Select the closest valid options to the current schedule
    if (!validStartTimes.includes(schedule.start)) {
        // Find the closest time in the valid options
        const closestStartTime = findClosestTime(schedule.start, validStartTimes);
        if (closestStartTime) {
            startTimeSelect.value = closestStartTime;
        }
    }
    
    if (!validEndTimes.includes(schedule.end)) {
        // Find the closest time in the valid options
        const closestEndTime = findClosestTime(schedule.end, validEndTimes);
        if (closestEndTime) {
            endTimeSelect.value = closestEndTime;
        }
    }
    
    // Validate times when selection changes
    startTimeSelect.addEventListener('change', () => {
        validateTimes();
        updateEndTimeOptions();
    });
    endTimeSelect.addEventListener('change', validateTimes);
    
    // Initial validation
    validateTimes();
    updateEndTimeOptions();
    
    // Function to update end time options based on start time
    function updateEndTimeOptions() {
        const startTime = startTimeSelect.value;
        const startMinutes = timeToMinutes(startTime);
        
        // Grey out end time options that are earlier than or equal to the start time
        Array.from(endTimeSelect.options).forEach(option => {
            const optionMinutes = timeToMinutes(option.value);
            if (optionMinutes <= startMinutes) {
                option.disabled = true;
                option.style.color = '#999';
                option.style.backgroundColor = '#f0f0f0';
            } else {
                option.disabled = false;
                option.style.color = '';
                option.style.backgroundColor = '';
            }
        });
        
        // If current selected end time is now invalid, select the first valid option
        if (timeToMinutes(endTimeSelect.value) <= startMinutes) {
            for (const option of endTimeSelect.options) {
                if (!option.disabled) {
                    endTimeSelect.value = option.value;
                    break;
                }
            }
        }
    }
    
    function validateTimes() {
        const startTime = startTimeSelect.value;
        const endTime = endTimeSelect.value;
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        
        if (endMinutes <= startMinutes) {
            validationError.textContent = 'End time must be after start time';
            saveBtn.disabled = true;
            return false;
        }
        
        // Check for conflicts with existing courses
        const day = document.getElementById('day-select').value;
        const newSchedule = {
            day,
            start: startTime,
            end: endTime
        };
        
        // Get all selected courses except the current one being edited
        const selectedCourses = window.coursesData.filter(c => 
            c.selected && c.id !== course.id
        );
        
        let hasConflict = false;
        let conflictCourse = null;
        
        // Check each selected course for conflicts
        for (const existingCourse of selectedCourses) {
            // Get schedules for the existing course
            const existingSchedules = existingCourse.schedules || [];
            
            // Check each schedule combination for conflicts
            for (const existingSchedule of existingSchedules) {
                if (schedulesConflict(newSchedule, existingSchedule)) {
                    hasConflict = true;
                    conflictCourse = existingCourse;
                    break;
                }
            }
            
            if (hasConflict) break;
        }
        
        if (hasConflict) {
            validationError.textContent = `Time conflict with ${conflictCourse.id}`;
            saveBtn.disabled = true;
            return false;
        } else {
            validationError.textContent = '';
            saveBtn.disabled = false;
            return true;
        }
    }
    
    closeBtn.addEventListener('click', () => popup.remove());
    cancelBtn.addEventListener('click', () => popup.remove());
    
    saveBtn.addEventListener('click', () => {
        // Check if the times are valid
        if (!validateTimes()) {
            return;
        }
        
        // Get values from form
        const day = document.getElementById('day-select').value;
        const startTime = startTimeSelect.value;
        const endTime = endTimeSelect.value;
        const location = document.getElementById('location-input').value || 'TBA';
        
        // Update the schedule in the courseData
        const courseIndex = window.coursesData.findIndex(c => c.id === course.id);
        const scheduleIndex = parseInt(courseEvent.dataset.scheduleIndex, 10);
        
        if (courseIndex >= 0 && !isNaN(scheduleIndex)) {
            window.coursesData[courseIndex].schedules[scheduleIndex] = {
                ...window.coursesData[courseIndex].schedules[scheduleIndex],
                day,
                start: startTime,
                end: endTime,
                location
            };
            
            // Save the updated tentative schedule to localStorage
            saveTentativeSchedules();
            
            // Update the display
            clearTimetable();
            displayCoursesOnTimetable(window.coursesData.filter(c => c.selected));
            
            // Optional: Highlight the moved event
            setTimeout(() => {
                const updatedEvent = document.querySelector(`.course-event[data-course-id="${course.id}"][data-schedule-index="${scheduleIndex}"]`);
                if (updatedEvent) {
                    updatedEvent.classList.add('highlight-updated');
                    setTimeout(() => updatedEvent.classList.remove('highlight-updated'), 2000);
                }
            }, 100);
        }
        
        // Close the popup
        popup.remove();
    });
}

/**
 * Find the closest time in a list of valid times
 */
function findClosestTime(targetTime, validTimes) {
    if (!targetTime || !validTimes || validTimes.length === 0) return null;
    
    const targetMinutes = timeToMinutes(targetTime);
    let closestTime = validTimes[0];
    let smallestDiff = Math.abs(timeToMinutes(closestTime) - targetMinutes);
    
    for (let i = 1; i < validTimes.length; i++) {
        const currentTime = validTimes[i];
        const currentDiff = Math.abs(timeToMinutes(currentTime) - targetMinutes);
        
        if (currentDiff < smallestDiff) {
            smallestDiff = currentDiff;
            closestTime = currentTime;
        }
    }
    
    return closestTime;
}

/**
 * Position the popup near the course event
 */
function positionPopup(popup, courseEvent) {
    const rect = courseEvent.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    popup.style.position = 'absolute';
    
    // Position to the right if there's enough space, otherwise to the left
    const rightSpace = window.innerWidth - rect.right;
    if (rightSpace >= 320) {
        popup.style.left = `${rect.right + 20}px`;
    } else {
        popup.style.left = `${Math.max(20, rect.left - 320)}px`;
    }
    
    // Position vertically centered with the event
    popup.style.top = `${rect.top + scrollTop - popup.offsetHeight/2 + rect.height/2}px`;
    
    // Make sure popup is fully visible vertically
    const popupRect = popup.getBoundingClientRect();
    if (popupRect.top < 60) {
        popup.style.top = `${scrollTop + 60}px`;
    } else if (popupRect.bottom > window.innerHeight - 20) {
        popup.style.top = `${scrollTop + window.innerHeight - popupRect.height - 20}px`;
    }
}