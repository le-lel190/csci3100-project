document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    setupLogout();
    setupDegreeSelection();
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
    
    // Map of degree codes to their respective image paths
    const degreeImages = {
        'CENG': '/images/roadmaps/ceng_roadmap.png',
        'CSCI': '/images/roadmaps/csci_roadmap.png',
        'MATH': '/images/roadmaps/math_roadmap.png',
        'IERG': '/images/roadmaps/ierg_roadmap.png',
        'AIST': '/images/roadmaps/aist_roadmap.png'
    };

    // Add click event listeners to all degree items
    document.querySelectorAll('.degree-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const degree = this.getAttribute('data-degree');
            const imagePath = degreeImages[degree];
            
            if (imagePath) {
                modalImg.src = imagePath;
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
            }
        });
    });

    // Close modal when clicking the close button
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
    });

    // Close modal when clicking outside the image
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scrolling
        }
    });

    // Close modal with escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scrolling
        }
    });
}

function loadRoadmap(degreeName) {
    // Show loading state
    document.querySelector('.empty-state').style.display = 'none';
    const roadmapDisplay = document.getElementById('roadmap-display');
    roadmapDisplay.classList.remove('hidden');
    roadmapDisplay.innerHTML = '<div class="loading">Loading roadmap for ' + degreeName + '...</div>';
    
    // Fetch the roadmap data from the server
    fetch(`/api/roadmap/${encodeURIComponent(degreeName)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load roadmap data');
            }
            return response.json();
        })
        .then(data => {
            displayRoadmap(data, degreeName);
        })
        .catch(error => {
            console.error('Error loading roadmap:', error);
            roadmapDisplay.innerHTML = `
                <div class="error-message">
                    Failed to load roadmap for ${degreeName}. 
                    <p>${error.message}</p>
                </div>
            `;
            
            // For development/demo purposes, if the API fails, display a sample roadmap
            displaySampleRoadmap(degreeName);
        });
}

function displayRoadmap(data, degreeName) {
    const roadmapDisplay = document.getElementById('roadmap-display');
    
    // Create the roadmap visualization based on the returned data
    // This would be the actual implementation that visualizes the real data
    
    // For now, just display the degree name as a placeholder
    roadmapDisplay.innerHTML = `
        <div class="roadmap-title">
            <h2>${degreeName} Curriculum Roadmap</h2>
        </div>
        <div class="roadmap-visualization">
            <!-- The actual roadmap visualization would go here -->
            <p>Roadmap data successfully loaded. Visualization is under development.</p>
        </div>
    `;
}

function displaySampleRoadmap(degreeName) {
    // This is just a sample/placeholder to show what the roadmap might look like
    // In a real implementation, this would be replaced with actual data visualization
    
    const roadmapDisplay = document.getElementById('roadmap-display');
    
    roadmapDisplay.innerHTML = `
        <div class="roadmap-title">
            <h2>${degreeName} Curriculum Roadmap (Sample)</h2>
        </div>
        <div class="roadmap-visualization">
            <p>This is a sample roadmap visualization. In the final implementation, this would display the actual curriculum roadmap for ${degreeName}.</p>
            
            <div class="sample-roadmap">
                <div class="sample-year">
                    <h3>Year 1</h3>
                    <div class="sample-courses">
                        <div class="sample-course">ENGL1000: Academic English</div>
                        <div class="sample-course">MATH1000: Calculus</div>
                        <div class="sample-course">COMP1000: Introduction to Programming</div>
                        <div class="sample-course">PHYS1000: Physics I</div>
                    </div>
                </div>
                
                <div class="sample-year">
                    <h3>Year 2</h3>
                    <div class="sample-courses">
                        <div class="sample-course">COMP2000: Data Structures</div>
                        <div class="sample-course">COMP2100: Computer Organization</div>
                        <div class="sample-course">STAT2000: Statistical Methods</div>
                        <div class="sample-course">MATH2000: Linear Algebra</div>
                    </div>
                </div>
                
                <div class="sample-year">
                    <h3>Year 3</h3>
                    <div class="sample-courses">
                        <div class="sample-course">COMP3000: Algorithms</div>
                        <div class="sample-course">COMP3100: Operating Systems</div>
                        <div class="sample-course">COMP3200: Database Systems</div>
                        <div class="sample-course">COMP3300: Software Engineering</div>
                    </div>
                </div>
                
                <div class="sample-year">
                    <h3>Year 4</h3>
                    <div class="sample-courses">
                        <div class="sample-course">COMP4000: Final Year Project</div>
                        <div class="sample-course">COMP4100: Artificial Intelligence</div>
                        <div class="sample-course">COMP4200: Computer Networks</div>
                        <div class="sample-course">COMP4300: Computer Graphics</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add some minimal styling to the sample roadmap
    const style = document.createElement('style');
    style.textContent = `
        .sample-roadmap {
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding: 20px;
            background-color: #f5f6fa;
            border-radius: 8px;
        }
        
        .sample-year {
            border: 1px solid #dcdde1;
            border-radius: 6px;
            padding: 10px;
            background-color: white;
        }
        
        .sample-year h3 {
            margin-bottom: 10px;
            color: #2c7a4f;
            border-bottom: 1px solid #e8f5e9;
            padding-bottom: 5px;
        }
        
        .sample-courses {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
        }
        
        .sample-course {
            background-color: #e8f5e9;
            border: 1px solid #2c7a4f;
            border-radius: 4px;
            padding: 8px;
            font-size: 14px;
        }
        
        .roadmap-title {
            margin-bottom: 20px;
            text-align: center;
        }
        
        .roadmap-visualization {
            padding: 20px;
        }
        
        .loading, .error-message {
            padding: 20px;
            text-align: center;
        }
        
        .error-message {
            color: #e74c3c;
            background-color: #fad7d3;
            border-radius: 4px;
            padding: 15px;
        }
    `;
    document.head.appendChild(style);
}
