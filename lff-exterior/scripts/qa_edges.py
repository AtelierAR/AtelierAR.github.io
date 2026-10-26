"""Edge-diff composite for arrival QA: render with the reference page's edges in magenta."""
import sys
from PIL import Image, ImageFilter, ImageChops
pg = sys.argv[1]
ref = Image.open(f"reference/pages/p-0{pg}.png").convert("L").resize((1920, 1080))
ren = Image.open(f"qa/p{pg}_render.png").convert("RGB")
e = ref.filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 40 else 0)
mag = Image.new("RGB", ren.size, (230, 0, 160))
out = Image.composite(mag, ren, e)
out.save(f"qa/p{pg}_edges.jpg", quality=88)
