const fs = require('fs');
const path = require('path');

const workflowsDir = path.join(__dirname, '.agents', 'workflows');
const templatesDir = path.join(__dirname, '.specify', 'templates');

const expectedWorkflows = [
  'speckit.constitution.md',
  'speckit.implement.md',
  'speckit.clarify.md',
  'speckit.analyze.md',
  'speckit.checklist.md',
  'speckit.specify.md',
  'speckit.plan.md',
  'speckit.tasks.md'
];

const expectedTemplates = [
  'constitution-template.md',
  'plan-template.md',
  'spec-template.md',
  'tasks-template.md',
  'checklist-template.md'
];

console.log('--- Spec-Kit Validation ---');

let failures = 0;

console.log('\nChecking Workflows:');
expectedWorkflows.forEach(file => {
  const fullPath = path.join(workflowsDir, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('description:')) {
      console.log(`[PASS] ${file} (found with frontmatter)`);
    } else {
      console.log(`[FAIL] ${file} (missing 'description:' frontmatter)`);
      failures++;
    }
  } else {
    console.log(`[FAIL] ${file} (file missing)`);
    failures++;
  }
});

console.log('\nChecking Templates:');
expectedTemplates.forEach(file => {
  const fullPath = path.join(templatesDir, file);
  if (fs.existsSync(fullPath)) {
    console.log(`[PASS] ${file}`);
  } else {
    console.log(`[FAIL] ${file} (file missing)`);
    failures++;
  }
});

console.log(`\nValidation complete with ${failures} failures.`);
process.exit(failures > 0 ? 1 : 0);
