# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio site for Black Ant Media, built on **Stacey CMS** (v2.3.0) — a flat-file PHP CMS with no database. All content and assets live in the filesystem.

## Architecture

### Request Flow
`index.php` → loads all `app/**/*.inc.php` files → `Stacey` class routes the request → maps URL to a `content/` folder via `Helpers::url_to_file_path()` → renders matching template through `Cache` and `TemplateParser`.

### Key Directories
- **`content/`** — Page content as numbered directories (e.g., `2.work/13.git/`). The number prefix controls sort order and is stripped from URLs. Each folder contains a `.txt` file with key-value page data and associated asset files (images, etc.).
- **`templates/`** — Stacey templates (`index.html`, `project.json`, etc.). Template name matches the `.txt` filename in the content folder (e.g., `project.txt` → `templates/project.json`).
- **`app/`** — Core PHP framework: routing, caching, template parsing, asset types, markdown/JSON parsers.
- **`public/`** — Static assets (CSS, JS, images). Served directly via `.htaccess` rewrite rules.
- **`config/`** — `settings.php` (gitignored, see `settings.example.php` for structure). Contains Akismet key, SMTP config, contact form settings.

### Template Language
Stacey uses a custom template syntax parsed by `TemplateParser`:
- `@variable` — Variable substitution from page data
- `:partial_name` — Include a partial from `templates/partials/`
- `foreach @collection do ... endforeach` — Loop with optional slice `[start:end]`
- `if @var do ... endif` / `if ! @var do ... endif` — Conditionals
- `get "route" do ... end` — Load data from another content path

### Caching
Pages are cached in `app/_cache/` (gitignored). Cache invalidation is based on file modification times across content and template files.

## Development

### CSS
Sass compiles to CSS. Watch for changes:
```
sass --watch public/docs/css/sass:public/docs/css
```
(or run `./sass-watch`)

### Running Locally
Use the Docker image to run PHP 8.4.27 with Apache and mod_rewrite. The `.htaccess` handles URL routing.
```
docker build --pull -t blackantmedia:php84-security .
docker run --rm -p 127.0.0.1:8087:80 blackantmedia:php84-security
```

### Verification
```
python3 tests/smoke.py http://127.0.0.1:8087
docker run --rm -v "$PWD/tests:/tests:ro" blackantmedia:php84-security php /tests/markdown.php
docker run --rm blackantmedia:php84-security sh -c 'find . -name "*.php" -print0 | xargs -0 -n1 php -l'
```
The HTTP checks can also run against production; they only submit invalid contact input and do not send mail.

### Deployment
Fly.io deploys the Docker image to the `blackantmedia` app. Rebuild and redeploy to apply PHP security updates; a merge alone does not update running machines. Capistrano config remains for the former hosting setup.
```
flyctl deploy --app blackantmedia --remote-only
```
The image contains an empty `config/settings.php`; contact mail is unconfigured and returns HTTP 503 until mail settings are supplied. Local settings and test/browser artifacts are excluded from the Docker build context.
