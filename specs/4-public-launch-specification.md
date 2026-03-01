# Epic 4 — Public Launch & CI/CD Deployment — Specification

## Overview

This epic publishes the Say Silly project as a public GitHub repository (`pronunciation-manual`) with a single clean commit (no prior history), and wires up a GitHub Actions pipeline that builds the Vite frontend, runs Playwright e2e tests, and deploys the static bundle to AWS (S3 + CloudFront) behind the custom domain `pronounce.plusx.black`.

---

## Tech stack

| Concern | Choice |
|---|---|
| Source hosting | GitHub — public repo `pronunciation-manual` |
| CI/CD | GitHub Actions |
| Frontend build | Bun + Vite (`bun run build` → `dist/`) |
| E2E tests | Playwright (existing suite in `e2e/`) |
| Static file hosting | AWS S3 (private bucket, OAC) |
| CDN + TLS termination | AWS CloudFront |
| TLS certificate | AWS ACM (`pronounce.plusx.black`, issued in `us-east-1`) |
| DNS | AWS Route 53 (hosted zone for `plusx.black` already exists) |

---

## Part A — One-time manual AWS setup

These steps are performed once by the developer before the first deployment. They are **not** automated by GitHub Actions.

### A1 — ACM certificate

1. Open ACM in region **`us-east-1`** (required for CloudFront).
2. Request a public certificate for `pronounce.plusx.black`.
3. Use DNS validation: ACM will provide a CNAME record → add it to the Route 53 hosted zone for `plusx.black`.
4. Wait for status `Issued`. Note the certificate ARN.

### A2 — S3 bucket

1. Create bucket named e.g. `pronounce-plusx-black` in any region (e.g. `eu-west-1`).
2. **Block all public access** (CloudFront will use Origin Access Control, not public bucket policy).
3. Do not enable S3 static website hosting (CloudFront handles routing).

### A3 — CloudFront distribution

Create a CloudFront distribution with the following settings:

| Setting | Value |
|---|---|
| Origin domain | S3 bucket regional endpoint |
| Origin access | Origin Access Control (OAC) — create new OAC for the bucket |
| Default root object | `index.html` |
| Viewer protocol policy | Redirect HTTP to HTTPS |
| Alternate domain name (CNAME) | `pronounce.plusx.black` |
| Custom SSL certificate | ACM cert from A1 |
| Error pages | 404 → `/index.html`, HTTP 200 (SPA fallback) |

After creation:
- Copy the bucket policy statement that CloudFront generates and apply it to the S3 bucket.
- Note the CloudFront **distribution ID** and **domain name** (e.g. `d1abc.cloudfront.net`).

### A4 — Route 53 DNS record

In the `plusx.black` hosted zone, create:

| Field | Value |
|---|---|
| Record name | `pronounce` |
| Type | `A` (alias) |
| Alias target | CloudFront distribution domain (`d1abc.cloudfront.net`) |
| Routing policy | Simple |

### A5 — GitHub Actions secrets

In the GitHub repo → Settings → Secrets → Actions, add:

| Secret name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user access key (see A6) |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `AWS_REGION` | Region of the S3 bucket (e.g. `eu-west-1`) |
| `S3_BUCKET` | Bucket name from A2 |
| `CLOUDFRONT_DISTRIBUTION_ID` | Distribution ID from A3 |

### A6 — IAM user for deployment

Create an IAM user (or role) with the minimum permissions for the deploy step:

```json
{
  "Effect": "Allow",
  "Action": [
    "s3:PutObject",
    "s3:DeleteObject",
    "s3:ListBucket"
  ],
  "Resource": [
    "arn:aws:s3:::pronounce-plusx-black",
    "arn:aws:s3:::pronounce-plusx-black/*"
  ]
},
{
  "Effect": "Allow",
  "Action": "cloudfront:CreateInvalidation",
  "Resource": "arn:aws:cloudfront::{account-id}:distribution/{distribution-id}"
}
```

---

## Part B — Git history cleanup & public repository

### B1 — Create clean orphan history (run locally once)

```bash
# 1. Ensure working tree is clean (no uncommitted secrets)
git status

# 2. Create an orphan branch (no parent commits)
git checkout --orphan clean-history

# 3. Stage everything that is tracked (dist/ is .gitignored and won't be included)
git add -A

# 4. Single initial commit
git commit -m "feat: initial public release"

# 5. Delete the old main branch and rename
git branch -D main
git branch -m main

# 6. Force-push to the public remote (GitHub)
git remote add origin git@github.com:{username}/pronunciation-manual.git
git push --force origin main
```

> Note: `dist/` is listed in `.gitignore` and will not be committed. All source files, configs, specs, and e2e tests are included.

### B2 — Repository settings

- Visibility: **Public**
- Default branch: `main`
- Branch protection on `main`: optional (CI gate already prevents broken deploys)

---

## Part C — GitHub Actions workflow

File: `.github/workflows/deploy.yml`

### Trigger

```yaml
on:
  push:
    branches: [main]
```

### Pipeline steps (in order)

| Step | Detail |
|---|---|
| Checkout | `actions/checkout@v4` |
| Setup Bun | `oven-sh/setup-bun@v2` |
| Install deps | `bun install` |
| Install Playwright browsers | `bunx playwright install --with-deps chromium` |
| Vite build | `bun run build` → `dist/` |
| Start static server | `bunx serve dist/ -p 5173 &` (background) |
| Wait for server | `bunx wait-on http://localhost:5173` |
| Run Playwright tests | `BASE_URL=http://localhost:5173 npx playwright test --config e2e/playwright.config.ts` |
| Configure AWS credentials | `aws-actions/configure-aws-credentials@v4` using the five secrets |
| Sync to S3 | `aws s3 sync dist/ s3://$S3_BUCKET --delete` |
| Invalidate CloudFront | `aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"` |

### Full workflow file

```yaml
name: Deploy to pronounce.plusx.black

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: bun install

      - name: Install Playwright browsers
        run: bunx playwright install --with-deps chromium

      - name: Build
        run: bun run build

      - name: Start static server
        run: bunx serve dist/ -p 5173 &

      - name: Wait for server
        run: bunx wait-on http://localhost:5173

      - name: Run e2e tests
        run: BASE_URL=http://localhost:5173 npx playwright test --config e2e/playwright.config.ts

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Deploy to S3
        run: aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }} --delete

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

---

## Out of scope

| Item | Deferred to |
|---|---|
| Infrastructure-as-code (Terraform/CDK) for AWS resources | Future epic or manual ops |
| Preview deployments for PRs | Future epic |
| Staging environment | Future epic |
| LLM backend (Epic 5) | Separate epic |
| Monitoring / alerting (CloudWatch, uptime checks) | Future epic |
| Cache-control headers per file type | Future ops task |
