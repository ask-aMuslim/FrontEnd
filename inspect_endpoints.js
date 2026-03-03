const fs = require('fs');
const coll = JSON.parse(fs.readFileSync('AskAMuslimBackend_API_collection.json', 'utf8'));

// Deep traverse to find all requests
const reqs = [];
function traverse(items) {
    if (!items) return;
    for (const item of items) {
        if (item.item) {
            traverse(item.item);
        } else if (item.request) {
            reqs.push({
                name: item.name,
                method: item.request.method,
                url: typeof item.request.url === 'string' ? item.request.url : item.request.url?.raw || '',
                bodyRaw: item.request.body?.raw || '',
            });
        }
    }
}

// Try to find collection item top level
const topLevel = coll.item || coll.collection?.item || [];
traverse(topLevel);

// Filter relevant
const filtered = reqs.filter(r => {
    const u = r.url.toLowerCase();
    return u.includes('auth') || u.includes('level') || u.includes('course') || u.includes('login');
}).slice(0, 30);

console.log(JSON.stringify(filtered.map(r => ({ name: r.name, method: r.method, url: r.url })), null, 2));
