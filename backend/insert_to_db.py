import os
import json
from postgres_db import connect_to_db
from utils import get_video_ids
from distance import l2
from constants import DATA_DIR


# docker compose up
def add_data_to_pg():
    """
    Adds the data to the database
    """
    conn = connect_to_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE EXTENSION IF NOT EXISTS vector;

        CREATE TABLE IF NOT EXISTS frames (
          id text PRIMARY KEY,
          video_id text,
          frame_id text,
          timestamp float,
          objects text[],
          colors int[][],
          image_vector vector(768),
          text text[]
        );
    """)

    for video_id, frame_id, objects, image_vector, dominant_colors, timestamp, text in get_data():
        row_id = video_id + '-' + frame_id

        cursor.execute(f"""
            INSERT INTO frames (id, video_id, frame_id, timestamp, objects, colors, image_vector, text) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (row_id, video_id, frame_id, timestamp, objects, dominant_colors, image_vector, text))

    conn.commit()
    cursor.close()
    conn.close()


def get_data():
    """
    Loops through all the data.json file in the dataset
    For each data.json file, it loops through all the frames present in the file,

    :return: yield's videoId(str), frameId(str), objects(list[str]), imageVector(list[float]), dominantColors(list[list[int]]), timestamp(float), text(list[str])
    """

    video_ids = get_video_ids()
    video_ids.append("00182")

    for video_id in video_ids:
        with open(os.path.join(DATA_DIR, video_id, 'data.json'), 'r') as file:
            data = json.load(file)

        prev_image_vector = None

        for frame in data['keyframes']:
            if len(frame['dominant_colors']) == 1:
                continue

            video_id = video_id
            frame_id = frame['frame_id']
            objects = sorted(frame['objects'].keys())
            timestamp = frame['timestamp']
            image_vector = frame['image_vector']
            dominant_colors = [v for v in frame['dominant_colors']]
            text = frame['text']

            if prev_image_vector is not None:
                if l2(prev_image_vector, image_vector) < 40:
                    continue

            prev_image_vector = image_vector

            yield video_id, frame_id, objects, image_vector, dominant_colors, timestamp, text


if __name__ == '__main__':
    add_data_to_pg()
