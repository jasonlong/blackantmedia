## Overview

I've made this repo public so that it might help others learn from how it is put together. And better yet, maybe someone will let me know about things that could be improved (though I have a list of improvements to make already). Please feel free to download the code or fork it for your own spelunking, but please don't copy it wholesale as if you built it.

The site is built on Stacey (<http://staceyapp.com>). This is a great little CMS that doesn't require a backend database. All of the content and assets are stored in directories. It's a perfect system for lightweight portfolio sites.

## Running and Deploying

The current deployment runs PHP 8.4.27 and Apache on Fly.io.

```
docker build --pull -t blackantmedia:php84-security .
docker run --rm -p 127.0.0.1:8087:80 blackantmedia:php84-security
```

Run `python3 tests/smoke.py http://127.0.0.1:8087` to check pages, portfolio JSON/images, compressed assets, caching, and contact validation. The same checks can safely target `https://blackantmedia.fly.dev`; they do not send mail. Markdown regression checks run with `docker run --rm -v "$PWD/tests:/tests:ro" blackantmedia:php84-security php /tests/markdown.php`.

GitHub Actions builds and tests pull requests and pushes to `master`, then deploys pushes using the `FLY_API_TOKEN` repository secret. For manual deployment, use `flyctl deploy --app blackantmedia --remote-only`.

The image contains an empty `config/settings.php`, so contact email is currently unconfigured and returns HTTP 503 for otherwise valid submissions. Supply the settings shown in `config/settings.example.php` before enabling mail. Local settings are excluded from the image build context.

## Possibly Interesting Features

A few of the things you may find nifty:

* Page content fades in once TypeKit fonts load (to avoid "flash of unstyled content").
* Pseudo-parallax effect for the background while scrolling.
* Animated portfolio section - lots 'o animation and AJAX via MooTools.
* Animated contact form (3D transform for flipping the form in WebKit).
* Modernizr for detecting browser capabilities (ie. supplying fallback effect for 3D transforms).
* Contact form uses inline validation via MooTools.
* Contact form spam detection with Akismet
* -webkit-transitions for subtle hover state transitions
* Sass for generating CSS (I use the sass-watch script).
* hCard microformat for contact info.
* Capistrano used for simple deployment.

## To-Dos

* Add HTML5 History API for portfolio navigation (see <http://html5demos.com/history>)
* Create mobile version.
* Create larger pool of entries for Play section and pull 4 random ones.
* Refactor giant/fugly JS functions
