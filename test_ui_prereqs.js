const https = require('https');

const BASE_URL = 'aam-api.ask-a-muslim.com';

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const opts = {
            hostname: BASE_URL,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
            },
        };

        const req = https.request(opts, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null }));
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function main() {
    const login = await request('POST', '/api/Authentication/login/admin', { email: 'admin@askamuslim.com', password: 'Admin@123456' });
    let token = login.body?.data?.token || login.body?.token;
    if (!token) {
        const login2 = await request('POST', '/api/Authentication/login/admin', { email: 'admin@ask-a-muslim.com', password: 'Admin@123456' });
        token = login2.body?.data?.token || login2.body?.token;
    }
    if (!token) {
        console.error("Login failed!");
        return;
    }
    console.log("Logged in!");

    const levelsRes = await request('GET', '/api/Levels?PageNumber=1&PageSize=20', null, token);
    const levels = levelsRes.body?.data?.items || levelsRes.body?.data || [];
    if (!levels.length) { console.error("No levels"); return; }

    const coursesRes = await request('GET', `/api/Courses?LevelId=${levels[0].id}&PageNumber=1&PageSize=50`, null, token);
    let courses = coursesRes.body?.data?.items || coursesRes.body?.data || [];

    if (courses.length < 6) {
        console.error("Not enough courses! Found: " + courses.length);
        return;
    }

    // Clear prerequisites for the 5 child courses just in case? The API might not need it, or it might just fail if they already exist.
    // We'll just try to POST.
    const parent = courses[0];
    const children = courses.slice(1, 6);

    console.log(`Setting "${parent.title}" as prerequisite for 5 courses...`);
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        console.log(` -> ${child.title}`);
        const res = await request('POST', `/api/Courses/${child.id}/prerequisites`, {
            prerequisiteCourseId: parent.id,
            order: i + 1,
        }, token);
        console.log(`    Status: ${res.status}`);
    }
    console.log("Done seeding UI test data.");
}

main().catch(console.error);
