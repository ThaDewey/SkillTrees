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