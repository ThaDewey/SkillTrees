document.addEventListener("DOMContentLoaded", function () {
	const canvas = document.getElementById("skillTreeCanvas");
	const ctx = canvas.getContext("2d");

	class SkillNode {
		constructor(id, name, unlocked = false) {
			this.id = id;
			this.name = name;
			this.unlocked = unlocked;
			this.dependencies = [];
			this.x = 0; // Will be set dynamically
			this.y = 0; // Will be set dynamically
			this.radius = 30;
		}

		setPosition(x, y) {
			this.x = x;
			this.y = y;
		}

		draw() {
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
			ctx.fillStyle = this.unlocked ? "#cfc" : "#fcc";
			ctx.fill();
			ctx.stroke();

			ctx.fillStyle = "#000";
			ctx.textAlign = "center";
			ctx.font = "16px Arial";
			ctx.fillText(this.name, this.x, this.y + 5);
		}
	}

	const skillData = [
		{
			id: "ENG_1113",
			creditHours: 3,
			name: "English Composition",
			degree: "core",
			Domain: "writtenOralCommunication",
			category: "englishComp",
			required: true,
			unlocked: true,
			dependencies: [],
		},
		{
			id: "ENG_1153",
			creditHours: 3,
			degree: "core",
			Domain: "writtenOralCommunication",
			category: "englishComp",
			name: "english Composition - Int",
			unlocked: false,
			dependencies: [],
		},
		{
			id: "ENG_1213",
			creditHours: 3,
			degree: "core",
			Domain: "writtenOralCommunication",
			category: "englishComp",
			name: "english Composition and Research",
			unlocked: true,
			dependencies: [],
		},
		{
			id: "ENG_1223",
			creditHours: 3,
			degree: "core",
			Domain: "writtenOralCommunication",
			category: "englishComp",
			name: "Comp & Research: International",
			unlocked: false,
			dependencies: [],
		},
		{
			id: "MCOM_1113",
			creditHours: 3,
			degree: "core",
			Domain: "writtenOralCommunication",
			category: "englishComp",
			name: "fundamentqls of Speech",
			unlocked: false,
			dependencies: [],
		},
	];

	let skills = skillData.map(
		(data) => new SkillNode(data.id, data.name, data.unlocked)
	);

	skills.forEach((skill) => {
		skillData
			.find((s) => s.id === skill.id)
			.dependencies.forEach((depId) => {
				const dependency = skills.find((s) => s.id === depId);
				if (dependency) {
					skill.dependencies.push(dependency);
				}
			});
	});

	function layoutSkills() {
		const margin = 100;
		const verticalSpacing = 100;
		let currentY = margin;

		skills.forEach((skill, index) => {
			skill.setPosition(canvas.width / 2, currentY);
			currentY += verticalSpacing;
		});
	}

	function drawSkills() {
		ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
		skills.forEach((skill) => {
			skill.dependencies.forEach((dep) => {
				ctx.beginPath();
				ctx.moveTo(skill.x, skill.y);
				ctx.lineTo(dep.x, dep.y);
				ctx.stroke();
			});
		});
		skills.forEach((skill) => skill.draw());
	}

	layoutSkills();
	drawSkills();

	canvas.addEventListener("click", function (event) {
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		skills.forEach((skill) => {
			const distance = Math.sqrt((x - skill.x) ** 2 + (y - skill.y) ** 2);
			if (distance < skill.radius) {
				if (skill.dependencies.every((dep) => dep.unlocked)) {
					skill.unlocked = true;
					drawSkills();
				} else if (skill.dependencies.length === 0) {
					skill.unlocked = true; // Automatically unlock if no dependencies
					drawSkills();
				} else {
					alert("Dependencies not met!");
				}
			}
		});
	});
});
