const { execSync } = require('child_process');
const fs = require('fs');

console.log('Looking for process on port 4200...');
try {
    const output = execSync('netstat -ano | findstr :4200').toString();
    const lines = output.trim().split('\n');
    const pids = new Set();
    for (const line of lines) {
        if (line.includes('LISTENING')) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            pids.add(pid);
        }
    }
    for (const pid of pids) {
        console.log('Killing PID', pid);
        execSync(`taskkill /PID ${pid} /F`);
    }
} catch (e) {
    console.log('No process on 4200 or error:', e.message);
}

console.log('Clearing .angular/cache...');
try {
    fs.rmSync('./.angular/cache', { recursive: true, force: true });
    console.log('Cache cleared successfully!');
} catch (e) {
    console.log('Error clearing cache:', e.message);
}
