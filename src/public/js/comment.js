document.addEventListener('DOMContentLoaded', () => {
    console.log("1");

    initializeSemesterButtons();
    console.log("2");

    initializeCourseSelection();
    console.log("3");

    initializeSearch();
    console.log("4");

    loadCourseData();
    console.log("5");

    loadUserInfo();
    console.log("6");

    setupLogout();
    console.log("7");

});

function fetchComments(courseId) {
    fetch(`/api/comments/${courseId}`)
      .then(response => response.json())
      .then(comments => {
        displayComments(comments, courseId);
      })
      .catch(error => {
        console.error('Error fetching comments:', error);
        // Optional: Display error message to user
      });
  }
  
  // Display comments in the container
  function displayComments(comments, courseId) {
    const commentsContainer = document.getElementById('commentsContainer');
    
    // Clear existing comments
    commentsContainer.innerHTML = '';
    
    if (comments.length === 0) {
      commentsContainer.innerHTML = '<p>No comments yet. Be the first to share your experience!</p>';
      return;
    }
    
    // Add each comment to the container
    comments.forEach(comment => {
      const commentBlock = document.createElement('div');
      commentBlock.className = 'comment-block';
      
      // Format the date
      const date = new Date(comment.date);
      const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Generate rating stars
      const stars = '⭐'.repeat(comment.rating);
      
      commentBlock.innerHTML = `
        <div class="rating-box">
          <span class="rating-stars">${stars}</span>
        </div>
        <div class="comment-author">${comment.author}</div>
        <div class="comment-date">${formattedDate}</div>
        <div class="comment-content">
          <p>${comment.content}</p>
        </div>
      `;
      
      commentsContainer.appendChild(commentBlock);
    });
  }
  
  // Handle comment form submission
  function setupCommentForm(courseId, courseName) {
    const postButton = document.getElementById('postComment');
    const commentTextarea = document.getElementById('newComment');
    
    postButton.addEventListener('click', () => {
      // Get input values
      const content = commentTextarea.value.trim();
      if (!content) {
        alert('Please enter a comment');
        return;
      }
      
      // Get author name (you might want to get this from a logged-in user)
      const author = 'Current User'; // Replace with actual username
      
      // Get selected rating
      const ratingDropdown = document.querySelector('.rating-dropdown');
      const rating = ratingDropdown ? parseInt(ratingDropdown.value) : 5;
      
      // Create comment object
      const commentData = {
        courseId,
        author,
        content,
        rating
      };
      
      // Send to server
      fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentData)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to save comment');
        }
        return response.json();
      })
      .then(savedComment => {
        // Clear the form
        commentTextarea.value = '';
        
        // Refresh comments to show the new one
        fetchComments(courseId);
      })
      .catch(error => {
        console.error('Error saving comment:', error);
        alert('Failed to save your comment. Please try again.');
      });
    });
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
        courseItem.dataset.courseName = course.name;
        courseItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', course.id);
        });

        const checkbox = courseItem.querySelector('input');
        checkbox.addEventListener('change', (e) => {
            // Uncheck all other checkboxes
            const allCheckboxes = document.querySelectorAll('.course-item input[type="checkbox"]');
            allCheckboxes.forEach(cb => {
                if (cb !== e.target) {
                    cb.checked = false;
                }
            });

            // Update the `selected` property for all courses
            courses.forEach(c => {
                c.selected = c.id === course.id ? e.target.checked : false;
            });

            if (e.target.checked) {
                console.log("DLLM ah");

                displayCourseCode(course.id, course.name);
            } else {
                clearCourseCode();
            }
        });

        courseItems.appendChild(courseItem);
    });
}


function displayCourseCode(courseId, courseName) {
    console.log("DLLM ah 2");

    const commentForm = document.querySelector('.main-content');
    console.log("Main content element:", commentForm); // Check if it's null

    if (commentForm) {
        console.log("DLLM ah 3");
        commentForm.innerHTML = `
            <div class="comment-section">
                <div class="comment-header">
                    <h2>Course Comments</h2>
                </div>
                
                <div class="course-info" id="courseInfo">
                    <p><strong>Course ID:</strong> ${courseId}</p>
                    <p><strong>Title:</strong> ${courseName}</p>
                </div>
                
                <div class="comments-container" id="commentsContainer">
                    <!-- Example of comment structure for JS to follow -->
                    <div class="comment-block">
                        <div class="rating-box">
                        </div>
                        <div class="comment-author">John Doe</div>
                        <div class="comment-date">March 29, 2025</div>
                        <div class="comment-content">
                            <p>This course was very helpful for understanding the fundamentals of AI. The professor explained complex concepts clearly.</p>
                        </div>
                    </div>
                    
                    <div class="comment-block">
                        <div class="comment-author">Jane Smith</div>
                        <div class="comment-date">March 25, 2025</div>
                        <div class="comment-content">
                            <p>Great course! The assignments were challenging but really helped solidify the material.</p>
                        </div>
                    </div>
                </div>
                
                <div class="comment-form">
                    <textarea id="newComment" placeholder="Share your experience with this course..."></textarea>
                    <button id="postComment" class="post-btn">Post Comment</button>
                </div>
            </div>

        `;
        // Set up the comment form and fetch existing comments
        setupCommentForm(courseId, courseName);
        fetchComments(courseId);
    }
}

function clearCourseCode() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = '';
    }
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
            item.style.display = courseText.includes(searchTerm) ? 'block' : 'none';
        });
    });
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

// Load all course data from JSON files
async function loadAllCourseData() {
    try {
        // Load course list
        const courseListResponse = await fetch('courses.json');
        const courseList = await courseListResponse.json();
        
        // Load department-specific course data
        const departments = ['AIST', 'CDAS', 'CENG', 'CSCI'];
        
        for (const dept of departments) {
            try {
                const response = await fetch(`${dept}.json`);
                const data = await response.json();
                
                // Process and store the course data
                if (!courseData[dept]) {
                    courseData[dept] = {};
                }
                
                // Process each course in the JSON file
                if (Array.isArray(data)) {
                    data.forEach(course => {
                        if (course.code) {
                            const courseCode = course.code;
                            courseData[dept][courseCode] = course;
                        }
                    });
                }
            } catch (error) {
                console.error(`Error loading ${dept} data:`, error);
            }
        }
        
        // Initialize course selection after data is loaded
        initializeCourseSelection();
    } catch (error) {
        console.error('Error loading course data:', error);
    }
}

// Initialize course selection event listeners
function initializeCourseSelection() {
    // Add click event listeners to course items
    document.addEventListener('click', (event) => {
        // Find if a course item or its child was clicked
        const courseItem = event.target.closest('.course-item');
        
        if (courseItem) {
            // Only handle clicks on the course item, not on the checkbox
            if (event.target.tagName.toLowerCase() !== 'input') {
                const courseCode = courseItem.querySelector('input').id;
                const courseName = courseItem.querySelector('.course-name').textContent;
                
                // Extract department and code
                const parts = courseCode.split(' ');
                if (parts.length >= 2) {
                    const dept = parts[0];
                    const code = parts[1];
                    
                    // Handle the course selection
                    handleCourseSelection(dept, code, courseName);
                }
            }
        }
    });
}

// Handle course selection
function handleCourseSelection(department, courseNumber, courseName) {
    // Set current course
    currentCourse = {
        department: department,
        code: courseNumber,
        name: courseName
    };
    
    // Get the main content area
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    // Create and display the comment section
    mainContent.innerHTML = createCommentSectionHTML(currentCourse);
    
    // Load course details and comments
    loadCourseDetails(department, courseNumber);
    
    // Setup the comment form
    setupCommentForm();
}
