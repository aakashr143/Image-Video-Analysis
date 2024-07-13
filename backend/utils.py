import os
import subprocess

import torch
import clip
import easyocr
import numpy as np
from PIL import Image
from ultralytics import YOLO
from constants import DATA_DIR
from typing import Union, List, Dict, Tuple


# CONSTANTS
OBJECT_MIN_CONFIDENCE = 0.5
TEXT_MIN_CONFIDENCE = 0.25


model_clip, preprocess_clip = clip.load("ViT-L/14")
model_clip.eval()


# FUNCTIONS
def encode_image(image: Union[Image, os.PathLike]) -> List[float]:
    if isinstance(image, os.PathLike):
        image = Image.open(image)

    with torch.no_grad():
        return model_clip.encode_image(preprocess_clip(image).unsqueeze(0))[0].tolist()


def encode_text(text: str) -> List[float]:
    with torch.no_grad():
        return model_clip.encode_text(clip.tokenize([text]))[0].tolist()


def get_text_in_image(image: [Image, os.PathLike]):
    model_ocr = easyocr.Reader(['en'], quantize=False)

    if not isinstance(image, os.PathLike):
        image = np.array(image)

    res = model_ocr.readtext(image)

    txt = []
    for t in res:
        txt += t[1].lower().split(' ')

    return txt


def get_objects_in_image(image: Image) -> Dict[str, int]:
    model_yolo = YOLO('yolov8x.pt')

    results = model_yolo(source=image, save=False, verbose=False)

    classes = results[0].names

    items = {}
    for res in results:
        confidence = res.boxes.conf.tolist()
        for p in [int(c) for i, c in enumerate(res.boxes.cls.tolist()) if confidence[i] > OBJECT_MIN_CONFIDENCE]:
            if classes[p] in items:
                items[classes[p]] += 1
            else:
                items[classes[p]] = 1

    return items


def get_image_colors(image: Image) -> Tuple[List[List[int]], List[int], List[int], List[int]]:
    r, g, b = image.split()

    pixels = image.getcolors(image.width * image.height)

    # 10 most dominating colors in the image
    dominant_colors = [list(px[1]) for px in sorted(pixels, key=lambda t: t[0])[-10:]]

    return dominant_colors, r.histogram(), g.histogram(), b.histogram()


def get_video_ids():
    video_ids = os.listdir(DATA_DIR)

    try:
        video_ids.remove('.DS_Store')
    except:
        pass

    try:
        video_ids.remove('credits_v3c1-100.txt')
    except:
        pass

    video_ids.remove('00182')

    return video_ids


def find_middle_timestamps(timestamps: List[float]) -> List[float]:
    middle_timestamps = []
    for i in range(len(timestamps) - 1):
        middle_timestamp = (timestamps[i] + timestamps[i + 1]) / 2
        middle_timestamps.append(middle_timestamp)
    return middle_timestamps


def compress_video(video_id: str):
    try:
        src_path = os.path.join(DATA_DIR, video_id, f'{video_id}.mp4')
        target_path = os.path.join(DATA_DIR, video_id, f'{video_id}_compressed.mp4')

        # Increase -crf for higher compression
        ffmpeg = f"ffmpeg -i {src_path} -vcodec libx264 -acodec aac -ac 1 -crf 35 {target_path}"

        res = subprocess.getoutput(ffmpeg)
        return res
    except Exception as e:
        print(e)
        print(f' ======================== UNABLE TO COMPRESS {video_id} ========================')
