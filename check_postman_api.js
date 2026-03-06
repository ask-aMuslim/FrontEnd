const https = require('https');

const options = {
    hostname: 'api.postman.com',
    port: 443,
    path: '/collections',
    method: 'GET',
    headers: {
        'X-Api-Key': 'PMAK-698cb72137f70b0001078161-52224c9747c87d3e2a963b0cab8f71920c'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem: ${e.message}`);
});
req.end();
