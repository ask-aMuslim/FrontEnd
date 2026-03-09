const { execSync } = require('child_process');
const fs = require('fs');
try {
    const status = execSync('git status --short').toString();
    const build = execSync('npx ng build').toString();
    fs.writeFileSync('git_status.txt', status + '\n\n' + build);
} catch (e) {
    fs.writeFileSync('git_status.txt', e.toString() + (e.stdout ? '\nOutput: ' + e.stdout.toString() : ''));
}
