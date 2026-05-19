"""Generate app icons for 2468 game using pure Python (no deps)."""
import struct, zlib, os, sys

def create_png(width, height):
    """Create a minimal PNG with the 2468 game icon (numbered tiles pattern)."""
    pixels = []
    # Colors
    bg = (0xbb, 0xad, 0xa0)       # grid background
    tile2 = (0xee, 0xe4, 0xda)    # 2 tile
    tile4 = (0xed, 0xe0, 0xc8)    # 4 tile
    tile8 = (0xf2, 0xb1, 0x79)    # 8 tile
    tile16 = (0xf5, 0x95, 0x63)   # 16 tile

    cell = width // 4
    for y in range(height):
        row = [0]  # filter byte
        for x in range(width):
            cx = x // cell
            cy = y // cell
            if cx >= 4: cx = 3
            if cy >= 4: cy = 3

            # Draw tile borders
            margin = cell // 8
            lx = x % cell
            ly = y % cell

            if lx < margin or lx >= cell - margin or ly < margin or ly >= cell - margin:
                r, g, b = bg
            elif cx == 0 and cy == 0:
                r, g, b = tile2
            elif cx == 1 and cy == 0:
                r, g, b = tile4
            elif cx == 0 and cy == 1:
                r, g, b = tile8
            elif cx == 1 and cy == 1:
                r, g, b = tile16
            else:
                r, g, b = tile2

            row.extend([r, g, b])
        pixels.append(bytes(row))

    raw = b''.join(pixels)

    def chunk(ctype, data):
        c = ctype + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    return (b'\x89PNG\r\n\x1a\n' +
            chunk(b'IHDR', ihdr) +
            chunk(b'IDAT', zlib.compress(raw)) +
            chunk(b'IEND', b''))

def main():
    base = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(base, '..', 'icons')
    os.makedirs(icons_dir, exist_ok=True)

    for size in [192, 512]:
        png = create_png(size, size)
        path = os.path.join(icons_dir, f'icon-{size}.png')
        with open(path, 'wb') as f:
            f.write(png)
        print(f'Created: {path} ({len(png)} bytes)')

if __name__ == '__main__':
    main()
