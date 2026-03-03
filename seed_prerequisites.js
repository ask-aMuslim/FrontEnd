/**
 * Seed Script: Add course prerequisites via the backend API
 * Usage: node seed_prerequisites.js
 * 
 * This script logs in as admin, fetches all levels + courses,
 * then adds prerequisites to form a hierarchical tree.
 */

const https = require('https');

const BASE_URL = 'aam-api.ask-a-muslim.com';

// --- HTTP helper ---
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
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
                } catch {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function main() {
    // 1. Login as admin
    console.log('\n--- 1. Admin Login ---');
    const loginRes = await request('POST', '/api/Authentication/login/admin', {
        email: 'admin@askamuslim.com',
        password: 'Admin@123456',
    });
    console.log('Login status:', loginRes.status);

    if (loginRes.status !== 200 || !loginRes.body?.data?.token) {
        console.log('Login failed:', JSON.stringify(loginRes.body, null, 2));
        console.log('\n⚠ Trying alternative admin credentials...');

        const login2 = await request('POST', '/api/Authentication/login/admin', {
            email: 'admin@ask-a-muslim.com',
            password: 'Admin@123456',
        });
        console.log('Login 2 status:', login2.status, JSON.stringify(login2.body?.data || login2.body?.message || login2.body, null, 2));

        if (login2.status !== 200 || !login2.body?.data?.token) {
            console.log('\n❌ Could not authenticate. Checking what the API returns...');
            return;
        }
    }

    const token = loginRes.body?.data?.token || loginRes.body?.token;
    console.log('✅ Token obtained:', token ? token.slice(0, 40) + '...' : 'NONE');

    // 2. Fetch all levels
    console.log('\n--- 2. Fetching Levels ---');
    const levelsRes = await request('GET', '/api/Levels?PageNumber=1&PageSize=20&IsPublished=true', null, token);
    console.log('Levels status:', levelsRes.status);
    const levels = levelsRes.body?.data?.items || levelsRes.body?.data || levelsRes.body || [];
    console.log('Levels found:', levels.length);
    levels.forEach(l => console.log(`  - ${l.id}: ${l.name || l.title}`));

    if (levels.length === 0) {
        console.log('\n❌ No levels found. Cannot seed prerequisites without levels and courses.');
        return;
    }

    // 3. Fetch all courses for first level
    const firstLevelId = levels[0].id;
    console.log(`\n--- 3. Fetching Courses for level ${firstLevelId} ---`);
    const coursesRes = await request('GET', `/api/Courses?LevelId=${firstLevelId}&PageNumber=1&PageSize=50`, null, token);
    console.log('Courses status:', coursesRes.status);
    const courses = coursesRes.body?.data?.items || coursesRes.body?.data || coursesRes.body || [];
    console.log('Courses found:', courses.length);
    courses.forEach((c, i) => console.log(`  ${i + 1}. ${c.id}: ${c.title}`));

    if (courses.length < 2) {
        console.log('\n❌ Need at least 2 courses to add prerequisites.');
        return;
    }

    // 4. Add prerequisites (sequential chain: course[0] -> course[1] -> course[2] etc.)
    console.log('\n--- 4. Adding Prerequisites ---');

    // Group courses by category
    const byCat = {};
    for (const c of courses) {
        const cat = c.category || 'other';
        if (!byCat[cat]) byCat[cat] = [];
        byCat[cat].push(c);
    }

    let addedCount = 0;
    for (const [cat, catCourses] of Object.entries(byCat)) {
        console.log(`\nCategory: ${cat} (${catCourses.length} courses)`);
        for (let i = 1; i < catCourses.length; i++) {
            const courseId = catCourses[i].id;
            const prereqId = catCourses[i - 1].id;
            console.log(`  Adding: "${catCourses[i].title}" requires "${catCourses[i - 1].title}"`);

            const res = await request('POST', `/api/Courses/${courseId}/prerequisites`, {
                prerequisiteCourseId: prereqId,
                order: i,
            }, token);

            if (res.status === 200 || res.status === 201) {
                console.log(`  ✅ Added successfully`);
                addedCount++;
            } else {
                console.log(`  ⚠ Status ${res.status}:`, JSON.stringify(res.body)?.slice(0, 100));
            }
        }
    }

    console.log(`\n✅ Done! Added ${addedCount} prerequisites.`);
    console.log('\nRefresh the Academy page to see the hierarchical tree!');
}

main().catch(console.error);
