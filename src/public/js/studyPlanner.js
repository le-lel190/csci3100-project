document.addEventListener('DOMContentLoaded', () => { 
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
        console.log(`Course ${course.id}: Units = ${course.units}, Type = ${course.type}`); // Debug log

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
            const courseId = item.querySelector('input[type="checkbox"]')?.id;
            
            // Standard search - check if text content contains the search term
            let isMatch = courseText.includes(searchTerm);
            
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
                // Check if the course is already in another cell in the planner
                const existingCourseBlock = document.querySelector(`.course-block[data-course-id="${courseId}"]`);
                if (existingCourseBlock) {
                    // Remove the course from its original cell
                    existingCourseBlock.remove();
                }
                const courseBlock = document.createElement('div');
                courseBlock.className = 'course-block';
                courseBlock.dataset.courseId = course.id;
                courseBlock.style.backgroundColor = course.color || '#f0e6ff'; // Update to use purple theme
                courseBlock.innerHTML = `
                    <div class="course-title">${course.id}</div>
                `;
                courseBlock.draggable = true; // Make the course block draggable
                courseBlock.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', course.id);
                    e.target.classList.add('dragging');
                });
                courseBlock.addEventListener('dragend', (e) => {
                    e.target.classList.remove('dragging');
                });
                
                cell.appendChild(courseBlock);
                updateProgressBars();
            }
        });
    });
    // Set up the search panel as a drop target
    const courseItems = document.querySelector('.course-items');
    courseItems.addEventListener('dragover', (e) => {
        e.preventDefault();
        courseItems.classList.add('drag-over');
    });

    courseItems.addEventListener('dragleave', () => {
        courseItems.classList.remove('drag-over');
    });

    courseItems.addEventListener('drop', (e) => {
        e.preventDefault();
        courseItems.classList.remove('drag-over');
        const courseId = e.dataTransfer.getData('text/plain');
        
        // Find and remove the course block from the timetable
        const courseBlock = document.querySelector(`.course-block[data-course-id="${courseId}"]`);
        if (courseBlock) {
            courseBlock.remove();
            updateProgressBars();
        }
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
                    `;
                    courseBlock.draggable = true;
                    courseBlock.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('text/plain', course.id);
                        e.target.classList.add('dragging');
                    });
                    courseBlock.addEventListener('dragend', (e) => {
                        e.target.classList.remove('dragging');
                    });
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
            const units = course.units || 0; // Use the actual units from the course data
            switch (course.type) {
                case 'Major':
                    majorCredits += units;
                    break;
                case 'UG Core':
                    ugCoreCredits += units;
                    break;
                case 'Free':
                    freeCredits += units;
                    break;
            }
        }
    });

    const totalCredits = 120, majorTotal = 80, ugCoreTotal = 30, freeTotal = 10;

    document.getElementById('majorCredits').textContent = majorCredits.toFixed(2); // Display with 2 decimal places
    document.getElementById('majorProgress').style.width = `${Math.min((majorCredits / majorTotal) * 100, 100)}%`;

    document.getElementById('ugCoreCredits').textContent = ugCoreCredits.toFixed(2);
    document.getElementById('ugCoreProgress').style.width = `${Math.min((ugCoreCredits / ugCoreTotal) * 100, 100)}%`;

    document.getElementById('freeCredits').textContent = freeCredits.toFixed(2);
    document.getElementById('freeProgress').style.width = `${Math.min((freeCredits / freeTotal) * 100, 100)}%`;

    const totalCompleted = majorCredits + ugCoreCredits + freeCredits;
    document.getElementById('totalCredits').textContent = totalCompleted.toFixed(2);
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
    // Show loading indicator
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'loading-indicator';
    loadingMessage.textContent = 'Generating study plan image...';
    document.body.appendChild(loadingMessage);

    // Get the "Your Study Plan" section
    const studyPlanSection = document.querySelector('.timetable');
    if (!studyPlanSection) {
        console.error('Study Plan section not found');
        document.body.removeChild(loadingMessage);
        alert('Failed to generate study plan image: Study Plan section not found.');
        return;
    }

    // Clone the study plan section
    const containerClone = document.createElement('div');
    containerClone.style.position = 'absolute';
    containerClone.style.left = '-9999px';
    containerClone.style.top = '0';
    containerClone.style.backgroundColor = '#ffffff';
    containerClone.style.padding = '0'; // We'll add padding later for A4

    const studyPlanClone = studyPlanSection.cloneNode(true);
    studyPlanClone.id = 'study-plan-clone';
    studyPlanClone.style.width = 'auto';
    studyPlanClone.style.height = 'auto';
    studyPlanClone.style.overflow = 'visible';
    studyPlanClone.style.transform = 'none';
    studyPlanClone.style.zIndex = '-9999';
    studyPlanClone.style.backgroundColor = '#ffffff';

    // Ensure the table inside the clone is fully visible
    const tableElement = studyPlanClone.querySelector('table');
    if (tableElement) {
        tableElement.style.width = 'auto'; // Allow the table to expand to its natural width
        tableElement.style.height = 'auto';
        tableElement.style.overflow = 'visible';
        tableElement.style.tableLayout = 'auto'; // Let the table adjust to content
        tableElement.style.borderCollapse = 'collapse';
    }

    // Style headers and cells for printing
    studyPlanClone.querySelectorAll('th').forEach(th => {
        th.style.backgroundColor = '#f0e6ff';
        th.style.color = '#663399';
        th.style.fontWeight = 'bold';
        th.style.padding = '25px';
        th.style.fontSize = '30px';
        th.style.border = '2px solid #dcdde1';
        th.style.height = '80px';
        th.style.whiteSpace = 'nowrap'; // Prevent text wrapping
    });

    studyPlanClone.querySelectorAll('td').forEach(td => {
        td.style.overflow = 'visible';
        td.style.height = '150px';
        td.style.padding = '15px';
        td.style.fontSize = '24px';
        td.style.border = '2px solid #dcdde1';
        td.style.boxSizing = 'border-box';
    });

    // Style course blocks
    studyPlanClone.querySelectorAll('.course-block').forEach(block => {
        block.style.padding = '12px';
        block.style.margin = '6px 0';
        block.style.border = '2px solid #663399';
        block.style.borderRadius = '6px';
        block.style.fontSize = '24px';
        block.style.minHeight = '60px';
        block.style.display = 'block';
        block.style.width = 'auto'; // Ensure course blocks fit their content
    });

    // Append the clone to the container
    containerClone.appendChild(studyPlanClone);
    document.body.appendChild(containerClone);

    // A4 dimensions in pixels at 300 DPI
    const A4_WIDTH = 2480; // 210mm at 300 DPI
    const A4_HEIGHT = 3508; // 297mm at 300 DPI

    // Get semester name for the title and filename
    const activeBtn = document.querySelector('.semester-btn.active');
    const semesterName = activeBtn ? activeBtn.textContent : 'Study Plan';

    // Add a title and date
    const titleDiv = document.createElement('div');
    titleDiv.style.textAlign = 'center';
    titleDiv.style.marginBottom = '50px';
    titleDiv.style.padding = '30px';
    titleDiv.style.borderBottom = '3px solid #663399';

    const date = new Date();
    const dateString = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    titleDiv.innerHTML = `
        <h1 style="margin:0;color:#663399;font-size:48px;font-weight:bold;">
            ${semesterName} Study Plan
        </h1>
        <p style="margin:5px 0 0;color:#7f8c8d;font-size:24px;">
            Generated on ${dateString}
        </p>
    `;
    containerClone.insertBefore(titleDiv, containerClone.firstChild);

    // Calculate natural dimensions after adding the title
    const naturalWidth = containerClone.scrollWidth;
    const naturalHeight = containerClone.scrollHeight;

    // Adjust scaling to fit within A4, ensuring all years are visible
    const padding = 40;
    const availableWidth = A4_WIDTH - 2 * padding;
    const availableHeight = A4_HEIGHT - titleDiv.scrollHeight - 2 * padding;

    // Scale to fit the width, ensuring all years are visible
    let scale = availableWidth / naturalWidth;
    const scaledHeight = naturalHeight * scale;

    // If the scaled height exceeds the available height, adjust the scale
    if (scaledHeight > availableHeight) {
        scale = availableHeight / naturalHeight;
    }

    // Apply a minimum scale to ensure readability
    scale = Math.max(scale, 0.8); // Reduced minimum scale to ensure all years fit

    // Apply padding and set container dimensions
    containerClone.style.padding = `${padding}px`;
    containerClone.style.width = `${A4_WIDTH}px`;
    containerClone.style.height = `${A4_HEIGHT}px`;

    // Apply scaling to the study plan clone
    const contentContainer = document.createElement('div');
    contentContainer.style.transform = `scale(${scale})`;
    contentContainer.style.transformOrigin = 'top left';
    contentContainer.style.width = `${naturalWidth}px`;
    contentContainer.style.height = `${naturalHeight - titleDiv.scrollHeight}px`;

    // Move studyPlanClone into contentContainer
    while (containerClone.children.length > 1) {
        contentContainer.appendChild(containerClone.children[1]);
    }
    containerClone.appendChild(contentContainer);

    // Center the content if necessary
    const scaledWidth = naturalWidth * scale;
    if (scaledWidth < availableWidth) {
        contentContainer.style.marginLeft = `${(availableWidth - scaledWidth) / 2}px`;
    }

    // Use html2canvas to capture the clone
    html2canvas(containerClone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: A4_WIDTH,
        height: A4_HEIGHT,
        scrollX: 0,
        scrollY: 0,
        windowWidth: A4_WIDTH,
        windowHeight: A4_HEIGHT,
        logging: true,
        onclone: (clonedDoc) => {
            const finalClone = clonedDoc.getElementById('study-plan-clone');
            if (finalClone) {
                finalClone.style.overflow = 'visible';
                finalClone.style.width = 'auto';
                finalClone.style.height = 'auto';
                finalClone.querySelectorAll('table').forEach(table => {
                    table.style.overflow = 'visible';
                    table.style.width = 'auto';
                    table.style.height = 'auto';
                });
            }
        }
    }).then(canvas => {
        // Convert canvas to data URL
        const imgData = canvas.toDataURL('image/png');

        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = imgData;

        // Format filename with date
        const semesterFilename = semesterName.replace(/\s+/g, '_').toLowerCase();
        const dateStr = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        downloadLink.download = `${semesterFilename}_study_plan_${dateStr}_A4.png`;

        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // Clean up
        document.body.removeChild(containerClone);
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
        successMessage.textContent = 'Study Plan image saved successfully!';
        document.body.appendChild(successMessage);

        // Remove success message after 3 seconds
        setTimeout(() => {
            document.body.removeChild(successMessage);
        }, 3000);
    }).catch(error => {
        console.error('Error generating study plan image:', error);

        // Clean up
        document.body.removeChild(containerClone);
        document.body.removeChild(loadingMessage);

        // Show error message
        alert('Failed to generate study plan image. Please try again.');
    });
}