"""
image-utils power demo script.
Demonstrates basic operations: load, resize, crop, watermark, and web optimization.
Run with: .venv/bin/python scripts/image-utils-demo.py
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from pathlib import Path

# --- Helper functions (matching the image-utils power API) ---

def load(source):
    """Load image from file path."""
    return Image.open(source)

def save(image, path, quality=85):
    """Save image to file path."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, quality=quality)
    print(f"  Saved: {path} ({image.width}x{image.height})")

def get_info(image):
    """Get image metadata."""
    return {
        "width": image.width,
        "height": image.height,
        "mode": image.mode,
        "format": image.format,
    }

def resize(image, width=None, height=None, maintain_aspect=True):
    """Resize image to specified dimensions."""
    if maintain_aspect:
        if width and height:
            image.thumbnail((width, height), Image.Resampling.LANCZOS)
            return image.copy()
        elif width:
            ratio = width / image.width
            height = int(image.height * ratio)
        elif height:
            ratio = height / image.height
            width = int(image.width * ratio)
    return image.resize((width, height), Image.Resampling.LANCZOS)

def crop_center(image, width, height):
    """Crop from center of image."""
    left = (image.width - width) // 2
    top = (image.height - height) // 2
    return image.crop((left, top, left + width, top + height))

def add_text_watermark(image, text, position="bottom-right", font_size=20, color=(255, 255, 255, 128), margin=10):
    """Add text watermark to image."""
    img = image.copy().convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except (IOError, OSError):
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    text_w, text_h = bbox[2] - bbox[0], bbox[3] - bbox[1]

    if position == "bottom-right":
        x = img.width - text_w - margin
        y = img.height - text_h - margin
    elif position == "top-left":
        x, y = margin, margin
    else:
        x = (img.width - text_w) // 2
        y = (img.height - text_h) // 2

    draw.text((x, y), text, fill=color, font=font)
    return Image.alpha_composite(img, overlay)

def adjust_brightness(image, factor):
    """Adjust brightness. >1 brighter, <1 darker."""
    enhancer = ImageEnhance.Brightness(image)
    return enhancer.enhance(factor)

def optimize_for_web(image, max_dimension=1920, quality=85):
    """Resize and compress for web delivery."""
    img = image.copy()
    img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
    return img


# --- Demo ---

def main():
    print("=" * 50)
    print("  image-utils Power Demo")
    print("=" * 50)

    # Create a sample image (gradient with shapes)
    print("\n1. Creating a sample 800x600 image...")
    img = Image.new("RGB", (800, 600), color=(41, 128, 185))
    draw = ImageDraw.Draw(img)
    # Add some shapes
    draw.rectangle([50, 50, 250, 250], fill=(46, 204, 113))
    draw.ellipse([300, 100, 550, 350], fill=(231, 76, 60))
    draw.polygon([(600, 50), (750, 250), (450, 250)], fill=(241, 196, 15))
    # Add gradient-like stripes at bottom
    for i in range(100):
        y = 400 + i * 2
        alpha = int(255 * (i / 100))
        draw.line([(0, y), (800, y)], fill=(52, 73, 94), width=2)

    output_dir = Path("scripts/demo-output")
    output_dir.mkdir(exist_ok=True)
    save(img, output_dir / "original.png")

    # 2. Get info
    info = get_info(img)
    print(f"\n2. Image info: {info['width']}x{info['height']}, mode={info['mode']}")

    # 3. Resize
    print("\n3. Resizing to 400px width (maintaining aspect ratio)...")
    resized = resize(img, width=400)
    save(resized, output_dir / "resized_400w.png")

    # 4. Center crop
    print("\n4. Center-cropping to 300x300 square...")
    cropped = crop_center(img, 300, 300)
    save(cropped, output_dir / "cropped_300x300.png")

    # 5. Watermark
    print("\n5. Adding text watermark...")
    watermarked = add_text_watermark(img, "© xConvert24", position="bottom-right", font_size=28)
    save(watermarked, output_dir / "watermarked.png")

    # 6. Brightness adjustment
    print("\n6. Adjusting brightness (+30%)...")
    bright = adjust_brightness(img, 1.3)
    save(bright, output_dir / "bright.png")

    # 7. Web optimization
    print("\n7. Optimizing for web (max 1920px, WebP)...")
    optimized = optimize_for_web(img, max_dimension=1920, quality=85)
    save(optimized, output_dir / "optimized.webp", quality=85)

    print("\n" + "=" * 50)
    print(f"  Done! All outputs saved to: {output_dir}/")
    print("=" * 50)


if __name__ == "__main__":
    main()
