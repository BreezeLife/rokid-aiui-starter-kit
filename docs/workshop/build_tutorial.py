"""Render the four-page workshop handout from editable JSON. Requires reportlab."""
import argparse
import html
import json
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from reportlab.lib.utils import ImageReader

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
W, H = A4
M = 43
CW = W - M * 2
INK = colors.HexColor('#17231D')
ACCENT = colors.HexColor('#285C42')
MUTED = colors.HexColor('#51635A')
PALE = colors.HexColor('#F0F5F1')
LINE = colors.HexColor('#D4DFD7')
WHITE = colors.white
LIMIT = 793


def plain(s):
    return html.unescape(re.sub('<[^>]*>', '', s.replace('<br/>', '\n')))


class Handout:
    def __init__(self, target, data):
        self.c = canvas.Canvas(str(target), pagesize=A4, pageCompression=1)
        self.c.setTitle(data['title'])
        self.c.setAuthor('BreezeLife')
        self.c.setSubject('Rokid AIUI 0.19.0 workshop tutorial - 24 October 2026')
        self.c.setCreator('BreezeLife workshop tutorial / ReportLab')
        self.layout = []

    def paragraph(self, text, x, top, width, size=10.5, leading=14.5, color=INK, bold=False):
        style = ParagraphStyle('text', fontName='Helvetica-Bold' if bold else 'Helvetica',
                               fontSize=size, leading=leading, textColor=color,
                               spaceAfter=0, allowWidows=0, allowOrphans=0)
        p = Paragraph(text, style)
        _, height = p.wrap(width, H)
        if top + height > LIMIT:
            raise ValueError(f'Page {self.page}: text overflow at {top + height:.1f}: {plain(text)[:70]}')
        p.drawOn(self.c, x, H - top - height)
        return top + height

    def rule(self, top, x=M, width=CW, color=LINE):
        self.c.setStrokeColor(color)
        self.c.setLineWidth(0.7)
        self.c.line(x, H - top, x + width, H - top)

    def box(self, x, top, width, height, fill=PALE):
        self.c.setFillColor(fill)
        self.c.rect(x, H - top - height, width, height, stroke=0, fill=1)

    def code(self, lines, top, size=8.5):
        if isinstance(lines, str):
            lines = lines.splitlines()
        leading = size * 1.42
        height = len(lines) * leading + 19
        if top + height > LIMIT:
            raise ValueError(f'Page {self.page}: code overflow')
        self.box(M, top, CW, height)
        self.c.setFillColor(ACCENT)
        self.c.rect(M, H - top - height, 2.5, height, stroke=0, fill=1)
        self.c.setFont('Courier', size)
        self.c.setFillColor(INK)
        for index, line in enumerate(lines):
            if self.c.stringWidth(line, 'Courier', size) > CW - 25:
                raise ValueError(f'Page {self.page}: code line too wide: {line}')
            self.c.drawString(M + 13, H - top - 13 - index * leading, line)
        return top + height

    def crop(self, path, x, top, width):
        # Clip the actual screenshot in the PDF; never redraw or edit the app UI.
        image = ImageReader(str(ROOT / path))
        iw, ih = image.getSize()
        crop_x, crop_y, crop_w, crop_h = 178, 221, 480, 352
        scale = width / crop_w
        height = crop_h * scale
        bottom = H - top - height
        self.c.saveState()
        p = self.c.beginPath()
        p.rect(x, bottom, width, height)
        self.c.clipPath(p, stroke=0)
        self.c.drawImage(image, x - crop_x * scale,
                         bottom - (ih - crop_y - crop_h) * scale,
                         width=iw * scale, height=ih * scale, mask='auto')
        self.c.restoreState()
        return top + height

    def blocks(self, blocks, top):
        for b in blocks:
            kind = b['type']
            start = top
            if kind == 'body':
                top = self.paragraph(b['text'], M, top, CW, b.get('size', 10.5), b.get('leading', 14.5))
            elif kind == 'small':
                top = self.paragraph(b['text'], M, top, CW, b.get('size', 9), b.get('leading', 12.5), MUTED)
            elif kind == 'heading':
                top = self.paragraph(b['text'], M, top, CW, 13.5, 17, bold=True)
            elif kind == 'code':
                top = self.code(b['lines'], top, b.get('size', 8.5))
            elif kind == 'note':
                style = ParagraphStyle('note', fontName='Helvetica', fontSize=9.4, leading=13, textColor=INK)
                p = Paragraph(b['text'], style)
                _, height = p.wrap(CW - 24, H)
                self.box(M, top, CW, height + 18)
                self.c.setFillColor(ACCENT)
                self.c.rect(M, H - top - height - 18, 2.5, height + 18, stroke=0, fill=1)
                top = self.paragraph(b['text'], M + 12, top + 9, CW - 24, 9.4, 13) + 9
            elif kind == 'demos':
                gap = 18
                width = (CW - gap) / 2
                bottom = top
                for i, item in enumerate(b['items']):
                    x = M + i * (width + gap)
                    y = self.paragraph(item['title'], x, top, width, 15, 19, bold=True)
                    y = self.paragraph(item['description'], x, y + 5, width, 10, 13.5)
                    y = self.crop(item['image'], x, max(top + 68, y + 8), width)
                    y = self.paragraph(item['action'], x, y + 10, width, 9.5, 13)
                    y = self.paragraph(f'<link href="{item["url"]}" color="#285C42"><u>Watch the 30-second walkthrough</u></link>', x, y + 7, width, 9, 12)
                    bottom = max(bottom, y)
                top = bottom
            elif kind == 'entrypoints':
                self.rule(top)
                top += 10
                width = (CW - 24) / 3
                bottom = top
                for i, item in enumerate(b['items']):
                    x = M + i * (width + 12)
                    y = self.paragraph(item['title'], x, top, width, 10.2, 14, bold=True)
                    y = self.paragraph('<font name="Courier">' + html.escape(item['path']) + '</font>', x, y + 5, width, 8, 11.5)
                    y = self.paragraph(item['description'], x, y + 6, width, 9.5, 13)
                    bottom = max(bottom, y)
                top = bottom + 10
                self.rule(top)
            elif kind == 'resource':
                qr = QrCodeWidget(b['url'])
                bx, by, ex, ey = qr.getBounds()
                dim = 74
                drawing = Drawing(dim, dim, transform=[dim / (ex - bx), 0, 0, dim / (ey - by), 0, 0])
                drawing.add(qr)
                renderPDF.draw(drawing, self.c, M, H - top - dim)
                self.c.linkURL(b['url'], (M, H - top - dim, M + dim, H - top), relative=0)
                x = M + 90
                y = self.paragraph('Open the Starter Kit', x, top + 2, CW - 90, 13, 16, bold=True)
                y = self.paragraph(f'<link href="{b["url"]}" color="#285C42"><u>github.com/BreezeLife/rokid-aiui-starter-kit</u></link>', x, y + 7, CW - 90, 9.8, 14)
                y = self.paragraph(b['text'], x, y + 7, CW - 90, 9.5, 13)
                top = max(top + dim, y)
            else:
                raise ValueError(kind)
            self.layout.append({'page': self.page, 'type': kind, 'top': round(start, 2), 'bottom': round(top, 2)})
            top += b.get('after', 10)
        if top > LIMIT + 10:
            raise ValueError(f'Page {self.page} content ends at {top}')
        return top

    def render(self, data):
        for number, page in enumerate(data['pages'], 1):
            self.page = number
            c = self.c
            c.setFillColor(ACCENT)
            c.rect(M, H - 31, 25, 3, stroke=0, fill=1)
            c.setFillColor(MUTED)
            c.setFont('Helvetica-Bold', 8)
            c.drawString(M + 35, H - 31, 'ROKID AIUI / WORKSHOP FIELD GUIDE')
            c.setFont('Helvetica', 8)
            c.drawRightString(W - M, H - 31, '24 OCT 2026')
            top = self.paragraph(page['kicker'], M, 55, CW, 9, 13, MUTED, True)
            top = self.paragraph(page['title'], M, top + 9, CW, page.get('titleSize', 26), page.get('titleLeading', 30), bold=True)
            top = self.paragraph(page['subtitle'], M, top + 11, CW, 11, 15.5)
            self.blocks(page['blocks'], top + 20)
            self.rule(H - 38)
            c.setFont('Helvetica', 7.7)
            c.setFillColor(MUTED)
            c.drawString(M, 23, 'BreezeLife  /  AIUI 0.19.0  /  Prepared 23 Oct 2026')
            c.drawRightString(W - M, 23, f'{number} / {len(data["pages"])}')
            c.showPage()
        c.save()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=ROOT / 'output/pdf/rokid-aiui-workshop-tutorial-en.pdf')
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    data = json.loads((HERE / 'tutorial.en.json').read_text())
    assert len(data['pages']) == 4
    handout = Handout(args.output, data)
    handout.render(data)
    (args.output.parent / 'tutorial-layout.json').write_text(json.dumps(handout.layout, indent=2) + '\n')
    print(args.output)


if __name__ == '__main__':
    main()
