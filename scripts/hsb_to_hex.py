#!/usr/bin/env python3
"""
HSB (HSV) to HEX color converter

Usage:
    python3 hsb_to_hex.py <hue> <saturation> <brightness>

    hue: 0-360
    saturation: 0-100
    brightness: 0-100

Examples:
    python3 hsb_to_hex.py 335 28 20
    # Output: #33242A

    python3 hsb_to_hex.py 335 55 85
    # Output: #D86193
"""

import colorsys
import sys

def hsb_to_hex(h: float, s: float, b: float) -> str:
    """
    Convert HSB (HSV) to HEX color.

    Args:
        h: Hue (0-360)
        s: Saturation (0-100)
        b: Brightness/Value (0-100)

    Returns:
        HEX color string (e.g., "#D86193")
    """
    r, g, b_rgb = colorsys.hsv_to_rgb(h/360.0, s/100.0, b/100.0)
    return "#{:02X}{:02X}{:02X}".format(int(r*255), int(g*255), int(b_rgb*255))

def hex_to_hsb(hex_color: str) -> tuple:
    """
    Convert HEX to HSB (HSV).

    Args:
        hex_color: HEX color string (e.g., "#D86193" or "D86193")

    Returns:
        Tuple of (hue, saturation, brightness)
    """
    hex_color = hex_color.lstrip('#')
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    return (round(h * 360, 1), round(s * 100, 1), round(v * 100, 1))

def print_color_palette(base_hue: float = 335):
    """Print a complete color palette based on a hue."""
    print(f"=== Color Palette (Base Hue: {base_hue}) ===")
    print()

    print("-- Dark Theme Backgrounds --")
    configs = [
        ("activityBar (darkest)", base_hue, 35, 10),
        ("sideBar", base_hue, 32, 12),
        ("titleBar", base_hue, 32, 12),
        ("tab.inactive", base_hue, 30, 13),
        ("editor.background", base_hue, 28, 20),
        ("lineHighlight", base_hue, 28, 25),
        ("input.background", base_hue, 26, 22),
        ("border", base_hue, 25, 30),
        ("list.activeSelection", base_hue, 28, 32),
    ]
    for name, h, s, b in configs:
        print(f"{name:25} {hsb_to_hex(h, s, b)}  (H:{h} S:{s} B:{b})")

    print()
    print("-- Accent Colors --")
    accents = [
        ("primary", base_hue, 55, 85),
        ("bright", base_hue, 50, 95),
        ("button/badge", base_hue, 60, 70),
    ]
    for name, h, s, b in accents:
        print(f"{name:25} {hsb_to_hex(h, s, b)}  (H:{h} S:{s} B:{b})")

    print()
    print("-- Syntax Colors (shifted hues) --")
    syntax = [
        ("keyword", 350, 45, 90),
        ("function", 285, 35, 85),
        ("class/type", 295, 30, 82),
        ("string", 35, 40, 90),
        ("number", 320, 40, 90),
        ("comment", base_hue, 20, 55),
    ]
    for name, h, s, b in syntax:
        print(f"{name:25} {hsb_to_hex(h, s, b)}  (H:{h} S:{s} B:{b})")

if __name__ == "__main__":
    if len(sys.argv) == 4:
        h = float(sys.argv[1])
        s = float(sys.argv[2])
        b = float(sys.argv[3])
        print(hsb_to_hex(h, s, b))
    elif len(sys.argv) == 2:
        # Hex to HSB conversion
        hex_color = sys.argv[1]
        h, s, b = hex_to_hsb(hex_color)
        print(f"H: {h}, S: {s}, B: {b}")
    elif len(sys.argv) == 1:
        print_color_palette(335)
    else:
        print(__doc__)
        sys.exit(1)
