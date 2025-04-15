const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

// Fix path resolution with absolute path
// Base path to course data directory
const courseDataPath = path.resolve(process.cwd(), 'course-data');

// Helper function to ensure required directories exist
async function ensureDirectoriesExist() {
    try {
        // First, ensure the main course-data directory exists
        await fs.mkdir(courseDataPath, { recursive: true });
        
        // Ensure courses directory exists
        const coursesDir = path.join(courseDataPath, 'courses');
        await fs.mkdir(coursesDir, { recursive: true });
        
        // Ensure derived directory exists
        const derivedDir = path.join(courseDataPath, 'derived');
        await fs.mkdir(derivedDir, { recursive: true });
        
        // Ensure resources directory exists
        const resourcesDir = path.join(courseDataPath, 'resources');
        await fs.mkdir(resourcesDir, { recursive: true });
        
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
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
    'Sunday': 7
};

// Helper function to map numeric day indices to day names
const dayIndexToName = ['null_template', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
        
        // Check if course-data directory exists
        try {
            await fs.access(courseDataPath);
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
        
        let colorIndex = 0;
        
        // Process each subject's courses
        for (const subject of subjectsToInclude) {
            if (!subjectsWithCourses[subject]) {
                continue;
            }
                     
            // Get the individual course data file
            const subjectFilePath = path.join(courseDataPath, `courses/${subject}.json`);
            let subjectFileContent;
            
            try {
                subjectFileContent = await fs.readFile(subjectFilePath, 'utf8');
            } catch (error) {
                console.warn(`Could not read ${subject} course file:`, error.message);
                continue;
            }
            
            let courseData;
            try {
                courseData = JSON.parse(subjectFileContent);
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
            // Inside the main route handler for GET /:semester?
            for (const courseInfo of courseData) {
                const courseCode = courseInfo.code;
                const courseName = courseTitles[courseCode] || courseInfo.title || 'Unknown Course';
                
                // Check if terms exist and contain valid data
                const hasTerms = courseInfo.terms && 
                            Object.keys(courseInfo.terms).length > 0;                
                
                // If no terms, create a placeholder
                if (!hasTerms) {
                    // Create a more diverse placeholder schedule based on course code
                    const codeNum = parseInt(courseCode.replace(/\D/g, '')) || 0;
                    
                    const dayIndex = codeNum % 7;
                    const day = dayIndexToName[dayIndex];
                    
                    const hour = 8 + (codeNum % 10);
                    const startTime = `${hour.toString().padStart(2, '0')}:00`;
                    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

                    const placeholderSchedule = {
                        type: 'TBA (Placeholder)', 
                        day: day, 
                        start: startTime, 
                        end: endTime, 
                        meetingDates: 'TBA',
                        location: 'TBA - Schedule not yet available'
                    };
                    
                    courses.push({
                        id: `${subject} ${courseCode}`,
                        name: courseName,
                        schedules: [placeholderSchedule],
                        color: colors[colorIndex % colors.length],
                        selected: false,
                        isPlaceholder: true,
                        units: parseFloat(courseInfo.units) || 0, // Add units, default to 0 if not available
                        type: 'Major' // Since all courses are Major
                    });
                    
                    colorIndex++;
                } else {
                    // Create schedules from terms
                    const schedules = [];
                    
                    for (const [termName, termData] of Object.entries(courseInfo.terms)) {
                        for (const [sectionName, sectionData] of Object.entries(termData)) {
                            let type = 'Class';
                            if (sectionName.includes('LEC')) {
                                type = 'Lecture';
                            } else if (sectionName.includes('LAB')) {
                                type = 'Laboratory';
                            } else if (sectionName.includes('TUT')) {
                                type = 'Tutorial';
                            }
                            
                            if (!sectionData.days || !sectionData.startTimes || !sectionData.endTimes ||
                                !Array.isArray(sectionData.days) || !Array.isArray(sectionData.startTimes) || 
                                !Array.isArray(sectionData.endTimes)) {
                                continue;
                            }
                            
                            if (sectionData.days.length === 0 || sectionData.startTimes.length === 0 || sectionData.endTimes.length === 0) {
                                continue;
                            }
                            
                            for (let i = 0; i < sectionData.days.length; i++) {
                                let dayIndex = sectionData.days[i];
                                
                                if (typeof dayIndex === 'string') {
                                    dayIndex = dayNameToIndex[dayIndex] || -1;
                                }
                                
                                if (dayIndex < 0 || dayIndex > 6) {
                                    continue;
                                }
                                
                                const day = dayIndexToName[dayIndex];
                                
                                let startTime = sectionData.startTimes[i] || sectionData.startTimes[0] || "09:00";
                                let endTime = sectionData.endTimes[i] || sectionData.endTimes[0] || "10:00";
                                
                                startTime = normalizeTimeFormat(startTime) || "09:00";
                                endTime = normalizeTimeFormat(endTime) || "10:00";
                                
                                let location = "TBA";
                                if (sectionData.locations && sectionData.locations[i]) {
                                    location = sectionData.locations[i];
                                }
                                
                                let instructor = "";
                                if (sectionData.instructors && sectionData.instructors[i]) {
                                    instructor = sectionData.instructors[i];
                                }
                                
                                let meetingDates = [];
                                if (sectionData.meetingDates && Array.isArray(sectionData.meetingDates)) {
                                    meetingDates = sectionData.meetingDates;
                                }

                                const detailedType = `${type} ${sectionName}`.trim();

                                schedules.push({
                                    type: detailedType,
                                    day,
                                    start: startTime,
                                    end: endTime,
                                    location,
                                    meetingDates,
                                    instructor,
                                    term: termName
                                });
                            }
                        }
                    }
                    
                    if (schedules.length === 0) {
                        const codeNum = parseInt(courseCode.replace(/\D/g, '')) || 0;
                        
                        const dayIndex = codeNum % 7;
                        const day = dayIndexToName[dayIndex];
                        
                        const hour = 8 + (codeNum % 10);
                        const startTime = `${hour.toString().padStart(2, '0')}:00`;
                        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

                        const placeholderSchedule = {
                            type: 'TBA (Placeholder)', 
                            day: day, 
                            start: startTime, 
                            end: endTime, 
                            meetingDates: 'TBA', 
                            location: 'TBA - Schedule not yet available'
                        };
                        
                        courses.push({
                            id: `${subject} ${courseCode}`,
                            name: courseName,
                            schedules: [placeholderSchedule],
                            color: colors[colorIndex % colors.length],
                            selected: false,
                            isPlaceholder: true,
                            units: parseFloat(courseInfo.units) || 0, // Add units
                            type: 'Major' // Since all courses are Major
                        });
                        
                        colorIndex++;
                    } else {
                        courses.push({
                            id: `${subject} ${courseCode}`,
                            name: courseName,
                            schedules,
                            color: colors[colorIndex % colors.length],
                            selected: false,
                            isPlaceholder: false,
                            units: parseFloat(courseInfo.units) || 0, // Add units
                            type: 'Major' // Since all courses are Major
                        });
                        
                        colorIndex++;
                    }
                }
            }
        }
        
        // Sort courses by subject and code
        courses.sort((a, b) => a.id.localeCompare(b.id));
        
        // If there are no courses, return demo data for demonstration
        if (courses.length === 0) {
            return res.json(getDemoCourses());
        }
        
        // Limit to first 200 courses to avoid overwhelming the UI but show more than before
        courses = courses.slice(0, 200);
        
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
                { 
                    type: 'Lecture', 
                    day: 'Monday', 
                    start: '11:30', 
                    end: '12:15', 
                    location: 'T.Y.Wong Hall LT',
                    meetingDates: ['05/09', '12/09', '19/09', '26/09', '03/10', '10/10', '17/10', '24/10', '31/10', '07/11', '14/11', '21/11', '28/11']
                },
                { 
                    type: 'Lecture', 
                    day: 'Tuesday', 
                    start: '12:30', 
                    end: '14:15', 
                    location: 'Lee Shau Kee Building LT6',
                    meetingDates: ['06/09', '13/09', '20/09', '27/09', '04/10', '11/10', '18/10', '25/10', '01/11', '08/11', '15/11', '22/11', '29/11']
                }
            ],
            color: '#c2e0c6', // light green
            selected: true
        },
        { 
            id: 'CSCI 3180',
            name: 'Principles of Programming Languages',
            schedules: [
                { 
                    type: 'Interactive Tutorial', 
                    day: 'Thursday', 
                    start: '12:30', 
                    end: '13:15', 
                    location: 'Y.C. Liang Hall 104',
                    meetingDates: ['08/09', '15/09', '22/09', '29/09', '06/10', '13/10', '20/10', '27/10', '03/11', '10/11', '17/11', '24/11', '01/12']
                },
                { 
                    type: 'Lecture', 
                    day: 'Monday', 
                    start: '14:30', 
                    end: '16:15', 
                    location: 'William M W Mong Eng Bldg LT',
                    meetingDates: ['05/09', '12/09', '19/09', '26/09', '03/10', '10/10', '17/10', '24/10', '31/10', '07/11', '14/11', '21/11', '28/11']
                },
                { 
                    type: 'Lecture', 
                    day: 'Tuesday', 
                    start: '15:30', 
                    end: '16:15', 
                    location: 'William M W Mong Eng Bldg LT',
                    meetingDates: ['06/09', '13/09', '20/09', '27/09', '04/10', '11/10', '18/10', '25/10', '01/11', '08/11', '15/11', '22/11', '29/11']
                }
            ],
            color: '#d0e0f0', // light blue
            selected: true
        },
        { 
            id: 'CSCI 3250',
            name: 'Computers and Society',
            schedules: [
                { 
                    type: 'Lecture', 
                    day: 'Thursday', 
                    start: '13:30', 
                    end: '15:15', 
                    location: 'Lady Shaw Bldg LT1',
                    meetingDates: ['08/09', '15/09', '22/09', '29/09', '06/10', '13/10', '20/10', '27/10', '03/11', '10/11', '17/11', '24/11', '01/12']
                }
            ],
            color: '#f0e0d0', // light orange
            selected: true
        },
        { 
            id: 'CSCI 3251',
            name: 'Engineering Practicum',
            schedules: [
                { 
                    type: 'Practicum', 
                    day: 'Thursday', 
                    start: '15:30', 
                    end: '16:15', 
                    location: 'Lady Shaw Bldg LT1',
                    meetingDates: ['08/09', '15/09', '22/09', '29/09', '06/10', '13/10', '20/10', '27/10', '03/11', '10/11', '17/11', '24/11', '01/12']
                }
            ],
            color: '#e0d0f0', // light purple
            selected: true
        },
        { 
            id: 'CSCI 4430',
            name: 'Data Communication and Computer Networks',
            schedules: [
                { 
                    type: 'Lecture', 
                    day: 'Wednesday', 
                    start: '12:30', 
                    end: '13:15', 
                    location: 'Lady Shaw Bldg LT2',
                    meetingDates: ['07/09', '14/09', '21/09', '28/09', '05/10', '12/10', '19/10', '26/10', '02/11', '09/11', '16/11', '23/11', '30/11']
                },
                { 
                    type: 'Interactive Tutorial', 
                    day: 'Wednesday', 
                    start: '13:30', 
                    end: '14:15', 
                    location: 'Lady Shaw Bldg LT2',
                    meetingDates: ['07/09', '14/09', '21/09', '28/09', '05/10', '12/10', '19/10', '26/10', '02/11', '09/11', '16/11', '23/11', '30/11']
                },
                { 
                    type: 'Lecture', 
                    day: 'Monday', 
                    start: '16:30', 
                    end: '18:15', 
                    location: 'Y.C. Liang Hall 103',
                    meetingDates: ['05/09', '12/09', '19/09', '26/09', '03/10', '10/10', '17/10', '24/10', '31/10', '07/11', '14/11', '21/11', '28/11']
                },
                { 
                    type: 'Interactive Tutorial', 
                    day: 'Wednesday', 
                    start: '17:30', 
                    end: '18:15', 
                    location: 'Science Centre L3',
                    meetingDates: ['07/09', '14/09', '21/09', '28/09', '05/10', '12/10', '19/10', '26/10', '02/11', '09/11', '16/11', '23/11', '30/11']
                }
            ],
            color: '#e0f0d0', // light yellow-green
            selected: true
        },
        { 
            id: 'GESC 1000',
            name: 'College Assembly',
            schedules: [
                { 
                    type: 'Assembly', 
                    day: 'Friday', 
                    start: '11:30', 
                    end: '13:15', 
                    location: 'TBA',
                    meetingDates: ['09/09', '16/09', '23/09', '30/09', '07/10', '14/10', '21/10', '28/10', '04/11', '11/11', '18/11', '25/11', '02/12']
                }
            ],
            color: '#f0d0e0', // light pink
            selected: true
        },
        { 
            id: 'STAT 2005',
            name: 'Statistics',
            schedules: [
                { 
                    type: 'Lecture', 
                    day: 'Thursday', 
                    start: '16:30', 
                    end: '18:15', 
                    location: 'Lady Shaw Bldg LT2',
                    meetingDates: ['08/09', '15/09', '22/09', '29/09', '06/10', '13/10', '20/10', '27/10', '03/11', '10/11', '17/11', '24/11', '01/12']
                },
                { 
                    type: 'Lecture', 
                    day: 'Tuesday', 
                    start: '17:30', 
                    end: '18:15', 
                    location: 'Y.C. Liang Hall 104',
                    meetingDates: ['06/09', '13/09', '20/09', '27/09', '04/10', '11/10', '18/10', '25/10', '01/11', '08/11', '15/11', '22/11', '29/11']
                }
            ],
            color: '#d0f0e0', // light mint
            selected: true
        }
    ];
}

module.exports = router;