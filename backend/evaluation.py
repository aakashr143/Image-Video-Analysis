from typing import List

import pandas
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, precision_recall_fscore_support, confusion_matrix
from postgres_db import connect_to_db
from utils import encode_text
from constants import YOLO_CLASSES

VIDEO_ID = "00184"
SELECTED_OBJECTS = ["bicycle", "person", "car", "boat", "bench"]

conn = connect_to_db()
cursor = conn.cursor()


# --------------------------- Prediction
def text_query(query: str):
    # For CLIP evaluation
    encoded_query = encode_text(query)

    cursor.execute(f"""
        SELECT frame_id FROM frames
        WHERE 
            video_id = '{VIDEO_ID}'
        AND
            image_vector <=> %s::vector < 0.875
    """, (encoded_query,))

    return [item[0] for item in cursor.fetchall()]


def object_query(obj: str):
    # For YoloV8x evaluation
    if obj not in YOLO_CLASSES:
        raise Exception("Invalid object")

    cursor.execute(f"""
        SELECT frame_id FROM frames
        WHERE 
            video_id = '{VIDEO_ID}'
        AND
            objects && ARRAY{[obj]}::text[]
    """)

    return [item[0] for item in cursor.fetchall()]


def get_video_frames():
    cursor.execute(f"""
        SELECT frame_id FROM frames
        WHERE video_id = '{VIDEO_ID}'
    """)

    return [item[0] for item in cursor.fetchall()]


def CLIP_evaluation():
    data = []
    for fid in get_video_frames():
        data.append({
            "id": fid,
        })

    for obj in SELECTED_OBJECTS:
        frames = text_query(f"a photo of an {obj}")

        for item in data:
            item[obj] = item["id"] in frames

    items = []
    keys = None
    for item in data:
        items.append(item.values())
        keys = item.keys()

    df = pandas.DataFrame(data=items, columns=keys)
    df = df.set_index("id")
    df.to_csv(f"evaluation_CLIP_{VIDEO_ID}.csv")


def YOLO_evaluation():
    data = []
    for fid in get_video_frames():
        data.append({
            "id": fid,
        })

    for obj in SELECTED_OBJECTS:
        frames = object_query(obj)

        for item in data:
            item[obj] = item["id"] in frames

    items = []
    keys = None
    for item in data:
        items.append(item.values())
        keys = item.keys()

    df = pandas.DataFrame(data=items, columns=keys)
    df = df.set_index("id")
    df.to_csv(f"evaluation_YOLO_{VIDEO_ID}.csv")


# --------------------------- Evaluation
def load_csv(file: str):
    df = pd.read_csv(file)
    df = df.set_index("id").applymap(lambda x: int(x))
    return df

def filter_col(arr: List[str]):
    return [e for e in arr if e != ""]


def evaluate_results(pred_file: str, gt_file: str):
    pred = load_csv(pred_file)
    gt = load_csv(gt_file)

    np_pred = pred.to_numpy()
    np_gt = gt.to_numpy()

    acc = accuracy_score(np_gt, np_pred)
    precision = precision_score(np_gt, np_pred, average="micro")
    recall = recall_score(np_gt, np_pred, average="micro")
    f1 = f1_score(np_gt, np_pred, average="micro")

    print()
    print("Accuracy, Precison, Recall, F1 Score")
    print(acc, precision, recall, f1)

    data = precision_recall_fscore_support(np_gt, np_pred)

    print()
    print("Label, Accuracy Precison, Recall, F1 Score")
    for i, obj in enumerate(SELECTED_OBJECTS):
        precision, recall, f1score = data[0][i], data[1][i], data[2][i]
        acc = accuracy_score(gt[obj].to_numpy(), pred[obj].to_numpy())
        print(f"{obj} -> {acc} {precision}  {recall}  {f1score}")

    print()
    print("Class, TN, FP, FN, TP")
    for obj in SELECTED_OBJECTS:
        cf = confusion_matrix(gt[obj].to_numpy(), pred[obj].to_numpy())
        tn, fp, fn, tp = cf.ravel()
        print(f"{obj} -> {tn}, {fp}, {fn}, {tp}")


if __name__ == "__main__":
    evaluate_results("evaluations/evaluation_CLIP_00184.csv", "evaluations/evaluation_true_00184.csv")

