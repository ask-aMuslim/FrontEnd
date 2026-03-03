const https = require('https');

const options = {
    hostname: 'api.getpostman.com',
    path: '/collections/36594832-dc526989-433f-49eb-bfd7-1ba2b17d6cfc',
    method: 'GET',
    headers: {
        'X-Api-Key': 'PMAK-699e3aa9178d520001056580-cda5982bc60c4ca413e04f7e5dc950f74a'
    }
};

const req = https.request(options, res => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        try {
            const coll = JSON.parse(data);
            const reqs = [];
            function traverse(item) {
                if (!item) return;
                if (item.item) {
                    item.item.forEach(traverse);
                } else if (item.request && item.request.url && item.request.url.raw && item.request.url.raw.includes('roadmap')) {
                    reqs.push(item);
                }
            }
            traverse(coll.collection);
            console.log(JSON.stringify(reqs.map(i => ({
                name: i.name,
                responses: i.response.map(r => r.body)
            })), null, 2));
        } catch (e) {
            console.log('Error parsing or traversing. Raw output:');
            console.log(data.slice(0, 1000));
        }
    });
});

req.on('error', error => {
    console.error(error);
});

req.end();
