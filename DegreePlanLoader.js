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
    const response = await fetch(url);
    return await response.json();
  }
}