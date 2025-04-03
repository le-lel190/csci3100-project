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
    setupImageExport();
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

function setupImageExport() {
    const saveImageBtn = document.getElementById('saveImageBtn');
    if (saveImageBtn) {
        saveImageBtn.addEventListener('click', captureAndSaveStudyPlan);
    }
}

function captureAndSaveStudyPlan() {
    // Get the timetable element
    const timetableElement = document.querySelector('.timetable');
    
    // Show a loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.textContent = 'Capturing study plan and formatting for A4...';
    document.body.appendChild(loadingIndicator);
    
    // Create a clone of the timetable element to modify without affecting the visible UI
    const timetableClone = timetableElement.cloneNode(true);
    timetableClone.style.position = 'absolute';
    timetableClone.style.top = '-9999px';
    timetableClone.style.left = '-9999px';
    document.body.appendChild(timetableClone);
    
    // A4 dimensions in pixels (at 300 DPI for high quality printing)
    // A4 is 210 x 297 mm which is approximately 2480 x 3508 pixels at 300 DPI
    const A4_WIDTH = 2480;
    const A4_HEIGHT = 3508;
    const A4_ASPECT_RATIO = A4_HEIGHT / A4_WIDTH; // Approximately 1.414
    
    // Ensure the clone has all content visible and properly sized
    const tableElement = timetableClone.querySelector('table');
    if (tableElement) {
        // Prepare for A4 formatting
        const headerElement = timetableClone.querySelector('.timetable-header');
        
        // Modify styles for capture
        timetableClone.style.width = `${A4_WIDTH}px`;
        timetableClone.style.backgroundColor = '#ffffff';
        timetableClone.style.padding = '20px';
        timetableClone.style.boxSizing = 'border-box';
        
        // Modify table styles
        tableElement.style.height = 'auto';
        tableElement.style.overflow = 'visible';
        tableElement.style.width = '100%';
        tableElement.style.tableLayout = 'fixed';
        tableElement.style.borderCollapse = 'collapse';
        
        // Add a title if it doesn't exist
        if (headerElement) {
            headerElement.style.textAlign = 'center';
            headerElement.style.marginBottom = '20px';
            headerElement.style.fontSize = '24px';
            
            // Find the h3 element in the header
            const headerTitle = headerElement.querySelector('h3');
            if (headerTitle) {
                headerTitle.style.fontSize = '28px';
                headerTitle.style.fontWeight = 'bold';
                headerTitle.style.color = '#663399'; // Match the primary color
            }
        }
        
        // Ensure all cells are visible and properly sized
        timetableClone.querySelectorAll('td, th').forEach(cell => {
            cell.style.overflow = 'visible';
            cell.style.height = 'auto';
            cell.style.padding = '5px';
            cell.style.fontSize = '12px';
            cell.style.border = '1px solid #dcdde1';
        });
        
        // Style the table headers
        timetableClone.querySelectorAll('th').forEach(th => {
            th.style.backgroundColor = '#f0e6ff'; // Light purple
            th.style.color = '#663399'; // Primary purple
            th.style.fontWeight = 'bold';
            th.style.padding = '8px';
            th.style.fontSize = '14px';
        });
        
        // Style course blocks for better printing
        timetableClone.querySelectorAll('.course-block').forEach(block => {
            block.style.padding = '4px';
            block.style.margin = '2px';
            block.style.border = '1px solid #663399';
            block.style.borderRadius = '3px';
            
            // Make sure course titles are visible
            const courseTitle = block.querySelector('.course-title');
            if (courseTitle) {
                courseTitle.style.fontWeight = 'bold';
                courseTitle.style.fontSize = '11px';
            }
            
            // Make sure course names are visible
            const courseName = block.querySelector('.course-name');
            if (courseName) {
                courseName.style.fontSize = '10px';
            }
        });
        
        // Get the semester name for the filename and title
        let semesterName = "Study Plan";
        const activeBtn = document.querySelector('.semester-btn.active');
        if (activeBtn) {
            semesterName = activeBtn.textContent;
        }
        
        // Add title and date to the document
        const titleDiv = document.createElement('div');
        titleDiv.style.textAlign = 'center';
        titleDiv.style.marginBottom = '20px';
        titleDiv.style.padding = '10px';
        titleDiv.style.borderBottom = '2px solid #663399';
        
        // Format current date
        const date = new Date();
        const dateString = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        titleDiv.innerHTML = `
            <h1 style="margin:0;color:#663399;font-size:28px;font-weight:bold;">
                ${semesterName} Study Plan
            </h1>
            <p style="margin:5px 0 0;color:#7f8c8d;font-size:14px;">
                Generated on ${dateString}
            </p>
        `;
        
        // Insert the title at the beginning of the clone
        timetableClone.insertBefore(titleDiv, timetableClone.firstChild);
        
        // Use html2canvas to capture the element
        html2canvas(timetableClone, {
            scale: 1, // Scale is already handled by setting dimensions
            width: A4_WIDTH,
            height: A4_WIDTH * A4_ASPECT_RATIO, // Maintain A4 aspect ratio
            scrollX: 0,
            scrollY: 0,
            windowWidth: A4_WIDTH,
            windowHeight: A4_WIDTH * A4_ASPECT_RATIO,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            onclone: function(clonedDoc) {
                // Additional adjustments to the cloned document if needed
                const clonedTable = clonedDoc.querySelector('table');
                if (clonedTable) {
                    clonedTable.style.height = 'auto';
                    clonedTable.style.maxHeight = `${A4_WIDTH * A4_ASPECT_RATIO - 200}px`; // Leave room for header/footer
                }
            }
        }).then(canvas => {
            // Remove the clone and loading indicator
            document.body.removeChild(timetableClone);
            document.body.removeChild(loadingIndicator);
            
            // Format filename
            const semesterFilename = semesterName.replace(/\s+/g, '_').toLowerCase();
            const dateStr = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            
            // Create a download link
            const link = document.createElement('a');
            link.download = `${semesterFilename}_study_plan_${dateStr}_A4.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Show a success message
            const successMsg = document.createElement('div');
            successMsg.style.position = 'fixed';
            successMsg.style.top = '20px';
            successMsg.style.left = '50%';
            successMsg.style.transform = 'translateX(-50%)';
            successMsg.style.padding = '10px 20px';
            successMsg.style.backgroundColor = '#4caf50';
            successMsg.style.color = 'white';
            successMsg.style.borderRadius = '4px';
            successMsg.style.zIndex = '1000';
            successMsg.textContent = 'Study Plan saved as A4 PNG!';
            document.body.appendChild(successMsg);
            
            // Remove the success message after 3 seconds
            setTimeout(() => {
                document.body.removeChild(successMsg);
            }, 3000);
        }).catch(error => {
            console.error('Error capturing study plan:', error);
            document.body.removeChild(timetableClone);
            document.body.removeChild(loadingIndicator);
            
            // Show error message
            alert('Failed to save study plan as image. Please try again.');
        });
    }
}