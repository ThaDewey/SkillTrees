/**
 * Parses the degree plan and calculates credit hour information.
 * @param {Object} degreePlan - The degree plan object.
 * @returns {Object} - An object containing total and completed credit hours.
 */
export function calculateCreditHours(Degreeinfo, DegreeData) {
    console.log(`Calculating credit hours for degree plan:`, DegreeData);

    // Initialize the creditHours object
    const creditHours = { totalCredits: 0, completedCredits: 0 };

    // Check if the degree is UG and set default credits
    setTotalCreditHours(Degreeinfo.school, creditHours);
    creditHours.completedCredits = calculateCompletedCreditHours(DegreeData);
    console.log(`Final credit hour calculation result:`, creditHours);
    return creditHours; // Ensure the object is returned
}




/**
 * Updates the progress bar based on credit hour information.
 * @param {Object} creditHours - An object containing total and completed credit hours.
 */
export function updateProgressBar(creditHours) {
    console.log(`Updating progress bar with credit hours:`, creditHours);

    const progressElement = document.getElementById("credit-progress-bar");
    const progressLabel = document.getElementById("credit-progress-label");

    if (!progressElement || !progressLabel) {
        console.error("Progress bar elements not found!");
        return;
    }

    const { totalCredits, completedCredits } = creditHours;
    const progressPercentage = totalCredits ? (completedCredits / totalCredits) * 100 : 0;

    progressElement.style.width = `${progressPercentage}%`;
    progressLabel.textContent = `Credits: ${completedCredits} / ${totalCredits}`;

    console.log(`Progress bar updated. Percentage: ${progressPercentage.toFixed(2)}%`);
}

/**
 * Sets total credit hours for the degree plan.
 * If the school is undergraduate (UG), sets total credits to 124.
 * Otherwise, calculates total credits from blocks.
 * @param {Object} school - The degree plan object.
 * @param {Object} creditHours - The credit hours object containing total and completed credits.
 */
export function setTotalCreditHours(school, creditHours) {
    console.log("Setting total credit hours for degree plan:", school);

    if (!creditHours) {
        console.error("CreditHours object is undefined!");
        return;
    }

    if (school === "UG") {
        console.log("Degree is undergraduate. Setting total credits to 124.");
        creditHours.totalCredits = 124;
    } else {
        creditHours.totalCredits = -1;
    }

    console.log("Updated credit hours:", creditHours);
}

/**
 * Logs whether each course in the degree plan is completed or not.
 * @param {Array<Object>} degreePlan - The degree plan object (array of blocks).
 */
export function calculateCompletedCreditHours(degreePlan) {
    console.log("Logging course completion status for degree plan:", degreePlan);

    let completedCredits = 0;

    degreePlan.forEach((block) => {
        (block.categories || []).forEach((category) => {
            (category.subcategories || []).forEach((subcategory) => {
                (subcategory.courses || []).forEach((course) => {
                    if (course.completed) {
                        console.log(`Course ${course.subj} ${course.num} is completed.`);
                        let digit = getLastDigit(course.num);
                        // console.log(`Last digit of course number ${course.num} is ${digit}.`);
                        completedCredits += digit;
                    }
                });
            });
        });
    });
    return completedCredits;
}


/**
 * Extracts the last digit from a given number.
 * @param {number} num - The input number.
 * @returns {number} - The last digit of the number.
 */
export function getLastDigit(num) {
    // console.log(`Extracting last digit from number: ${num}`);
    let digit = Math.abs(num) % 10;
    // console.log(`Last digit extracted: ${digit}`);
    return digit;
}