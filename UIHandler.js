import { courseData } from './CourseData.js';
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('courseCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    const ctx = canvas.getContext('2d');

    // Clear the canvas before drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // First, draw all courses as nodes (circles, rectangles, etc.)
    courseData.forEach(course => {
        // Draw the course as a circle
        ctx.beginPath();
        ctx.arc(course.x, course.y, 20, 0, 2 * Math.PI); // Circle for each course
        ctx.fillStyle = course.unlocked ? 'green' : 'red'; // Conditional color based on unlocked status
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();

        // Optional: Add labels to each node
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.fillText(course.name, course.x, course.y - 30); // Adjust text position as needed
    });

    // Then, draw lines for dependencies
    courseData.forEach(course => {
        course.dependencies.forEach(depId => {
            let dep = courseData.find(c => c.id === depId);
            if (dep) {
                ctx.beginPath();
                ctx.moveTo(course.x, course.y);
                ctx.lineTo(dep.x, dep.y);
                ctx.strokeStyle = 'blue'; // Line color
                ctx.stroke();
            }
        });
    });
});
