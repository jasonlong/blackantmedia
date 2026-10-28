#!/usr/bin/env python3
"""HTTP regression checks. Usage: python3 tests/smoke.py http://127.0.0.1:8087

Safe for production: contact checks submit only invalid input, so no mail is sent.
"""
import gzip
import json
import re
import sys
from urllib.error import HTTPError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

BASE = sys.argv[1].rstrip('/') + '/'


def request(path, *, headers=None, data=None, status=200):
    req = Request(urljoin(BASE, path), headers=headers or {}, data=data)
    try:
        response = urlopen(req, timeout=60)
    except HTTPError as error:
        response = error
    with response:
        body = response.read()
        assert response.status == status, (path, response.status, body[:200])
        if response.headers.get('Content-Encoding') == 'gzip':
            body = gzip.decompress(body)
        assert not re.search(rb'(?:<b>(?:Fatal error|Parse error|Warning|Deprecated)</b>|^(?:PHP )?(?:Fatal error|Parse error|Warning|Deprecated):)', body, re.M), path
        return response.headers, body


headers, home = request('/')
assert b'Black Ant Media' in home and b'@title' not in home
assert b'id="contact-form"' in home
etag = headers['ETag']
assert etag
request('/', headers={'If-None-Match': etag}, status=304)
_, cached_home = request('/')
assert b'Black Ant Media' in cached_home

_, body = request('/work/')
projects = json.loads(body)['projects']
assert len(projects) == 9
for project in projects:
    path = urljoin('/work/', project['url'])
    _, body = request(path)
    detail = json.loads(body)
    assert detail['title'] == project['title'], path
    assert detail['images'] and detail['description'], path
    for image in detail['images']:
        request(urljoin(path, image['url']))
_, body = request('/work/git.json')
assert json.loads(body)['title'] == 'Git'

for group, content_type, marker in [('css', 'text/css', b'body'), ('js', 'javascript', b'window.addEvent')]:
    path = '/min/index.php?g=' + group
    headers, body = request(path)
    assert content_type in headers['Content-Type']
    assert len(body) > 1000 and marker in body
    etag = headers['ETag']
    assert etag
    request(path, headers={'If-None-Match': etag}, status=304)
    compressed_headers, compressed = request(path, headers={'Accept-Encoding': 'gzip'})
    assert compressed_headers['Content-Encoding'] == 'gzip'
    assert compressed == body

request('/does-not-exist/', status=404)
headers, body = request('/public/php/contact.php', status=405)
assert headers['Allow'] == 'POST' and json.loads(body)['code'] == '0'
for invalid in [b'', b'name[]=x&email=x&message=x', b'name=Test&email=invalid&message=Test']:
    _, body = request('/public/php/contact.php', data=invalid, status=400)
    assert json.loads(body)['code'] == '0'

print(f'PASS: homepage/cache, {len(projects)} projects and images, CSS/JS/gzip/304, 404, contact validation ({BASE})')
