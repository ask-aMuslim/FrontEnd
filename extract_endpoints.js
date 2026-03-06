const fs = require('fs');
const path = 'C:/Users/aa631/.gemini/antigravity/brain/29431855-f50e-4253-8174-2c3ccc8c4580/.system_generated/steps/823/output.txt';

const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const endpoints = [];

function extractUrl(urlObj) {
    if (typeof urlObj === 'string') return urlObj;
    if (urlObj && urlObj.raw) return urlObj.raw;
    return '';
}

function processItem(item) {
    if (item.item) {
        item.item.forEach(processItem);
    } else if (item.request && item.request.url) {
        const method = item.request.method;
        const url = extractUrl(item.request.url);
        endpoints.push(`${method} ${url}`);
    }
}

processItem(data.collection);

const keywords = ['academy', 'course', 'stage', 'level', 'lesson'];
const filtered = endpoints.filter(e => {
    const lower = e.toLowerCase();
    return keywords.some(k => lower.includes(k));
});

fs.writeFileSync('d:/College Content/Ask A Muslim/PROJECT/AskAMuslim/endpoints.txt', filtered.join('\n'));
console.log('done');
