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
    headerRow.appendChild(timeHeader);
    
    // Add day headers
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    days.forEach(day => {
        const dayHeader = document.createElement('th');
        dayHeader.textContent = day;
        headerRow.appendChild(dayHeader);
    });
    
    thead.appendChild(headerRow);
    
    // Create time slots
    const startTime = 8 * 60 + 30; // 8:30 AM
    const endTime = 19 * 60 + 30; // now shows 6:30 PM
    const interval = 60; // 60 minutes per slot (1 hour)

    for (let time = startTime; time < endTime; time += interval) {
        const row = document.createElement('tr');
        const timeCell = document.createElement('td');
        
        const hours = Math.floor(time / 60);
        const minutes = time % 60;
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        timeCell.textContent = formattedTime;
        
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
            item.style.display = courseText.includes(searchTerm) ? 'block' : 'none';
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
        
        courseItem.innerHTML = `
            <input type="checkbox" id="${course.id}" ${course.selected ? 'checked' : ''}>
            <label for="${course.id}">
                ${course.id}
                <div class="course-name">${course.name}</div>
                ${course.isPlaceholder ? '<div class="placeholder-indicator">(Schedule TBA)</div>' : ''}
            </label>
        `;

        const checkbox = courseItem.querySelector('input');
        
        // Separate the checkbox click handling from the label hover
        checkbox.addEventListener('change', (e) => {
            course.selected = e.target.checked;
            // Update the timetable display
            updateTimetableDisplay(courses);
        });
        
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

function updateTimetableDisplay(courses) {
    // Store courses globally for filtering
    window.coursesData = courses;
    
    // Only display selected courses
    const selectedCourses = courses.filter(course => course.selected);
    displayCoursesOnTimetable(selectedCourses);
}

function showCourseDetails(course) {
    const detailsContent = document.querySelector('.details-content');
    
    let schedulesHTML = '';
    course.schedules.forEach(schedule => {
        schedulesHTML += `<p>${schedule.type}: ${schedule.day} ${schedule.start} - ${schedule.end}</p>
        <p class="location">Location: ${schedule.location}</p>`;
    });
    
    detailsContent.innerHTML = `
        <h4>${course.id}</h4>
        <p class="course-name-details">${course.name}</p>
        ${course.isPlaceholder ? '<p class="placeholder-warning">Note: Schedule information is not yet available. Times shown are placeholders.</p>' : ''}
        <div class="course-schedule">
            <p><strong>Schedule:</strong></p>
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
        // Sort schedules to ensure earlier ones render first
        const sortedSchedules = [...course.schedules].sort((a, b) => {
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
                            const lastRowIndex = Math.min(rows.length - 1, durationHours - 1);
                            const lastRow = rows[lastRowIndex];
                            
                            // Calculate height from top of first row to bottom of last row
                            const totalHeight = lastRow.offsetTop + lastRow.offsetHeight - rows[0].offsetTop - 4; // -4px for borders
                            courseElement.style.height = `${totalHeight}px`;
                        } else {
                            // Fallback to a proportional height based on duration
                            const baseRowHeight = Math.max(rows[0].offsetHeight, 60); // Minimum height of 60px
                            courseElement.style.height = `${baseRowHeight * durationHours - 4}px`;
                        }
                    } catch (e) {
                        console.error('Error calculating course block height:', e);
                        // Fallback to minimum height
                        courseElement.style.height = `${60 * durationHours - 4}px`;
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
            courseElement.innerHTML = `
                <div class="course-title">${course.id}</div>
                <div class="course-type">${schedule.type}</div>
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
                for (let i = 1; i < rows.length && i < durationHours; i++) {
                    const cell = rows[i].children[dayIndex + 1];
                    if (cell) {
                        // Mark this cell as having content from a multi-hour course above
                        cell.dataset.multiHourAbove = 'true';
                        // Also mark as occupied to prevent other courses from being placed here
                        cell.dataset.occupied = 'true';
                        
                        // Add a visual indicator that this cell is part of a multi-hour course
                        cell.style.backgroundColor = 'rgba(0,0,0,0.03)';
                    }
                }
            }
        });
    });
    
    // Function to find rows for a time span
    function findRowsForTimeSpan(startTimeMinutes, endTimeMinutes) {
        const rows = document.querySelectorAll('.timetable tbody tr');
        const matchingRows = [];
        
        // Add a small tolerance to handle minute differences
        const startWithTolerance = startTimeMinutes - 5;
        const endWithTolerance = endTimeMinutes + 5;
        
        for (const row of rows) {
            const timeCell = row.children[0];
            const [rowHours, rowMinutes] = timeCell.textContent.split(':').map(Number);
            const rowTimeInMinutes = rowHours * 60 + rowMinutes;
            
            // Get the next row's time, if available
            let nextRowTimeInMinutes = Number.MAX_SAFE_INTEGER;
            if (row.nextElementSibling) {
                const nextTimeCell = row.nextElementSibling.children[0];
                const [nextHours, nextMinutes] = nextTimeCell.textContent.split(':').map(Number);
                nextRowTimeInMinutes = nextHours * 60 + nextMinutes;
            }
            
            // Check if this row's time range overlaps with the course time range
            if (
                // Course starts in this row's time range
                (rowTimeInMinutes <= startTimeMinutes && startTimeMinutes < nextRowTimeInMinutes) ||
                // Course ends in this row's time range
                (rowTimeInMinutes < endTimeMinutes && endTimeMinutes <= nextRowTimeInMinutes) ||
                // Course completely spans this row
                (startTimeMinutes <= rowTimeInMinutes && endTimeMinutes >= nextRowTimeInMinutes)
            ) {
                matchingRows.push(row);
            }
        }
        
        return matchingRows;
    }
}

function showCourseScheduleDetails(course, schedule) {
    const detailsContent = document.querySelector('.details-content');
    detailsContent.innerHTML = `
        <h4>${course.id}</h4>
        <p class="course-name-details">${course.name}</p>
        <div class="course-schedule">
            <p><strong>Schedule Details:</strong></p>
            <p>${schedule.type}: ${schedule.day} ${schedule.start} - ${schedule.end}</p>
            <p class="location">Location: ${schedule.location}</p>
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

// Setup timetable action buttons (export and save image)
function setupTimetableActions() {
    const exportBtn = document.getElementById('exportTimetableBtn');
    const saveImageBtn = document.getElementById('saveImageBtn');

    // Export timetable button (template only, no actual functionality)
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            alert('Export functionality will be implemented in a future update.');
        });
    }

    // Save image button
    if (saveImageBtn) {
        saveImageBtn.addEventListener('click', () => {
            // Get the timetable element
            const timetableElement = document.querySelector('.timetable');
            
            if (!timetableElement) {
                alert('Could not find timetable to capture.');
                return;
            }

            // Use html2canvas library to capture the timetable as an image
            // First check if html2canvas is loaded, if not load it
            if (typeof html2canvas === 'undefined') {
                // Create script element to load html2canvas
                const script = document.createElement('script');
                script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
                script.onload = () => captureAndSaveTimetable(timetableElement);
                script.onerror = () => alert('Failed to load html2canvas library. Please try again later.');
                document.head.appendChild(script);
            } else {
                captureAndSaveTimetable(timetableElement);
            }
        });
    }
}

// Function to capture and save timetable as image
function captureAndSaveTimetable(timetableElement) {
    // Show loading message
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
    
    // Use html2canvas to capture the timetable
    html2canvas(timetableElement, {
        backgroundColor: '#f5f6fa',
        scale: 2, // Higher scale for better quality
        logging: false
    }).then(canvas => {
        // Remove loading message
        document.body.removeChild(loadingMessage);
        
        // Convert canvas to blob
        canvas.toBlob(blob => {
            // Create a ClipboardItem for copying to clipboard
            try {
                // Try to copy to clipboard (may not work in all browsers)
                const clipboardItem = new ClipboardItem({ 'image/png': blob });
                navigator.clipboard.write([clipboardItem])
                    .then(() => console.log('Image copied to clipboard'))
                    .catch(err => console.error('Error copying to clipboard:', err));
            } catch (e) {
                console.warn('Clipboard copy not supported:', e);
            }
            
            // Create download link
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            
            // Get current semester name for filename
            const activeSemester = document.querySelector('.semester-btn.active');
            const semesterName = activeSemester ? activeSemester.textContent.replace(/\s+/g, '_') : 'timetable';
            downloadLink.download = `${semesterName}.jpg`;
            
            // Trigger download
            downloadLink.click();
            
            // Clean up
            URL.revokeObjectURL(downloadLink.href);
        }, 'image/jpeg', 0.95); // High quality JPEG
    }).catch(error => {
        // Remove loading message and show error
        document.body.removeChild(loadingMessage);
        console.error('Error capturing timetable:', error);
        alert('Error capturing timetable. Please try again.');
    });
} 