// Import the JSON file (if using a module bundler like Webpack or Vite)
import degreeCodes from './DegreeCodes.json';

// Preprocess the degree codes to remove periods
const normalizedDegreeCodes = Object.keys(degreeCodes.degreeCodes).reduce((acc, key) => {
    const normalizedKey = key.replace(/\./g, ''); // Remove periods from the key
    acc[normalizedKey] = degreeCodes.degreeCodes[key];
    return acc;
}, {});


// Function to look up a degree code
function getDegreeDescription(code) {
    const normalizedCode = code.replace(/\./g, ''); // Normalize the input
    return normalizedDegreeCodes[normalizedCode] || "Degree code not found";
}