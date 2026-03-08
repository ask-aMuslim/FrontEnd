const https = require('https');
const fs = require('fs');

https.get('https://aam-api.ask-a-muslim.com/api/Course/GetCourses', (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
        data += chunk;
    });
    resp.on('end', () => {
        fs.writeFileSync('courses_api_out_v2.json', data);
        console.log('Saved to courses_api_out_v2.json');
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
