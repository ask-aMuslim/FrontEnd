@echo off
echo Starting installation at %DATE% %TIME% > install_log.txt
npx -y antigravity-awesome-skills@latest --path .agents/skills >> install_log.txt 2>&1
echo Finished installation at %DATE% %TIME% >> install_log.txt
