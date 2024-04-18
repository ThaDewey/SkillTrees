import { Course } from './Course.js';

export class DependencyManager {
    constructor(courses) {
        this.courses = courses;
    }

    resolveDependencies() {
        this.courses.forEach(course => {
            course.dependencies = course.dependencies.map(depId => 
                this.courses.find(c => c.id === depId));
        });
    }

    checkDependencies(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        return course.dependencies.every(dep => dep.isUnlocked());
    }

    unlockCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (this.checkDependencies(courseId)) {
            course.unlock();
            console.log(`${course.name} has been unlocked.`);
        } else {
            console.log(`Cannot unlock ${course.name}. Dependencies are not met.`);
        }
    }
}