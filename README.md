# Brand Machina — Deploy Guide

## IMPORTANT: Deploy via GitHub (not drag-drop)
Netlify Functions (API proxies) only work from a Git repo.

### Step 1: Create GitHub Repo
1. Go to https://github.com/new
2. Name it brand-machina, private, click Create
3. Upload ALL files preserving this structure:
   - netlify.toml (root)
   - package.json (root)  
   - public/index.html
   - public/app.jsx
   - public/_redirects
   - netlify/functions/llm.js
   - netlify/functions/imagegen.js

### Step 2: Connect to Netlify  
1. app.netlify.com → Add new site → Import from GitHub
2. Select your brand-machina repo
3. Deploy (settings auto-detected from netlify.toml)

### Step 3: Add API Keys
1. Site configuration → Environment variables
2. Add ANTHROPIC_API_KEY and GEMINI_API_KEY
3. Trigger redeploy

### Troubleshooting
- White screen: F12 console for errors
- Something went wrong: Deploy via GitHub not drag-drop, check API keys are set
