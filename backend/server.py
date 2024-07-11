import os
import json
import base64
import re
from io import BytesIO
from PIL import Image
from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS

from postgres_db import connect_to_db
from utils import encode_image, encode_text
from utils_server import get_neighbour_colors
from distance import l2
from constants import DATA_DIR

conn = connect_to_db()
cursor = conn.cursor()

app = Flask(__name__)
cors = CORS(app, origins='*')


@app.route("/", methods=['GET'])
def root():
    return jsonify({
        "ping": "ok"
    })


@app.route('/video/<video_id>', methods=['GET'])
def video(video_id: str):
    base_path = os.path.join(DATA_DIR, video_id)
    video_path = f'{video_id}_compressed.mp4'

    if not os.path.exists(os.path.join(base_path, video_path)):
        return f"<p>video does not exist {video_id}</p>"

    return send_from_directory(base_path, video_path)


@app.route('/video/<video_id>/frame/<frame_id>', methods=['GET'])
def frame(video_id: str, frame_id: str):
    base_path = os.path.join(DATA_DIR, video_id, 'frames')
    frame_path = f'frame_{frame_id}.jpeg'

    if not os.path.exists(os.path.join(base_path, frame_path)):
        return f"<p>frame does not exist {frame_id}</p>"

    return send_from_directory(base_path, frame_path)


@app.route('/search', methods=['POST'])
def search():
    data = json.loads(request.data)

    # Generate query
    text_vec = None
    if data['query']['textQuery']:
        text_vec = encode_text(data['query']['textQuery'])

    image_vec = None
    if data['query']['imageQuery']:
        image_data = re.sub('^data:image/.+;base64,', '', data['query']['imageQuery'])
        im = Image.open(BytesIO(base64.b64decode(image_data)))
        image_vec = encode_image(im)

    object_query_str = ''
    if data['query']['objectQuery']:
        if data['searchParams']['objectsContain'] == 'any':
            object_query_str = f" AND objects && ARRAY{data['query']['objectQuery']}::text[]"
        elif data['searchParams']['objectsContain'] == 'all':
            object_query_str = f" AND objects @> ARRAY{data['query']['objectQuery']}::text[]"
        elif data['searchParams']['objectsContain'] == 'only':
            object_query_str = f" AND objects = ARRAY{sorted(data['query']['objectQuery'])}::text[]"

    color_query_str = ''
    if data['query']['colorQuery']:
        n_colors = get_neighbour_colors(data['query']['colorQuery'], data['searchParams']['colorRadius'])
        n_colors = [v for v in n_colors]
        color_query_str = f' AND colors && ARRAY{n_colors}::int[]'

    word_query_str = ''
    if data['query']['wordQuery']:
        word_query_str = f" AND text && ARRAY{data['query']['wordQuery']}::text[]"

    cursor.execute(f"""
        SELECT id, video_id, frame_id, timestamp, colors, objects, text,
            (CASE 
                WHEN %s IS NULL THEN 0
                ELSE image_vector <=> %s::vector
            END) + (CASE
                WHEN %s IS NULL THEN 0
                ELSE image_vector <=> %s::vector
            END) AS distance FROM frames
        WHERE (
            (
                %s IS NOT NULL AND image_vector <=> %s::vector < {data['searchParams']['maxTextSimilarity']}
                OR
                %s IS NOT NULL AND image_vector <=> %s::vector < {data['searchParams']['maxImageSimilarity']}
                OR (
                    %s IS NULL AND %s IS NULL
                )
            ) 
            {object_query_str}
            {color_query_str}
            {word_query_str}
        ) ORDER BY distance ASC
    """, (text_vec, text_vec, image_vec, image_vec, text_vec, text_vec, image_vec, image_vec, text_vec, image_vec))

    final_data = []
    for doc_id, video_id, frame_id, timestamp, colors, objects, text, distance in cursor.fetchall():
        obj = {
            'video_id': video_id,
            'frame_id': frame_id,
            'timestamp': timestamp,
            'dominant_colors': colors,
            'objects': objects,
            'text': text,
            'score': distance
        }

        # Calculating color score
        if data['query']['colorQuery']:
            obj['score'] += min([l2(c, data['query']['colorQuery']) for c in obj['dominant_colors']]) / 255

        final_data.append(obj)

    return jsonify({
        'data': sorted(final_data, key=lambda x: x['score'])[:data['searchParams']['maxResults']]
    })


@app.route('/explore/<video_id>', methods=['GET'])
def explore_video(video_id: str):
    cursor.execute(f"""
        SELECT id, video_id, frame_id, timestamp, colors, objects, text FROM frames 
        WHERE video_id = '{video_id}'
        ORDER BY timestamp ASC
    """)

    final_data = []
    for doc_id, video_id, frame_id, timestamp, colors, objects, text in cursor.fetchall():
        final_data.append({
            'video_id': video_id,
            'frame_id': frame_id,
            'timestamp': timestamp,
            'dominant_colors': colors,
            'objects': objects,
            'text': text,
            'score': 0
        })

    return jsonify({
        'data': final_data
    })


if __name__ == '__main__':
    app.run(host="127.0.0.1", port=5000, debug=False)
