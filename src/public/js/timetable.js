document.addEventListener('DOMContentLoaded', () => {
    // Initialize day filters (all days visible by default)
    window.visibleDays = [0, 1, 2, 3, 4, 5, 6]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    
    // Initialize timetable
    createTimetableGrid();
    initializeSemesterButtons();
    initializeSearch();
    initializeDayFilters();
    loadUserInfo();
    setupLogout();
    setupDemoButton();
    setupTimetableActions();

    // Load course data from external file instead of hardcoding
    loadCourseData();
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
            loadCourseData(semester);
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
        const courseItems = document.querySelectorAll('.course-item');
        
        courseItems.forEach(item => {
            const courseText = item.textContent.toLowerCase();
            
            // Standard search
            let isMatch = courseText.includes(searchTerm);
            
            // If no match and potential course code (contains letters and numbers)
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
    });
}

/**
 * Initialize day filter functionality
 */
function initializeDayFilters() {
    // Add event listeners to checkboxes
    const dayCheckboxes = document.querySelectorAll('.day-filters input[type="checkbox"]');
    dayCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateVisibleDays();
        });
    });
    
    // Add event listeners to buttons
    const selectAllBtn = document.getElementById('selectAllDays');
    const clearAllBtn = document.getElementById('clearAllDays');
    
    selectAllBtn.addEventListener('click', () => {
        dayCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        updateVisibleDays();
    });
    
    clearAllBtn.addEventListener('click', () => {
        dayCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        updateVisibleDays();
    });
}

/**
 * Update visible days based on checkbox selection
 */
function updateVisibleDays() {
    const dayCheckboxes = document.querySelectorAll('.day-filters input[type="checkbox"]');
    window.visibleDays = [];
    
    dayCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            window.visibleDays.push(parseInt(checkbox.dataset.day));
        }
    });
    
    // Update column visibility
    updateColumnVisibility();
    
    // Redisplay courses with the new day filter
    if (window.coursesData) {
        updateTimetableDisplay(window.coursesData);
    }
}

/**
 * Show/hide columns based on visible days
 */
function updateColumnVisibility() {
    // Update header cells
    const headerCells = document.querySelectorAll('.timetable-header .header-cell');
    for (let i = 1; i < headerCells.length; i++) { // Skip first (empty) cell
        const dayIndex = i - 1;
        headerCells[i].style.display = window.visibleDays.includes(dayIndex) ? '' : 'none';
    }
    
    // Update time slots
    const timeSlots = document.querySelectorAll('.time-slot');
    timeSlots.forEach(slot => {
        const dayIndex = parseInt(slot.dataset.day);
        slot.style.display = window.visibleDays.includes(dayIndex) ? '' : 'none';
    });
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
            alert('Saving timetable... (To be implemented with MongoDB)');
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
 * Export timetable to CSV
 */
function exportTimetableToCsv() {
            const selectedCourses = window.coursesData ? window.coursesData.filter(course => course.selected) : [];
            if (!selectedCourses.length) {
                alert('No courses selected to export.');
                return;
            }

            // Prepare CSV headers
            const headers = ['Course ID', 'Course Name', 'Type', 'Day', 'Start Time', 'End Time', 'Location'];
            const csvRows = [headers.join(',')];

            // Add each course schedule as a row
            selectedCourses.forEach(course => {
                if (course.schedules && course.schedules.length > 0) {
                    course.schedules.forEach(schedule => {
                        const row = [
                            `"${course.id}"`,
                            `"${course.name}"`,
                            `"${schedule.type}"`,
                            `"${schedule.day}"`,
                            `"${schedule.start}"`,
                            `"${schedule.end}"`,
                            `"${schedule.location}"`
                        ];
                        csvRows.push(row.join(','));
                    });
                } else {
                    // If no schedules, add a row with empty schedule fields
                    const row = [
                        `"${course.id}"`,
                        `"${course.name}"`,
                        '""', // Type
                        '""', // Day
                        '""', // Start Time
                        '""', // End Time
                        '""'  // Location
                    ];
                    csvRows.push(row.join(','));
                }
            });

            // Create CSV content
            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            const activeSemester = document.querySelector('.semester-btn.active');
            const semesterName = activeSemester ? activeSemester.textContent.replace(/\s+/g, '_') : 'timetable';
            downloadLink.download = `${semesterName}_timetable.csv`;
            downloadLink.click();
            URL.revokeObjectURL(downloadLink.href);
}

/**
 * Capture and save timetable as image
 */
function captureAndSaveTimetable() {
            const timetableElement = document.querySelector('.timetable');
            if (!timetableElement) {
                alert('Could not find timetable to capture.');
                return;
            }

            const loadingMessage = document.createElement('div');
            loadingMessage.textContent = 'Capturing timetable...';
            loadingMessage.style.position = 'fixed';
            loadingMessage.style.top = '50%';
            loadingMessage.style.left = '50%';
            loadingMessage.style.transform = 'translate(-50%, -50%)';
            loadingMessage.style.padding = '1rem';
            loadingMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            loadingMessage.style.color = 'white';
            loadingMessage.style.borderRadius = '5px';
            loadingMessage.style.zIndex = '9999';
            document.body.appendChild(loadingMessage);

            window.scrollTo(0, 0); // Ensure the element is fully visible
            html2canvas(timetableElement, {
                backgroundColor: '#f5f6fa',
                scale: 2,
                useCORS: true, // Handle external resources like FontAwesome icons
                logging: false
            }).then(canvas => {
                document.body.removeChild(loadingMessage);
                canvas.toBlob(blob => {
                    try {
                        const clipboardItem = new ClipboardItem({ 'image/png': blob });
                        navigator.clipboard.write([clipboardItem])
                            .then(() => console.log('Image copied to clipboard'))
                            .catch(err => console.error('Error copying to clipboard:', err));
                    } catch (e) {
                        console.warn('Clipboard copy not supported:', e);
                    }

                    const downloadLink = document.createElement('a');
                    downloadLink.href = URL.createObjectURL(blob);
                    const activeSemester = document.querySelector('.semester-btn.active');
                    const semesterName = activeSemester ? activeSemester.textContent.replace(/\s+/g, '_') : 'timetable';
            downloadLink.download = `${semesterName}.png`;
                    downloadLink.click();
                    URL.revokeObjectURL(downloadLink.href);
        }, 'image/png');
            }).catch(error => {
                document.body.removeChild(loadingMessage);
                console.error('Error capturing timetable:', error);
                alert('Error capturing timetable. Please try again.');
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
            // Store courses globally for filtering
            window.coursesData = courses;
            
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
            // Store courses globally for filtering
            window.coursesData = courses;
            
            // Populate course list
            populateCourseList(courses);
            
            // Display selected courses on the timetable
            updateTimetableDisplay(courses);
        })
        .catch(error => {
            console.error('Error loading demo data from API:', error);
            // If even the demo API fails, fall back to hardcoded demo data
            loadDemoData();
        });
}

/**
 * Fallback function with hardcoded demo data
 */
function loadDemoData() {
    console.log('Loading hardcoded demo data');
    const courses = [
        { 
            id: 'CSCI 2100',
            name: 'Data Structures',
            schedules: [
                // Lecture section A (meets twice a week)
                { type: 'Lecture A-LEC', day: 'Tuesday', start: '10:30', end: '12:15', location: 'Y.C. Liang Hall 104' },
                { type: 'Lecture A-LEC', day: 'Wednesday', start: '10:30', end: '11:15', location: 'Y.C. Liang Hall 104' },
                
                // Lecture section B (meets twice a week)
                { type: 'Lecture B-LEC', day: 'Thursday', start: '14:30', end: '16:15', location: 'William M W Mong Eng Bldg 1004' },
                { type: 'Lecture B-LEC', day: 'Wednesday', start: '12:30', end: '14:15', location: 'Science Centre L2' },
                
                // Tutorial section AT01 (once a week)
                { type: 'Tutorial AT01-TUT', day: 'Thursday', start: '12:30', end: '13:15', location: 'William M W Mong Eng Bldg 702' },
                
                // Tutorial section AT02 (once a week)
                { type: 'Tutorial AT02-TUT', day: 'Friday', start: '12:30', end: '13:15', location: 'Mong Man Wai Bldg 702' },
                
                // Tutorial section BT01 (once a week)
                { type: 'Tutorial BT01-TUT', day: 'Thursday', start: '16:30', end: '17:15', location: 'William M W Mong Eng Bldg 1004' }
            ],
            color: '#fae3d9', // light peach
            selected: true
        },
        { 
            id: 'CSCI 3100',
            name: 'Software Engineering',
            schedules: [
                { type: 'Lecture', day: 'Monday', start: '11:30', end: '12:15', location: 'T.Y.Wong Hall LT' },
                { type: 'Lecture', day: 'Tuesday', start: '12:30', end: '14:15', location: 'Lee Shau Kee Building LT6' }
            ],
            color: '#c2e0c6', // light green
            selected: true
        },
        { 
            id: 'CSCI 3180',
            name: 'Principles of Programming Languages',
            schedules: [
                { type: 'Interactive Tutorial', day: 'Thursday', start: '12:30', end: '13:15', location: 'Y.C. Liang Hall 104' },
                { type: 'Lecture', day: 'Monday', start: '14:30', end: '16:15', location: 'William M W Mong Eng Bldg LT' },
                { type: 'Lecture', day: 'Tuesday', start: '15:30', end: '16:15', location: 'William M W Mong Eng Bldg LT' }
            ],
            color: '#d0e0f0', // light blue
            selected: true
        },
        { 
            id: 'CSCI 3250',
            name: 'Computers and Society',
            schedules: [
                { type: 'Lecture', day: 'Thursday', start: '13:30', end: '15:15', location: 'Lady Shaw Bldg LT1' }
            ],
            color: '#f0e0d0', // light orange
            selected: true
        },
        { 
            id: 'CSCI 3251',
            name: 'Engineering Practicum',
            schedules: [
                { type: 'Practicum', day: 'Thursday', start: '15:30', end: '16:15', location: 'Lady Shaw Bldg LT1' }
            ],
            color: '#e0d0f0', // light purple
            selected: true
        },
        { 
            id: 'CSCI 4430',
            name: 'Data Communication and Computer Networks',
            schedules: [
                { type: 'Lecture', day: 'Wednesday', start: '12:30', end: '13:15', location: 'Lady Shaw Bldg LT2' },
                { type: 'Interactive Tutorial', day: 'Wednesday', start: '13:30', end: '14:15', location: 'Lady Shaw Bldg LT2' },
                { type: 'Lecture', day: 'Monday', start: '16:30', end: '18:15', location: 'Y.C. Liang Hall 103' },
                { type: 'Interactive Tutorial', day: 'Wednesday', start: '17:30', end: '18:15', location: 'Science Centre L3' }
            ],
            color: '#e0f0d0', // light yellow-green
            selected: true
        },
        { 
            id: 'GESC 1000',
            name: 'College Assembly',
            schedules: [
                { type: 'Assembly', day: 'Friday', start: '11:30', end: '13:15', location: 'TBA' }
            ],
            color: '#f0d0e0', // light pink
            selected: true
        },
        { 
            id: 'STAT 2005',
            name: 'Statistics',
            schedules: [
                { type: 'Lecture', day: 'Thursday', start: '16:30', end: '18:15', location: 'Lady Shaw Bldg LT2' },
                { type: 'Lecture', day: 'Tuesday', start: '17:30', end: '18:15', location: 'Y.C. Liang Hall 104' }
            ],
            color: '#d0f0e0', // light mint
            selected: true
        }
    ];

    // Store courses globally for filtering
    window.coursesData = courses;
    
    populateCourseList(courses);
    
    // Display selected courses on the timetable
    updateTimetableDisplay(courses);
}

/**
 * Populate the course list sidebar with course items
 */
function populateCourseList(courses) {
    const courseItems = document.querySelector('.course-items');
    courseItems.innerHTML = '';

    courses.forEach(course => {
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
        
        // Separate the checkbox click handling from the label hover
        checkbox.addEventListener('change', (e) => {
            course.selected = e.target.checked;
            // Update the timetable display
            updateTimetableDisplay(courses);
        });
        
        // Add event listeners for section selectors if they exist
        if (hasMultipleSections) {
            addSectionSelectorEventListeners(courseItem, course);
        }
        
        // Add hover event to show course details
        courseItem.addEventListener('mouseenter', () => {
            showCourseDetails(course);
        });

        courseItems.appendChild(courseItem);
    });
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
        const sectionId = extractSectionId(schedule.type);
        
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
    // Map days to their indices
    const dayMap = {
        'Monday': 0,
        'Tuesday': 1,
        'Wednesday': 2,
        'Thursday': 3,
        'Friday': 4,
        'Saturday': 5,
        'Sunday': 6
    };

    // Helper function to convert time to minutes
    function timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Sort courses by start time to display earlier classes first
    const sortedCourses = [...courses].sort((a, b) => {
        if (!a.schedules || !a.schedules.length) return 1;
        if (!b.schedules || !b.schedules.length) return -1;
        
        const aStartTime = Math.min(...a.schedules.map(s => timeToMinutes(s.start)));
        const bStartTime = Math.min(...b.schedules.map(s => timeToMinutes(s.start)));
        return aStartTime - bStartTime;
    });

    // Process each course
    sortedCourses.forEach(course => {
        // Skip if no schedules
        if (!course.schedules || !course.schedules.length) return;
        
        // Get only the schedules that should be displayed
        // (either selected sections or all if no selection)
        let schedulesToDisplay = [];
        
        if (course.selectedSections) {
            // Group schedules by section
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
            
            // Skip if this day is filtered out
            if (!window.visibleDays.includes(dayIndex)) return;
            
            // Calculate start and end times in minutes
            const startTimeMinutes = timeToMinutes(schedule.start);
            const endTimeMinutes = timeToMinutes(schedule.end);
            
            // Find the appropriate time slot
            const startHour = Math.floor(startTimeMinutes / 60);
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
            const rows = Math.ceil(durationMinutes / 60); // Number of hour slots
            const heightPercentage = (durationMinutes / 60) * 100; // Height as percentage of hour slot
            
            // Create course event element
            const courseEvent = document.createElement('div');
            courseEvent.className = 'course-event';
            if (course.isPlaceholder || schedule.type.includes('Placeholder')) {
                courseEvent.classList.add('placeholder-event');
            }
            
            // Set style for positioning
            courseEvent.style.backgroundColor = course.color || getRandomColor(course.id);
            courseEvent.style.top = `${startMinute / 60 * 100}%`;
            courseEvent.style.height = `${heightPercentage}%`;
            
            // Extract section ID and base type
            const sectionId = extractSectionId(schedule.type) || '';
            const baseType = normalizeSessionType(schedule.type);

            // Add content
            courseEvent.innerHTML = `
                <div class="course-event-title">${course.id}</div>
                <div class="course-event-type">
                    ${baseType}${sectionId ? ` (Section ${sectionId})` : ''}
                </div>
                <div class="course-event-time">${schedule.start} - ${schedule.end}</div>
                <div class="course-event-location">${schedule.location}</div>
            `;
            
            // Add hover effect for details
            courseEvent.addEventListener('mouseenter', () => {
                // Highlight this course in the course list
                highlightCourseInList(course.id);
                
                // Show detailed info
                showCourseScheduleDetails(course, schedule);
            });
            
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
                const courseItems = document.querySelectorAll('.course-item');
                courseItems.forEach(item => {
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
        schedulesHTML += `<div class="schedule-item">
            <strong>${baseType}</strong>`;
        
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
            
            // Section header with id
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
    
    // Extract section identifier and base type
    const sectionId = extractSectionId(schedule.type) || '';
    const baseType = normalizeSessionType(schedule.type);
    
    // Find all sessions that belong to this section
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
    const placeholderWarning = course.isPlaceholder || schedule.type.includes('Placeholder') ? 
        '<p class="placeholder-warning">Note: Schedule information is not yet finalized. Times shown are tentative.</p>' : '';
    
    detailsContent.innerHTML = `
        <h4>${course.id}</h4>
        <p class="course-name-details">${course.name}</p>
        ${placeholderWarning}
        <div class="course-schedule">
            <h3>Schedule Details</h3>
            <div class="schedule-item">
                <strong>${baseType}${sectionId ? ` (Section ${sectionId})` : ''}</strong>
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