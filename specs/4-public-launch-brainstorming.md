# Epic 4 — Public Launch & CI/CD Deployment — Brainstorming

> Push the project to a public GitHub repo with a clean single-commit history, and deploy automatically via GitHub Actions to pronounce.plusx.black (AWS-hosted).
> Epic 4 covers:
> - Scrub all history → single clean commit
> - Public GitHub repository
> - GitHub Actions pipeline: build → push to AWS → serve on pronounce.plusx.black

---

## Round 1 — History cleanup & repository setup

### Q1.1 — How to clean history

The goal is a public repo that contains zero secrets across all commits. The recommended approach is to create a fresh Git history (single "initial commit") rather than rebasing/filtering the existing history.

- [x] Orphan branch: `git checkout --orphan main-clean`, stage everything, single commit, force-push ← recommended: simplest and guaranteed clean; no secret can leak from prior commits
- [ ] `git filter-repo` to scrub secrets from history: keeps commit chronology but complex and easy to miss things
- [ ] New repo, copy files manually: achieves the same as orphan branch but more error-prone

> **Your answer / freetext:**
>

### Q1.2 — What to include in the single commit

Which files should be committed? Note that `dist/` is already git-ignored (Vite build output).

- [x] Everything tracked today except secrets (code, configs, specs, e2e, docker-compose, nginx conf) ← recommended: full project in one shot
- [ ] Only `frontend/` source + config files (exclude specs/docs)
- [ ] Custom selection — list files to exclude

> **Your answer / freetext:**
>

### Q1.3 — Secrets audit before publishing

Before creating the clean commit we must confirm there are no secrets in the working tree. The project currently has no backend and no `.env` in version control (`.env.example` was deleted per git status). Do you know of any secrets currently in the working tree that need to be removed first?

- [ ] No secrets in working tree — safe to commit as-is ← recommended: project is frontend-only
- [ ] Yes, there are secrets — I'll list them in the freetext field below

> **Your answer / freetext:**
> Please do an extensive scan for secrets.
>
> **Scan result (automated):** No secrets found. Checked: API keys, AWS AKIA keys, private key files (*.pem, *.key, *.p12), GitHub tokens (ghp_/github_pat_), Anthropic/OpenAI keys (sk-), credential-embedded URLs, `.env` files, and `password=`/`secret_key=` patterns. Working tree is clean.

## Round 2 — Deployment infrastructure

### Q2.1 — AWS hosting mechanism

pronounce.plusx.black is on AWS. How is it (or will it be) hosted?

- [x] S3 static website + CloudFront CDN ← recommended: ideal for a pure-frontend Vite bundle; no server to manage
- [ ] EC2 instance running nginx (same as current docker-compose setup)
- [ ] ECS/Fargate container (docker-compose-compatible, more complex)
- [ ] Elastic Beanstalk

> **Your answer / freetext:**
>

### Q2.2 — DNS & TLS setup

pronounce.plusx.black is a subdomain of plusx.black. Where is DNS managed?

- [x] AWS Route 53 ← recommended if the whole stack is on AWS: tight integration with CloudFront/ACM
- [ ] External DNS provider (e.g. Cloudflare, Namecheap)
- [ ] Not yet set up — need to configure from scratch

> **Your answer / freetext:**
>

### Q2.3 — GitHub Actions trigger

When should the deployment pipeline run?

- [x] On every push to `main` ← recommended: simple and direct
- [ ] On Git tags only (e.g. `v1.0.0`)
- [ ] Manually via `workflow_dispatch` only
- [ ] Push to main + manual trigger

> **Your answer / freetext:**
>

### Q2.4 — Pipeline steps

What should the GitHub Actions workflow do? Proposed sequence:

```
1. Checkout code
2. Install deps (bun install)
3. Vite build (bun run build → dist/)
4. Deploy dist/ to AWS (sync to S3 + CloudFront invalidation)
```

- [ ] This sequence is correct ← recommended
- [x] Add a test step (run Playwright e2e before deploying)
- [ ] Different sequence — describe in freetext

> **Your answer / freetext:**
>

### Q2.5 — AWS credentials for GitHub Actions

The workflow needs AWS credentials to push to S3/CloudFront. How should they be stored?

- [x] GitHub Actions secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`) ← recommended: standard practice
- [ ] OIDC (OpenID Connect) — keyless, role-assumed via identity federation (more secure but more setup)
- [ ] Hardcoded in workflow file — **not acceptable for a public repo**

> **Your answer / freetext:**
>

## Round 3 — CI test setup & existing infrastructure

### Q3.1 — Playwright server in CI

You chose to run Playwright e2e tests before deploying. In CI there is no running server — we need to start one for the tests. The test suite currently targets `http://localhost:5173` (dev) or port 3001 (docker). The simplest CI approach is to build first, then serve the `dist/` folder with a static server during tests.

Proposed revised pipeline:
```
1. Checkout
2. Install deps (bun install)
3. Install Playwright browsers
4. Vite build → dist/
5. Start static server (e.g. `bunx serve dist/ -p 5173`) in background
6. Run Playwright tests against localhost:5173
7. Stop server
8. Deploy dist/ to S3 + CloudFront invalidation
```

- [x] This approach is correct ← recommended: clean, no Docker required in CI
- [ ] Run docker-compose in CI (builds image, starts nginx on port 3001)
- [ ] Skip e2e in CI — run only on push to a separate `test` branch

> **Your answer / freetext:**
>

### Q3.2 — GitHub repository

Where should the public repo live?

- [ ] Your personal GitHub account (github.com/{your-username}/say-silly)
- [ ] A GitHub organisation
- [x] Repo name is different from `say-silly`

> **Your answer / freetext:**
> pronunciation-manual

### Q3.3 — Existing AWS infrastructure state

Which of these already exist in your AWS account?

- [ ] S3 bucket for pronounce.plusx.black
- [ ] CloudFront distribution pointing at that bucket
- [ ] ACM TLS certificate for pronounce.plusx.black (or *.plusx.black)
- [x] Route 53 hosted zone for plusx.black
- [ ] None of the above — all needs to be created

> **Your answer / freetext (check all that apply, or describe current state):**
>

