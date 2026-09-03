#!/usr/bin/env python3
"""
The site's one and only backend.

One process serves every topic. A topic contributes a module of plain functions
plus a METHODS table; this file owns everything HTTP — routing, validation,
limits, and error shape — so a new topic costs one import and no nginx work.

Routes are /api/<topic>/<method>.

Deliberately NOT copied from the reference server this was modelled on:
  * host='0.0.0.0'  - this binds loopback only. nginx is the sole public face.
  * CORS(app)       - /api/ is same-origin behind nginx, and flask_cors is not
                      in the flake's pythonEnv.
Both would widen the exposed surface for nothing.
"""
import os

from flask import Flask, jsonify, request

from topics.interpolation import api_interp

# One entry per topic. The key is the URL segment.
TOPICS = {
    'interpolation': api_interp,
}

# Caps on a public endpoint that accepts an arbitrary array. Without them one
# request can allocate until the box gives up.
MAX_BODY_BYTES = 8 * 1024 * 1024
MAX_ROWS = 20000
MAX_COLS = 64
MAX_QUERY_POINTS = 50000

app = Flask(__name__)
# Flask rejects an oversize body before any parsing happens.
app.config['MAX_CONTENT_LENGTH'] = MAX_BODY_BYTES


class BadRequest(Exception):
    """A fault in the request. Always the caller's, never a 500."""


def _table(payload):
    """Validate the pasted grid: a 2D list, within caps, cells stringable."""
    data = payload.get('data')
    if not isinstance(data, list) or not data:
        raise BadRequest('data must be a non-empty list of rows')
    if len(data) > MAX_ROWS:
        raise BadRequest(f'too many rows: {len(data)} > {MAX_ROWS}')

    rows = []
    for row in data:
        if not isinstance(row, list):
            raise BadRequest('every row must be a list of cells')
        if len(row) > MAX_COLS:
            raise BadRequest(f'too many columns: {len(row)} > {MAX_COLS}')
        rows.append(['' if c is None else str(c) for c in row])

    # A header row is text, so it would be skipped cell by cell anyway. Dropping
    # it up front keeps the series-length checks honest.
    if rows and not _numeric_row(rows[0]):
        rows = rows[1:]
    if not rows:
        raise BadRequest('no data rows after the header')
    return rows


def _numeric_row(row):
    for cell in row:
        if cell == '':
            continue
        try:
            float(cell)
        except ValueError:
            return False
    return True


def _query(payload, module):
    query = module.generate_range(payload.get('rangeMin'),
                                  payload.get('rangeMax'),
                                  payload.get('interval'))
    if query.size == 0:
        raise BadRequest('empty range: check rangeMin, rangeMax and interval')
    if query.size > MAX_QUERY_POINTS:
        raise BadRequest(f'too many query points: {query.size} > {MAX_QUERY_POINTS}')
    return query


def _run(topic, method):
    module = TOPICS[topic]
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise BadRequest('body must be a JSON object')
    return module.METHODS[method](_table(payload), _query(payload, module))


@app.errorhandler(BadRequest)
def _bad_request(err):
    return jsonify({'error': str(err)}), 400


@app.errorhandler(413)
def _too_large(_err):
    return jsonify({'error': f'request body exceeds {MAX_BODY_BYTES} bytes'}), 413


@app.errorhandler(404)
def _not_found(_err):
    return jsonify({'error': 'no such endpoint'}), 404


@app.errorhandler(Exception)
def _unexpected(err):
    # A stack trace in the response tells an attacker about the box and tells
    # the visitor nothing. Log it, return a flat message.
    app.logger.exception('unhandled error', exc_info=err)
    return jsonify({'error': 'internal error'}), 500


@app.route('/api/health')
def health():
    return jsonify({'ok': True, 'topics': sorted(TOPICS)})


def _register():
    """One route per topic method, read from the topic's own METHODS table."""
    for topic, module in TOPICS.items():
        for method in module.METHODS:
            def view(topic=topic, method=method):
                return jsonify(_run(topic, method))

            app.add_url_rule(f'/api/{topic}/{method}',
                             endpoint=f'{topic}.{method}',
                             view_func=view,
                             methods=['POST'])


_register()

if __name__ == '__main__':
    # Loopback only. Every public request arrives through nginx.
    app.run(host='127.0.0.1', port=int(os.environ.get('INTERP_API_PORT', 35910)))
