const fs = require('fs');
const data = JSON.parse(fs.readFileSync('swagger.json', 'utf8'));
console.log(JSON.stringify(data.paths['/api/Courses/roadmap/{levelId}'], null, 2));
