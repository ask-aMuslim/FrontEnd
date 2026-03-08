const fs = require('fs');
const d = JSON.parse(fs.readFileSync('C:/Users/aa631/.gemini/antigravity/brain/29431855-f50e-4253-8174-2c3ccc8c4580/.system_generated/steps/2227/output.txt', 'utf8'));

let output = '';

function log(msg) {
    output += msg + '\n';
}

function findCourses(items) {
    items.forEach(i => {
        if (i.item) {
            findCourses(i.item);
        } else if (i.request && i.request.url && i.request.url.raw && i.request.url.raw.includes('/api/Course')) {
            log('--- Endpoint: ' + i.name + ' ' + i.request.method + ' ' + i.request.url.raw);
            i.response.forEach(r => {
                if (r.body) {
                    log('Response Body Snippet:');
                    log(r.body.substring(0, 1500));
                }
            });
        }
    });
}
if (d.collection && d.collection.item) {
    findCourses(d.collection.item);
} else {
    log('No items found');
}

fs.writeFileSync('parsed_postman.txt', output);
console.log('Done!');
