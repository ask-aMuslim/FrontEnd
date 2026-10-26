# Project-Scoped Rules

## Publishing Workflow
When asked to **publish** in this project:
1. Push the local `master` branch to the remote: `git push FrontEnd master`
2. Create a pull request from `master` to `production`: `gh pr create --repo ask-aMuslim/FrontEnd --base production --head master --title "<title>" --body "<body>"`
3. Merge the pull request into `production`: `gh pr merge <pr_number_or_url> --repo ask-aMuslim/FrontEnd --merge` (or `--squash`/`--auto`)

- Never push directly to the `production` branch without going through `master` and creating/merging a pull request.
