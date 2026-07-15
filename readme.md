# @jonahsnider/renovate-config

[![Build Status](https://github.com/jonahsnider/renovate-config/workflows/CI/badge.svg)](https://github.com/jonahsnider/renovate-config/actions)

A Renovate config great for small JavaScript libraries.

## Usage

Set your Renovate config to use this config

```json
{
	"extends": ["github>jonahsnider/renovate-config"]
}
```

## Self-hosting

Mend Renovate CE runs from `Dockerfile.renovate` on Railway. Its GitHub App is intentionally configured with `onboarding: false` and `requireConfig: "required"`, so repositories without an existing Renovate config are not changed.

The `Enqueue Renovate CE` workflow fans out a `main` push to every enabled repository. A manual run defaults to the `jonahsnider/renovate-config` canary and can be expanded to all repositories. The workflow remains inert until these repository settings exist:

- Secret: `MEND_RNV_API_SERVER_SECRET`
- Variable: `RENOVATE_CE_URL`
- Variable: `RENOVATE_CE_ENABLED=true`

During migration, Railway must retain `RENOVATE_IGNORE_PR_AUTHOR=true` until every pull request authored by the hosted `renovate[bot]` is gone. Start with `MEND_RNV_AUTODISCOVER_FILTER=jonahsnider/renovate-config`, `RENOVATE_DRY_RUN=full`, startup enqueueing disabled, and a dormant job schedule. Disable the hosted Renovate installation before the first run without dry-run mode. The production schedule is:

- App sync: `MEND_RNV_CRON_APP_SYNC=7 */4 * * *`
- Repository jobs: `MEND_RNV_CRON_JOB_SCHEDULER_ALL=17 */4 * * *`
