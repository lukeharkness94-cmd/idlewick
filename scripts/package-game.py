"""Package the browser game and local fonts into one standalone HTML file."""
from pathlib import Path
import argparse
import base64
import re

parser = argparse.ArgumentParser()
parser.add_argument("output", nargs="?", type=Path,
                    default=Path(__file__).resolve().parents[1] / "Play Idlewick.html")
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
html = (root / "index.html").read_text()
html = re.sub(r'<link[^>]+https://[^>]+>', '', html)

def stylesheet(match):
    source = root / match[1]
    css = source.read_text()
    def font_url(font):
        data = base64.b64encode((source.parent / font[1]).read_bytes()).decode()
        return 'url(data:font/woff2;base64,' + data + ')'
    css = re.sub(r'url\(\./([^)]*\.woff2)\)', font_url, css)
    return '<style>' + css + '</style>'

html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', stylesheet, html)
def script(match):
    source = (root / match[1]).read_text()
    def image_url(image):
        data = base64.b64encode((root / image[0]).read_bytes()).decode()
        return 'data:image/' + ('webp' if image[0].endswith('.webp') else 'png') + ';base64,' + data
    source = re.sub(r'assets/(?:painted/[a-z-]+\.png|art-completion/web/[a-z-]+\.webp)', image_url, source)
    return '<script>\n' + source + '\n</script>'

html = re.sub(r'<script src="([^"]+)"></script>',
              script, html)
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(html)
print(args.output.resolve())
