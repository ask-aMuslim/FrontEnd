const https = require('https');
const fs = require('fs');

const url = 'https://codeload.github.com/sickn33/antigravity-awesome-skills/zip/refs/heads/main';
const file = fs.createWriteStream('skills.zip');

https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log('Download completed.');
    });
}).on('error', (err) => {
    fs.unlink('skills.zip');
    console.error('Error downloading file:', err.message);
});
