import fs from "fs";
import path from "path";

// Title map for all categories we support in /data
const categories = {
  "ai_tools.json": "🧠 AI & LLM APIs",
  "dev_tools.json": "🧰 Developer Tools",
  "mobile_builders.json": "📱 Mobile App Builders",
  "design_tools.json": "🎨 Design, Video & Demo Creation",
  "frontend_frameworks.json": "🧩 Frontend Frameworks",
  "backend_tools.json": "⚙️ Backend & Databases",
  "payments.json": "💸 Payments & Monetization",
  "analytics.json": "📈 Analytics & Tracking",
  "communication_email.json": "📧 Communication & Email",
  "privacy.json": "🔐 Security & Privacy",
  "productivity.json": "🧭 Project Management & Productivity",
  "launch_community.json": "🚀 Launch & Community Platforms",
  "learning.json": "🧠 Learning Resources"
};

let readme = `# 🌍 Programmify AI Builders Toolkit\n\n`;
readme += `Automatically generated from the data files in \`/data/\`.\n\n`;

for (const [file, title] of Object.entries(categories)) {
  const filePath = path.join('data', file);
  if (!fs.existsSync(filePath)) continue;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const count = Array.isArray(data) ? data.length : 0;
  readme += `## ${title} (${count})\n\n`;
  readme += `| Name | Description | Type | Learn | Tags | Popularity |\n`;
  readme += `|------|--------------|------|-------|------|------------|\n`;
  data.forEach((tool) => {
    const name = tool.name || '';
    const link = tool.link || tool.website || '#';
    const desc = (tool.description || '').replace(/\|/g, '\\|');
    const type = tool.type || tool.pricing || '';
    const tutorial = tool.tutorial || link;
    const tags = Array.isArray(tool.tags) ? tool.tags.join(", ") : '';
    const popularity = tool.popularity || '';
    readme += `| [${name}](${link}) | ${desc} | ${type} | [Docs](${tutorial}) | ${tags} | ${popularity} |\n`;
  });
  readme += `\n---\n\n`;
}

fs.writeFileSync('README.md', readme);
console.log('✅ README updated');
