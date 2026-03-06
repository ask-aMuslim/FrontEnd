const fs = require('fs');
const data = JSON.parse(fs.readFileSync('AskAMuslimBackend_API_collection.json', 'utf8'));
const reqs = [];
function traverse(item) {
    if (item.item) {
        item.item.forEach(traverse);
    } else if (item.request && item.request.url && item.request.url.raw && item.request.url.raw.includes('roadmap')) {
        reqs.push(item);
    }
}
traverse(data);
console.log(JSON.stringify(reqs.map(i => ({
    name: i.name,
    responses: i.response.map(r => r.body)
})), null, 2));
