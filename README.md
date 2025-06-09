# SkillTrees

SkillTrees is a small experiment for visualizing academic degree plans as an interactive skill tree. The HTML pages use simple JavaScript modules to render course data and dependencies using the [vis-network](https://visjs.github.io/vis-network/) graph library. A D3-based visualization is also available for force-directed layouts.

## Setup

No build step is required. The project is plain HTML/JS and expects to be served from a web server so that module imports work correctly. Start a simple local server from the repository root:

```bash
python3 -m http.server
```

Then open your browser to `http://localhost:8000/DegreeSheet.html`.

## Required Libraries

The following libraries are loaded from CDNs by the HTML files:

- **vis-network** – renders the skill tree graph
- **D3** – used for alternate tree layouts
- **Bootstrap** – provides basic styling (included in `DegreeSheet.html`)

No additional installation is required as these libraries are fetched via CDN when the page loads.

## Viewing DegreeSheet.html

1. Run the server command shown above.
2. Navigate to `http://localhost:8000/DegreeSheet.html` in your web browser.
3. Optionally supply a `key` query parameter to load a specific degree plan. For example:

```
http://localhost:8000/DegreeSheet.html?key=6100
```

This will load the JSON file `DegreeJSON/6100.json` and render it as a skill tree.
