from typing import List


def get_neighbour_colors(color: List[int], n: int):
    colors = {(r, g, b) for r in range(max(0, color[0] - n), min(255, color[0] + n + 1))
              for g in range(max(0, color[1] - n), min(255, color[1] + n + 1))
              for b in range(max(0, color[2] - n), min(255, color[2] + n + 1))}

    return list([list(c) for c in colors])


if __name__ == '__main__':
    print(get_neighbour_colors([5, 5, 5], 5))
