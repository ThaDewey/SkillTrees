import { Course } from './Course.js';
import { DependencyManager } from './DependencyManager.js';

export const courseData = [
    new Course("ENG_1113", 3, "English Composition", "core", "Written and Oral Communication", "English Composition", true, [], 50, 50),
    new Course("ENG_1153", 3, "English Composition - Intermediate", "core", "Written and Oral Communication", "English Composition", false, ["ENG_1113"], 50, 150),
    // More courses...
];

export const dependencyManager = new DependencyManager(courseData);
dependencyManager.resolveDependencies();


// Example data structure with coordinates and check
console.log(courseData);  // Log the data to verify structure and content