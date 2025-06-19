/**
 * Fetches the course description based on the course identification.
 * @param {string} courseId - The course identification to search for.
 * @returns {Promise<string>} - The course_text_narrative or an error message.
 */
export async function getCourseDescription(courseId) {
    try {
        // Load the CourseDescriptions.json file
        const response = await fetch('../../DegreeJSON/CourseDescriptions.json');
        if (!response.ok) {
            throw new Error(`Failed to load CourseDescriptions.json: ${response.statusText}`);
        }

        // Parse the JSON data
        const courses = await response.json();

        // Find the course with the matching courseId
        const course = courses.find(c => c.course_identification === courseId);

        // Return the course_text_narrative if found
        if (course) {
            return course.course_text_narrative;
        } else {
            throw new Error(`Course with ID "${courseId}" not found.`);
        }
    } catch (error) {
        console.error("Error fetching course description:", error);
        return `Error: ${error.message}`;
    }
}