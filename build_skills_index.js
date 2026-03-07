const fs = require('fs');
const path = require('path');

const skillsDir = path.join(__dirname, '.agents', 'skills');
const directories = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

const index = {};
let markdownIndex = `# Skills Index\n\n`;

for (const dir of directories) {
    const skillMdPath = path.join(skillsDir, dir, 'SKILL.md');
    if (fs.existsSync(skillMdPath)) {
        const content = fs.readFileSync(skillMdPath, 'utf8');
        // Extract frontmatter
        const match = content.match(/---\r?\n([\s\S]*?)\r?\n---/);
        let description = '';
        if (match) {
            const frontmatter = match[1];
            // Match description: "..." or description: ...
            const descMatch = frontmatter.match(/description:\s*["']?(.*?)["']?(?:\r?\n|$)/);
            if (descMatch) {
                description = descMatch[1].trim();
            }
        }
        if (!description) {
            // fallback to first non-empty line after frontmatter (excluding headers)
            const lines = content.replace(/---\r?\n([\s\S]*?)\r?\n---/, '').split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
            if (lines.length > 0) {
                description = lines[0].substring(0, 150);
            }
        }
        index[dir] = description;
        markdownIndex += `- **[${dir}](./skills/${dir}/SKILL.md)**: ${description}\n`;
    }
}

fs.writeFileSync(path.join(__dirname, '.agents', 'skills_index.json'), JSON.stringify(index, null, 2));
fs.writeFileSync(path.join(__dirname, '.agents', 'SKILLS_INDEX.md'), markdownIndex);
console.log(`Indexed ${Object.keys(index).length} skills successfully. Created .agents/skills_index.json and .agents/SKILLS_INDEX.md`);
