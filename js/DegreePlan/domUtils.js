// Utility functions for DOM element creation

export function CreateElement(elementType) {
    return document.createElement(elementType);
}

export function BuildElement(elementType, text) {
    let element = CreateElement(elementType);
    element = ApplyText(element, text);
    return element;
}

export function ApplyText(element, text) {
    element.textContent = text;
    return element;
}
