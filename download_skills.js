const { exec } = require('child_process');
const fs = require('fs');

const logFile = 'install_log.txt';
const command = 'npx -y antigravity-awesome-skills@latest --path .agents/skills';

fs.writeFileSync(logFile, `Starting installation at ${new Date().toISOString()}\n`);

const child = exec(command, { cwd: process.cwd() });

child.stdout.on('data', (data) => {
    fs.appendFileSync(logFile, `STDOUT: ${data}`);
});

child.stderr.on('data', (data) => {
    fs.appendFileSync(logFile, `STDERR: ${data}`);
});

child.on('close', (code) => {
    fs.appendFileSync(logFile, `Process exited with code ${code} at ${new Date().toISOString()}\n`);
});
