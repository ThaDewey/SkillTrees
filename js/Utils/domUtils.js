// Utility functions for DOM element creation



export function BuildElement(elementType, text, classList) {
    let element = CreateElement(elementType);
    if (classList) {
        classList.forEach(className => {
            ApplyClass(element, className);
        });
    }
    element = ApplyText(element, text);
    return element;
}

export function buildElement(elementObject) {
    let element;
    if (!elementObject || !elementObject.elementType) {
        console.error("🚫 buildElement called with invalid elementObject", elementObject);
        return null;
    }

    element = CreateElement(elementObject.elementType);

    if (elementObject.classList) {
        ApplyClasses(element, elementObject.classList);
    }

    if (elementObject.text) {
        ApplyText(element, elementObject.text);
    }

    if (elementObject.id) {
        element.id = elementObject.id;
    }


    if (elementObject.parent) {
        elementObject.parent.appendChild(element);
    }

    return element;
}

export function ApplyText(element, text) {
    element.textContent = text;
    return element;
}

export function ApplyClass(element, className) {
    if (!className) {
        console.log("🚫 ApplyClass called with no className");
        return element;
    }

    element.classList.add(className);
    return element;
}

export function ApplyClasses(element, classList) {
    if (!classList) {
        console.log("🚫 ApplyClasses called with no className");
        return element;
    }

    if (!Array.isArray(classList)) {
        console.error("🚫 ApplyClasses called with non-array classList", classList);
        return element;
    }

    element.classList.add(...classList);



    return element;
}

export function CreateElement(elementType) {
    return document.createElement(elementType);
}

/**
 * Builds a Bootstrap accordion dynamically.
 * @param {string} accordionId - The ID for the accordion container.
 * @param {Array} items - An array of objects with `title` and `content` properties.
 * @returns {HTMLElement} - The constructed accordion element.
 */
function buildBootstrapAccordion(accordionId, items) {
    // Create the accordion container
    const accordion = document.createElement("div");
    accordion.className = "accordion";
    accordion.id = accordionId;

    // Iterate over the items to create accordion items
    items.forEach((item, index) => {
        const itemId = `${accordionId}-item-${index}`;

        // Create the accordion item
        const accordionItem = document.createElement("div");
        accordionItem.className = "accordion-item";

        // Create the header
        const header = document.createElement("h2");
        header.className = "accordion-header";
        header.id = `${itemId}-header`;

        const button = document.createElement("button");
        button.className = "accordion-button";
        button.type = "button";
        button.setAttribute("data-bs-toggle", "collapse");
        button.setAttribute("data-bs-target", `#${itemId}-collapse`);
        button.setAttribute("aria-expanded", index === 0 ? "true" : "false");
        button.setAttribute("aria-controls", `${itemId}-collapse`);
        button.textContent = item.title;

        header.appendChild(button);

        // Create the collapse container
        const collapse = document.createElement("div");
        collapse.className = `accordion-collapse collapse ${index === 0 ? "show" : ""}`;
        collapse.id = `${itemId}-collapse`;
        collapse.setAttribute("aria-labelledby", `${itemId}-header`);
        collapse.setAttribute("data-bs-parent", `#${accordionId}`);

        const body = document.createElement("div");
        body.className = "accordion-body";
        body.innerHTML = item.content;

        collapse.appendChild(body);

        // Append header and collapse to the accordion item
        accordionItem.appendChild(header);
        accordionItem.appendChild(collapse);

        // Append the accordion item to the accordion container
        accordion.appendChild(accordionItem);
    });

    return accordion;
}