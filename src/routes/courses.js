const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

// Fix path resolution with absolute path
// Base path to course data directory
const courseDataPath = path.resolve(process.cwd(), 'course-data');
console.log('Course data path:', courseDataPath);

// Helper function to ensure required directories exist
async function ensureDirectoriesExist() {
    try {
        console.log('Ensuring course data directories exist...');
        
        // First, ensure the main course-data directory exists
        await fs.mkdir(courseDataPath, { recursive: true });
        console.log(`Ensured ${courseDataPath} exists`);
        
        // Ensure courses directory exists
        const coursesDir = path.join(courseDataPath, 'courses');
        await fs.mkdir(coursesDir, { recursive: true });
        console.log(`Ensured ${coursesDir} exists`);
        
        // Ensure derived directory exists
        const derivedDir = path.join(courseDataPath, 'derived');
        await fs.mkdir(derivedDir, { recursive: true });
        console.log(`Ensured ${derivedDir} exists`);
        
        // Ensure resources directory exists
        const resourcesDir = path.join(courseDataPath, 'resources');
        await fs.mkdir(resourcesDir, { recursive: true });
        console.log(`Ensured ${resourcesDir} exists`);
        
        return true;
    } catch (error) {
        console.error('Error ensuring directories exist:', error);
        return false;
    }
}

// Call the function when the router is loaded
ensureDirectoriesExist();

// Helper function to map day names to indices
const dayNameToIndex = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4,
    'Saturday': 5,
    'Sunday': 6
};

// Helper function to map numeric day indices to day names
const dayIndexToName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper function to normalize time format to HH:MM
function normalizeTimeFormat(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') {
        return null;
    }
    
    // Try to handle various time formats
    
    // Format: "HH:MM" or "H:MM"
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
        // Already in correct format, just ensure two digits for hour
        const [hours, minutes] = timeStr.split(':');
        return `${hours.padStart(2, '0')}:${minutes}`;
    }
    
    // Format: Military time "HHMM"
    if (/^\d{3,4}$/.test(timeStr)) {
        const time = timeStr.padStart(4, '0');
        return `${time.substring(0, 2)}:${time.substring(2, 4)}`;
    }
    
    // Format: "HH.MM" or "H.MM"
    if (/^\d{1,2}\.\d{2}$/.test(timeStr)) {
        const [hours, minutes] = timeStr.split('.');
        return `${hours.padStart(2, '0')}:${minutes}`;
    }
    
    // If no format matched, return null
    return null;
}

// Check if the course-data directory exists
router.get('/check', async (req, res) => {
    try {
        const exists = await fs.access(courseDataPath).then(() => true).catch(() => false);
        const dirs = exists ? await fs.readdir(courseDataPath) : [];
        
        res.json({
            exists,
            path: courseDataPath,
            contents: dirs
        });
    } catch (error) {
        res.status(500).json({
            error: 'Error checking course data directory',
            message: error.message
        });
    }
});

// Load demo data directly
router.get('/demo', (req, res) => {
    // Return demo course data using our helper function
    res.json(getDemoCourses());
});

// Get all courses or courses for a specific semester
router.get('/:semester?', async (req, res) => {
    try {
        const semester = req.params.semester || 'current';
        console.log(`Loading courses for semester: ${semester}`);
        
        // Check if course-data directory exists
        try {
            await fs.access(courseDataPath);
            console.log('Course data directory exists');
        } catch (error) {
            console.error('Course data directory not found:', error.message);
            return res.status(404).json({
                error: 'Course data directory not found',
                message: 'Please ensure the course-data directory exists in the project root'
            });
        }
        
        // Try to load the derived directory
        const derivedPath = path.join(courseDataPath, 'derived');
        try {
            await fs.access(derivedPath);
            console.log('Derived data directory exists');
        } catch (error) {
            console.error('Derived data directory not found:', error.message);
            return res.status(404).json({
                error: 'Derived data directory not found',
                message: 'The course-data/derived directory is missing'
            });
        }
        
        let courses = [];
        
        // Get the list of course codes from the subject course names file
        const subjectCoursesPath = path.join(courseDataPath, 'derived/subject_course_names.json');
        
        let subjectsWithCourses;
        try {
            const subjectCoursesData = await fs.readFile(subjectCoursesPath, 'utf8');
            subjectsWithCourses = JSON.parse(subjectCoursesData);
            console.log('Successfully loaded subject course names');
        } catch (error) {
            console.error('Error loading subject course names:', error);
            return res.status(500).json({
                error: 'Failed to load subject course names',
                message: error.message
            });
        }
        
        // Get course titles
        const courseListPath = path.join(courseDataPath, 'resources/course_list.json');
        
        let courseListData;
        try {
            const courseListContent = await fs.readFile(courseListPath, 'utf8');
            courseListData = JSON.parse(courseListContent);
            console.log('Successfully loaded course list');
        } catch (error) {
            console.error('Error loading course list:', error);
            return res.status(500).json({
                error: 'Failed to load course list',
                message: error.message
            });
        }
        
        // Define color palette for the courses (reuse colors from the demo data)
        const colors = [
            '#c2e0c6', // light green
            '#d0e0f0', // light blue
            '#f0e0d0', // light orange
            '#e0d0f0', // light purple
            '#e0f0d0', // light yellow-green
            '#f0d0e0', // light pink
            '#d0f0e0', // light mint
            '#e0d0d0', // light salmon
            '#d0e0e0', // light teal
            '#e0e0d0'  // light olive
        ];
        
        // Get a list of available course files instead of hardcoding subjects
        const coursesDir = path.join(courseDataPath, 'courses');
        let availableSubjects = [];
        
        try {
            const files = await fs.readdir(coursesDir);
            availableSubjects = files
                .filter(file => file.endsWith('.json'))
                .map(file => path.basename(file, '.json'));
            
            console.log('Available subject files:', availableSubjects);
        } catch (error) {
            console.error('Error reading courses directory:', error);
            return res.status(500).json({
                error: 'Failed to read courses directory',
                message: error.message
            });
        }
        
        // Use priority subjects if available, otherwise use all available subjects
        const prioritySubjects = ['CSCI', 'ESTR', 'ENGG', 'MATH', 'GESC', 'STAT'];
        const subjectsToInclude = prioritySubjects
            .filter(subject => availableSubjects.includes(subject))
            .concat(
                availableSubjects.filter(subject => !prioritySubjects.includes(subject))
            );
        
        console.log('Processing subjects:', subjectsToInclude);
        
        let colorIndex = 0;
        
        // Process each subject's courses
        for (const subject of subjectsToInclude) {
            if (!subjectsWithCourses[subject]) {
                console.log(`Skipping ${subject} - not found in subject course names`);
                continue;
            }
            
            console.log(`Processing ${subject} courses`);
            
            // Get the individual course data file
            const subjectFilePath = path.join(courseDataPath, `courses/${subject}.json`);
            let subjectFileContent;
            
            try {
                subjectFileContent = await fs.readFile(subjectFilePath, 'utf8');
                console.log(`Successfully read ${subject} course file`);
            } catch (error) {
                console.warn(`Could not read ${subject} course file:`, error.message);
                continue;
            }
            
            let courseData;
            try {
                courseData = JSON.parse(subjectFileContent);
                console.log(`Successfully parsed ${subject} course data with ${courseData.length} courses`);
                
                // Improved debug logging to understand course structure
                if (courseData.length > 0) {
                    const sampleCourse = courseData[0];
                    console.log(`Sample course structure for ${subject}:`, 
                                JSON.stringify(sampleCourse).substring(0, 300) + '...');
                    
                    // Log meeting pattern structure to better understand how to parse it
                    if (sampleCourse.meeting_patterns && sampleCourse.meeting_patterns.length > 0) {
                        console.log('Sample meeting pattern structure:',
                                  JSON.stringify(sampleCourse.meeting_patterns[0], null, 2));
                    }
                }
            } catch (error) {
                console.error(`Error parsing ${subject} course data:`, error.message);
                continue;
            }
            
            // Get course titles from course list
            const subjectCourseList = courseListData[subject] || [];
            const courseTitles = {};
            
            subjectCourseList.forEach(course => {
                if (course.c && course.t) {
                    const courseCode = course.c.replace(`${subject}`, '').trim();
                    courseTitles[courseCode] = course.t;
                }
            });
            
            // Process each course in the subject
            for (const courseInfo of courseData) {
                const courseCode = courseInfo.code;
                const courseName = courseTitles[courseCode] || courseInfo.title || 'Unknown Course';
                
                console.log(`Processing course ${subject} ${courseCode}: "${courseName}"`);
                
                // Check if meeting patterns exist and contain valid data
                const hasMeetingPatterns = courseInfo.meeting_patterns && 
                                         Array.isArray(courseInfo.meeting_patterns) && 
                                         courseInfo.meeting_patterns.length > 0;
                
                console.log(`${subject} ${courseCode} has meeting patterns: ${hasMeetingPatterns}`);
                
                if (hasMeetingPatterns) {
                    // Debug the first meeting pattern
                    console.log(`First meeting pattern for ${subject} ${courseCode}:`, 
                               JSON.stringify(courseInfo.meeting_patterns[0], null, 2));
                }
                
                // If no meeting patterns, create a placeholder
                if (!hasMeetingPatterns) {
                    console.log(`No meeting patterns for ${subject} ${courseCode}, creating placeholder`);
                    
                    // Create a more diverse placeholder schedule based on course code
                    // This ensures courses don't all stack in the same time slot
                    const codeNum = parseInt(courseCode.replace(/\D/g, '')) || 0;
                    
                    // Distribute across days of week (0-6)
                    const dayIndex = codeNum % 7;
                    const day = dayIndexToName[dayIndex];
                    
                    // Distribute across hours (8am-5pm)
                    const hour = 8 + (codeNum % 10);
                    const startTime = `${hour.toString().padStart(2, '0')}:00`;
                    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
                    
                    // Create placeholder schedule
                    const placeholderSchedule = {
                        type: 'TBA (Placeholder)', 
                        day: day, 
                        start: startTime, 
                        end: endTime, 
                        location: 'TBA - Schedule not yet available'
                    };
                    
                    // Create course object with the placeholder schedule
                    courses.push({
                        id: `${subject} ${courseCode}`,
                        name: courseName,
                        schedules: [placeholderSchedule],
                        color: colors[colorIndex % colors.length],
                        selected: false,
                        isPlaceholder: true // This is a placeholder schedule
                    });
                    
                    colorIndex++;
                } else {
                    // Create schedules from meeting patterns
                    const schedules = [];
                    
                    for (const pattern of courseInfo.meeting_patterns) {
                        console.log(`Processing pattern for ${subject} ${courseCode}:`, 
                                   JSON.stringify(pattern).substring(0, 200) + '...');
                        
                        // IMPROVED: More detailed inspection of the pattern structure
                        console.log(`Pattern details - has days: ${Boolean(pattern.days)}, ` +
                                   `startTimes: ${Boolean(pattern.startTimes)}, ` +
                                   `endTimes: ${Boolean(pattern.endTimes)}, ` +
                                   `locations: ${Boolean(pattern.locations)}`);
                        
                        if (pattern.days) {
                            console.log(`Days array: ${JSON.stringify(pattern.days)}`);
                        }
                        
                        // Skip patterns with no days, start times, or end times
                        if (!pattern.days || !pattern.startTimes || !pattern.endTimes) {
                            console.log(`Missing days/times for ${subject} ${courseCode} pattern`);
                            continue;
                        }
                        
                        // Check if arrays are empty
                        if (pattern.days.length === 0 || pattern.startTimes.length === 0 || pattern.endTimes.length === 0) {
                            console.log(`Empty days/times arrays for ${subject} ${courseCode} pattern`);
                            continue;
                        }
                        
                        // Get the pattern type (Lecture, Tutorial, etc.)
                        let type = 'Class';
                        
                        // Try to extract pattern type from different possible fields
                        if (pattern.type) {
                            type = pattern.type;
                        } else if (pattern.activity_type) {
                            type = pattern.activity_type;
                        } else if (pattern.session_type) {
                            type = pattern.session_type;
                        } else if (pattern.term_pattern) {
                            type = pattern.term_pattern;
                        }
                        
                        // Process each day/time combination
                        for (let i = 0; i < pattern.days.length; i++) {
                            // Get day index, which could be a number or a string
                            let dayIndex = pattern.days[i];
                            
                            // If day is a string (like "Monday"), convert to index
                            if (typeof dayIndex === 'string') {
                                dayIndex = dayNameToIndex[dayIndex] || -1;
                            }
                            
                            if (dayIndex < 0 || dayIndex > 6) {
                                console.log(`Invalid day index ${dayIndex} for ${subject} ${courseCode}`);
                                continue;
                            }
                            
                            const day = dayIndexToName[dayIndex];
                            let startTime, endTime;
                            
                            // Handle different time formats
                            if (Array.isArray(pattern.startTimes)) {
                                startTime = pattern.startTimes[i] || pattern.startTimes[0] || "09:00";
                            } else if (typeof pattern.startTimes === 'string') {
                                startTime = pattern.startTimes;
                            } else {
                                startTime = "09:00";
                            }
                            
                            if (Array.isArray(pattern.endTimes)) {
                                endTime = pattern.endTimes[i] || pattern.endTimes[0] || "10:00";
                            } else if (typeof pattern.endTimes === 'string') {
                                endTime = pattern.endTimes;
                            } else {
                                endTime = "10:00";
                            }
                            
                            // Normalize time formats to HH:MM
                            startTime = normalizeTimeFormat(startTime) || "09:00";
                            endTime = normalizeTimeFormat(endTime) || "10:00";
                            
                            // Get location, which might be in different formats or properties
                            let location = "TBA";
                            
                            if (pattern.locations && pattern.locations[i]) {
                                location = pattern.locations[i];
                            } else if (pattern.location) {
                                location = typeof pattern.location === 'string' ? pattern.location : "TBA";
                            } else if (pattern.venue) {
                                location = typeof pattern.venue === 'string' ? pattern.venue : "TBA";
                            } else if (pattern.room) {
                                location = typeof pattern.room === 'string' ? pattern.room : "TBA";
                            }
                            
                            schedules.push({
                                type,
                                day,
                                start: startTime,
                                end: endTime,
                                location
                            });
                        }
                    }
                    
                    // If we couldn't extract any valid schedules, add a placeholder
                    if (schedules.length === 0) {
                        console.log(`No valid schedules created for ${subject} ${courseCode}, adding placeholder`);
                        
                        // Create a more diverse placeholder schedule based on course code
                        // This ensures courses don't all stack in the same time slot
                        const codeNum = parseInt(courseCode.replace(/\D/g, '')) || 0;
                        
                        // Distribute across days of week (0-6)
                        const dayIndex = codeNum % 7;
                        const day = dayIndexToName[dayIndex];
                        
                        // Distribute across hours (8am-5pm)
                        const hour = 8 + (codeNum % 10);
                        const startTime = `${hour.toString().padStart(2, '0')}:00`;
                        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
                        
                        // Create placeholder schedule
                        const placeholderSchedule = {
                            type: 'TBA (Placeholder)', 
                            day: day, 
                            start: startTime, 
                            end: endTime, 
                            location: 'TBA - Schedule not yet available'
                        };
                        
                        // Create course object with the placeholder schedule
                        courses.push({
                            id: `${subject} ${courseCode}`,
                            name: courseName,
                            schedules: [placeholderSchedule],
                            color: colors[colorIndex % colors.length],
                            selected: false,
                            isPlaceholder: true // This is a placeholder schedule
                        });
                        
                        colorIndex++;
                    } else {
                        // Create the course object with real schedules
                        courses.push({
                            id: `${subject} ${courseCode}`,
                            name: courseName,
                            schedules,
                            color: colors[colorIndex % colors.length],
                            selected: false,
                            isPlaceholder: false // This is a real schedule
                        });
                        
                        colorIndex++;
                    }
                }
            }
        }
        
        // Sort courses by subject and code
        courses.sort((a, b) => a.id.localeCompare(b.id));
        
        console.log(`Found ${courses.length} courses for ${semester} semester`);
        
        // MODIFIED: Always return at least some courses
        // If there are no courses, return demo data for demonstration
        if (courses.length === 0) {
            console.log('No courses found, returning demo data instead of error');
            return res.json(getDemoCourses());
        }
        
        // Limit to first 200 courses to avoid overwhelming the UI but show more than before
        courses = courses.slice(0, 200);
        console.log(`Returning ${courses.length} courses`);
        
        res.json(courses);
    } catch (error) {
        console.error('Error fetching course data:', error);
        res.status(500).json({
            error: 'Failed to load course data',
            message: error.message
        });
    }
});

// Helper function to get consistent demo courses
function getDemoCourses() {
    return [
        { 
            id: 'CSCI 3100',
            name: 'Software Engineering',
            schedules: [
                { type: 'Lecture', day: 'Monday', start: '11:30', end: '12:15', location: 'T.Y.Wong Hall LT' },
                { type: 'Lecture', day: 'Tuesday', start: '12:30', end: '14:15', location: 'Lee Shau Kee Building LT6' }
            ],
            color: '#c2e0c6', // light green
            selected: true
        },
        { 
            id: 'CSCI 3180',
            name: 'Principles of Programming Languages',
            schedules: [
                { type: 'Interactive Tutorial', day: 'Thursday', start: '12:30', end: '13:15', location: 'Y.C. Liang Hall 104' },
                { type: 'Lecture', day: 'Monday', start: '14:30', end: '16:15', location: 'William M W Mong Eng Bldg LT' },
                { type: 'Lecture', day: 'Tuesday', start: '15:30', end: '16:15', location: 'William M W Mong Eng Bldg LT' }
            ],
            color: '#d0e0f0', // light blue
            selected: true
        },
        { 
            id: 'CSCI 3250',
            name: 'Computers and Society',
            schedules: [
                { type: 'Lecture', day: 'Thursday', start: '13:30', end: '15:15', location: 'Lady Shaw Bldg LT1' }
            ],
            color: '#f0e0d0', // light orange
            selected: true
        },
        { 
            id: 'CSCI 3251',
            name: 'Engineering Practicum',
            schedules: [
                { type: 'Practicum', day: 'Thursday', start: '15:30', end: '16:15', location: 'Lady Shaw Bldg LT1' }
            ],
            color: '#e0d0f0', // light purple
            selected: true
        },
        { 
            id: 'CSCI 4430',
            name: 'Data Communication and Computer Networks',
            schedules: [
                { type: 'Lecture', day: 'Wednesday', start: '12:30', end: '13:15', location: 'Lady Shaw Bldg LT2' },
                { type: 'Interactive Tutorial', day: 'Wednesday', start: '13:30', end: '14:15', location: 'Lady Shaw Bldg LT2' },
                { type: 'Lecture', day: 'Monday', start: '16:30', end: '18:15', location: 'Y.C. Liang Hall 103' },
                { type: 'Interactive Tutorial', day: 'Wednesday', start: '17:30', end: '18:15', location: 'Science Centre L3' }
            ],
            color: '#e0f0d0', // light yellow-green
            selected: true
        },
        { 
            id: 'GESC 1000',
            name: 'College Assembly',
            schedules: [
                { type: 'Assembly', day: 'Friday', start: '11:30', end: '13:15', location: 'TBA' }
            ],
            color: '#f0d0e0', // light pink
            selected: true
        },
        { 
            id: 'STAT 2005',
            name: 'Statistics',
            schedules: [
                { type: 'Lecture', day: 'Thursday', start: '16:30', end: '18:15', location: 'Lady Shaw Bldg LT2' },
                { type: 'Lecture', day: 'Tuesday', start: '17:30', end: '18:15', location: 'Y.C. Liang Hall 104' }
            ],
            color: '#d0f0e0', // light mint
            selected: true
        }
    ];
}

module.exports = router;