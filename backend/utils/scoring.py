from backend.models import Exercise


def compute_total_points(ex: Exercise) -> int:
    """Calculate the full score of an exercise using its points map."""
    point_map = ex.points or {}
    total = 0
    for block in ex.prompt:
        base = point_map.get(block.get("type"), 1)
        total += base * len(block.get("items", []))
    return int(total)

