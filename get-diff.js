const { execSync } = require('child_process');
const fs = require('fs');
try {
    const diff = execSync('git diff HEAD~1').toString();
    fs.writeFileSync('diff.txt', diff);
} catch (e) {
    fs.writeFileSync('diff.txt', 'Error: ' + e.message);
}
process.exit(0);
