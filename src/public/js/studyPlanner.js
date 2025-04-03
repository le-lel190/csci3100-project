document.addEventListener('DOMContentLoaded', () => {
    window.visibleDays = [0, 1, 2, 3, 4, 5, 6]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    
    loadUserInfo();
    setupLogout();
    initializeSemesterButtons();
    initializeSearch();
    setupDemoButton();
    loadCourseData();
    setupDragAndDrop();
    setupAddYearButton();
    updateProgressBars();
});

function setupDemoButton() {
    const demoButton = document.getElementById('loadDemoButton');
    if (demoButton) {
        demoButton.addEventListener('click', () => {
            demoButton.textContent = 'Loading Demo...';
            demoButton.disabled = true;
            
            const semesterButtons = document.querySelectorAll('.semester-btn');
            semesterButtons.forEach(btn => btn.classList.remove('active'));
            
            loadDemoDataFromAPI()
                .finally(() => {
                    demoButton.textContent = 'Load Demo Data';
                    demoButton.disabled = false;
                });
        });
    }
}

function loadCourseData(semester = 'current') {
    const courseItems = document.querySelector('.course-items');
    courseItems.innerHTML = '<div class="loading-indicator">Loading courses...</div>';

    fetch(`/api/courses/${semester}`)
        .then(response => {
            if (!response.ok) throw new Error(`Failed to load ${semester} data`);
            return response.json();
        })
        .then(courses => {
            window.coursesData = courses;
            populateCourseList(courses);
        })
        .catch(error => {
            console.error('Error loading course data:', error);
            courseItems.innerHTML = `<div class="error-message">Failed to load courses: ${error.message}<button id="loadDemoData">Load Demo Data</button></div>`;
            document.getElementById('loadDemoData').addEventListener('click', loadDemoDataFromAPI);
        });
}

function loadDemoDataFromAPI() {
    return fetch('/api/courses/demo')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load demo data');
            return response.json();
        })
        .then(courses => {
            window.coursesData = courses;
            populateCourseList(courses);
        })
        .catch(error => {
            console.error('Error loading demo data:', error);
            loadDemoData();
        });
}

function loadDemoData() {
    const courses = [
        { id: 'CSCI 3100', name: 'Software Engineering', color: '#c2e0c6', selected: true, type: 'Major' },
        { id: 'CSCI 3180', name: 'Principles of Programming Languages', color: '#d0e0f0', selected: true, type: 'Major' },
        { id: 'CSCI 3250', name: 'Computers and Society', color: '#f0e0d0', selected: true, type: 'UG Core' },
        { id: 'CSCI 3251', name: 'Engineering Practicum', color: '#e0d0f0', selected: true, type: 'UG Core' },
        { id: 'CSCI 4430', name: 'Data Communication and Computer Networks', color: '#e0f0d0', selected: true, type: 'Major' },
        { id: 'GESC 1000', name: 'College Assembly', color: '#f0d0e0', selected: true, type: 'Free' },
        { id: 'STAT 2005', name: 'Statistics', color: '#d0f0e0', selected: true, type: 'Free' }
    ];
    window.coursesData = courses;
    populateCourseList(courses);
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
        courseItem.draggable = true;
        courseItem.dataset.courseId = course.id;

        courseItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', course.id);
        });

        courseItem.querySelector('input').addEventListener('change', (e) => {
            course.selected = e.target.checked;
        });

        courseItems.appendChild(courseItem);
    });
}

function initializeSemesterButtons() {
    const buttons = document.querySelectorAll('.semester-btn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
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

function setupDragAndDrop() {
    const cells = document.querySelectorAll('.timetable td:not(:first-child)');
    cells.forEach(cell => {
        cell.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (cell.querySelectorAll('.course-block').length < parseInt(cell.dataset.maxCourses || Infinity)) {
                cell.classList.add('drag-over');
            }
        });

        cell.addEventListener('dragleave', () => {
            cell.classList.remove('drag-over');
        });

        cell.addEventListener('drop', (e) => {
            e.preventDefault();
            cell.classList.remove('drag-over');
            if (cell.querySelectorAll('.course-block').length >= parseInt(cell.dataset.maxCourses || Infinity)) return;

            const courseId = e.dataTransfer.getData('text/plain');
            const course = window.coursesData.find(c => c.id === courseId);
            if (course) {
                const courseBlock = document.createElement('div');
                courseBlock.className = 'course-block';
                courseBlock.dataset.courseId = course.id;
                courseBlock.style.backgroundColor = course.color || '#f0e6ff'; // Update to use purple theme
                courseBlock.innerHTML = `
                    <div class="course-title">${course.id}</div>
                    <div class="course-name">${course.name}</div>
                `;
                cell.appendChild(courseBlock);
                updateProgressBars();
            }
        });
    });
}

function setupAddYearButton() {
    const addYearBtn = document.getElementById('addYearBtn');
    let yearCount = 4; // Starting with 4 years
    const MAX_YEARS = 8; // Maximum number of years allowed
    
    // Update button state on initialization
    updateAddYearButtonState();
    
    addYearBtn.addEventListener('click', () => {
        if (yearCount >= MAX_YEARS) {
            return; // Don't add more years if maximum is reached
        }
        
        yearCount++;
        const thead = document.querySelector('.timetable thead tr');
        const th = document.createElement('th');
        th.textContent = `Year ${yearCount}`;
        thead.appendChild(th);

        const tbody = document.querySelector('.timetable tbody');
        tbody.querySelectorAll('tr').forEach(row => {
            const td = document.createElement('td');
            td.dataset.year = yearCount;
            td.dataset.semester = row.cells[0].textContent.split(' ')[1] || '1';
            td.dataset.maxCourses = row.cells[1].dataset.maxCourses; // Copy max courses from existing cell
            row.appendChild(td);
            td.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (td.querySelectorAll('.course-block').length < parseInt(td.dataset.maxCourses || Infinity)) {
                    td.classList.add('drag-over');
                }
            });
            td.addEventListener('dragleave', () => {
                td.classList.remove('drag-over');
            });
            td.addEventListener('drop', (e) => {
                e.preventDefault();
                td.classList.remove('drag-over');
                if (td.querySelectorAll('.course-block').length >= parseInt(td.dataset.maxCourses || Infinity)) return;

                const courseId = e.dataTransfer.getData('text/plain');
                const course = window.coursesData.find(c => c.id === courseId);
                if (course) {
                    const courseBlock = document.createElement('div');
                    courseBlock.className = 'course-block';
                    courseBlock.dataset.courseId = course.id;
                    courseBlock.style.backgroundColor = course.color || '#f0e6ff'; // Update to use purple theme
                    courseBlock.innerHTML = `
                        <div class="course-title">${course.id}</div>
                        <div class="course-name">${course.name}</div>
                    `;
                    td.appendChild(courseBlock);
                    updateProgressBars();
                }
            });
        });
        
        // Update button state after adding a year
        updateAddYearButtonState();
    });
    
    // Function to update the button state based on current year count
    function updateAddYearButtonState() {
        if (yearCount >= MAX_YEARS) {
            addYearBtn.disabled = true;
            addYearBtn.classList.add('disabled');
            addYearBtn.title = 'Maximum of 8 years reached';
        } else {
            addYearBtn.disabled = false;
            addYearBtn.classList.remove('disabled');
            addYearBtn.title = 'Add another year to your study plan';
        }
    }
}

function updateProgressBars() {
    const courseBlocks = document.querySelectorAll('.timetable .course-block');
    let majorCredits = 0, ugCoreCredits = 0, freeCredits = 0;

    courseBlocks.forEach(block => {
        const courseId = block.dataset.courseId;
        const course = window.coursesData.find(c => c.id === courseId);
        if (course) {
            switch (course.type) {
                case 'Major': majorCredits += 3; break;
                case 'UG Core': ugCoreCredits += 3; break;
                case 'Free': freeCredits += 3; break;
            }
        }
    });

    const totalCredits = 120, majorTotal = 80, ugCoreTotal = 30, freeTotal = 10;

    document.getElementById('majorCredits').textContent = majorCredits;
    document.getElementById('majorProgress').style.width = `${Math.min((majorCredits / majorTotal) * 100, 100)}%`;

    document.getElementById('ugCoreCredits').textContent = ugCoreCredits;
    document.getElementById('ugCoreProgress').style.width = `${Math.min((ugCoreCredits / ugCoreTotal) * 100, 100)}%`;

    document.getElementById('freeCredits').textContent = freeCredits;
    document.getElementById('freeProgress').style.width = `${Math.min((freeCredits / freeTotal) * 100, 100)}%`;

    const totalCompleted = majorCredits + ugCoreCredits + freeCredits;
    document.getElementById('totalCredits').textContent = totalCompleted;
    document.getElementById('totalProgress').style.width = `${Math.min((totalCompleted / totalCredits) * 100, 100)}%`;
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