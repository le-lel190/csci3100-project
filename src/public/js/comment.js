document.addEventListener('DOMContentLoaded', () => {

    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;
    let devModeEnabled = false;
    const searchBox = document.querySelector('.search-box input');
    
    // Add input event listener to check for "dev" in the search box
    if (searchBox) {
        searchBox.addEventListener('input', function(event) {
            // Check if the search box contains "dev"
            devModeEnabled = this.value.toLowerCase().includes('dev');
        });
    }
    document.addEventListener('keydown', function(event) {
        // Only process Konami Code if dev mode is enabled
        if (devModeEnabled) {
            if (event.key === konamiCode[konamiIndex]) {
                konamiIndex++;
                if (konamiIndex === konamiCode.length) {
                    // Activate dev mode
                    alert('Dev mode activated! You can now delete comments.');
                    konamiIndex = 0;
                    enableDeleteMode();
                }
            } else {
                konamiIndex = 0;
            }
        }
    });
    initializeSemesterButtons();
    initializeCourseSelection();
    initializeSearch();
    loadCourseData();
    loadUserInfo();
    setupLogout();
});



function enableDeleteMode() {
    // Add functionality to delete comments
    const commentBlocks = document.querySelectorAll('.comment-block');
    
    commentBlocks.forEach(block => {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-comment-btn';
        deleteBtn.innerHTML = '❌';
        deleteBtn.style.position = 'absolute';
        deleteBtn.style.top = '2px';
        deleteBtn.style.left = '2px';
        deleteBtn.style.background = 'none';
        deleteBtn.style.border = 'none';
        deleteBtn.style.cursor = 'pointer';
        
        deleteBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this comment?')) {
                block.remove();
            }
        });
        
        block.appendChild(deleteBtn);
    });
}

function setupSorting(courseId) {
    const sortByTimeBtn = document.getElementById('sortByTime');
    const sortByRatingBtn = document.getElementById('sortByRating');

    sortByTimeBtn.addEventListener('click', () => {
        fetch(`/api/comments/${courseId}`)
            .then(response => response.json())
            .then(comments => {
                // Sort comments by time (newest first)
                comments.sort((a, b) => new Date(b.date) - new Date(a.date));
                displayComments(comments, courseId);
            })
            .catch(error => console.error('Error fetching comments:', error));
    });

    sortByRatingBtn.addEventListener('click', () => {
        fetch(`/api/comments/${courseId}`)
            .then(response => response.json())
            .then(comments => {
                // Sort comments by rating (highest first)
                comments.sort((a, b) => b.rating - a.rating);
                displayComments(comments, courseId);
            })
            .catch(error => console.error('Error fetching comments:', error));
    });
}


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
      
    if (comment.rating <= 2) {
        commentBlock.classList.add('low-rating'); // Red background for 1-2 stars
    } else if (comment.rating === 3) {
        commentBlock.classList.add('neutral-rating'); // Current design for 3 stars
    } else if (comment.rating >= 4) {
        commentBlock.classList.add('high-rating'); // Green background for 4-5 stars
    }
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
      commentsContainer.scrollTop = 0;

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
      const author = document.getElementById('userUsername').textContent; // Replace with actual username
      
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

                displayCourseCode(course.id, course.name);
            } else {
                clearCourseCode();
            }
        });

        courseItems.appendChild(courseItem);
    });
}


function displayCourseCode(courseId, courseName) {
    const commentForm = document.querySelector('.main-content');
    if (commentForm) {
        commentForm.innerHTML = `
            <div class="comment-section">
                <div class="comment-header">
                    <h2>Course Comments</h2>
                    <div class="sort-buttons">
                        <button id="sortByTime" class="sort-btn">Sort by Time</button>
                        <button id="sortByRating" class="sort-btn">Sort by Rating</button>
                    </div>
                </div>
                
                <div class="course-info" id="courseInfo">
                    <p><strong>Course ID:</strong> ${courseId}</p>
                    <p><strong>Title:</strong> ${courseName}</p>
                </div>
                
                <div class="comments-container" id="commentsContainer">
                    <!-- Comments will be dynamically loaded here -->
                </div>
                
                <div class="comment-form">
                    <label for="newRating">Rating:</label>
                    <select id="newRating" class="rating-dropdown">
                        <option value="1">⭐</option>
                        <option value="2">⭐⭐</option>
                        <option value="3">⭐⭐⭐</option>
                        <option value="4">⭐⭐⭐⭐</option>
                        <option value="5" selected>⭐⭐⭐⭐⭐</option>
                    </select>
                    
                    <textarea id="newComment" placeholder="Share your experience with this course..."></textarea>
                    <button id="postComment" class="post-btn">Post Comment</button>
                </div>
            </div>
        `;

        // Set up the comment form and fetch existing comments
        // Set up sorting functionality
        setupSorting(courseId);
        fetchComments(courseId);
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
