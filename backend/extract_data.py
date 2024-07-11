import os
import json
import subprocess
import cv2 as cv
import numpy as np
from PIL import Image

from utils import get_video_ids, encode_image, get_objects_in_image, get_image_colors, find_middle_timestamps, \
    compress_video, get_text_in_image
from constants import DATA_DIR

SHOT_CHANGE_THRESHOLD = 2


def generate_shot_change_info(video_id: str):
    """
    Runs the shot change detection filter on the video

    :param video_id: name of file in the dataset without the extension
    :return: relative path to the video and the ffmpeg output
    """
    src_path = os.path.join(DATA_DIR, video_id, f'{video_id}.mp4')
    target_path = os.path.join(DATA_DIR, video_id, f'{video_id}_shot.mp4')

    # https://ffmpeg.org/ffmpeg-filters.html#scdet-1
    ffmpeg_cmd = f'ffmpeg -i {src_path} -vf "scdet=s=0:t={SHOT_CHANGE_THRESHOLD}" {target_path}'
    ffmpeg_result = subprocess.getoutput(ffmpeg_cmd)

    out = os.path.join(DATA_DIR, video_id, 'ffmpeg_out.txt')
    with open(out, 'w') as f:
        f.write(ffmpeg_result)

    # Removes the output file from the ffmpeg cmd
    os.remove(target_path)

    return src_path, out


def get_video_info(video_path: str, ffmpeg_info_file: str):
    """
    Extracts metadata and shot change timestamp

    :param video_path: path to the source video in the dataset
    :param ffmpeg_info_file: path to the ffmpeg shot change detection filter cmd outfile
    :return: fps(float), timeperiod(float), videoDuration(float), timestamps of shot change(list[float])
    """
    shot_change_ts = [0]
    video_duration = -1

    with open(ffmpeg_info_file, 'r') as f:
        for l in f.readlines():
            if 'lavfi.scd.score' in l and 'lavfi.scd.time' in l:
                contents = l.split('lavfi.scd.time:')
                shot_change_ts.append(float(contents[1].strip().replace('\n', '')))

            if 'Duration' in l:
                contents = l.split('Duration: ')[1].split(',')[0].split(':')
                contents = [float(c) for c in contents]
                video_duration = (contents[0] * 60 + contents[1]) * 60 + contents[2]

    shot_change_ts.append(video_duration)

    cap = cv.VideoCapture(video_path)
    fps = cap.get(cv.CAP_PROP_FPS)
    timeperiod = 1 / fps

    cap.release()

    return fps, timeperiod, video_duration, find_middle_timestamps(shot_change_ts)


def generate_keyframes(video_path: str, video_id: str, timeperiod: float, keyframe_ts: list[float]):
    frames_dir = os.path.join(DATA_DIR, video_id, 'frames')
    os.makedirs(frames_dir)

    frame_id = 1
    timestamps = keyframe_ts
    current_ts = 0
    cap = cv.VideoCapture(video_path)

    data = []

    while cap.isOpened():
        if len(timestamps) == 0:
            break

        can_read, frame = cap.read()

        if not can_read:
            print(f"Unable to read video @ {current_ts}, source: {video_path}")
            break

        current_ts += timeperiod
        if current_ts > timestamps[0]:
            timestamps.pop(0)
            frame = cv.cvtColor(frame, cv.COLOR_RGB2BGR)
            img = Image.fromarray(np.uint8(frame))
            img.save(os.path.join(frames_dir, f'frame_{frame_id}.jpeg'))

            img_vec = encode_image(img)
            img_objs = get_objects_in_image(img)
            dominant_colors, red, green, blue = get_image_colors(img)
            txt = get_text_in_image(img)

            data.append({
                'frame_id': f'frame_{frame_id}',
                'timestamp': current_ts,
                'image_vector': img_vec,
                'objects': img_objs,
                'text': txt,
                'histogram': {
                    'red': red,
                    'green': green,
                    'blue': blue
                },
                'dominant_colors': dominant_colors
            })

            frame_id += 1

    return data


def video00182():
    # For 00182
    # ffmpeg -i V3C1-100/00182/00182.mov -vf "scdet=s=0:t=2" V3C1-100/00182/00182_shot.mov > output.txt 2>&1
    # copy and paste the contents of output.txt to a new file .txt file, encoding error

    video_data = {}

    video_id = "00182"
    video_path = "V3C1-100/00182/00182.mov"
    ffmpeg_info_file = "V3C1-100/00182/ffmpeg_out.txt"

    fps, timeperiod, duration, keyframe_ts = get_video_info(video_path, ffmpeg_info_file)
    keyframe_data = generate_keyframes(video_path, video_id, timeperiod, keyframe_ts)

    video_data['video_id'] = video_id
    video_data['fps'] = fps
    video_data['duration'] = duration
    video_data['num_keyframes'] = len(keyframe_data)
    video_data['keyframes'] = keyframe_data

    with open(os.path.join(DATA_DIR, video_id, 'data.json'), 'w') as file:
        file.write(json.dumps(video_data, indent=4))


def extract_video_data(video_id: str):
    try:
        video_data = {}

        video_path, ffmpeg_info_file = generate_shot_change_info(video_id)
        fps, timeperiod, duration, keyframe_ts = get_video_info(video_path, ffmpeg_info_file)
        keyframe_data = generate_keyframes(video_path, video_id, timeperiod, keyframe_ts)

        video_data['video_id'] = video_id
        video_data['fps'] = fps
        video_data['duration'] = duration
        video_data['num_keyframes'] = len(keyframe_data)
        video_data['keyframes'] = keyframe_data

        with open(os.path.join(DATA_DIR, video_id, 'data.json'), 'w') as file:
            file.write(json.dumps(video_data, indent=4))

        compress_video(video_id)
        print(video_id)

    except Exception as e:
        print(e)
        print(f'======================== ERROR @ {video_id} ========================')


if __name__ == '__main__':
    """
    ids = get_video_ids()

    ctr = 0
    for vid in ids:
        ctr += 1
        print(f"[{ctr} / {len(ids)}]")
        extract_video_data(vid)    
    """
