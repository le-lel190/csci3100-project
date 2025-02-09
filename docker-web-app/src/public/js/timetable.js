document.addEventListener('DOMContentLoaded', () => {
    // Initialize timetable
    createTimeSlots();
    initializeSemesterButtons();
    initializeSearch();
    loadUserInfo();
    setupLogout();

    // Add sample courses (replace with actual data from backend)
    const courses = [
        { id: 'BEPS1061-1A', name: 'Introduction to Human Anatomy and Physiology' },
        { id: 'BEPS2061-1A', name: 'Human Anatomy' },
        { id: 'BEPS2062-1A', name: 'Physiological Basis of Health and Disease' },
        // Add more courses as needed
    ];

    populateCourseList(courses);
});

function createTimeSlots() {
    const tbody = document.querySelector('.timetable tbody');
    const startTime = 8 * 60 + 30; // 8:30 AM in minutes
    const endTime = 18 * 60 + 30; // 6:30 PM in minutes
    const interval = 50; // 50 minutes per slot

    for (let time = startTime; time < endTime; time += interval) {
        const row = document.createElement('tr');
        const timeCell = document.createElement('td');
        
        const hours = Math.floor(time / 60);
        const minutes = time % 60;
        timeCell.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        row.appendChild(timeCell);

        // Add cells for each day
        for (let i = 0; i < 7; i++) {
            const cell = document.createElement('td');
            cell.dataset.time = `${hours}:${minutes}`;
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
            <input type="checkbox" id="${course.id}">
            <label for="${course.id}">
                ${course.id}
                <div class="course-name">${course.name}</div>
            </label>
        `;

        courseItem.querySelector('input').addEventListener('change', (e) => {
            if (e.target.checked) {
                // Add course to timetable
                showCourseDetails(course);
            } else {
                // Remove course from timetable
                hideCourseDetails();
            }
        });

        courseItems.appendChild(courseItem);
    });
}

function showCourseDetails(course) {
    const detailsContent = document.querySelector('.details-content');
    detailsContent.innerHTML = `
        <h4>${course.id}</h4>
        <p>${course.name}</p>
        <div class="course-schedule">
            <p><strong>Schedule:</strong></p>
            <p>Lecture: Monday 10:30 - 12:20</p>
            <p>Tutorial: Wednesday 14:30 - 15:20</p>
        </div>
    `;
}

function hideCourseDetails() {
    const detailsContent = document.querySelector('.details-content');
    detailsContent.innerHTML = 'Course details will be displayed here once you hover or click on a course';
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