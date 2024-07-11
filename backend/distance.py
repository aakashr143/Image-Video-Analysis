import numpy as np
from numpy.typing import ArrayLike


def l2(x: ArrayLike, y: ArrayLike) -> float:
    return np.linalg.norm(np.array(x) - np.array(y)) ** 2


def cosine(x: ArrayLike, y: ArrayLike) -> float:
    NORM_EPS = 1e-50
    x = np.array(x)
    y = np.array(y)
    return 1 - np.dot(x, y) / ((np.linalg.norm(x) + NORM_EPS) * (np.linalg.norm(y) + NORM_EPS))
