document.addEventListener('DOMContentLoaded', () => {
    // Initialize timetable
    createTimetableGrid();
    initializeSemesterButtons();
    initializeSearch();
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
 * Show/hide columns based on visible days
 */
function updateColumnVisibility() {
    // All days are visible by default
    const headerCells = document.querySelectorAll('.timetable-header .header-cell');
    for (let i = 1; i < headerCells.length; i++) { // Skip first (empty) cell
        headerCells[i].style.display = '';
    }
    
    // All time slots are visible
    const timeSlots = document.querySelectorAll('.time-slot');
    timeSlots.forEach(slot => {
        slot.style.display = '';
    });
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
                { type: 'Lecture A-LEC (8001)', day: 'Tuesday', start: '10:30', end: '12:15', location: 'Y.C. Liang Hall 104' },
                { type: 'Lecture A-LEC (8001)', day: 'Wednesday', start: '10:30', end: '11:15', location: 'Y.C. Liang Hall 104' },
                
                // Lecture section B (meets twice a week)
                { type: 'Lecture B-LEC (8002)', day: 'Thursday', start: '14:30', end: '16:15', location: 'William M W Mong Eng Bldg 1004' },
                { type: 'Lecture B-LEC (8002)', day: 'Wednesday', start: '12:30', end: '14:15', location: 'Science Centre L2' },
                
                // Tutorial section AT01 (once a week)
                { type: 'Tutorial AT01-TUT (8101)', day: 'Thursday', start: '12:30', end: '13:15', location: 'William M W Mong Eng Bldg 702' },
                
                // Tutorial section AT02 (once a week)
                { type: 'Tutorial AT02-TUT (8102)', day: 'Friday', start: '12:30', end: '13:15', location: 'Mong Man Wai Bldg 702' },
                
                // Tutorial section BT01 (once a week)
                { type: 'Tutorial BT01-TUT (8103)', day: 'Thursday', start: '16:30', end: '17:15', location: 'William M W Mong Eng Bldg 1004' }
            ],
            color: '#fae3d9', // light peach
            selected: true
        },
        { 
            id: 'CSCI 3100',
            name: 'Software Engineering',
            schedules: [
                { type: 'Lecture (8010)', day: 'Monday', start: '11:30', end: '12:15', location: 'T.Y.Wong Hall LT' },
                { type: 'Lecture (8010)', day: 'Tuesday', start: '12:30', end: '14:15', location: 'Lee Shau Kee Building LT6' }
            ],
            color: '#c2e0c6', // light green
            selected: true
        },
        { 
            id: 'CSCI 3180',
            name: 'Principles of Programming Languages',
            schedules: [
                { type: 'Interactive Tutorial (8105)', day: 'Thursday', start: '12:30', end: '13:15', location: 'Y.C. Liang Hall 104' },
                { type: 'Lecture (8015)', day: 'Monday', start: '14:30', end: '16:15', location: 'William M W Mong Eng Bldg LT' },
                { type: 'Lecture (8015)', day: 'Tuesday', start: '15:30', end: '16:15', location: 'William M W Mong Eng Bldg LT' }
            ],
            color: '#d0e0f0', // light blue
            selected: true
        },
        { 
            id: 'CSCI 3250',
            name: 'Computers and Society',
            schedules: [
                { type: 'Lecture (8020)', day: 'Thursday', start: '13:30', end: '15:15', location: 'Lady Shaw Bldg LT1' }
            ],
            color: '#f0e0d0', // light orange
            selected: true
        },
        { 
            id: 'CSCI 3251',
            name: 'Engineering Practicum',
            schedules: [
                { type: 'Practicum (8025)', day: 'Thursday', start: '15:30', end: '16:15', location: 'Lady Shaw Bldg LT1' }
            ],
            color: '#e0d0f0', // light purple
            selected: true
        },
        { 
            id: 'CSCI 4430',
            name: 'Data Communication and Computer Networks',
            schedules: [
                { type: 'Lecture (8030)', day: 'Wednesday', start: '12:30', end: '13:15', location: 'Lady Shaw Bldg LT2' },
                { type: 'Interactive Tutorial (8130)', day: 'Wednesday', start: '13:30', end: '14:15', location: 'Lady Shaw Bldg LT2' },
                { type: 'Lecture (8030)', day: 'Monday', start: '16:30', end: '18:15', location: 'Y.C. Liang Hall 103' },
                { type: 'Interactive Tutorial (8130)', day: 'Wednesday', start: '17:30', end: '18:15', location: 'Science Centre L3' }
            ],
            color: '#e0f0d0', // light yellow-green
            selected: true
        },
        { 
            id: 'GESC 1000',
            name: 'College Assembly',
            schedules: [
                { type: 'Assembly (8050)', day: 'Friday', start: '11:30', end: '13:15', location: 'TBA' }
            ],
            color: '#f0d0e0', // light pink
            selected: true
        },
        { 
            id: 'STAT 2005',
            name: 'Statistics',
            schedules: [
                { type: 'Lecture (8040)', day: 'Thursday', start: '16:30', end: '18:15', location: 'Lady Shaw Bldg LT2' },
                { type: 'Lecture (8040)', day: 'Tuesday', start: '17:30', end: '18:15', location: 'Y.C. Liang Hall 104' }
            ],
            color: '#d0f0e0', // light mint
            selected: true
        },
        { 
            id: 'AIST 1000',
            name: 'Introduction to Artificial Intelligence and Machine Learning',
            schedules: [
                { type: 'Lecture --LEC (8137)', day: 'Tuesday', start: '10:30', end: '11:15', location: 'Mong Man Wai Bldg 707' },
                { type: 'Lecture --LEC (8137)', day: 'Wednesday', start: '10:30', end: '11:15', location: 'Mong Man Wai Bldg 707' }
            ],
            color: '#b2dfdb', // light teal
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

        courseItems.appendChild(courseItem);
        
        // Add course selection handler - this handles conflict checking
        handleCourseSelection(checkbox, course);
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
                <div class="course-event-type">${formattedType}</div>
                <div class="course-event-time">${schedule.start} - ${schedule.end}</div>
                <div class="course-event-location">${schedule.location || 'TBA'}</div>
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
    
    // Get the original class type and format
    const classType = schedule.type || '';
    
    // Extract class code for display in the dedicated section
    let classCode = '';
    if (schedule.type) {
        const codeMatch = schedule.type.match(/\((\d+)\)/);
        if (codeMatch && codeMatch[1]) {
            classCode = codeMatch[1];
        }
    }
    
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
    
    // Display class code if available
    const classCodeInfo = classCode ? 
        `<p class="class-code"><strong>Class Code:</strong> ${classCode}</p>` : '';
    
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
                <strong>${classType}</strong>
                <div class="schedule-detail selected-section">
                    <div class="section-header">Selected Session</div>
                    <p>${schedule.day} ${schedule.start} - ${schedule.end}</p>
                    <div class="location">${schedule.location || 'Location TBA'}</div>
                ${classCodeInfo}
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
    
    // Get the schedules for the course to check
    const schedulesToCheck = courseToCheck.schedules || [];
    
    // Loop through existing courses
    for (const existingCourse of existingCourses) {
        // Skip if it's the same course or not selected
        if (existingCourse.id === courseToCheck.id || !existingCourse.selected) {
            continue;
        }
        
        const existingSchedules = existingCourse.schedules || [];
        
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