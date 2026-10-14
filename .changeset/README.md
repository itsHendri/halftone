# Changesets

Releases of the packages in `packages/` (today: `@halftone-ds/tokens`). The apps are private and never published.

When a change to a package should ship, run `npx changeset` at the repo root, pick the package and the bump
(patch: fix · minor: new target or option · major: a change an app has to react to), and commit the file it
writes with your change. On `main`, the release workflow opens a "Version Packages" PR; merging it publishes
to npm through trusted publishing.

## First publish (once, by hand) — done 2026-10-14, 1.0.0

Kept for the record, and for a second package if one is ever added.


npm cannot create a package through trusted publishing, so `1.0.0` goes up from a laptop:

1. On npmjs.com, create the organisation `halftone-ds` (free for public packages) so you can publish to the
   `@halftone-ds` scope. Turn on two-factor authentication.
2. From the repo root, on `main`: `npm login`, then `npm publish -w packages/tokens --access public`.
3. Package → Settings → Trusted Publisher → GitHub Actions: owner `itsHendri`, repository `halftone`,
   workflow `release.yml`, no environment. Under allowed actions, tick `npm publish`.
4. Package → Settings → Publishing access: "Require two-factor authentication and disallow tokens".
5. GitHub repo → Settings → Actions → General: tick "Allow GitHub Actions to create and approve pull
   requests" (the Version Packages PR needs it).
6. GitHub repo → Settings → Secrets and variables → Actions → Variables: add `RELEASES_ENABLED` = `true`.
   Until then the release workflow skips, so main stays green.
7. Remove any "not published yet" notes from the docs.

Provenance statements are added automatically once the repository is public.
