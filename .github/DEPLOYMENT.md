# Quick Deployment Reference - Frontend

## 🚀 Deploy to Production

### Method 1: Automatic (Recommended)
```bash
# Merge your changes to production branch
git checkout production
git merge main  # or your feature branch
git push origin production

# GitHub Actions will automatically deploy! 🎉
# View progress at: https://github.com/ask-aMuslim/FrontEnd/actions
```

### Method 2: Manual Deployment
```bash
# SSH into server
ssh azmy@164.68.111.197

# Run deployment script
cd /srv/docker/web/FrontEnd/.github/workflows
./deploy-manual.sh
```

### Method 3: Direct Commands
```bash
# SSH into server
ssh azmy@164.68.111.197

# Pull and rebuild
cd /srv/docker/web/FrontEnd && git pull origin production
cd /srv/docker && docker compose build web && docker compose up -d web
```

## 📊 Check Deployment Status

```bash
# On server
docker compose ps web
docker compose logs web --tail 50 -f

# Check health
docker inspect web --format='{{.State.Health.Status}}'
```

## 🔧 Setup Required (One-time)

### 1. Add GitHub Secrets
Go to: https://github.com/ask-aMuslim/FrontEnd/settings/secrets/actions

Add these secrets:
- `SERVER_HOST`: 164.68.111.197
- `SERVER_USER`: azmy
- `SSH_PRIVATE_KEY`: Your deployment SSH private key (same as API)
- `SSH_PORT`: 22 (optional)

### 2. SSH Key Already Set Up
You can use the same SSH key from the API deployment:
```bash
cat ~/.ssh/github_key
# Copy the entire output to GitHub Secrets
```

## 🆘 Troubleshooting

### Deployment Failed
```bash
# Check GitHub Actions logs first!
# Then SSH and check:
docker compose logs web --tail 200
docker compose ps web
```

### Rollback
```bash
ssh azmy@164.68.111.197
cd /srv/docker/web/FrontEnd
git log --oneline -10  # Find commit to rollback to
git reset --hard <commit-hash>
cd /srv/docker
docker compose build web && docker compose up -d web
```

## 📝 Pre-deployment Checklist

- [ ] Changes tested locally
- [ ] Build successful (`npm run build` or similar)
- [ ] Environment variables updated (if needed)
- [ ] Dependencies updated in package.json
- [ ] Code reviewed and approved
- [ ] Merged to production branch

## 🔗 Useful Links

- Repository: https://github.com/ask-aMuslim/FrontEnd
- Actions: https://github.com/ask-aMuslim/FrontEnd/actions
- Server: ssh://azmy@164.68.111.197
- Web Endpoint: http://164.68.111.197 (or your domain)
