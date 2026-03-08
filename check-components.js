const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ?
            walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

console.log('Starting validation...');
let hasError = false;

walkDir(path.join(__dirname, 'src'), (filePath) => {
    if (filePath.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check missing templateUrl
        let matchTpl = content.match(/templateUrl:\s+['"]([^'"]+)['"]/);
        if (matchTpl) {
            const targetPath = path.join(path.dirname(filePath), matchTpl[1]);
            if (!fs.existsSync(targetPath)) {
                console.error('MISSING TEMPLATE:', targetPath, 'referenced in', filePath);
                hasError = true;
            }
        }

        // Check missing styleUrls or styleUrl
        let stlMatches = [...content.matchAll(/styleUrls?:\s*\[?(?:['"]([^'"]+)['"]\s*,?\s*)*\]?/g)];
        for (let match of stlMatches) {
            if (match[1]) {
                const targetPath = path.join(path.dirname(filePath), match[1]);
                if (!fs.existsSync(targetPath)) {
                    console.error('MISSING STYLE:', targetPath, 'referenced in', filePath);
                    hasError = true;
                }
            }
        }

        // Advanced regex to catch multiple styleUrls
        let multiStlMatch = content.match(/styleUrls?:\s*\[([^\]]+)\]/);
        if (multiStlMatch) {
            let urls = [...multiStlMatch[1].matchAll(/['"]([^'"]+)['"]/g)];
            for (let u of urls) {
                const targetPath = path.join(path.dirname(filePath), u[1]);
                if (!fs.existsSync(targetPath)) {
                    console.error('MISSING STYLE:', targetPath, 'referenced in', filePath);
                    hasError = true;
                }
            }
        }
    }
});

if (!hasError) {
    console.log('No missing templates or stylesheets found.');
}
