// filepath: e:\Projects\SkillTrees\DegreePlanLoader.js
// --- Data Loader ---
// Responsible for fetching and returning the degree plan JSON data.
export class DegreePlanLoader {
  /**
   * Loads a JSON file from the given URL.
   * @param {string} url - The URL to fetch the JSON from.
   * @returns {Promise<Object>} - The parsed JSON object.
   */
  async load(url) {
    console.log("Attempting to load degree plan from URL:", url);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load degree plan: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Successfully loaded degree plan:", data);
      return data;
    } catch (error) {
      console.error("Error loading degree plan:", error);
      return null;
    }
  }
}