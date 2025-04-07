document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    setupLogout();
    setupDegreeSelection();
    setupCUHKRegistrationLink();
    setupInteractiveDiagramFeature();
});

function loadUserInfo() {
    fetch('/api/auth/login', { method: 'GET', credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            if (data.user) {
                document.getElementById('userUsername').textContent = data.user.username;
            } else if (data.username) {
                document.getElementById('userUsername').textContent = data.username;
            }
        })
        .catch(error => {
            console.error('Error loading user info:', error);
            window.location.href = '/';
        });
}

function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', function() {
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
            .then(response => {
                if (response.ok) {
                    window.location.href = '/';
                }
            })
            .catch(error => {
                console.error('Error during logout:', error);
            });
    });
}

function setupDegreeSelection() {
    const modal = document.getElementById('roadmapModal');
    const modalImg = document.getElementById('roadmapImage');
    const closeBtn = document.querySelector('.close-modal');
    
    // Map of degree codes to their respective paths (local or online)
    const degreeImages = {
        'CENG': 'https://www.cse.cuhk.edu.hk/wp-content/uploads/academics/ug/CENGN-2023.pdf',
        'CSCI': 'https://www.cse.cuhk.edu.hk/wp-content/uploads/academics/ug/CSCIN-2023.pdf',
        'AIST': 'https://www.cse.cuhk.edu.hk/wp-content/uploads/academics/ug/AISTN-2024.pdf',
        'CDAS': 'https://www.cdas.cuhk.edu.hk/en/curriculum'
    };
    
    // Add click event listeners to all degree items
    document.querySelectorAll('.degree-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const degree = this.getAttribute('data-degree');
            const path = degreeImages[degree];
            if (path) {
                // For all degrees now, we'll open in a new tab since they're all external links
                window.open(path, '_blank');
            }
        });
    });
    
    // Keep modal code for future use with local images
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

// New code starts here - Add interactive curriculum diagram functionality
function setupCUHKRegistrationLink() {
    const cuhkLink = document.querySelector('.cuhk-link');
    if (cuhkLink) {
        cuhkLink.addEventListener('click', function(e) {
            // Optional: Track analytics for link clicks
            console.log('CUHK Registration link clicked');
            
            // You could add more sophisticated tracking here
            // For example, sending an analytics event to your backend
            try {
                if (typeof gtag === 'function') { // If Google Analytics is available
                    gtag('event', 'click', {
                        'event_category': 'external_link',
                        'event_label': 'CUHK Registration',
                        'transport_type': 'beacon'
                    });
                }
            } catch (error) {
                console.error('Analytics tracking error:', error);
            }
            
            // Link will open in new tab due to target="_blank" in HTML
        });
    }
}

// // New function to set up interactive diagram button
// function setupInteractiveDiagramFeature() {
//     // Create a button in the sidebar to toggle the interactive diagram
//     const sidebar = document.querySelector('.sidebar');
//     if (!sidebar) return;
    
//     const interactiveSectionHeader = document.createElement('div');
//     interactiveSectionHeader.className = 'cuhk-registration-section';
//     interactiveSectionHeader.innerHTML = `
//         <h2>Interactive Features</h2>
//         <div class="cuhk-links">
//             <a href="#" class="cuhk-link interactive-diagram-btn">
//                 <i class="fas fa-project-diagram"></i>
//                 View Interactive Curriculum Diagram
//             </a>
//         </div>
//     `;
    
//     sidebar.appendChild(interactiveSectionHeader);
    
//     // Add event listener to the button
//     const interactiveDiagramBtn = document.querySelector('.interactive-diagram-btn');
//     if (interactiveDiagramBtn) {
//         interactiveDiagramBtn.addEventListener('click', function(e) {
//             e.preventDefault();
//             showInteractiveDiagramSelector();
//         });
//     }
// }

function setupInteractiveDiagramFeature() {
    // Get the button and add click event (keep existing functionality)
    const viewDiagramBtn = document.getElementById('viewInteractiveDiagramBtn');
    if (viewDiagramBtn) {
        viewDiagramBtn.addEventListener('click', function() {
            showInteractiveDiagramSelector();
        });
    }
    
    // Call function to display options directly on page load
    showInteractiveDiagramSelector(true); // true = display directly without modal
}


// bug: pop up messaage is shown which should be deleted
function showInteractiveDiagramSelector() {
    // Create a modal to select which program to display
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'diagramSelectorModal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Select a program to view interactive diagram</h2>
            <div class="program-selection">
                <button class="program-btn" data-program="CSCI">Computer Science (CSCI)</button>
                <button class="program-btn" data-program="CENG">Computer Engineering (CENG)</button>
                <button class="program-btn" data-program="AIST">Artificial Intelligence (AIST)</button>
                <button class="program-btn" data-program="CDAS">Computational Data Science (CDAS)</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Set up close button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.removeChild(modal);
    });
    
    // Set up program selection buttons
    const programBtns = modal.querySelectorAll('.program-btn');
    programBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const program = this.getAttribute('data-program');
            modal.style.display = 'none';
            document.body.removeChild(modal);
            renderInteractiveDiagram(program);
        });
    });
}

function renderInteractiveDiagram(program) {
    // Show loading state
    document.querySelector('.empty-state').style.display = 'none';
    const roadmapDisplay = document.getElementById('roadmap-display');
    roadmapDisplay.classList.remove('hidden');
    roadmapDisplay.innerHTML = '<div class="loading-indicator">Loading interactive curriculum diagram...</div>';
    
    // Create the diagram container
    setTimeout(() => {
        // Create course data for the selected program
        const courseData = getCourseData(program);
        
        // Create the diagram structure
        const diagramContainer = document.createElement('div');
        diagramContainer.className = 'curriculum-diagram-container';
        
        // Add header
        const header = document.createElement('div');
        header.className = 'diagram-header';
        header.innerHTML = `
            <h2>Department of Computer Science and Engineering</h2>
            <h3>Curriculum Flowchart for ${program} programme (for students admitted in 2023 and thereafter)</h3>
        `;
        diagramContainer.appendChild(header);
        
        // Create the semester grid
        const semesterGrid = document.createElement('div');
        semesterGrid.className = 'semester-grid';
        
        // Add semester headers
        for (let i = 1; i <= 8; i++) {
            const semHeader = document.createElement('div');
            semHeader.className = 'semester-header';
            semHeader.textContent = `Semester ${i}`;
            semesterGrid.appendChild(semHeader);
        }
        
        // Add courses to semesters
        for (let i = 1; i <= 8; i++) {
            const semColumn = document.createElement('div');
            semColumn.className = 'semester-column';
            
            // Filter courses for this semester
            const semesterCourses = courseData.filter(course => course.semester === i);
            
            // Add courses to column
            semesterCourses.forEach(course => {
                const courseBox = document.createElement('div');
                courseBox.className = 'course-box';
                courseBox.dataset.id = course.id;
                courseBox.style.backgroundColor = getColorForCourseType(course.type);
                
                courseBox.innerHTML = `
                    <div class="course-code">${course.code}</div>
                    <div class="course-credits">(${course.credits})</div>
                `;
                
                // Make the course box interactive
                courseBox.addEventListener('click', () => {
                    highlightPrerequisites(course.id, courseData);
                });
                
                semColumn.appendChild(courseBox);
            });
            
            semesterGrid.appendChild(semColumn);
        }
        
        diagramContainer.appendChild(semesterGrid);
        
        // Create the SVG overlay for arrows
        const svgContainer = document.createElement('div');
        svgContainer.className = 'svg-container';
        svgContainer.innerHTML = `
            <svg class="prerequisite-arrows" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                    refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                    </marker>
                </defs>
            </svg>
        `;
        
        // Add the container to the display
        roadmapDisplay.innerHTML = '';
        roadmapDisplay.appendChild(header);
        roadmapDisplay.appendChild(diagramContainer);
        roadmapDisplay.appendChild(svgContainer);
        
        // Draw the prerequisite arrows
        setTimeout(() => {
            drawPrerequisiteArrows(courseData);
        }, 100);
        
    }, 500); // Simulate loading delay
}

function getCourseData(program) {
    // This function returns course data for the selected program
    if (program === 'CSCI') {
        return [
            // Semester 1
            { id: 'ENGG1100', code: 'ENGG1100 / ESTR1002', name: 'Introduction to Engineering Design', credits: 3, semester: 1, type: 'pink', prereqs: [] },
            { id: 'PHYS1', code: 'PHYS/CHEM/LSCI', name: 'Science Elective 1', credits: 3, semester: 1, type: 'lightblue', prereqs: [] },
            { id: 'MATH1510', code: 'MATH1510', name: 'Calculus for Engineers', credits: 3, semester: 1, type: 'lightblue', prereqs: [] },
            { id: 'MATH1020', code: 'MATH1020', name: 'General Mathematics', credits: 3, semester: 1, type: 'red', prereqs: [] },
            
            // Semester 2
            { id: 'ENGG1120', code: 'ENGG1120 / ESTR1005', name: 'Linear Algebra for Engineers', credits: 3, semester: 2, type: 'pink', prereqs: [] },
            // either term
            { id: 'PHYS2', code: 'PHYS/CHEM/LSCI', name: 'Science Elective 2', credits: 3, semester: 2, type: 'lightblue', prereqs: ['PHYS1'] },
            { id: 'ENGG1130', code: 'ENGG1130 / ESTR1006', name: 'Multi-variable Calculus for Engineers', credits: 3, semester: 2, type: 'pink', prereqs: ['MATH1510'] },
            { id: 'ENGG2020', code: 'ENGG2020 / ESTR2104', name: 'Digital Logic and Systems', credits: 3, semester: 2, type: 'yellow', prereqs: [] },
            
            // Semester 3
            { id: 'ENGG2440', code: 'ENGG2440 / ESTR2004', name: 'Discrete Mathematics for Engineers', credits: 3, semester: 3, type: 'lightblue', prereqs: [] },
            { id: 'ENGG2760', code: 'ENGG2760 / ESTR2018', name: 'Probability for Engineers', credits: 2, semester: 3, type: 'lightblue', prereqs: [] },
            { id: 'CSCI1130', code: 'CSCI1130 / ESTR1102', name: 'Introduction to Computing Using C++', credits: 3, semester: 3, type: 'lightblue', prereqs: [] },
            
            // Semester 4
            { id: 'ENGG2780', code: 'ENGG2780 / ESTR2020', name: 'Statistics for Engineers', credits: 2, semester: 4, type: 'lightblue', prereqs: ['ENGG2760'] },
            { id: 'CENG3420', code: 'CENG3420', name: 'Computer Organization and Design', credits: 3, semester: 4, type: 'yellow', prereqs: ['ENGG2020'] },
            { id: 'CSCI2100', code: 'CSCI2100 / ESTR2102', name: 'Data Structures', credits: 3, semester: 4, type: 'yellow', prereqs: ['CSCI1130'] },
            
            // Semester 5
            { id: 'CSCI3130', code: 'CSCI3130', name: 'Formal Languages and Automata Theory', credits: 3, semester: 5, type: 'yellow', prereqs: ['ENGG2440'] },
            // 2 pre-requesiste for 3150 
            { id: 'CSCI3150', code: 'CSCI3150 / ESTR3102', name: 'Introduction to Operating Systems', credits: 3, semester: 5, type: 'yellow', prereqs: ['CENG3420'] },
            // 2 pre-requsiste for 3160
            { id: 'CSCI3160', code: 'CSCI3160', name: 'Design and Analysis of Algorithms', credits: 3, semester: 5, type: 'yellow', prereqs: ['CSCI2100'] },
            { id: 'STREAM1', code: 'Stream courses', name: 'Stream Electives', credits: 6, semester: 5, type: 'green', prereqs: [] },
            
            // Semester 6
            { id: 'CSCI3100', code: 'CSCI3100', name: 'Software Engineering', credits: 3, semester: 6, type: 'yellow', prereqs: ['CSCI1130'] },
            { id: 'CSCI3180', code: 'CSCI3180', name: 'Principles of Programming Languages', credits: 3, semester: 6, type: 'yellow', prereqs: ['CSCI2100'] },
            { id: 'CSCI3250', code: 'CSCI3250', name: 'Computers and Society', credits: 2, semester: 6, type: 'yellow', prereqs: [] },
            { id: 'CSCI3251', code: 'CSCI3251', name: 'Engineering Practicum', credits: 1, semester: 6, type: 'yellow', prereqs: ['CSCI3250'] },
            { id: 'STREAM2', code: 'Stream courses', name: 'Stream Electives', credits: 6, semester: 6, type: 'green', prereqs: [] },
            
            // Semester 7
            { id: 'CSCI4998', code: 'CSCI4998 / ESTR4998', name: 'Final Year Project I', credits: 3, semester: 7, type: 'yellow', prereqs: [] },
            { id: 'STREAM3', code: 'Stream courses', name: 'Stream Electives', credits: 6, semester: 7, type: 'green', prereqs: [] },
            
            // Semester 8
            { id: 'CSCI4999', code: 'CSCI4999 / ESTR4999', name: 'Final Year Project II', credits: 3, semester: 8, type: 'yellow', prereqs: ['CSCI4998'] },
            { id: 'STREAM4', code: 'Stream courses', name: 'Stream Electives', credits: 6, semester: 8, type: 'green', prereqs: [] }
        ];
    } else if (program === 'CENG') {
        // For other programs, return a placeholder dataset
        return [
            // Semester 1
            { id: 'ENGG1110', code: 'ENGG1110 / ESTR1002', name: 'Introduction to Engineering Design', credits: 3, semester: 1, type: 'pink', prereqs: [] },
            { id: 'PHYS1', code: 'PHYS/CHEM/LSCI', name: 'Science Elective 1', credits: 3, semester: 1, type: 'lightblue', prereqs: [] },
            { id: 'MATH1510', code: 'MATH1510', name: 'Calculus for Engineers', credits: 3, semester: 1, type: 'lightblue', prereqs: [] },
            { id: 'MATH1020', code: 'MATH1020', name: 'General Mathematics', credits: 3, semester: 1, type: 'lightblue', prereqs: [] },
            
            // Semester 2
            { id: 'ENGG1120', code: 'ENGG1120 / ESTR1005', name: 'Linear Algebra for Engineers', credits: 3, semester: 2, type: 'pink', prereqs: [] },
            // either term
            { id: 'PHYS2', code: 'PHYS/CHEM/LSCI', name: 'Science Elective 2', credits: 3, semester: 2, type: 'lightblue', prereqs: ['PHYS1'] },
            { id: 'ENGG1130', code: 'ENGG1130 / ESTR1006', name: 'Multi-variable Calculus for Engineers', credits: 3, semester: 2, type: 'pink', prereqs: ['MATH1510'] },
            { id: 'ENGG2020', code: 'ENGG2020 / ESTR2104', name: 'Digital Logic and Systems', credits: 3, semester: 2, type: 'yellow', prereqs: [] },
            
            // Semester 3
            { id: 'ENGG2720', code: 'ENGG2720 / ESTR2014', name: 'Complex Variables for Engineers', credits: 2, semester: 3, type: 'lightblue', prereqs: [] },
            { id: 'ENGG2760', code: 'ENGG2760 / ESTR2018', name: 'Probability for Engineers', credits: 2, semester: 3, type: 'lightblue', prereqs: [] },
            { id: 'CENG2010', code: 'CENG2010', name: 'Digital Logic Design Laboratory', credits: 1, semester: 3, type: 'yellow', prereqs: [] },
            { id: 'CSCI1120', code: 'CSCI1120 / ESTR1100', name: 'Introduction to Computing Using C++', credits: 2, semester: 3, type: 'lightblue', prereqs: [] },
            
            // Semester 4
            { id: 'ENGG2740', code: 'ENGG2740 / ESTR2016', name: 'Differential Equations for Engineers', credits: 2, semester: 4, type: 'lightblue', prereqs: [] },
            { id: 'ENGG2780', code: 'ENGG2780 / ESTR2020', name: 'Statistics for Engineers	', credits: 2, semester: 4, type: 'lightblue', prereqs: ['ENGG2760'] },
            { id: 'CENG2030', code: 'CENG2030', name: 'Fundamentals of Embedded Systems', credits: 3, semester: 4, type: 'yellow', prereqs: ['ENGG1110'] },
            { id: 'CENG3420', code: 'CENG3420', name: 'Computer Organization & Design', credits: 3, semester: 4, type: 'yellow', prereqs: ['ENGG2020'] },
            { id: 'CSCI2100', code: 'CSCI2100 / ESTR2102', name: 'Data Structures', credits: 3, semester: 4, type: 'yellow', prereqs: ['CSCI1120'] },
            
            // Semester 5
            { id: 'CENG2400', code: 'CENG2400 / ESTR2100', name: 'Embedded System Design', credits: 3, semester: 5, type: 'yellow', prereqs: ['ENGG2020']},
            { id: 'CSCI3150', code: 'CSCI3150 / ESTR3102', name: 'Introduction to Operating Systems', credits: 3, semester: 5, type: 'yellow', prereqs: ['CSCI2100']},
            { id: 'CSCI3190', code: 'CSCI3190', name: 'Introduction to Discrete Mathematics and Algorithms', credits: 3, semester: 5, type: 'yellow', prereqs: ['CSCI2100']},
            { id: 'ELEG2202', code: 'ELEG2202', name: 'Fundamentals of Electric Circuits', credits: 3, semester: 5, type: 'yellow', prereqs: ['ENGG2020']},

            // Semester 6
            { id: 'CSCI3100', code: 'CSCI3100', name: 'Software Engineering', credits: 3, semester: 6, type: 'yellow', prereqs: ['CSCI1120'] },
            { id: 'CSCI3250', code: 'CSCI3250', name: 'Computers and Society', credits: 2, semester: 6, type: 'yellow', prereqs: [] },
            { id: 'CSCI3251', code: 'CSCI3251', name: 'Engineering Practicum', credits: 1, semester: 6, type: 'yellow', prereqs: ['CSCI3250'] },
            { id: 'STREAM1', code: 'Stream courses', name: 'Stream Electives', credits: 6, semester: 6, type: 'green', prereqs: [] },

            
            // Semester 7
            { id: 'CSCI4998', code: 'CSCI4998 / ESTR4998', name: 'Final Year Project I', credits: 3, semester: 7, type: 'yellow', prereqs: [] },
            { id: 'STREAM2', code: 'Stream courses', name: 'Stream Electives', credits: 6, semester: 7, type: 'green', prereqs: [] },
            
            // Semester 8
            { id: 'CSCI4999', code: 'CSCI4999 / ESTR4999', name: 'Final Year Project II', credits: 3, semester: 8, type: 'yellow', prereqs: ['CSCI4998'] },
            { id: 'STREAM3', code: 'Stream courses', name: 'Stream Electives', credits: 6, semester: 8, type: 'green', prereqs: [] }
        ];        
    } else if (program === 'AIST') {
        return [
            // Semester 1
            { id: 'ENGG1100', code: 'ENGG1100 / ESTR1002', name: 'Introduction to Engineering Design', credits: 3, semester: 1, type: 'pink', prereqs: [] },
            { id: 'MATH1510', code: 'MATH1510', name: 'Calculus for Engineers', credits: 3, semester: 1, type: 'lightblue', prereqs: [] },
            { id: 'PHYS1003', code: 'PHYS1003 / PHYS110', name: 'Physics for Engineers', credits: 3, semester: 1, type: 'lightblue', prereqs: [] },
            { id: 'AIST1000', code: 'AIST1000', name: 'Introduction to AI and Data Science', credits: 1, semester: 1, type: 'yellow', prereqs: [] },

            // Semester 2
            { id: 'ENGG1120', code: 'ENGG1120 / ESTR1005', name: 'Linear Algebra for Engineers', credits: 3, semester: 2, type: 'pink', prereqs: [] },
            { id: 'ENGG1130', code: 'ENGG1130 / ESTR1006', name: 'Multi-variable Calculus for Engineers', credits: 3, semester: 2, type: 'pink', prereqs: ['MATH1510'] },
            { id: 'AIST1110', code: 'AIST1110', name: 'Programming Methodology and Data Structures', credits: 3, semester: 2, type: 'lightblue', prereqs: ['PHYS1003'] },

            // Semester 3
            { id: 'ENGG2760', code: 'ENGG2760 / ESTR2018', name: 'Probability for Engineers', credits: 2, semester: 3, type: 'lightblue', prereqs: [] },
            { id: 'ENGG2440', code: 'ENGG2440 / ESTR2004', name: 'Discrete Mathematics for Engineers', credits: 3, semester: 3, type: 'lightblue', prereqs: [] },
            { id: 'CSCI2100', code: 'CSCI2100 / ESTR2102', name: 'Data Structures', credits: 3, semester: 3, type: 'yellow', prereqs: ['AIST1110'] },

            // Semester 4
            { id: 'ENGG2780', code: 'ENGG2780 / ESTR2020', name: 'Statistics for Engineers', credits: 2, semester: 4, type: 'lightblue', prereqs: ['ENGG2760'] },
            { id: 'AIST2601', code: 'AIST2601', name: 'AI Project I', credits: 2, semester: 4, type: 'yellow', prereqs: ['CSCI2100'] },
            { id: 'AIST2602', code: 'AIST2602', name: 'AI Project II', credits: 1, semester: 4, type: 'yellow', prereqs: [] },

            // Semester 5
            { id: 'AIST3030', code: 'AIST3030', name: 'Machine Learning for AI', credits: 3, semester: 5, type: 'yellow', prereqs: ['ENGG2780'] },
            { id: 'CSCI3160', code: 'CSCI3160 / ESTR3104', name: 'Design and Analysis of Algorithms', credits: 3, semester: 5, type: 'yellow', prereqs: ['ENGG2440'] },
            { id: 'CSCI3230', code: 'CSCI3230 / ESTR3108', name: 'Fundamentals of Artificial Intelligence', credits: 3, semester: 5, type: 'yellow', prereqs: ['AIST2601'] },
            { id: 'STREAM1', code: 'Stream courses', name: 'Stream Electives', credits: 3, semester: 5, type: 'green', prereqs: [] },

            // Semester 6
            { id: 'CSCI3320', code: 'CSCI3320', name: 'Fundamentals of Machine Learning', credits: 3, semester: 6, type: 'yellow', prereqs: ['CSCI3160', 'CSCI3230'] },
            { id: 'STREAM2', code: 'Stream courses', name: 'Stream Electives', credits: 3, semester: 6, type: 'green', prereqs: [] },

            // Semester 7
            { id: 'AIST4998', code: 'AIST4998 / ESTR4998', name: 'Final Year Project I', credits: 3, semester: 7, type: 'orange', prereqs: [] },
            { id: 'STREAM3', code: 'Stream courses', name: 'Stream Electives', credits: 3, semester: 7, type: 'green', prereqs: [] },
            { id: 'AIST4010', code: 'AIST4010 / ESTR4140', name: 'AI Ethics and Society', credits: 3, semester: 7, type: 'yellow', prereqs: ['CSCI3230'] },

            // Semester 8
            { id: 'AIST4999', code: 'AIST4999 / ESTR4999', name: 'Final Year Project II', credits: 3, semester: 8, type: 'orange', prereqs: ['AIST4998'] },
            { id: 'STREAM4', code: 'Stream courses', name: 'Stream Electives', credits: 3, semester: 8, type: 'green', prereqs: [] }
        ];
    } else if (program === 'CDAS') {
        return [
            // Semester 1
            { id: 'ENGG1100', code: 'ENGG1100 / ESTR1002', name: 'Introduction to Engineering Design', credits: 3, semester: 1, type: 'pink', prereqs: [] },
            { id: 'MATH1510', code: 'MATH1510', name: 'Calculus for Engineers', credits: 3, semester: 1, type: 'lightblue', prereqs: [] },
            { id: 'PHYS1003', code: 'PHYS1003 / PHYS110', name: 'Physics for Engineers', credits: 3, semester: 1, type: 'lightblue', prereqs: [] },
            { id: 'AIST1000', code: 'AIST1000', name: 'Introduction to AI and Data Science', credits: 1, semester: 1, type: 'yellow', prereqs: [] },

            // Semester 2
            { id: 'ENGG1120', code: 'ENGG1120 / ESTR1005', name: 'Linear Algebra for Engineers', credits: 3, semester: 2, type: 'pink', prereqs: [] },
            { id: 'ENGG1130', code: 'ENGG1130 / ESTR1006', name: 'Multi-variable Calculus for Engineers', credits: 3, semester: 2, type: 'pink', prereqs: ['MATH1510'] },
            { id: 'AIST1110', code: 'AIST1110', name: 'Programming Methodology and Data Structures', credits: 3, semester: 2, type: 'lightblue', prereqs: ['PHYS1003'] },

            // Semester 3
            { id: 'ENGG2760', code: 'ENGG2760 / ESTR2018', name: 'Probability for Engineers', credits: 2, semester: 3, type: 'lightblue', prereqs: [] },
            { id: 'ENGG2440', code: 'ENGG2440 / ESTR2004', name: 'Discrete Mathematics for Engineers', credits: 3, semester: 3, type: 'lightblue', prereqs: [] },
            { id: 'CSCI2100', code: 'CSCI2100 / ESTR2102', name: 'Data Structures', credits: 3, semester: 3, type: 'yellow', prereqs: ['AIST1110'] },

            // Semester 4
            { id: 'ENGG2780', code: 'ENGG2780 / ESTR2020', name: 'Statistics for Engineers', credits: 2, semester: 4, type: 'lightblue', prereqs: ['ENGG2760'] },
            { id: 'AIST2601', code: 'AIST2601', name: 'AI Project I', credits: 2, semester: 4, type: 'yellow', prereqs: [] },
            { id: 'AIST2602', code: 'AIST2602', name: 'AI Project II', credits: 1, semester: 4, type: 'yellow', prereqs: ['AIST2601'] },

            // Semester 5
            { id: 'AIST3030', code: 'AIST3030', name: 'Machine Learning for AI', credits: 3, semester: 5, type: 'yellow', prereqs: ['ENGG2780'] },
            { id: 'CSCI3160', code: 'CSCI3160 / ESTR3104', name: 'Design and Analysis of Algorithms', credits: 3, semester: 5, type: 'yellow', prereqs: ['ENGG2440'] },
            { id: 'CSCI3230', code: 'CSCI3230 / ESTR3108', name: 'Fundamentals of Artificial Intelligence', credits: 3, semester: 5, type: 'yellow', prereqs: ['CSCI2100'] },
            { id: 'STREAM1', code: 'Stream courses', name: 'Stream Electives', credits: 3, semester: 5, type: 'green', prereqs: [] },

            // Semester 6
            { id: 'CSCI3320', code: 'CSCI3320', name: 'Fundamentals of Machine Learning', credits: 3, semester: 6, type: 'yellow', prereqs: ['ENGG2780', 'ENGG2760'] },
            { id: 'STREAM2', code: 'Stream courses', name: 'Stream Electives', credits: 3, semester: 6, type: 'green', prereqs: [] },

            // Semester 7
            { id: 'AIST4998', code: 'AIST4998 / ESTR4998', name: 'Final Year Project I', credits: 3, semester: 7, type: 'orange', prereqs: [] },
            { id: 'STREAM3', code: 'Stream courses', name: 'Stream Electives', credits: 3, semester: 7, type: 'green', prereqs: [] },

            // Semester 8
            { id: 'AIST4999', code: 'AIST4999 / ESTR4999', name: 'Final Year Project II', credits: 3, semester: 8, type: 'orange', prereqs: ['AIST4998'] },
            // 2 pre-re
            { id: 'AIST4010', code: 'AIST4010 / ESTR4140', name: 'AI Ethics and Society', credits: 3, semester: 8, type: 'yellow', prereqs: ['CSCI3320', 'CSCI3230'] },
            { id: 'STREAM4', code: 'Stream courses', name: 'Stream Electives', credits: 3, semester: 8, type: 'green', prereqs: [] }
        ];
    } else {
        return [{}];
    }
}

function getColorForCourseType(type) {
    const colors = {
        'pink': '#ff8aed',
        'lightblue': '#ccffff',
        'yellow': '#ffffcc',
        'green': '#ccffcc',
        'orange': '#ffa64d',
        'red': '#ffcccc'
    };
    return colors[type] || '#ffffff';
}

function highlightPrerequisites(courseId, courseData) {
    // Reset all course highlights
    document.querySelectorAll('.course-box').forEach(box => {
        box.classList.remove('highlight-course', 'highlight-prereq');
    });
    
    // Highlight the selected course
    const selectedCourse = document.querySelector(`.course-box[data-id="${courseId}"]`);
    if (selectedCourse) {
        selectedCourse.classList.add('highlight-course');
    }
    
    // Find and highlight prerequisites recursively
    highlightPrereqsRecursive(courseId, courseData);
}

function highlightPrereqsRecursive(courseId, courseData) {
    const course = courseData.find(c => c.id === courseId);
    if (course && course.prereqs && course.prereqs.length > 0) {
        course.prereqs.forEach(prereqId => {
            const prereqElement = document.querySelector(`.course-box[data-id="${prereqId}"]`);
            if (prereqElement) {
                prereqElement.classList.add('highlight-prereq');
                // Recursively highlight prerequisites of prerequisites
                highlightPrereqsRecursive(prereqId, courseData);
            }
        });
    }
}

function drawPrerequisiteArrows(courseData) {
    const svg = document.querySelector('.prerequisite-arrows');
    if (!svg) return;
    
    // Clear any existing arrows
    const existingPaths = svg.querySelectorAll('path');
    existingPaths.forEach(path => path.remove());
    
    // Draw arrows for each course with prerequisites
    courseData.forEach(course => {
        if (course.prereqs && course.prereqs.length > 0) {
            const targetElement = document.querySelector(`.course-box[data-id="${course.id}"]`);
            
            course.prereqs.forEach(prereqId => {
                const sourceElement = document.querySelector(`.course-box[data-id="${prereqId}"]`);
                
                if (sourceElement && targetElement) {
                    drawArrow(svg, sourceElement, targetElement);
                }
            });
        }
    });
}

function drawArrow(svg, sourceElement, targetElement) {
    // Get positions relative to the viewport
    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    
    // Calculate positions relative to the SVG
    const startX = sourceRect.left + sourceRect.width/2 - svgRect.left;
    const startY = sourceRect.bottom - svgRect.top;
    const endX = targetRect.left + targetRect.width/2 - svgRect.left;
    const endY = targetRect.top - svgRect.top;
    
    // Create the path element
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Define curve parameters
    const curveControlY = (startY + endY) / 2;
    
    // Set path attributes
    path.setAttribute('d', `M${startX},${startY} C${startX},${curveControlY} ${endX},${curveControlY} ${endX},${endY}`);
    path.setAttribute('stroke', '#666');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arrowhead)');
    
    // Add path to SVG
    svg.appendChild(path);
}
