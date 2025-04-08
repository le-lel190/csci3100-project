document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    setupLogout();
    setupDegreeSelection();
    setupInteractiveDiagramFeature();
  });
  
  function loadUserInfo() {
    fetch('/api/auth/login', {
      method: 'GET',
      credentials: 'include'
    })
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
      fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
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
  
    // Add buttons to all degree items
    document.querySelectorAll('.degree-item').forEach(item => {
        const degree = item.getAttribute('data-degree');
        const button = document.createElement('button');
        button.className = 'view-pdf-btn';
        button.textContent = 'View PDF';
        button.setAttribute('data-degree', degree); // Store the degree code in the button
        item.appendChild(button);
    });

    // Add click event listeners to all degree items
    document.querySelectorAll('.degree-item').forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        const degree = this.getAttribute('data-degree');
        
        // Show interactive diagram for all programs instead of redirecting
        renderInteractiveDiagram(degree);
      });
    });


    // Add click event listeners to all PDF buttons
    document.querySelectorAll('.view-pdf-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent the parent degree-item click event
        const degree = this.getAttribute('data-degree');
        const pdfUrl = degreeImages[degree];
        if (pdfUrl) {
            window.open(pdfUrl, '_blank');
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
  
  function setupInteractiveDiagramFeature() {
    // Get the button and add click event (keep existing functionality)
    const viewDiagramBtn = document.getElementById('viewInteractiveDiagramBtn');
    if (viewDiagramBtn) {
      viewDiagramBtn.addEventListener('click', function() {
        showInteractiveDiagramSelector();
      });
    }
  }
  
  function showInteractiveDiagramSelector() {
    // Create a modal to select which program to display
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'diagramSelectorModal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2>Select a Program to View</h2>
        <div class="program-selector">
          <button class="program-btn" data-program="CENG">Computer Engineering</button>
          <button class="program-btn" data-program="CSCI">Computer Science</button>
          <button class="program-btn" data-program="AIST">Artificial Intelligence</button>
          <button class="program-btn" data-program="CDAS">Computational Data Science</button>
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
  
  function getCourseData(program) {
    // This function provides course data for each program
    if (program === 'CSCI') {
        return {
          year1: {
            semester1: [
              { code: 'ENGG1100/ESTR1002', name: 'Introduction to Engineering Design', units: 3, required: true, category: 'faculty-package' },
              { code: 'PHYS/CHEM/LSCI', name: 'Science Elective 1', units: 3, required: true, category: 'foundation-course' },
              { code: 'MATH1510', name: 'Calculus for Engineers', units: 3, required: true, category: 'foundation-course' },
              { code: 'MATH1020', name: 'General Mathematics', units: 3, required: false, category: 'foundation-course' }
            ],
            semester2: [
              { code: 'ENGG1120/ESTR1005', name: 'Linear Algebra for Engineers', units: 3, required: true, category: 'faculty-package' },
              { code: 'PHYS/CHEM/LSCI', name: 'Science Elective 2', units: 3, required: true, category: 'foundation-course' },
              { code: 'ENGG1130/ESTR1006', name: 'Multi-variable Calculus for Engineers', units: 3, required: true, category: 'faculty-package' },
              { code: 'ENGG2020/ESTR2104', name: 'Digital Logic and Systems', units: 3, required: true, category: 'major-required' }
            ]
          },
          year2: {
            semester1: [
              { code: 'ENGG2440/ESTR2004', name: 'Discrete Mathematics for Engineers', units: 3, required: true, category: 'foundation-course' },
              { code: 'ENGG2760/ESTR2018', name: 'Probability for Engineers', units: 2, required: true, category: 'foundation-course' },
              { code: 'CSCI1130/ESTR1102', name: 'Introduction to Computing Using C++', units: 3, required: true, category: 'foundation-course' }
            ],
            semester2: [
              { code: 'ENGG2780/ESTR2020', name: 'Statistics for Engineers', units: 2, required: true, category: 'foundation-course' },
              { code: 'CENG3420', name: 'Computer Organization and Design', units: 3, required: true, category: 'major-required' },
              { code: 'CSCI2100/ESTR2102', name: 'Data Structures', units: 3, required: true, category: 'major-required' }
            ]
          },
          year3: {
            semester1: [
              { code: 'CSCI3130', name: 'Formal Languages and Automata Theory', units: 3, required: true, category: 'major-required' },
              { code: 'CSCI3150/ESTR3102', name: 'Introduction to Operating Systems', units: 3, required: true, category: 'major-required' },
              { code: 'CSCI3160', name: 'Design and Analysis of Algorithms', units: 3, required: true, category: 'major-required' },
              { code: 'Stream courses', name: 'Stream Electives', units: 0, required: false, category: 'stream-course' }
            ],
            semester2: [
              { code: 'CSCI3100', name: 'Software Engineering', units: 3, required: true, category: 'major-required' },
              { code: 'CSCI3180', name: 'Principles of Programming Languages', units: 3, required: true, category: 'major-required' },
              { code: 'CSCI3250', name: 'Computers and Society', units: 2, required: true, category: 'major-required' },
              { code: 'CSCI3251', name: 'Engineering Practicum', units: 1, required: true, category: 'major-required' },
              { code: 'Stream courses', name: 'Stream Electives', units: 0, required: false, category: 'stream-course' }
            ]
          },
          year4: {
            semester1: [
              { code: 'CSCI4998/ESTR4998', name: 'Final Year Project I', units: 3, required: true, category: 'final-year-project' },
              { code: 'Stream courses', name: 'Stream Electives', units: 0, required: false, category: 'stream-course' }
            ],
            semester2: [
              { code: 'CSCI4999/ESTR4999', name: 'Final Year Project II', units: 3, required: true, category: 'final-year-project' },
              { code: 'Stream courses', name: 'Stream Electives', units: 0, required: false, category: 'stream-course' }
            ]
          }
        };
      } else if (program === 'CENG') {
        return {
          year1: {
            semester1: [
              { code: 'ENGG1110/ESTR1002', name: 'Introduction to Engineering Design', units: 3, required: true, category: 'faculty-package' },
              { code: 'PHYS/CHEM/LSCI', name: 'Science Elective 1', units: 3, required: true, category: 'foundation-course' },
              { code: 'MATH1510', name: 'Calculus for Engineers', units: 3, required: true, category: 'foundation-course' },
              { code: 'MATH1020', name: 'General Mathematics', units: 3, required: false, category: 'foundation-course' }
            ],
            semester2: [
              { code: 'ENGG1120/ESTR1005', name: 'Linear Algebra for Engineers', units: 3, required: true, category: 'faculty-package' },
              { code: 'PHYS/CHEM/LSCI', name: 'Science Elective 2', units: 3, required: true, category: 'foundation-course' },
              { code: 'ENGG1130/ESTR1006', name: 'Multi-variable Calculus for Engineers', units: 3, required: true, category: 'faculty-package' },
              { code: 'ENGG2020/ESTR2104', name: 'Digital Logic and Systems', units: 3, required: true, category: 'major-required' }
            ]
          },
          year2: {
            semester1: [
              { code: 'ENGG2720/ESTR2014', name: 'Complex Variables for Engineers', units: 2, required: true, category: 'foundation-course' },
              { code: 'ENGG2760/ESTR2018', name: 'Probability for Engineers', units: 2, required: true, category: 'foundation-course' },
              { code: 'CENG2010', name: 'Digital Logic Design Laboratory', units: 1, required: true, category: 'major-required' },
              { code: 'CSCI1120/ESTR1100', name: 'Introduction to Computing Using C++', units: 3, required: true, category: 'foundation-course' }
            ],
            semester2: [
              { code: 'ENGG2740/ESTR2016', name: 'Differential Equations for Engineers', units: 2, required: true, category: 'foundation-course' },
              { code: 'ENGG2780/ESTR2020', name: 'Statistics for Engineers', units: 2, required: true, category: 'foundation-course' },
              { code: 'CENG2030', name: 'Fundamentals of Embedded Systems', units: 3, required: true, category: 'major-required' },
              { code: 'CENG3420', name: 'Computer Organization & Design', units: 3, required: true, category: 'major-required' },
              { code: 'CSCI2100/ESTR2102', name: 'Data Structures', units: 3, required: true, category: 'major-required' }
            ]
          },
          year3: {
            semester1: [
              { code: 'CSCI3150/ESTR3102', name: 'Introduction to Operating Systems', units: 3, required: true, category: 'major-required' },
              { code: 'CSCI3190', name: 'Introduction to Discrete Mathematics and Algorithms', units: 3, required: true, category: 'major-required' },
              { code: 'ELEG2202', name: 'Fundamentals of Electric Circuits', units: 3, required: true, category: 'major-required' },
              { code: 'Stream courses', name: 'Stream Electives', units: 0, required: false, category: 'stream-course' }
            ],
            semester2: [
              { code: 'CSCI3100', name: 'Software Engineering', units: 3, required: true, category: 'major-required' },
              { code: 'CSCI3250', name: 'Computers and Society', units: 2, required: true, category: 'major-required' },
              { code: 'CSCI3251', name: 'Engineering Practicum', units: 1, required: true, category: 'major-required' },
              { code: 'Stream courses', name: 'Stream Electives', units: 0, required: false, category: 'stream-course' }
            ]
          },
          year4: {
            semester1: [
              { code: 'CENG4998/ESTR4998', name: 'Final Year Project I', units: 3, required: true, category: 'final-year-project' },
              { code: 'Stream courses', name: 'Stream Electives', units: 0, required: false, category: 'stream-course' }
            ],
            semester2: [
              { code: 'CENG4999/ESTR4999', name: 'Final Year Project II', units: 3, required: true, category: 'final-year-project' },
              { code: 'Stream courses', name: 'Stream Electives', units: 0, required: false, category: 'stream-course' }
            ]
          }
        };
      } else if (program === 'AIST') {
        return {
          year1: {
            semester1: [
              { code: 'ENGG1100/ESTR1002', name: 'Introduction to Engineering Design', units: 3, required: true, category: 'faculty-package' },
              { code: 'MATH1510', name: 'Calculus for Engineers', units: 3, required: true, category: 'foundation-course' },
              { code: 'PHYS1003/PHYS110', name: 'Physics for Engineers', units: 3, required: true, category: 'foundation-course' },
              { code: 'AIST1000', name: 'Introduction to AI and Data Science', units: 1, required: true, category: 'major-required' }
            ],
            semester2: [
              { code: 'ENGG1120/ESTR1005', name: 'Linear Algebra for Engineers', units: 3, required: true, category: 'faculty-package' },
              { code: 'AIST1110', name: 'Programming Methodology and Data Structures', units: 3, required: true, category: 'foundation-course' },
              { code: 'ENGG1130/ESTR1006', name: 'Multi-variable Calculus for Engineers', units: 3, required: true, category: 'faculty-package' }
            ]
          },
          year2: {
            semester1: [
              { code: 'ENGG2760/ESTR2018', name: 'Probability for Engineers', units: 2, required: true, category: 'foundation-course' },
              { code: 'ENGG2440/ESTR2004', name: 'Discrete Mathematics for Engineers', units: 3, required: true, category: 'foundation-course' },
              { code: 'CSCI2100/ESTR2102', name: 'Data Structures', units: 3, required: true, category: 'major-required' }
            ],
            semester2: [
              { code: 'ENGG2780/ESTR2020', name: 'Statistics for Engineers', units: 2, required: true, category: 'foundation-course' },
              { code: 'AIST2601', name: 'AI Project I', units: 2, required: true, category: 'major-required' },
              { code: 'AIST2602', name: 'AI Project II', units: 1, required: true, category: 'major-required' }
            ]
          },
          year3: {
            semester1: [
              { code: 'AIST3030', name: 'Machine Learning for AI', units: 3, required: true, category: 'major-required' },
              { code: 'CSCI3160/ESTR3104', name: 'Design and Analysis of Algorithms', units: 3, required: true, category: 'major-required' },
              { code: 'CSCI3230/ESTR3108', name: 'Fundamentals of Artificial Intelligence', units: 3, required: true, category: 'major-required' },
              { code: 'Stream courses', name: 'Stream Electives', units: 0, required: false, category: 'stream-course' }
            ],
            semester2: [
              { code: 'CSCI3320', name: 'Fundamentals of Machine Learning', units: 3, required: true, category: 'major-required' },
              { code: 'Stream courses', name: 'Stream Electives', units: 0, required: false, category: 'stream-course' }
            ]
          },
          year4: {
            semester1: [
              { code: 'AIST4998/ESTR4998', name: 'Final Year Project I', units: 3, required: true, category: 'final-year-project' },
              { code: 'Stream courses', name: 'Stream Electives', units: 0, required: false, category: 'stream-course' },
              { code: 'AIST4010/ESTR4140', name: 'AI Ethics and Society', units: 3, required: true, category: 'major-required' }
            ],
            semester2: [
              { code: 'AIST4999/ESTR4999', name: 'Final Year Project II', units: 3, required: true, category: 'final-year-project' },
              { code: 'Stream courses', name: 'Stream Electives', units: 0, required: false, category: 'stream-course' }
            ]
          }
        };
      } else if (program === 'CDAS') {
        // CDAS data (same format as above)
        return null;
      }
      // If program not found, return null
      return null;
  }
  
  function renderInteractiveDiagram(program) {
    // Show loading state
    document.querySelector('.empty-state').style.display = 'none';
    const roadmapDisplay = document.getElementById('roadmap-display');
    roadmapDisplay.classList.remove('hidden');
    
    // Get course data for the selected program
    const courseData = getCourseData(program);
    
    if (!courseData) {
      roadmapDisplay.innerHTML = '<div class="error-message">No interactive diagram available for this program yet</div>';
      return;
    }
    
    // Build the interactive diagram HTML
    let diagramHTML = `
      <div class="interactive-diagram">
        <div class="curriculum-header">
          <h2>Department of Computer Science and Engineering</h2>
          <p>Curriculum Flowchart for ${getProgramFullName(program)} programme (for students admitted in 2023 and thereafter)</p>
        </div>
        <div class="semester-row">
    `;
    
    // Add semester headers
    for (let i = 1; i <= 8; i++) {
      diagramHTML += `<div class="semester-header">Semester ${i}</div>`;
    }
    
    diagramHTML += `</div><div class="curriculum-grid">`;
    
    // Process all courses by semester
    const semesters = [];
    for (const yearKey in courseData) {
      const year = courseData[yearKey];
      for (const semesterKey in year) {
        semesters.push(year[semesterKey]);
      }
    }
    
    // Find the maximum number of courses in any semester
    const maxCourses = Math.max(...semesters.map(s => s.length));
    
    // For each row position
    for (let i = 0; i < maxCourses; i++) {
      diagramHTML += `<div class="course-row">`;
      
      // For each semester
      for (let j = 0; j < semesters.length; j++) {
        if (i < semesters[j].length) {
          const course = semesters[j][i];
          diagramHTML += `
            <div class="course-box ${course.category}" data-code="${course.code}">
              <div class="course-code">${course.code}</div>
              ${course.category !== 'stream-course' ? `<div class="course-units">(${course.units})</div>` : ''}
            </div>
          `;
        } else {
          // Empty cell
          diagramHTML += `<div class="empty-cell"></div>`;
        }
      }
      
      
      diagramHTML += `</div>`;
    }
    
    // Add legend
    diagramHTML += `
        </div>
        <div class="curriculum-legend">
          <div class="legend-title">Key:</div>
          <div class="legend-row">
            <div class="legend-item">
              <div class="key-color faculty-package"></div>
              <div class="legend-text">Faculty Package (9 units)</div>
            </div>
            <div class="legend-item">
              <div class="key-color foundation-course"></div>
              <div class="legend-text">Foundation Courses (18 units)</div>
            </div>
            <div class="legend-item">
              <div class="key-color major-required"></div>
              <div class="legend-text">Major Required (33 units)</div>
            </div>
            <div class="legend-item">
              <div class="key-color stream-course"></div>
              <div class="legend-text">Stream Courses (17 units)</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Set the HTML content
    roadmapDisplay.innerHTML = diagramHTML;
    
    // Add event listeners for course boxes
    roadmapDisplay.querySelectorAll('.course-box').forEach(courseBox => {
      courseBox.addEventListener('click', function() {
        const courseCode = this.getAttribute('data-code');
        if (courseCode !== 'STREAM1' && courseCode !== 'STREAM2' && courseCode !== 'STREAM3' && courseCode !== 'STREAM4') {
          showCourseDetails(courseCode, program);
        }
      });
    });
  }
  
  
  function getProgramFullName(programCode) {
    const programNames = {
      'CENG': 'Computer Engineering',
      'CSCI': 'Computer Science',
      'AIST': 'Artificial Intelligence',
      'CDAS': 'Computational Data Science'
    };
    
    return programNames[programCode] || programCode;
  }
  
  function showCourseDetails(courseCode, program) {
    // Show detailed information about a specific course
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'courseDetailsModal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2>Course Details: ${courseCode}</h2>
        <div class="course-details">
          <p><strong>Program:</strong> ${getProgramFullName(program)}</p>
          <p><strong>Description:</strong> Detailed information about ${courseCode} would be displayed here.</p>
          <p><strong>Prerequisites:</strong> Any prerequisite courses would be listed here.</p>
          <p><strong>Offered:</strong> Information about when this course is typically offered.</p>
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
    
    // Close when clicking outside the modal content
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.style.display = 'none';
        document.body.removeChild(modal);
      }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.style.display === 'block') {
        modal.style.display = 'none';
        document.body.removeChild(modal);
      }
    });
  }
  