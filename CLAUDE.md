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
Requires PHP 5+. Use any PHP-capable web server with mod_rewrite enabled. The `.htaccess` handles URL routing.

### Deployment
Capistrano deploys via git to the production server. `config/settings.php` is symlinked from shared storage on deploy.
```
cap deploy
```
