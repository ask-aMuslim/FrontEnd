const https = require('https');

const options = {
    hostname: 'api.getpostman.com',
    path: '/collections?workspace=1c3e34b1-e28a-4464-9b81-be99caeff76a',
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
