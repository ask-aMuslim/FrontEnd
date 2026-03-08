const { execSync } = require('child_process');
try {
    console.log('--- GIT STATUS ---');
    console.log(execSync('git status --short').toString());
    console.log('--- GIT DIFF ---');
    console.log(execSync('git diff HEAD~2 --name-only').toString());
} catch (e) {
    console.error(e.toString());
}
