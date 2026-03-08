const fs = require('fs');
const path = 'C:/Users/aa631/.gemini/antigravity/brain/29431855-f50e-4253-8174-2c3ccc8c4580/.system_generated/steps/2227/output.txt';

try {
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    let out = '';

    function search(items) {
        for (let i of items) {
            if (i.item) search(i.item);
            else if (i.name && i.name.toLowerCase().includes('course')) {
                out += 'FOUND REQUEST: ' + i.name + '\n';
                if (i.response && i.response.length > 0) {
                    i.response.forEach(r => {
                        out += 'RESPONSE BODY:\n';
                        if (r.body) {
                            out += r.body.substring(0, 1500) + '\n';
                        } else {
                            out += 'Empty body\n';
                        }
                    });
                } else {
                    out += 'No response examples saved.\n';
                }
            }
        }
    }

    if (data.collection && data.collection.item) {
        search(data.collection.item);
    }

    fs.writeFileSync('courses_postman.txt', out);
    console.log('Script completed. Check courses_postman.txt');
} catch (e) {
    console.error('Error:', e);
}
