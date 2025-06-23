import { parseDegreePlanHierarchical } from "../../Parsers/DegreePlanParser.js";

/**
 * Unicode-safe base64 encoding function
 * @param {string} str - String to encode
 * @returns {string} Base64 encoded string
 */
function unicodeSafeBase64(str) {
	return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Generate a custom SVG for a course node
 * @param {string} courseName - Course name (e.g., "CMSC 1013")
 * @param {number} credits - Credit hours
 * @param {boolean} completed - Whether the course is completed
 * @returns {string} SVG data URL
 */
function generateCourseNodeSVG(courseName, credits = 3, completed = false) {
	const borderColor = completed ? "#4CAF50" : "#555";
	const progressFill = completed ? "#4CAF50" : "#333";
	
	const svg = `
<svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
  <!-- Background with rounded corners -->
  <rect x="2" y="2" width="196" height="56" rx="8" ry="8" 
        fill="#2a2a2a" stroke="#555" stroke-width="2"/>
    <!-- Icon circle on the left -->
  <circle cx="25" cy="30" r="12" fill="#444" stroke="#666" stroke-width="1"/>
  <text x="25" y="35" text-anchor="middle" fill="#fff" font-size="10" font-family="Arial">C</text>
  
  <!-- Course name -->
  <text x="45" y="20" fill="#fff" font-size="12" font-weight="bold" font-family="Arial">${courseName}</text>
  
  <!-- Credit hours -->
  <text x="45" y="35" fill="#ccc" font-size="10" font-family="Arial">+${credits} CR</text>
  
  <!-- Progress indicators (bottom right) -->
  <g transform="translate(160, 40)">
    <rect x="0" y="0" width="8" height="8" fill="${progressFill}" stroke="#555"/>
    <rect x="10" y="0" width="8" height="8" fill="${progressFill}" stroke="#555"/>
    <rect x="20" y="0" width="8" height="8" fill="${progressFill}" stroke="#555"/>
  </g>
  
  <!-- Border highlight for completed courses -->
  <rect x="0" y="0" width="200" height="60" rx="8" ry="8" 
        fill="none" stroke="${borderColor}" stroke-width="3" opacity="0.8"/>
</svg>`;
		// Convert SVG to data URL
	return 'data:image/svg+xml;base64,' + unicodeSafeBase64(svg);
}

/**
 * Generate enhanced SVG for course nodes with game-like styling
 * @param {string} courseName - Course name
 * @param {number} credits - Credit hours
 * @param {string} nodeState - 'locked', 'unlocked', 'selected'
 * @param {boolean} optional - Whether the course is optional
 * @returns {string} SVG data URL
 */
function generateEnhancedCourseNodeSVG(courseName, credits = 3, nodeState = 'unlocked', optional = false) {
	let bgColor, borderColor, textColor, iconColor, glowColor;
	
	switch (nodeState) {
		case 'locked':
			bgColor = '#2a2a2a';
			borderColor = '#555';
			textColor = '#888';
			iconColor = '#666';
			glowColor = 'none';
			break;
		case 'selected':
			bgColor = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
			borderColor = '#4CAF50';
			textColor = '#fff';
			iconColor = '#fff';
			glowColor = '0 0 10px rgba(76, 175, 80, 0.6)';
			break;
		case 'unlocked':
		default:
			bgColor = optional ? 
				'linear-gradient(135deg, #3f51b5 0%, #303f9f 100%)' : 
				'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)';
			borderColor = optional ? '#3f51b5' : '#2196F3';
			textColor = '#fff';
			iconColor = '#fff';
			glowColor = optional ? 
				'0 0 8px rgba(63, 81, 181, 0.4)' : 
				'0 0 8px rgba(33, 150, 243, 0.4)';
			break;
	}
	
	const courseCode = courseName.split(' ')[1] || courseName.substring(0, 4);
	const opacity = nodeState === 'locked' ? '0.6' : '1';
	
	const svg = `
<svg width="220" height="80" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
    </linearGradient>
  </defs>
  
  <!-- Drop shadow -->
  <rect x="4" y="4" width="212" height="72" rx="12" ry="12" 
        fill="rgba(0,0,0,0.3)" opacity="${opacity}"/>
  
  <!-- Main background -->
  <rect x="2" y="2" width="212" height="72" rx="12" ry="12" 
        fill="${bgColor.includes('gradient') ? 'url(#mainGrad)' : bgColor}" 
        stroke="${borderColor}" stroke-width="2" opacity="${opacity}"
        style="box-shadow: ${glowColor !== 'none' ? glowColor : 'none'}"/>
  
  ${bgColor.includes('gradient') ? `
  <defs>
    <linearGradient id="mainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      ${bgColor.includes('#4CAF50') ? 
        '<stop offset="0%" style="stop-color:#4CAF50"/><stop offset="100%" style="stop-color:#45a049"/>' :
        bgColor.includes('#3f51b5') ?
        '<stop offset="0%" style="stop-color:#3f51b5"/><stop offset="100%" style="stop-color:#303f9f"/>' :
        '<stop offset="0%" style="stop-color:#2196F3"/><stop offset="100%" style="stop-color:#1976D2"/>'
      }
    </linearGradient>
  </defs>` : ''}
  
  <!-- Highlight overlay -->
  <rect x="2" y="2" width="212" height="72" rx="12" ry="12" 
        fill="url(#bg)" opacity="${opacity}"/>
  
  <!-- Icon hexagon -->
  <g transform="translate(25, 38)" opacity="${opacity}">
    <polygon points="0,-12 10,-6 10,6 0,12 -10,6 -10,-6" 
             fill="${iconColor}" stroke="${borderColor}" stroke-width="1"/>
    <text x="0" y="4" text-anchor="middle" fill="${bgColor.includes('gradient') ? '#000' : '#fff'}" 
          font-size="10" font-weight="bold" font-family="Arial">${courseCode}</text>
  </g>
  
  <!-- Course name -->
  <text x="50" y="25" fill="${textColor}" font-size="14" font-weight="bold" 
        font-family="Arial, sans-serif" opacity="${opacity}">${courseName}</text>
  
  <!-- Credit hours -->
  <text x="50" y="42" fill="${textColor}" font-size="11" 
        font-family="Arial, sans-serif" opacity="${parseFloat(opacity) * 0.8}">
    ${credits} Credit${credits !== 1 ? 's' : ''}
  </text>
  
  <!-- Optional indicator -->
  ${optional ? `
  <text x="50" y="57" fill="#FFC107" font-size="10" font-weight="bold" 
        font-family="Arial, sans-serif" opacity="${opacity}">OPTIONAL</text>
  ` : ''}
  
  <!-- Progress/completion indicators -->
  <g transform="translate(170, 50)" opacity="${opacity}">
    ${nodeState === 'selected' ? `
    <circle cx="0" cy="0" r="8" fill="#4CAF50" stroke="#fff" stroke-width="2"/>
    <path d="M-3,0 L-1,3 L4,-3" stroke="#fff" stroke-width="2" fill="none"/>
    ` : nodeState === 'locked' ? `
    <rect x="-6" y="-6" width="12" height="12" fill="#666" stroke="#888" stroke-width="1" rx="2"/>
    <path d="M-2,-2 L2,2 M2,-2 L-2,2" stroke="#aaa" stroke-width="1"/>
    ` : `
    <circle cx="0" cy="0" r="6" fill="none" stroke="${borderColor}" stroke-width="2"/>
    `}
  </g>
  
  <!-- Connection points -->
  <circle cx="2" cy="38" r="3" fill="${borderColor}" opacity="0.7"/>  <circle cx="218" cy="38" r="3" fill="${borderColor}" opacity="0.7"/>
</svg>`;
	
	return 'data:image/svg+xml;base64,' + unicodeSafeBase64(svg);
}

/**
 * Build a simplified, horizontal skill tree graph with collapsible categories.
 * @param {Object} degreePlan - The degree plan object.
 * @param {Array} [prereqs] - Optional array of prerequisite mappings (from 202510_Pre26CoReqs.json).
 * @param {Object} [collapsedState] - State of collapsed categories/subcategories
 * @param {Object} [nodeStates] - State of individual nodes (locked/unlocked/selected)
 * @returns {{nodes: Array, edges: Array, groupMap: Object, categoryInfo: Object}}
 */
export function buildSkillTreeGraph(degreePlan, prereqs = [], collapsedState = {}, nodeStates = {}) {
	const blocks = parseDegreePlanHierarchical(degreePlan);
	// 1. Collect all courses with their category/subcategory info
	const courseList = [];
	const categoryInfo = {}; // Track category positions
	let categoryYOffset = 0;
	
	blocks.forEach((block, blockIdx) => {
		block.categories.forEach((category, catIdx) => {
			const categoryKey = `${blockIdx}-${catIdx}`;
			categoryInfo[categoryKey] = {
				label: category.label,
				yOffset: categoryYOffset,
				subcategories: []
			};
			
			let subcatYOffset = 0;
			category.subcategories.forEach((subcat, subcatIdx) => {
				const subcatKey = `${categoryKey}-${subcatIdx}`;
				categoryInfo[categoryKey].subcategories.push({
					key: subcatKey,
					label: subcat.label,
					yOffset: subcatYOffset,
					courses: []
				});
						(subcat.courses || []).forEach((course) => {
					const courseId = `${course.subj} ${course.num}`;
					const courseData = {
						label: courseId,
						id: courseId,
						credits: course.credits || 3,
						optional: course.optional || false,
						nodeState: nodeStates[courseId] || 'unlocked', // Default to unlocked
						categoryKey,
						subcatKey,
						blockLabel: block.label,
						categoryLabel: category.label,
						subcatLabel: subcat.label
					};
					courseList.push(courseData);
					categoryInfo[categoryKey].subcategories.find(s => s.key === subcatKey).courses.push(courseData);
				});
				
				subcatYOffset += (subcat.courses || []).length * 80 + 40; // Space between subcategories
			});
			
			categoryYOffset += subcatYOffset + 60; // Space between categories
		});
	});

	// 2. Build a prereq map: course => [prereq, ...]
	const prereqMap = {};
	if (Array.isArray(prereqs)) {
		prereqs.forEach((pr) => {
			const courseKey = `${pr.coursesubject} ${pr.coursenumber}`;
			const reqKey = `${pr.reqsubject} ${pr.reqnumber}`;
			if (!prereqMap[courseKey]) prereqMap[courseKey] = [];
			prereqMap[courseKey].push(reqKey);
		});
	}
	// 3. Compute course levels and determine node states based on prerequisites
	const courseLevels = {};
	const courseSet = new Set(courseList.map((c) => c.id));
	
	// Initialize all courses as locked first
	courseList.forEach((c) => {
		if (!nodeStates[c.id]) {
			nodeStates[c.id] = 'locked';
		}
	});
	
	// Courses with no prereqs in the prereqMap or whose prereqs are not in courseSet should be unlocked
	courseList.forEach((c) => {
		const prereqs = prereqMap[c.id] || [];
		if (prereqs.length === 0 || prereqs.every((p) => !courseSet.has(p))) {
			courseLevels[c.id] = 0;
			if (nodeStates[c.id] === 'locked') {
				nodeStates[c.id] = 'unlocked'; // Auto-unlock courses with no prerequisites
			}
		}
	});
	
	// BFS to assign levels and update node states
	let changed = true;
	while (changed) {
		changed = false;
		courseList.forEach((c) => {
			if (courseLevels[c.id] !== undefined) return;
			const prereqs = prereqMap[c.id] || [];
			const prereqLevels = prereqs.map((p) => courseLevels[p]).filter((l) => l !== undefined);
			if (prereqLevels.length === prereqs.length && prereqLevels.length > 0) {
				const level = Math.max(...prereqLevels) + 1;
				courseLevels[c.id] = level;
				
				// Check if prerequisites are satisfied to unlock this course
				const prereqsSatisfied = prereqs.every((p) => nodeStates[p] === 'selected');
				if (prereqsSatisfied && nodeStates[c.id] === 'locked') {
					nodeStates[c.id] = 'unlocked';
				}
				changed = true;
			}
		});
	}
	// 4. Assign x/y positions for a horizontal layout grouped by categories
	const levels = {};
	Object.entries(courseLevels).forEach(([id, level]) => {
		if (!levels[level]) levels[level] = [];
		levels[level].push(id);
	});
	
	const nodes = [];
	const xSpacing = 280;		// Add category and subcategory labels as nodes with collapse/expand functionality
	Object.entries(categoryInfo).forEach(([catKey, catInfo]) => {
		const isCategoryCollapsed = collapsedState[`cat-${catKey}`] || false;
		
		// Add category label node with expand/collapse icon
		const categoryHeaderSVG = generateCategoryHeaderSVG(catInfo.label, !isCategoryCollapsed, 'category');
		nodes.push({
			id: `cat-${catKey}`,
			label: "", // Label is in the SVG
			shape: "image",
			image: categoryHeaderSVG,
			size: 50,
			x: -150,
			y: catInfo.yOffset,
			fixed: { x: true, y: true },
			physics: false,
			collapsible: true,
			nodeType: "category",
			title: `Click to ${isCategoryCollapsed ? 'expand' : 'collapse'} ${catInfo.label}`
		});
		
		// Only show subcategories if category is not collapsed
		if (!isCategoryCollapsed) {
			catInfo.subcategories.forEach((subcatInfo) => {
				const isSubcatCollapsed = collapsedState[`subcat-${subcatInfo.key}`] || false;
				
				// Add subcategory label node with expand/collapse icon
				const subcategoryHeaderSVG = generateCategoryHeaderSVG(subcatInfo.label, !isSubcatCollapsed, 'subcategory');
				nodes.push({
					id: `subcat-${subcatInfo.key}`,
					label: "", // Label is in the SVG
					shape: "image",
					image: subcategoryHeaderSVG,
					size: 40,
					x: -75,
					y: catInfo.yOffset + subcatInfo.yOffset,
					fixed: { x: true, y: true },
					physics: false,
					collapsible: true,
					nodeType: "subcategory",
					title: `Click to ${isSubcatCollapsed ? 'expand' : 'collapse'} ${subcatInfo.label}`
				});
			});
		}
	});
		// Add course nodes positioned by level and grouped by subcategory (only if visible)
	Object.entries(levels).forEach(([level, courseIds]) => {
		courseIds.forEach((id) => {
			const course = courseList.find(c => c.id === id);
			if (!course) return;
			
			const catInfo = categoryInfo[course.categoryKey];
			const subcatInfo = catInfo.subcategories.find(s => s.key === course.subcatKey);
			const courseIndexInSubcat = subcatInfo.courses.findIndex(c => c.id === id);
					// Only show course if both category and subcategory are expanded
			const isCategoryCollapsed = collapsedState[`cat-${course.categoryKey}`] || false;
			const isSubcatCollapsed = collapsedState[`subcat-${course.subcatKey}`] || false;
			
			if (!isCategoryCollapsed && !isSubcatCollapsed) {
				// Update course node state based on current nodeStates
				course.nodeState = nodeStates[course.id] || course.nodeState;
				
				const nodeImage = generateEnhancedCourseNodeSVG(
					id, 
					course.credits, 
					course.nodeState, 
					course.optional
				);
				
				nodes.push({
					id,
					label: "", // No label since it's in the SVG
					shape: "image",
					image: nodeImage,
					size: 80, // Increased size for enhanced nodes
					x: parseInt(level) * xSpacing,
					y: catInfo.yOffset + subcatInfo.yOffset + (courseIndexInSubcat * 90),
					fixed: { x: true, y: true },
					title: `${id}${course.optional ? ' (Optional)' : ''}\n${course.blockLabel} > ${course.categoryLabel} > ${course.subcatLabel}\n${course.credits} Credit Hours\nStatus: ${course.nodeState.charAt(0).toUpperCase() + course.nodeState.slice(1)}`,
					nodeType: "course",
					courseData: course // Store course data for interactions
				});
			}
		});
	});	// 5. Add edges for prerequisites (only for visible courses) with enhanced styling
	const edges = [];
	const visibleCourses = new Set(nodes.filter(n => n.nodeType === "course").map(n => n.id));
	
	Object.entries(prereqMap).forEach(([course, prereqs]) => {
		prereqs.forEach((pr) => {
			if (courseSet.has(course) && courseSet.has(pr) && 
				visibleCourses.has(course) && visibleCourses.has(pr)) {
				
				// Style edge based on prerequisite completion
				const prereqNode = nodes.find(n => n.id === pr);
				const isPrereqCompleted = prereqNode?.courseData?.nodeState === 'selected';
				
				edges.push({ 
					from: pr, 
					to: course, 
					color: { 
						color: isPrereqCompleted ? "#4CAF50" : "#888",
						opacity: isPrereqCompleted ? 0.8 : 0.5
					}, 
					arrows: { 
						to: { 
							enabled: true, 
							scaleFactor: 1.2,
							type: "arrow"
						}
					}, 
					width: isPrereqCompleted ? 3 : 2,
					smooth: { 
						type: "curvedCW",
						roundness: 0.2
					},
					dashes: !isPrereqCompleted,
					title: `Prerequisite: ${pr} → ${course}${isPrereqCompleted ? ' (Completed)' : ' (Incomplete)'}`
				});
			}
		});
	});

	return { nodes, edges, groupMap: {}, categoryInfo, nodeStates };
}

/**
 * Helper to load prerequisites from a JSON file (proof of concept).
 * @param {string} url - Path to 202510_Pre26CoReqs.json
 * @returns {Promise<Array>} - Array of prereq mappings
 */
export async function loadPrereqs(url = "../../DegreeJSON/202510_Pre26CoReqs.json") {
	const resp = await fetch(url);
	if (!resp.ok) throw new Error("Failed to load prereqs");
	return await resp.json();
}

/**
 * Generate SVG for category/subcategory headers with better styling
 * @param {string} label - Category name
 * @param {boolean} isExpanded - Whether expanded
 * @param {string} type - 'category' or 'subcategory'
 * @returns {string} SVG data URL
 */
function generateCategoryHeaderSVG(label, isExpanded = true, type = 'category') {
	const isCategory = type === 'category';
	const width = isCategory ? 300 : 250;
	const height = isCategory ? 50 : 40;
	const bgColor = isCategory ? 
		'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' : 
		'linear-gradient(135deg, #0f3460 0%, #16537e 100%)';
	const fontSize = isCategory ? '16' : '14';
	const expandIcon = isExpanded ? '▼' : '▶';
	
	const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="catBg" x1="0%" y1="0%" x2="100%" y2="100%">
      ${isCategory ? 
        '<stop offset="0%" style="stop-color:#1a1a2e"/><stop offset="100%" style="stop-color:#16213e"/>' :
        '<stop offset="0%" style="stop-color:#0f3460"/><stop offset="100%" style="stop-color:#16537e"/>'
      }
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect x="2" y="2" width="${width-4}" height="${height-4}" rx="8" ry="8" 
        fill="url(#catBg)" stroke="#444" stroke-width="1" 
        filter="url(#shadow)"/>
  
  <!-- Expand/collapse icon -->
  <text x="15" y="${height/2 + 5}" fill="#fff" font-size="${fontSize}" 
        font-family="Arial, sans-serif" font-weight="bold">${expandIcon}</text>
  
  <!-- Label -->
  <text x="35" y="${height/2 + 5}" fill="#fff" font-size="${fontSize}" 
        font-family="Arial, sans-serif" font-weight="bold">${label}</text>
  
  <!-- Hover effect overlay -->
  <rect x="2" y="2" width="${width-4}" height="${height-4}" rx="8" ry="8" 
        fill="rgba(255,255,255,0.1)" opacity="0" class="hover-overlay">
    <animate attributeName="opacity" begin="mouseover" end="mouseout"             from="0" to="1" dur="0.2s" fill="freeze"/>
  </rect>
</svg>`;
	
	return 'data:image/svg+xml;base64,' + unicodeSafeBase64(svg);
}
