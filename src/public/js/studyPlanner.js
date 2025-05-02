document.addEventListener('DOMContentLoaded', () => { 
    loadUserInfo();
    setupLogout();
    initializeSearch();
    setupDemoButton();
    loadCourseData('current');
    setupDragAndDrop();
    setupYearButtons();
    updateProgressBars();
    setupImageExport();
    setupSaveButton();
    
    // Chain loadCourseData and loadUserStudyPlan
    loadCourseData('current')
        .then(() => {
            console.log('Course data loaded successfully, now loading user study plan...');
            loadUserStudyPlan();
        })
        .catch(error => {
            console.error('Failed to load course data:', error);
            // Even if course data fails to load, we can still try to load the study plan
            // But we'll need to handle the undefined window.coursesData case in loadUserStudyPlan
            loadUserStudyPlan();
        });
});

function setupDemoButton() {
    const demoButton = document.getElementById('loadDemoButton');
    if (demoButton) {
        demoButton.addEventListener('click', () => {
            demoButton.textContent = 'Loading Demo...';
            demoButton.disabled = true;
            
            const semesterButtons = document.querySelectorAll('.semester-btn');
            semesterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Call loadDemoData directly instead of loadDemoDataFromAPI
            loadDemoData();
            
            // Re-enable the button after loading
            demoButton.textContent = 'Load Demo Data';
            demoButton.disabled = false;
        });
    }
}

function loadCourseData(semester = 'current') {
    return new Promise((resolve, reject) => {
        const courseItems = document.querySelector('.course-items');
        courseItems.innerHTML = '<div class="loading-indicator">Loading courses...</div>';

        fetch(`/api/courses/${semester}`)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load ${semester} data`);
                return response.json();
            })
            .then(fetchedCourses => {
                // Merge fetched courses with demo courses
                // Use a Map to avoid duplicates, prioritizing fetched courses
                const courseMap = new Map();

                // Add fetched courses first (they take precedence)
                fetchedCourses.forEach(course => {
                    courseMap.set(course.id, course);
                });

                // Add demo courses, but only if they don't already exist
                DEMO_COURSES.forEach(demoCourse => {
                    if (!courseMap.has(demoCourse.id)) {
                        courseMap.set(demoCourse.id, demoCourse);
                    }
                });

                // Convert the Map back to an array
                window.coursesData = Array.from(courseMap.values());
                populateCourseList(window.coursesData);
                resolve();
            })
            .catch(error => {
                console.error('Error loading course data:', error);
                courseItems.innerHTML = `<div class="error-message">Failed to load courses: ${error.message}<button id="loadDemoData">Load Demo Data</button></div>`;
                document.getElementById('loadDemoData').addEventListener('click', loadDemoData);
                reject(error);
            });
    });
}
/* remove this*/
/*
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
*/
// Define demo courses as a constant at the top of studyPlanner.js
const DEMO_COURSES = [
    { id: 'CSCI 3100', name: 'Software Engineering', units: 3, color: '#d0e0f0', selected: true, type: 'Major' },
    { id: 'CSCI 3180', name: 'Principles of Programming Lang', units: 3, color: '#f0e0d0', selected: true, type: 'Major' },
    { id: 'CSCI 3250', name: 'Computers and Society', units: 2, color: '#e0d0f0', selected: true, type: 'Major' },
    { id: 'CSCI 3251', name: 'Engineering Practicum', units: 1, color: '#e0f0d0', selected: true, type: 'Major' },
    { id: 'CSCI 3320', name: 'Fund. of Machine Learning', units: 3, color: '#f0d0e0', selected: true, type: 'Major' },
    { id: 'ELTU 3014', name: 'English for ERG Studs II', units: 2, color: '#c2e0c6', selected: true, type: 'UG Core' },
    { id: 'STAT 2005', name: 'Programming Lang for Stat', units: 3, color: '#f0e0d0', selected: true, type: 'Major' },
    { id: 'UGCP 1001', name: 'Understanding China', units: 1, color: '#e0d0f0', selected: true, type: 'UG Core' },
    { id: 'CSCI 3130', name: 'Formal Lang & Automata Theory', units: 3, color: '#e0f0d0', selected: true, type: 'Major' },
    { id: 'CSCI 3150', name: 'Intro to Operating Systems', units: 3, color: '#f0d0e0', selected: true, type: 'Major' },
    { id: 'CSCI 3160', name: 'Design & Analysis of Algo', units: 3, color: '#d0f0e0', selected: true, type: 'Major' },
    { id: 'CSCI 3230', name: 'Fundamentals of AI', units: 3, color: '#f0d0d0', selected: true, type: 'Major' },
    { id: 'GECC 3230', name: 'Service-Learning Programme', units: 3, color: '#c2e0c6', selected: true, type: 'College' },
    { id: 'UGEC 1511', name: 'Perspectives in Economics', units: 3, color: '#d0e0f0', selected: true, type: 'UG Core' },
    { id: 'CENG 3420', name: 'Computer Organization & Design', units: 3, color: '#f0e0d0', selected: true, type: 'Major' },
    { id: 'CSCI 2100', name: 'Data Structures', units: 3, color: '#e0d0f0', selected: true, type: 'Major' },
    { id: 'ELTU 2014', name: 'English for ERG Studs I', units: 3, color: '#e0f0d0', selected: true, type: 'UG Core' },    
    { id: 'ENGG 2780', name: 'Statistics for Engineers', units: 2, color: '#c2e0c6', selected: true, type: 'Major' },
    { id: 'UGED 1111', name: 'Logic', units: 2, color: '#d0e0f0', selected: true, type: 'UG Core' },
    { id: 'CHLT 1002', name: 'University Chinese II', units: 2, color: '#f0e0d0', selected: true, type: 'UG Core' },
    { id: 'CSCI 1130', name: 'Intro to Computing Using Java', units: 3, color: '#e0d0f0', selected: true, type: 'Major' },
    { id: 'ENGG 2440', name: 'Discrete Math for Engineers', units: 3, color: '#e0f0d0', selected: true, type: 'Major' },
    { id: 'ENGG 2760', name: 'Probability for Engineers', units: 2, color: '#f0d0e0', selected: true, type: 'Major' },
    { id: 'UGEA 2100', name: 'Outline of Chinese Culture', units: 2, color: '#d0f0e0', selected: true, type: 'UG Core' },
    { id: 'UGFH 1000', name: 'In Dialogue with Humanity', units: 3, color: '#e0d0f0', selected: true, type: 'UG Core' },
    { id: 'UGCP 1002', name: 'HK-Wider Constitutional Order', units: 1, color: '#f0d0e0', selected: true, type: 'UG Core' },
    { id: 'UGFN 1000', name: 'In Dialogue With Nature', units: 3, color: '#f0d0d0', selected: true, type: 'UG Core' },
    { id: 'ELTU 1001', name: 'Foundation Eng for Uni Studies', units: 3, color: '#d0e0f0', selected: true, type: 'UG Core' },
    { id: 'ENGG 1120', name: 'Linear Algebra for Engineers', units: 3, color: '#c2e0c6', selected: true, type: 'Major' },
    { id: 'ENGG 1130', name: 'Multivariable Calculus for Eng', units: 3, color: '#c2e0c6', selected: true, type: 'Major' },
    { id: 'ENGG 2020', name: 'Digital Logic and Systems', units: 3, color: '#d0e0f0', selected: true, type: 'Major' },
    { id: 'MAEG 1020', name: 'Comput\'nal Design & Fabric\'n', units: 3, color: '#e0d0f0', selected: true, type: 'Free' },
    { id: 'PHED 1031', name: 'Tennis (Men)', units: 1, color: '#e0f0d0', selected: true, type: 'UG Core' },
    { id: 'CHLT 1001', name: 'University Chinese I', units: 3, color: '#f0d0e0', selected: true, type: 'UG Core' },
    { id: 'ENGG 1003', name: 'Digit. Lit. & Comp. Thinking—P', units: 3, color: '#d0f0e0', selected: true, type: 'Major' },
    { id: 'ENGG 1110', name: 'Problem Solving By Programming', units: 3, color: '#f0d0d0', selected: true, type: 'Major' },
    { id: 'GECC 1130', name: 'Idea of a University', units: 2, color: '#d0f0e0', selected: true, type: 'College' },
    { id: 'GECC 1131', name: 'Idea of a University: STOT', units: 1, color: '#e0d0f0', selected: true, type: 'College' },
    { id: 'MATH 1510', name: 'Calculus for Engineers', units: 3, color: '#e0f0d0', selected: true, type: 'Major' },
    { id: 'PHED 1180', name: 'Badminton', units: 1, color: '#f0d0e0', selected: true, type: 'UG Core' },
    { id: 'PHYS 1110', name: 'Engineering Phy: Mech & Thermo', units: 3, color: '#d0f0e0', selected: true, type: 'Major' }
];
function loadDemoData() {
    // Define demo courses with name, type, and credits (units)
    const courses = [
        { id: 'CSCI 3100', name: 'Software Engineering', units: 3, color: '#d0e0f0', type: 'Major' },
        { id: 'CSCI 3180', name: 'Principles of Programming Lang', units: 3, color: '#f0e0d0', type: 'Major' },
        { id: 'CSCI 3250', name: 'Computers and Society', units: 2, color: '#e0d0f0', type: 'Major' },
        { id: 'CSCI 3251', name: 'Engineering Practicum', units: 1, color: '#e0f0d0', type: 'Major' },
        { id: 'CSCI 3320', name: 'Fund. of Machine Learning', units: 3, color: '#f0d0e0', type: 'Major' },
        { id: 'ELTU 3014', name: 'English for ERG Studs II', units: 2, color: '#c2e0c6', type: 'UG Core' },
        { id: 'STAT 2005', name: 'Programming Lang for Stat', units: 3, color: '#f0e0d0', type: 'Major' },
        { id: 'UGCP 1001', name: 'Understanding China', units: 1, color: '#e0d0f0', type: 'UG Core' },
        { id: 'CSCI 3130', name: 'Formal Lang & Automata Theory', units: 3, color: '#e0f0d0', type: 'Major' },
        { id: 'CSCI 3150', name: 'Intro to Operating Systems', units: 3, color: '#f0d0e0', type: 'Major' },
        { id: 'CSCI 3160', name: 'Design & Analysis of Algo', units: 3, color: '#d0f0e0', type: 'Major' },
        { id: 'CSCI 3230', name: 'Fundamentals of AI', units: 3, color: '#f0d0d0', type: 'Major' },
        { id: 'GECC 3230', name: 'Service-Learning Programme', units: 3, color: '#c2e0c6', type: 'College' },
        { id: 'UGEC 1511', name: 'Perspectives in Economics', units: 3, color: '#d0e0f0', type: 'UG Core' },
        { id: 'CENG 3420', name: 'Computer Organization & Design', units: 3, color: '#f0e0d0', type: 'Major' },
        { id: 'CSCI 2100', name: 'Data Structures', units: 3, color: '#e0d0f0', type: 'Major' },
        { id: 'ELTU 2014', name: 'English for ERG Studs I', units: 3, color: '#e0f0d0', type: 'UG Core' },
        { id: 'ENGG 2780', name: 'Statistics for Engineers', units: 2, color: '#c2e0c6', type: 'Major' },
        { id: 'UGED 1111', name: 'Logic', units: 2, color: '#d0e0f0', type: 'UG Core' },
        { id: 'CHLT 1002', name: 'University Chinese II', units: 2, color: '#f0e0d0', type: 'UG Core' },
        { id: 'CSCI 1130', name: 'Intro to Computing Using Java', units: 3, color: '#e0d0f0', type: 'Major' },
        { id: 'ENGG 2440', name: 'Discrete Math for Engineers', units: 3, color: '#e0f0d0', type: 'Major' },
        { id: 'ENGG 2760', name: 'Probability for Engineers', units: 2, color: '#f0d0e0', type: 'Major' },
        { id: 'UGEA 2100', name: 'Outline of Chinese Culture', units: 2, color: '#d0f0e0', type: 'UG Core' },
        { id: 'UGFH 1000', name: 'In Dialogue with Humanity', units: 3, color: '#e0d0f0', type: 'UG Core' },
        { id: 'UGCP 1002', name: 'HK-Wider Constitutional Order', units: 1, color: '#f0d0e0', type: 'UG Core' },
        { id: 'UGFN 1000', name: 'In Dialogue With Nature', units: 3, color: '#f0d0d0', type: 'UG Core' },
        { id: 'ELTU 1001', name: 'Foundation Eng for Uni Studies', units: 3, color: '#d0e0f0', type: 'UG Core' },
        { id: 'ENGG 1120', name: 'Linear Algebra for Engineers', units: 3, color: '#c2e0c6', type: 'Major' },
        { id: 'ENGG 1130', name: 'Multivariable Calculus for Eng', units: 3, color: '#c2e0c6', type: 'Major' },
        { id: 'ENGG 2020', name: 'Digital Logic and Systems', units: 3, color: '#d0e0f0', type: 'Major' },
        { id: 'MAEG 1020', name: 'Comput\'nal Design & Fabric\'n', units: 3, color: '#e0d0f0', type: 'Free' },
        { id: 'PHED 1031', name: 'Tennis (Men)', units: 1, color: '#e0f0d0', type: 'UG Core' },
        { id: 'CHLT 1001', name: 'University Chinese I', units: 3, color: '#f0d0e0', type: 'UG Core' },
        { id: 'ENGG 1003', name: 'Digit. Lit. & Comp. Thinking—P', units: 3, color: '#d0f0e0', type: 'Major' },
        { id: 'ENGG 1110', name: 'Problem Solving By Programming', units: 3, color: '#f0d0d0', type: 'Major' },
        { id: 'GECC 1130', name: 'Idea of a University', units: 2, color: '#d0f0e0', type: 'College' },
        { id: 'GECC 1131', name: 'Idea of a University: STOT', units: 1, color: '#e0d0f0', type: 'College' },
        { id: 'MATH 1510', name: 'Calculus for Engineers', units: 3, color: '#e0f0d0', type: 'Major' },
        { id: 'PHED 1180', name: 'Badminton', units: 1, color: '#f0d0e0', type: 'UG Core' },
        { id: 'PHYS 1110', name: 'Engineering Phy: Mech & Thermo', units: 3, color: '#d0f0e0', type: 'Major' }
    ];

    // Store the courses in the global variable
    window.coursesData = courses;

    // Populate the course list in the sidebar
    populateCourseList(courses);

    // Pre-populate the study plan with some courses
    const timetableCells = document.querySelectorAll('.timetable td:not(:first-child)');
    timetableCells.forEach(cell => {
        cell.innerHTML = '';
    });

    const demoPlacements = [
        { courseId: 'CSCI 3100', year: 3, semester: 2 },
        { courseId: 'CSCI 3180', year: 3, semester: 2 },
        { courseId: 'CSCI 3250', year: 3, semester: 2 },
        { courseId: 'CSCI 3251', year: 3, semester: 2 },
        { courseId: 'CSCI 3320', year: 3, semester: 2 },
        { courseId: 'ELTU 3014', year: 3, semester: 2 },
        { courseId: 'STAT 2005', year: 3, semester: 2 },
        { courseId: 'UGCP 1001', year: 3, semester: 2 },
        { courseId: 'CSCI 3130', year: 3, semester: 1 },
        { courseId: 'CSCI 3150', year: 3, semester: 1 },
        { courseId: 'CSCI 3160', year: 3, semester: 1 },
        { courseId: 'CSCI 3230', year: 3, semester: 1 },
        { courseId: 'GECC 3230', year: 2, semester: 3 },
        { courseId: 'UGEC 1511', year: 3, semester: 1 },
        { courseId: 'CENG 3420', year: 2, semester: 2 },
        { courseId: 'CSCI 2100', year: 2, semester: 2 },
        { courseId: 'ELTU 2014', year: 2, semester: 2 },
        { courseId: 'ENGG 2780', year: 2, semester: 2 },
        { courseId: 'UGED 1111', year: 2, semester: 2 },
        { courseId: 'CHLT 1002', year: 2, semester: 1 },
        { courseId: 'CSCI 1130', year: 2, semester: 1 },
        { courseId: 'ENGG 2440', year: 2, semester: 1 },
        { courseId: 'ENGG 2760', year: 2, semester: 1 },
        { courseId: 'UGEA 2100', year: 2, semester: 1 },
        { courseId: 'UGFH 1000', year: 2, semester: 1 },
        { courseId: 'UGCP 1002', year: 1, semester: 3 },
        { courseId: 'UGFN 1000', year: 1, semester: 3 },
        { courseId: 'ELTU 1001', year: 1, semester: 2 },
        { courseId: 'ENGG 1120', year: 1, semester: 2 },
        { courseId: 'ENGG 1130', year: 1, semester: 2 },
        { courseId: 'ENGG 2020', year: 1, semester: 2 },
        { courseId: 'MAEG 1020', year: 1, semester: 2 },
        { courseId: 'PHED 1031', year: 1, semester: 2 },
        { courseId: 'CHLT 1001', year: 1, semester: 1 },
        { courseId: 'ENGG 1003', year: 1, semester: 1 },
        { courseId: 'ENGG 1110', year: 1, semester: 1 },
        { courseId: 'GECC 1130', year: 1, semester: 1 },
        { courseId: 'GECC 1131', year: 1, semester: 1 },
        { courseId: 'MATH 1510', year: 1, semester: 1 },
        { courseId: 'PHED 1180', year: 1, semester: 1 }
    ];

    demoPlacements.forEach(placement => {
        const { courseId, year, semester } = placement;
        const course = DEMO_COURSES.find(c => c.id === courseId);
        if (course) {
            const cell = document.querySelector(`.timetable td[data-year="${year}"][data-semester="${semester}"]`);
            if (cell && cell.querySelectorAll('.course-block').length < parseInt(cell.dataset.maxCourses || Infinity)) {
                const courseBlock = document.createElement('div');
                courseBlock.className = 'course-block';
                courseBlock.dataset.courseId = course.id;
                courseBlock.style.backgroundColor = course.color || '#f0e6ff';
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
                cell.appendChild(courseBlock);
            }
        } else {
            console.error(`Course with ID ${courseId} not found in demo data.`);
        }
    });

    updateProgressBars();
}

function populateCourseList(courses) {
    const courseItems = document.querySelector('.course-items');
    courseItems.innerHTML = '';

    courses.forEach(course => {
        console.log(`Course ${course.id}: Units = ${course.units}, Type = ${course.type}`); // Debug log

        const courseItem = document.createElement('div');
        courseItem.className = 'course-item';
        courseItem.innerHTML = `
            <div class="course-id">${course.id}</div>
            <div class="course-name">${course.name}</div>
        `;
        courseItem.draggable = true;
        courseItem.dataset.courseId = course.id;

        courseItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', course.id);
        });

        courseItems.appendChild(courseItem);
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

function setupYearButtons() {
    const addYearBtn = document.getElementById('addYearBtn');
    const removeYearBtn = document.getElementById('removeYearBtn');
    const thead = document.querySelector('.timetable thead tr');
    
    const yearHeaders = Array.from(thead.querySelectorAll('th')).filter(th => th.textContent.includes('Year'));
    let yearCount = yearHeaders.length;

    const MAX_YEARS = 8; // Maximum number of years allowed
    const MIN_YEARS = 4; // Minimum number of years allowed

    // Update button states on initialization
    updateAddYearButtonState();
    updateRemoveYearButtonState();

    // Setup Add Year Button
    addYearBtn.addEventListener('click', () => {
        if (yearCount >= MAX_YEARS) {
            return; // Don't add more years if maximum is reached
        }

        yearCount++;
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
                    // Check if the course is already in another cell in the planner
                    const existingCourseBlock = document.querySelector(`.course-block[data-course-id="${courseId}"]`);
                    if (existingCourseBlock) {
                        // Remove the course from its original cell
                        existingCourseBlock.remove();
                    }

                    const courseBlock = document.createElement('div');
                    courseBlock.className = 'course-block';
                    courseBlock.dataset.courseId = course.id;
                    courseBlock.style.backgroundColor = course.color || '#f0e6ff';
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

        // Update both button states after adding a year
        updateAddYearButtonState();
        updateRemoveYearButtonState();
    });

    // Setup Remove Year Button
    removeYearBtn.addEventListener('click', () => {
        if (yearCount <= MIN_YEARS) {
            return; // Don't remove years if minimum is reached
        }

        // Check if the last year has any courses
        const lastYearCells = document.querySelectorAll(`.timetable td[data-year="${yearCount}"]`);
        let hasCourses = false;
        lastYearCells.forEach(cell => {
            if (cell.querySelectorAll('.course-block').length > 0) {
                hasCourses = true;
            }
        });

        if (hasCourses) {
            alert('Cannot remove year with assigned courses. Please remove all courses from Year ' + yearCount + ' first.');
            return;
        }

        // Remove the last year
        thead.lastChild.remove();

        const tbody = document.querySelector('.timetable tbody');
        tbody.querySelectorAll('tr').forEach(row => {
            row.lastChild.remove();
        });

        yearCount--;

        // Update both button states after removing a year
        updateAddYearButtonState();
        updateRemoveYearButtonState();
        updateProgressBars();
    });

    // Function to update the add year button state
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

    // Function to update the remove year button state
    function updateRemoveYearButtonState() {
        if (yearCount <= MIN_YEARS) {
            removeYearBtn.disabled = true;
            removeYearBtn.classList.add('disabled');
            removeYearBtn.title = 'Minimum of 3 years required';
        } else {
            removeYearBtn.disabled = false;
            removeYearBtn.classList.remove('disabled');
            removeYearBtn.title = 'Remove the last year from your study plan';
        }
    }
}

function updateProgressBars() {
    const courseBlocks = document.querySelectorAll('.timetable .course-block');
    let majorCredits = 0, ugCoreCredits = 0, freeCredits = 0, CollegeCredits = 0;

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
                case 'College':
                    CollegeCredits += units;
                    break;
            }
        }
    });

    const totalCredits = 123, majorTotal = 75, ugCoreTotal = 33, freeTotal = 9, CollegeTotal = 6;

    document.getElementById('majorCredits').textContent = majorCredits.toFixed(2); // Display with 2 decimal places
    document.getElementById('majorProgress').style.width = `${Math.min((majorCredits / majorTotal) * 100, 100)}%`;

    document.getElementById('ugCoreCredits').textContent = ugCoreCredits.toFixed(2);
    document.getElementById('ugCoreProgress').style.width = `${Math.min((ugCoreCredits / ugCoreTotal) * 100, 100)}%`;

    document.getElementById('freeCredits').textContent = freeCredits.toFixed(2);
    document.getElementById('freeProgress').style.width = `${Math.min((freeCredits / freeTotal) * 100, 100)}%`;

    document.getElementById('CollegeCredits').textContent = CollegeCredits.toFixed(2);
    document.getElementById('CollegeProgress').style.width = `${Math.min((CollegeCredits / CollegeTotal) * 100, 100)}%`;

    const totalCompleted = majorCredits + ugCoreCredits + freeCredits + CollegeCredits;
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

// function to load the user's saved study plan
function loadUserStudyPlan() {
    console.log('Fetching user study plan...');
    fetch('/api/studyplan', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => {
        console.log('GET /api/studyplan response status:', response.status);
        console.log('GET /api/studyplan response ok:', response.ok);
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(`Failed to load study plan: ${data.error || data.message || 'Unknown error'}`);
            });
        }
        return response.json();
    })
    .then(studyPlan => {
        console.log('Loaded study plan:', studyPlan);
        // Clear the timetable
        const timetableCells = document.querySelectorAll('.timetable td:not(:first-child)');
        timetableCells.forEach(cell => {
            cell.innerHTML = '';
        });

        // If studyPlan is empty or null, just leave the timetable empty
        if (!studyPlan || studyPlan.length === 0) {
            console.log('No saved study plan found. Displaying empty timetable.');
            updateProgressBars(); // Update progress bars (will show 0 credits)
            return;
        }

        // Check if window.coursesData is defined
        if (!window.coursesData) {
            console.error('Course data not loaded. Cannot populate study plan.');
            updateProgressBars(); // Update progress bars (will show 0 credits)
            return;
        }

        // Determine the maximum year from the saved study plan
        const maxSavedYear = Math.max(...studyPlan.map(placement => placement.year), 4); // Default to 4 if no higher year
        const thead = document.querySelector('.timetable thead tr');
        let yearCount = Array.from(thead.querySelectorAll('th')).filter(th => th.textContent.includes('Year')).length;

        // Add years if the saved plan requires more than the current yearCount (up to MAX_YEARS)
        const MAX_YEARS = 8;
        while (yearCount < maxSavedYear && yearCount < MAX_YEARS) {
            yearCount++;
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
                        const existingCourseBlock = document.querySelector(`.course-block[data-course-id="${courseId}"]`);
                        if (existingCourseBlock) {
                            existingCourseBlock.remove();
                        }
                        const courseBlock = document.createElement('div');
                        courseBlock.className = 'course-block';
                        courseBlock.dataset.courseId = course.id;
                        courseBlock.style.backgroundColor = course.color || '#f0e6ff';
                        courseBlock.innerHTML = `<div class="course-title">${course.id}</div>`;
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
        }

        // Populate the timetable with the saved study plan
        studyPlan.forEach(placement => {
            const { courseId, year, semester } = placement;
            const course = window.coursesData.find(c => c.id === courseId);
            if (course) {
                const cell = document.querySelector(`.timetable td[data-year="${year}"][data-semester="${semester}"]`);
                if (cell && cell.querySelectorAll('.course-block').length < parseInt(cell.dataset.maxCourses || Infinity)) {
                    const courseBlock = document.createElement('div');
                    courseBlock.className = 'course-block';
                    courseBlock.dataset.courseId = course.id;
                    courseBlock.style.backgroundColor = course.color || '#f0e6ff';
                    courseBlock.innerHTML = `<div class="course-title">${course.id}</div>`;
                    courseBlock.draggable = true;
                    courseBlock.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('text/plain', course.id);
                        e.target.classList.add('dragging');
                    });
                    courseBlock.addEventListener('dragend', (e) => {
                        e.target.classList.remove('dragging');
                    });
                    cell.appendChild(courseBlock);
                }
            } else {
                console.error(`Course with ID ${courseId} not found in courses data.`);
            }
        });

        updateProgressBars();
    })
    .catch(error => {
        console.error('Error loading study plan:', error);
        const timetableCells = document.querySelectorAll('.timetable td:not(:first-child)');
        timetableCells.forEach(cell => {
            cell.innerHTML = '';
        });
        updateProgressBars();

        const errorMessage = document.createElement('div');
        errorMessage.style.position = 'fixed';
        errorMessage.style.top = '20px';
        errorMessage.style.left = '50%';
        errorMessage.style.transform = 'translateX(-50%)';
        errorMessage.style.padding = '12px 24px';
        errorMessage.style.backgroundColor = 'rgba(255, 0, 0, 0.9)';
        errorMessage.style.color = 'white';
        errorMessage.style.borderRadius = '4px';
        errorMessage.style.zIndex = '9999';
        errorMessage.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
        errorMessage.textContent = 'Failed to load your study plan. Please try again.';
        document.body.appendChild(errorMessage);
        setTimeout(() => {
            document.body.removeChild(errorMessage);
        }, 3000);
    });
}

// function to set up the Save button
function setupSaveButton() {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveStudyPlan);
    }
}

// New function to save the study plan
function saveStudyPlan() {
    // Collect the current study plan from the timetable
    const studyPlan = [];
    const cells = document.querySelectorAll('.timetable td:not(:first-child)');
    cells.forEach(cell => {
        const year = parseInt(cell.dataset.year);
        const semester = parseInt(cell.dataset.semester);
        const courseBlocks = cell.querySelectorAll('.course-block');
        courseBlocks.forEach(block => {
            const courseId = block.dataset.courseId;
            studyPlan.push({ courseId, year, semester });
        });
    });

    // Send the study plan to the server
    fetch('/api/studyplan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studyPlan }),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to save study plan');
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
        successMessage.textContent = 'Study Plan saved successfully!';
        document.body.appendChild(successMessage);

        setTimeout(() => {
            document.body.removeChild(successMessage);
        }, 3000);
    })
    .catch(error => {
        console.error('Error saving study plan:', error);
        alert('Failed to save your study plan. Please try again.');
    });
}