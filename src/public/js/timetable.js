document.addEventListener('DOMContentLoaded', () => {
    // Initialize day filters (all days visible by default)
    window.visibleDays = [0, 1, 2, 3, 4, 5, 6]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    
    // Initialize timetable
    createTimeSlots();
    initializeSemesterButtons();
    initializeSearch();
    initializeDayFilters(); // Add day filters
    loadUserInfo();
    setupLogout();
    setupDemoButton(); // Add demo button functionality
    setupTimetableActions(); // Setup export and save functionality

    // Load course data from external file instead of hardcoding
    loadCourseData();
});

function setupTimetableActions() {
    const saveBtn = document.getElementById('saveBtn');
    const exportBtn = document.getElementById('exportTimetableBtn');
    const saveImageBtn = document.getElementById('saveImageBtn');

    // Save button (placeholder for now, will implement later)
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            alert('Saving timetable... (To be implemented with MongoDB)');
        });
    }

    // Export timetable button
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
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
        });
    }

    // Save image button
    if (saveImageBtn) {
        saveImageBtn.addEventListener('click', () => {
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
                    downloadLink.download = `${semesterName}.png`; // Changed to PNG
                    downloadLink.click();
                    URL.revokeObjectURL(downloadLink.href);
                }, 'image/png'); // Changed to PNG
            }).catch(error => {
                document.body.removeChild(loadingMessage);
                console.error('Error capturing timetable:', error);
                alert('Error capturing timetable. Please try again.');
            });
        });
    }
}

// Setup the demo button click handler
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

// Function to load course data from external file
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

// Function to load semester-specific data
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

// Function to load demo data directly from API
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

// Ultimate fallback function with hardcoded demo data
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

function createTimeSlots() {
    const tbody = document.querySelector('.timetable tbody');
    tbody.innerHTML = ''; // Clear existing rows
    
    // Create table header
    const thead = document.querySelector('.timetable thead');
    thead.innerHTML = '';
    const headerRow = document.createElement('tr');
    
    // Add time column header
    const timeHeader = document.createElement('th');
    timeHeader.textContent = 'Time';
    timeHeader.className = 'time-cell';
    headerRow.appendChild(timeHeader);
    
    // Add day headers
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    days.forEach(day => {
        const dayHeader = document.createElement('th');
        dayHeader.textContent = day;
        headerRow.appendChild(dayHeader);
    });
    
    thead.appendChild(headerRow);
    
    // Create time slots - only use 8:30, 9:30, etc. (half-hour intervals)
    const startTime = 8 * 60 + 30; // 8:30 AM
    const endTime = 22 * 60 + 30; // 10:30 PM
    const interval = 60; // Use 60 minutes (hourly) to only show half-hour slots

    for (let time = startTime; time < endTime; time += interval) {
        const row = document.createElement('tr');
        const timeCell = document.createElement('td');
        
        const hours = Math.floor(time / 60);
        const minutes = time % 60;
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        timeCell.textContent = formattedTime;
        timeCell.classList.add('time-cell'); // Add class for styling
        
        row.appendChild(timeCell);

        // Add cells for each day
        for (let i = 0; i < 7; i++) {
            const cell = document.createElement('td');
            cell.dataset.time = formattedTime;
            cell.dataset.day = i;
            row.appendChild(cell);
        }

        tbody.appendChild(row);
    }
}

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
        
        let sectionSelectors = '';
        if (hasMultipleSections) {
            sectionSelectors = generateSectionSelectors(course);
        }
        
        courseItem.innerHTML = `
            <input type="checkbox" id="${course.id}" ${course.selected ? 'checked' : ''}>
            <label for="${course.id}">
                ${course.id}
                <div class="course-name">${course.name}</div>
                ${course.isPlaceholder ? '<div class="placeholder-indicator">(Schedule TBA)</div>' : ''}
            </label>
            ${sectionSelectors}
        `;

        const checkbox = courseItem.querySelector('input');
        
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
        
        courseItem.addEventListener('mouseleave', () => {
            // Don't hide the details when moving away from the course item
            // This way details remain visible until hovering over another course
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
    let selectorHTML = '<div class="section-selectors">';
    
    for (const [baseType, typeSections] of Object.entries(sectionsByType)) {
        if (typeSections.length > 1) {
            selectorHTML += `
                <div class="section-selector">
                    <label class="section-label">${baseType}:</label>
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
    
    selectorHTML += '</div>';
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

function updateTimetableDisplay(courses) {
    // Store courses globally for filtering
    window.coursesData = courses;
    
    // Only display selected courses
    const selectedCourses = courses.filter(course => course.selected);
    displayCoursesOnTimetable(selectedCourses);
}

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
                '<span class="selected-indicator">✓ Selected</span>' : '';
            
            // Section header with id
            schedulesHTML += `
                <div class="schedule-detail ${selectedClass}">
                    <p class="section-header">Section ${section.sectionId} ${selectedIndicator}</p>`;
            
            // Display all the sessions for this section
            section.schedules.forEach(schedule => {
                schedulesHTML += `
                    <p>${schedule.day} ${schedule.start} - ${schedule.end}</p>`;
            });
            
            // Display the location (usually the same for all sessions in a section)
            schedulesHTML += `
                    <p class="location">${section.schedules[0].location || 'Location TBA'}</p>
                </div>`;
        });
        
        schedulesHTML += `</div>`;
    });
    
    detailsContent.innerHTML = `
        <h4>${course.id}</h4>
        <p class="course-name-details">${course.name}</p>
        ${course.isPlaceholder ? '<p class="placeholder-warning">Note: Schedule information is not yet available. Times shown are placeholders.</p>' : ''}
        <div class="course-schedule">
            <h3>Schedule Details:</h3>
            ${schedulesHTML}
        </div>
    `;
    
    // Highlight this course in the list
    const courseItems = document.querySelectorAll('.course-item');
    courseItems.forEach(item => {
        const itemId = item.querySelector('input').id;
        if (itemId === course.id) {
            item.classList.add('highlighted');
        } else {
            item.classList.remove('highlighted');
        }
    });
}

function hideCourseDetails() {
    const detailsContent = document.querySelector('.details-content');
    detailsContent.innerHTML = 'Course details will be displayed here once you hover or click on a course';
}

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

    // Clear existing courses from timetable
    const cells = document.querySelectorAll('.timetable td:not(:first-child)');
    cells.forEach(cell => {
        cell.innerHTML = '';
        cell.className = '';
        // Also clear the multi-hour data attribute
        delete cell.dataset.multiHourAbove;
        delete cell.dataset.occupied;
    });

    // Helper function to convert time to minutes
    function timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Sort courses by start time to display earlier classes first
    const sortedCourses = [...courses].sort((a, b) => {
        const aStartTime = Math.min(...a.schedules.map(s => timeToMinutes(s.start)));
        const bStartTime = Math.min(...b.schedules.map(s => timeToMinutes(s.start)));
        return aStartTime - bStartTime;
    });

    // Add each course to the timetable
    sortedCourses.forEach(course => {
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
        
        sortedSchedules.forEach(schedule => {
            const dayIndex = dayMap[schedule.day];
            
            // Skip if this day is filtered out
            if (!window.visibleDays.includes(dayIndex)) return;
            
            const startTimeMinutes = timeToMinutes(schedule.start);
            const endTimeMinutes = timeToMinutes(schedule.end);
            
            // Calculate duration in hours (round up for partial hours)
            const durationHours = Math.ceil((endTimeMinutes - startTimeMinutes) / 60);
            
            // Find all rows that this course spans
            const rows = findRowsForTimeSpan(startTimeMinutes, endTimeMinutes);
            if (rows.length === 0) return;
            
            // Get the cell in the first row for this day
            const firstCell = rows[0].children[dayIndex + 1]; // +1 because first column is time
            if (!firstCell) return;
            
            // Skip if the cell is marked as occupied by another course
            if (firstCell.dataset.occupied === 'true') return;
            
            // Create course element
            const courseElement = document.createElement('div');
            courseElement.className = 'course-block';
            
            // Add placeholder class if this is a placeholder schedule
            if (course.isPlaceholder || schedule.type.includes('Placeholder')) {
                courseElement.classList.add('placeholder-block');
            }
            
            // Set height based on duration
            if (durationHours > 1) {
                // Calculate the actual time span in minutes
                const timeSpanMinutes = endTimeMinutes - startTimeMinutes;
                
                // Only attempt to calculate dynamic heights once the DOM is fully rendered
                // and elements have their computed heights
                setTimeout(() => {
                    try {
                        // Calculate the exact height by using the number of rows that the course spans
                        if (rows.length > 1) {
                            // Get the last row that should be part of this course
                            const lastRowIndex = Math.min(rows.length - 1, durationHours - 1);
                            const lastRow = rows[lastRowIndex];
                            
                            // If we can't find a sufficient number of rows, use a more aggressive approach
                            // to find rows that might not have been included due to time boundaries
                            if (lastRowIndex < durationHours - 1) {
                                // Find the next rows manually
                                let lastRowFound = lastRow;
                                let rowsToFind = durationHours - 1 - lastRowIndex;
                                let currentRow = lastRow;
                                
                                while (rowsToFind > 0 && currentRow.nextElementSibling) {
                                    currentRow = currentRow.nextElementSibling;
                                    lastRowFound = currentRow;
                                    rowsToFind--;
                                }
                                
                                // Use this last row instead if found
                                if (lastRowFound !== lastRow) {
                                    // Calculate height using the newly found last row
                                    const totalHeight = lastRowFound.offsetTop + lastRowFound.offsetHeight - rows[0].offsetTop - 2; // -2px for borders
                                    courseElement.style.height = `${totalHeight}px`;
                                    console.log(`Extended height for ${course.id} to ${totalHeight}px (spanning more rows)`);
                                } else {
                                    // Calculate height from top of first row to bottom of last row
                                    const totalHeight = lastRow.offsetTop + lastRow.offsetHeight - rows[0].offsetTop - 2; // -2px for borders
                                    courseElement.style.height = `${totalHeight}px`;
                                    console.log(`Set height for ${course.id} to ${totalHeight}px (using available rows)`);
                                }
                            } else {
                                // Standard case - we have enough rows
                                const totalHeight = lastRow.offsetTop + lastRow.offsetHeight - rows[0].offsetTop - 2; // -2px for borders
                                courseElement.style.height = `${totalHeight}px`;
                                console.log(`Standard height for ${course.id} to ${totalHeight}px`);
                            }
                        } else {
                            // We have just one row but the course spans multiple hours
                            // Use a fixed height per hour with a bit more space
                            const baseRowHeight = 80; // Fixed height of 80px per hour (increased from 60px)
                            const totalHeight = baseRowHeight * durationHours - 2; // -2px for borders
                            courseElement.style.height = `${totalHeight}px`;
                            console.log(`Fixed height for ${course.id} to ${totalHeight}px for ${durationHours} hours`);
                        }
                    } catch (e) {
                        console.error('Error calculating course block height:', e);
                        // Fallback to minimum height
                        courseElement.style.height = `${80 * durationHours - 2}px`;
                    }
                }, 0);
                
                // Position absolutely
                courseElement.style.position = 'absolute';
                courseElement.style.top = '0';
                courseElement.style.left = '0';
                courseElement.style.right = '0';
                courseElement.style.zIndex = '10';
                courseElement.classList.add('multi-hour');
                
                // Also set position relative on the container cell
                firstCell.style.position = 'relative';
            }
            
            courseElement.style.backgroundColor = course.color;

            // Create a better structured HTML for course blocks
            const sectionId = extractSectionId(schedule.type) || '';
            const baseType = normalizeSessionType(schedule.type);

            courseElement.innerHTML = `
                <div class="course-title">${course.id}</div>
                <div class="course-type">
                    ${baseType}${sectionId ? ` (Section ${sectionId})` : ''}
                </div>
                <div class="course-time">${schedule.start} - ${schedule.end}</div>
                <div class="course-location">${schedule.location}</div>
            `;
            
            // Add hover effect to show more details
            courseElement.addEventListener('mouseenter', () => {
                showCourseScheduleDetails(course, schedule);
                
                // Also highlight this course in the list
                const courseItems = document.querySelectorAll('.course-item');
                courseItems.forEach(item => {
                    const itemId = item.querySelector('input').id;
                    if (itemId === course.id) {
                        item.classList.add('highlighted');
                    } else {
                        item.classList.remove('highlighted');
                    }
                });
            });
            
            courseElement.addEventListener('mouseleave', () => {
                // We no longer hide course details on mouse leave
                // This allows details to persist until another course is hovered
            });
            
            // Mark this cell as occupied
            firstCell.dataset.occupied = 'true';
            
            // Append to first cell
            firstCell.appendChild(courseElement);
            
            // If multiple rows, mark cells below as occupied
            if (durationHours > 1) {
                // Determine how many rows to mark as occupied
                const rowsToOccupy = durationHours;
                
                // Keep track of how many rows we've actually marked
                let markedRows = 1; // We've already marked the first row
                
                // Mark the cells in rows that we already found
                for (let i = 1; i < rows.length && markedRows < rowsToOccupy; i++) {
                    const cell = rows[i].children[dayIndex + 1];
                    if (cell) {
                        // Mark this cell as having content from a multi-hour course above
                        cell.dataset.multiHourAbove = 'true';
                        // Also mark as occupied to prevent other courses from being placed here
                        cell.dataset.occupied = 'true';
                        
                        // Add a visual indicator that this cell is part of a multi-hour course
                        cell.style.backgroundColor = 'rgba(0,0,0,0.03)';
                        markedRows++;
                    }
                }
                
                // If we haven't marked enough rows, try to find and mark additional rows
                if (markedRows < rowsToOccupy && rows.length > 0) {
                    // Start from the last row we found
                    let currentRow = rows[rows.length - 1];
                    
                    while (markedRows < rowsToOccupy && currentRow.nextElementSibling) {
                        currentRow = currentRow.nextElementSibling;
                        const cell = currentRow.children[dayIndex + 1];
                        
                        if (cell) {
                            // Mark this cell as having content from a multi-hour course above
                            cell.dataset.multiHourAbove = 'true';
                            // Also mark as occupied to prevent other courses from being placed here
                            cell.dataset.occupied = 'true';
                            
                            // Add a visual indicator that this cell is part of a multi-hour course
                            cell.style.backgroundColor = 'rgba(0,0,0,0.03)';
                            markedRows++;
                        }
                    }
                }
            }
        });
    });
    
    // Function to find rows for a time span
    function findRowsForTimeSpan(startTimeMinutes, endTimeMinutes) {
        const rows = document.querySelectorAll('.timetable tbody tr');
        const matchingRows = [];
        
        // Debug the time values we're searching for
        console.log(`Finding rows for course from ${Math.floor(startTimeMinutes/60)}:${(startTimeMinutes%60).toString().padStart(2, '0')} to ${Math.floor(endTimeMinutes/60)}:${(endTimeMinutes%60).toString().padStart(2, '0')}`);
        
        // Check each row to see if it contains the correct time
        for (const row of rows) {
            const timeCell = row.querySelector('.time-cell');
            if (!timeCell) continue;
            
            const timeText = timeCell.textContent;
            const [rowHours, rowMinutes] = timeText.split(':').map(Number);
            const rowTimeInMinutes = rowHours * 60 + rowMinutes;
            
            // Convert to string for debugging
            console.log(`Checking row with time: ${timeText} (${rowTimeInMinutes} minutes)`);
            
            // Get the time of the next slot (which would be 1 hour later with our current setup)
            let nextRowTimeInMinutes = rowTimeInMinutes + 60;
            
            // Check if this row's time range matches where the course should be
            // For a course starting at 10:30, it should be in the 10:30 row (not 9:30)
            if (
                // This is the starting row for the course
                (rowTimeInMinutes <= startTimeMinutes && startTimeMinutes < nextRowTimeInMinutes) ||
                // This row is covered by the course's duration
                (startTimeMinutes <= rowTimeInMinutes && rowTimeInMinutes < endTimeMinutes)
            ) {
                matchingRows.push(row);
                console.log(`✓ Row matched: ${timeText}`);
            }
        }
        
        console.log(`Found ${matchingRows.length} matching rows`);
        
        return matchingRows;
    }
}

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
    
    detailsContent.innerHTML = `
        <h4>${course.id}</h4>
        <p class="course-name-details">${course.name}</p>
        <div class="course-schedule">
            <h3>Schedule Details:</h3>
            <div class="schedule-item">
                <strong>${baseType}${sectionId ? ` (Section ${sectionId})` : ''}</strong>
                <p class="selected-session">
                    <strong>Selected Session:</strong> ${schedule.day} ${schedule.start} - ${schedule.end}
                </p>
                <p class="location">${schedule.location || 'Location TBA'}</p>
                ${instructorInfo}
                ${termInfo}
                ${allSessions.length > 1 ? sessionsHTML : ''}
            </div>
        </div>
    `;
}

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

function initializeDayFilters() {
    // Create the day filter container if it doesn't exist
    let dayFilterContainer = document.querySelector('.day-filter-container');
    if (!dayFilterContainer) {
        dayFilterContainer = document.createElement('div');
        dayFilterContainer.className = 'day-filter-container';
        
        // Insert it after the search box
        const searchBox = document.querySelector('.search-box');
        if (searchBox) {
            searchBox.parentNode.insertBefore(dayFilterContainer, searchBox.nextSibling);
        } else {
            // Fallback - add to the sidebar
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.appendChild(dayFilterContainer);
            }
        }
    }
    
    // Create the filter UI
    dayFilterContainer.innerHTML = `
        <div class="filter-header">Day Filters</div>
        <div class="day-filters">
            <label><input type="checkbox" data-day="0" checked> Mon</label>
            <label><input type="checkbox" data-day="1" checked> Tue</label>
            <label><input type="checkbox" data-day="2" checked> Wed</label>
            <label><input type="checkbox" data-day="3" checked> Thu</label>
            <label><input type="checkbox" data-day="4" checked> Fri</label>
            <label><input type="checkbox" data-day="5" checked> Sat</label>
            <label><input type="checkbox" data-day="6" checked> Sun</label>
        </div>
        <div class="filter-actions">
            <button id="selectAllDays">Select All</button>
            <button id="clearAllDays">Clear All</button>
        </div>
    `;
    
    // Add event listeners to checkboxes
    const dayCheckboxes = dayFilterContainer.querySelectorAll('input[type="checkbox"]');
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
    
    // Function to update visible days based on checkboxes
    function updateVisibleDays() {
        window.visibleDays = [];
        dayCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                window.visibleDays.push(parseInt(checkbox.dataset.day));
            }
        });
        
        // Update the table display
        updateColumnVisibility();
        
        // Redisplay courses with the new day filter
        const courses = window.coursesData || [];
        updateTimetableDisplay(courses);
    }
    
    // Function to show/hide columns based on visible days
    function updateColumnVisibility() {
        const table = document.querySelector('.timetable table');
        if (!table) return;
        
        // Get all rows
        const rows = table.querySelectorAll('tr');
        
        rows.forEach(row => {
            // Skip if it's the header row (handle separately)
            if (row.parentElement.tagName === 'THEAD') {
                const headers = row.querySelectorAll('th');
                // Skip the first column (time column)
                for (let i = 1; i < headers.length; i++) {
                    const dayIndex = i - 1;
                    headers[i].style.display = window.visibleDays.includes(dayIndex) ? '' : 'none';
                }
                return;
            }
            
            // Handle body rows
            const cells = row.querySelectorAll('td');
            // Skip the first column (time column)
            for (let i = 1; i < cells.length; i++) {
                const dayIndex = i - 1;
                cells[i].style.display = window.visibleDays.includes(dayIndex) ? '' : 'none';
            }
        });
    }
    
    // Initialize column visibility
    updateColumnVisibility();
}