export class Course {
    constructor(id, creditHours, name, degree, domain, category, unlocked, dependencies, x, y) {
        this.id = id;
        this.creditHours = creditHours;
        this.name = name;
        this.degree = degree;
        this.domain = domain;
        this.category = category;
        this.unlocked = unlocked;
        this.dependencies = dependencies;
        this.x = x;  // X coordinate on canvas
        this.y = y;  // Y coordinate on canvas
    }
}