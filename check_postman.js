const https = require('https');

const collectionId = 'f697bb80-b287-46b4-9fa6-7bc595e6028f';

const options = {
    hostname: 'api.getpostman.com',
    path: `/collections/${collectionId}`,
    method: 'GET',
    headers: {
        'X-Api-Key': 'PMAK-699e3aa9178d520001056580-cda5982bc60c4ca413e04f7e5dc950f74a'
    }
};

const req = https.request(options, res => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        console.log(JSON.stringify(JSON.parse(data), null, 2));
    });
});

req.on('error', error => {
    console.error(error);
});

req.end();
