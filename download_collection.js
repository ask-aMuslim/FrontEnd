const https = require('https');
const fs = require('fs');

const collectionId = 'dc526989-433f-49eb-bfd7-1ba2b17d6cfc';

const options = {
    hostname: 'api.postman.com',
    port: 443,
    path: `/collections/${collectionId}`,
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
            fs.writeFileSync('AskAMuslimBackend_API_collection.json', JSON.stringify(parsed, null, 2));
            console.log('Collection downloaded successfully: AskAMuslimBackend_API_collection.json');
        } catch (e) {
            console.error('Error parsing or writing file:', e);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem: ${e.message}`);
});
req.end();
