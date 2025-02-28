document.addEventListener('DOMContentLoaded', () => {
    // Initialize timetable
    createTimeSlots();
    initializeSemesterButtons();
    initializeSearch();
    loadUserInfo();
    setupLogout();

    // Sample courses based on the screenshot
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

    populateCourseList(courses);
    
    // Initially display selected courses on the timetable
    updateTimetableDisplay(courses);
});

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
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', '*', '*'];
    days.forEach(day => {
        const dayHeader = document.createElement('th');
        dayHeader.textContent = day;
        headerRow.appendChild(dayHeader);
    });
    
    thead.appendChild(headerRow);
    
    // Create time slots
    const startTime = 8 * 60 + 30; // 8:30 AM in minutes
    const endTime = 17 * 60 + 30; // 5:30 PM in minutes
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
            // Add logic to load semester-specific courses
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
        
        courseItem.innerHTML = `
            <input type="checkbox" id="${course.id}" ${course.selected ? 'checked' : ''}>
            <label for="${course.id}">
                ${course.id}
                <div class="course-name">${course.name}</div>
            </label>
        `;

        const checkbox = courseItem.querySelector('input');
        checkbox.addEventListener('change', (e) => {
            course.selected = e.target.checked;
            if (e.target.checked) {
                // Show course details
                showCourseDetails(course);
            } else {
                // Hide course details
                hideCourseDetails();
            }
            // Update the timetable display
            updateTimetableDisplay(courses);
        });

        courseItems.appendChild(courseItem);
    });
}

function updateTimetableDisplay(courses) {
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
        <div class="course-schedule">
            <p><strong>Schedule:</strong></p>
            ${schedulesHTML}
        </div>
    `;
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
            
            // Set height based on duration
            if (durationHours > 1) {
                // Calculate the actual time span in minutes
                const timeSpanMinutes = endTimeMinutes - startTimeMinutes;
                
                // Calculate the exact height by using the number of rows that the course spans
                if (rows.length > 1) {
                    const lastRowIndex = Math.min(rows.length - 1, durationHours - 1);
                    const lastRow = rows[lastRowIndex];
                    
                    // Calculate height from top of first row to bottom of last row
                    const totalHeight = lastRow.offsetTop + lastRow.offsetHeight - rows[0].offsetTop - 4; // -4px for borders
                    courseElement.style.height = `${totalHeight}px`;
                } else {
                    // Fallback to the previous calculation if only one row is found
                    const rowHeight = rows[0].offsetHeight;
                    courseElement.style.height = `${rowHeight * durationHours - 4}px`; // -4px for borders
                }
                
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
            });
            
            courseElement.addEventListener('mouseleave', () => {
                hideCourseDetails();
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