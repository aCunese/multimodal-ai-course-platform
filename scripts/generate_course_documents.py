from __future__ import annotations

import subprocess
import tempfile
import zipfile
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
OUTPUT_DIR = PROJECT_DIR / "docs" / "course-materials" / "generated-output"
ASSET_DIR = OUTPUT_DIR / "generated_assets"
UI_DIR = PROJECT_DIR / "docs" / "ui-reference" / "high-fidelity"
FONT_PATHS = [
    Path("/System/Library/Fonts/Hiragino Sans GB.ttc"),
    Path("/System/Library/Fonts/STHeiti Medium.ttc"),
]


REPORT_OUTPUT = OUTPUT_DIR / "四川大学锦江学院—课程结业实验报告—多模态AI课程成果平台.docx"
DEPLOY_OUTPUT = OUTPUT_DIR / "多模态AI课程成果平台—项目部署说明书.docx"

LINE_SPACING_PT = 20
BODY_FONT_SIZE = 12
CAPTION_FONT_SIZE = 10.5
FIRST_LINE_INDENT_CM = 0.85
RIGHT_TOC_TAB_CM = 15.8
HEADER_WIDTH_CM = 16.5
BLACK = (0, 0, 0)
HANGING_INDENT_CM = 0.78
DOC_DATE = "2026 年 6 月 6 日"


def get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    for path in FONT_PATHS:
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def set_run_font(run, font_name: str = "宋体", size: int = 12, bold: bool = False, color=BLACK) -> None:
    run.font.name = font_name
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = RGBColor(*color)
    r_pr = run._element.get_or_add_rPr()
    r_fonts = r_pr.rFonts
    if r_fonts is None:
        r_fonts = OxmlElement("w:rFonts")
        r_pr.append(r_fonts)
    r_fonts.set(qn("w:ascii"), font_name)
    r_fonts.set(qn("w:hAnsi"), font_name)
    r_fonts.set(qn("w:eastAsia"), font_name)


def configure_page(document: Document, header_left: str) -> None:
    section = document.sections[0]
    section.page_width = Cm(21)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(2.5)
    section.bottom_margin = Cm(2.5)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2.0)
    section.different_first_page_header_footer = True
    section.header.is_linked_to_previous = False
    section.first_page_header.is_linked_to_previous = False
    section.footer.is_linked_to_previous = False
    section.first_page_footer.is_linked_to_previous = False
    configure_header_story(section.header, header_left)
    configure_header_story(section.first_page_header, header_left)
    configure_footer_story(section.footer)
    configure_footer_story(section.first_page_footer)

    styles = document.styles
    normal = styles["Normal"]
    normal.font.name = "宋体"
    normal.font.size = Pt(BODY_FONT_SIZE)
    normal.font.color.rgb = RGBColor(*BLACK)
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), "宋体")
    normal.paragraph_format.line_spacing = Pt(LINE_SPACING_PT)
    normal.paragraph_format.first_line_indent = Cm(FIRST_LINE_INDENT_CM)
    normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    configure_paragraph_style(
        styles["Heading 1"],
        font_name="标宋黑体",
        size=15,
        bold=False,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_before=15.6,
        space_after=15.6,
        first_line_indent=-HANGING_INDENT_CM,
        left_indent=HANGING_INDENT_CM,
    )
    configure_paragraph_style(
        styles["Heading 2"],
        font_name="黑体",
        size=14,
        bold=True,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_before=15.6,
        space_after=0,
        first_line_indent=-HANGING_INDENT_CM,
        left_indent=HANGING_INDENT_CM,
    )
    configure_paragraph_style(
        styles["Heading 3"],
        font_name="楷体",
        size=12,
        bold=False,
        alignment=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=0,
        space_after=0,
    )

    for style_name, config in {
        "TOC Heading": {"font_name": "黑体", "size": 16, "bold": True, "align": WD_ALIGN_PARAGRAPH.CENTER},
        "TOC 1": {"font_name": "黑体", "size": 14, "bold": False, "align": WD_ALIGN_PARAGRAPH.LEFT},
        "TOC 2": {"font_name": "黑体", "size": 12, "bold": False, "align": WD_ALIGN_PARAGRAPH.LEFT},
        "TOC 3": {"font_name": "宋体", "size": 12, "bold": False, "align": WD_ALIGN_PARAGRAPH.LEFT},
    }.items():
        if style_name not in styles:
            continue
        configure_paragraph_style(
            styles[style_name],
            font_name=config["font_name"],
            size=config["size"],
            bold=config["bold"],
            alignment=config["align"],
            space_before=0,
            space_after=0,
            first_line_indent=0,
            left_indent=0,
            add_right_tab=True,
        )

    for style_name in ("Hyperlink", "FollowedHyperlink"):
        if style_name not in styles:
            continue
        style = styles[style_name]
        style.font.color.rgb = RGBColor(*BLACK)
        style.font.underline = False


def configure_paragraph_style(
    style,
    *,
    font_name: str,
    size: float,
    bold: bool,
    alignment,
    space_before: float,
    space_after: float,
    first_line_indent: float | None = None,
    left_indent: float | None = None,
    add_right_tab: bool = False,
) -> None:
    style.font.name = font_name
    style.font.size = Pt(size)
    style.font.bold = bold
    style.font.color.rgb = RGBColor(*BLACK)
    style._element.rPr.rFonts.set(qn("w:eastAsia"), font_name)
    paragraph_format = style.paragraph_format
    paragraph_format.line_spacing = Pt(LINE_SPACING_PT)
    paragraph_format.space_before = Pt(space_before)
    paragraph_format.space_after = Pt(space_after)
    paragraph_format.alignment = alignment
    paragraph_format.first_line_indent = None if first_line_indent is None else Cm(first_line_indent)
    paragraph_format.left_indent = None if left_indent is None else Cm(left_indent)
    if add_right_tab:
        paragraph_format.tab_stops.add_tab_stop(
            Cm(RIGHT_TOC_TAB_CM),
            alignment=WD_TAB_ALIGNMENT.RIGHT,
            leader=WD_TAB_LEADER.DOTS,
        )


def clear_story(story) -> None:
    for child in list(story._element):
        story._element.remove(child)


def set_table_borders_none(table) -> None:
    tbl_pr = table._tbl.tblPr
    borders = tbl_pr.first_child_found_in("w:tblBorders")
    if borders is not None:
        tbl_pr.remove(borders)
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        edge_element = OxmlElement(f"w:{edge}")
        edge_element.set(qn("w:val"), "nil")
        edge_element.set(qn("w:sz"), "0")
        edge_element.set(qn("w:space"), "0")
        edge_element.set(qn("w:color"), "auto")
        borders.append(edge_element)
    tbl_pr.append(borders)


def set_cell_margins(cell, *, left: int = 0, right: int = 0, top: int = 0, bottom: int = 0) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    margins = tc_pr.first_child_found_in("w:tcMar")
    if margins is not None:
        tc_pr.remove(margins)
    margins = OxmlElement("w:tcMar")
    for side, value in (("left", left), ("right", right), ("top", top), ("bottom", bottom)):
        side_element = OxmlElement(f"w:{side}")
        side_element.set(qn("w:w"), str(value))
        side_element.set(qn("w:type"), "dxa")
        margins.append(side_element)
    tc_pr.append(margins)


def configure_header_story(header, header_left: str) -> None:
    clear_story(header)
    table = header.add_table(rows=1, cols=2, width=Cm(HEADER_WIDTH_CM))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_borders_none(table)

    left_cell, right_cell = table.rows[0].cells
    left_cell.width = Cm(HEADER_WIDTH_CM / 2)
    right_cell.width = Cm(HEADER_WIDTH_CM / 2)
    left_cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    right_cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    set_cell_margins(left_cell)
    set_cell_margins(right_cell)

    for paragraph in (left_cell.paragraphs[0], right_cell.paragraphs[0]):
        paragraph.paragraph_format.space_before = Pt(0)
        paragraph.paragraph_format.space_after = Pt(0)
        paragraph.paragraph_format.first_line_indent = None
        paragraph.paragraph_format.left_indent = None
        paragraph.paragraph_format.right_indent = None
        paragraph.paragraph_format.line_spacing = Pt(LINE_SPACING_PT)

    left_paragraph = left_cell.paragraphs[0]
    left_paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
    left_run = left_paragraph.add_run(header_left)
    set_run_font(left_run, font_name="宋体", size=10.5, bold=False)

    right_paragraph = right_cell.paragraphs[0]
    right_paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    right_run = right_paragraph.add_run("多模态AI课程成果平台")
    set_run_font(right_run, font_name="宋体", size=10.5, bold=False)


def configure_footer_story(footer) -> None:
    clear_story(footer)
    footer_paragraph = footer.add_paragraph()
    footer_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer_paragraph.paragraph_format.space_before = Pt(0)
    footer_paragraph.paragraph_format.space_after = Pt(0)
    footer_paragraph.paragraph_format.first_line_indent = None
    footer_paragraph.paragraph_format.left_indent = None
    footer_paragraph.paragraph_format.right_indent = None
    add_page_field(footer_paragraph, prefix="第 ", suffix=" 页")


def add_page_field(paragraph, prefix: str = "", suffix: str = "") -> None:
    if prefix:
        run = paragraph.add_run(prefix)
        set_run_font(run, font_name="宋体", size=10)

    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = "PAGE"
    fld_separate = OxmlElement("w:fldChar")
    fld_separate.set(qn("w:fldCharType"), "separate")
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")

    run = paragraph.add_run()
    set_run_font(run, font_name="宋体", size=10)
    run._r.append(fld_begin)
    run._r.append(instr_text)
    run._r.append(fld_separate)

    # Keep the display-result run empty. A literal placeholder like "1" can
    # leak into the final footer text after Word refreshes the PAGE field.
    result_run = paragraph.add_run("")
    set_run_font(result_run, font_name="宋体", size=10)

    end_run = paragraph.add_run()
    set_run_font(end_run, font_name="宋体", size=10)
    end_run._r.append(fld_end)

    if suffix:
        run = paragraph.add_run(suffix)
        set_run_font(run, font_name="宋体", size=10)


def add_toc(paragraph) -> None:
    run = paragraph.add_run()
    set_run_font(run, font_name="宋体", size=12)
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = r'TOC \o "1-3" \h \z \u'
    fld_separate = OxmlElement("w:fldChar")
    fld_separate.set(qn("w:fldCharType"), "separate")
    placeholder = OxmlElement("w:t")
    placeholder.text = "打开 Word 后右键目录并选择“更新域”，即可生成完整目录。"
    fld_separate_run = OxmlElement("w:r")
    fld_separate_run.append(placeholder)
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    run._r.append(fld_begin)
    run._r.append(instr_text)
    run._r.append(fld_separate)
    run._r.append(fld_separate_run)
    run._r.append(fld_end)


def write_wrapped(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], text: str, font, fill, align="center", line_spacing=10):
    left, top, right, bottom = box
    max_width = right - left
    lines: list[str] = []
    for raw_line in text.split("\n"):
        current = ""
        for char in raw_line:
            test = current + char
            if draw.textlength(test, font=font) <= max_width:
                current = test
            else:
                if current:
                    lines.append(current)
                current = char
        lines.append(current or "")
    line_heights = []
    for line in lines:
        bbox = draw.textbbox((0, 0), line or "A", font=font)
        line_heights.append(bbox[3] - bbox[1])
    total_height = sum(line_heights) + line_spacing * (len(lines) - 1)
    y = top + max(0, (bottom - top - total_height) // 2)
    for idx, line in enumerate(lines):
        width = draw.textlength(line, font=font)
        if align == "left":
            x = left
        elif align == "right":
            x = right - width
        else:
            x = left + (max_width - width) / 2
        draw.text((x, y), line, fill=fill, font=font)
        y += line_heights[idx] + line_spacing


def draw_box(draw, box, title, body="", fill="#F7F9FC", outline="#335C81", title_font=None, body_font=None):
    draw.rounded_rectangle(box, radius=24, fill=fill, outline=outline, width=3)
    left, top, right, bottom = box
    title_font = title_font or get_font(34)
    body_font = body_font or get_font(24)
    write_wrapped(draw, (left + 24, top + 20, right - 24, top + 90), title, title_font, "#102A43")
    if body:
        write_wrapped(draw, (left + 24, top + 86, right - 24, bottom - 24), body, body_font, "#334E68")


def draw_arrow(draw, start, end, color="#486581", width=6):
    draw.line([start, end], fill=color, width=width)
    x1, y1 = start
    x2, y2 = end
    dx = x2 - x1
    dy = y2 - y1
    if dx == 0 and dy == 0:
        return
    import math

    angle = math.atan2(dy, dx)
    arrow_len = 20
    arrow_angle = math.pi / 7
    p1 = (
        x2 - arrow_len * math.cos(angle - arrow_angle),
        y2 - arrow_len * math.sin(angle - arrow_angle),
    )
    p2 = (
        x2 - arrow_len * math.cos(angle + arrow_angle),
        y2 - arrow_len * math.sin(angle + arrow_angle),
    )
    draw.polygon([end, p1, p2], fill=color)


def create_diagrams() -> dict[str, Path]:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    title_font = get_font(38)
    body_font = get_font(24)

    outputs = {}

    # Figure 3.6
    img = Image.new("RGB", (1600, 960), "white")
    draw = ImageDraw.Draw(img)
    write_wrapped(draw, (0, 20, 1600, 90), "图 3.6 系统功能结构图", title_font, "#102A43")
    center_box = (560, 240, 1040, 470)
    draw_box(draw, center_box, "多模态 AI\n课程成果平台", "统一导航、共享壳层、模块入口与实验记录", fill="#EAF2FF", title_font=get_font(40), body_font=body_font)
    module_boxes = [
        ((140, 180, 480, 330), "图像识别", "上传图片、分类预测、置信度"),
        ((1120, 180, 1460, 330), "情感分析", "评论判别、关键词、强度刻画"),
        ((140, 560, 480, 710), "文案生成", "标题、宣传语、短文案输出"),
        ((1120, 560, 1460, 710), "博物馆识别", "来源判断、描述生成、标签抽取"),
        ((560, 620, 1040, 790), "历史记录与项目说明", "任务轨迹、项目简介、成果沉淀"),
    ]
    for box, title, body in module_boxes:
        draw_box(draw, box, title, body, title_font=get_font(32), body_font=get_font(22))
        cx = (box[0] + box[2]) // 2
        cy = (box[1] + box[3]) // 2
        ccx = (center_box[0] + center_box[2]) // 2
        ccy = (center_box[1] + center_box[3]) // 2
        draw_arrow(draw, (cx, cy), (ccx, ccy))
    path = ASSET_DIR / "figure-3-6-function-structure.png"
    img.save(path)
    outputs["figure_3_6"] = path

    # Figure 3.7
    img = Image.new("RGB", (1600, 960), "white")
    draw = ImageDraw.Draw(img)
    write_wrapped(draw, (0, 20, 1600, 90), "图 3.7 用户操作流程图", title_font, "#102A43")
    steps = [
        ((80, 330, 320, 480), "进入平台", "打开首页，选择实验模块"),
        ((390, 330, 630, 480), "输入数据", "上传图片或输入文本"),
        ((700, 330, 940, 480), "触发分析", "前端提交请求并等待处理"),
        ((1010, 330, 1250, 480), "展示结果", "返回分类、情感或描述结果"),
        ((1320, 330, 1560, 480), "写入历史", "保留任务记录与页面说明"),
    ]
    for idx, (box, title, body) in enumerate(steps):
        draw_box(draw, box, title, body, fill="#F9FBFD", title_font=get_font(30), body_font=get_font(22))
        if idx < len(steps) - 1:
            draw_arrow(draw, (box[2], (box[1] + box[3]) // 2), (steps[idx + 1][0][0], (steps[idx + 1][0][1] + steps[idx + 1][0][3]) // 2))
    path = ASSET_DIR / "figure-3-7-user-flow.png"
    img.save(path)
    outputs["figure_3_7"] = path

    # Figure 3.11
    img = Image.new("RGB", (1600, 980), "white")
    draw = ImageDraw.Draw(img)
    write_wrapped(draw, (0, 20, 1600, 90), "图 3.11 系统部署架构图", title_font, "#102A43")
    browser = (120, 350, 420, 560)
    frontend = (540, 180, 1020, 390)
    assets = (540, 560, 1020, 770)
    backend = (1140, 180, 1480, 390)
    history = (1140, 560, 1480, 770)
    draw_box(draw, browser, "浏览器", "Chrome / Edge\n访问课程成果平台", fill="#E8F7FF", title_font=get_font(34), body_font=get_font(24))
    draw_box(draw, frontend, "Web 前端应用", "React + TypeScript + Vite\n路由、上传、结果展示、导出入口", fill="#EEF4FF", title_font=get_font(36), body_font=get_font(24))
    draw_box(draw, assets, "课程数据与运行时缓存", "data/experiments\nbackend/var 磁盘缓存与素材资源", fill="#F7F3FF", title_font=get_font(34), body_font=get_font(24))
    draw_box(draw, backend, "后端服务层", "FastAPI + Pydantic + OpenAPI\n推理、元信息、导出与搜索接口", fill="#F3FBF2", title_font=get_font(34), body_font=get_font(24))
    draw_box(draw, history, "结果沉淀与交付层", "SQLite 历史记录\nJSON / CSV / ZIP 交付产物", fill="#FFF8EA", title_font=get_font(34), body_font=get_font(24))
    draw_arrow(draw, (browser[2], 455), (frontend[0], 285))
    draw_arrow(draw, (frontend[2], 285), (backend[0], 285))
    draw_arrow(draw, (assets[2], 665), (frontend[0] + 120, 390))
    draw_arrow(draw, (frontend[2] - 80, 390), (history[0], 665))
    draw_arrow(draw, (backend[2] - 20, 390), (history[2] - 80, 560))
    path = ASSET_DIR / "figure-3-11-deployment-architecture.png"
    img.save(path)
    outputs["figure_3_11"] = path
    return outputs


def format_paragraph(
    paragraph,
    *,
    align=WD_ALIGN_PARAGRAPH.JUSTIFY,
    first_line_indent: bool = False,
    left_indent_cm: float | None = None,
    space_before_pt: float = 0,
    space_after_pt: float = 0,
) -> None:
    paragraph.alignment = align
    paragraph.paragraph_format.line_spacing = Pt(LINE_SPACING_PT)
    paragraph.paragraph_format.space_before = Pt(space_before_pt)
    paragraph.paragraph_format.space_after = Pt(space_after_pt)
    paragraph.paragraph_format.first_line_indent = Cm(FIRST_LINE_INDENT_CM) if first_line_indent else None
    paragraph.paragraph_format.left_indent = Cm(left_indent_cm) if left_indent_cm is not None else None


def add_paragraph(document: Document, text: str, *, style=None, align=None, first_line_indent=True, space_after=0):
    paragraph = document.add_paragraph(style=style)
    format_paragraph(
        paragraph,
        align=align or WD_ALIGN_PARAGRAPH.JUSTIFY,
        first_line_indent=first_line_indent,
        space_after_pt=space_after,
    )
    run = paragraph.add_run(text)
    set_run_font(run, font_name="宋体", size=BODY_FONT_SIZE)
    return paragraph


def add_heading(document: Document, text: str, level: int = 1):
    paragraph = document.add_paragraph(style=f"Heading {level}")
    if level == 1:
        format_paragraph(paragraph, align=WD_ALIGN_PARAGRAPH.CENTER, space_before_pt=15.6, space_after_pt=15.6)
        paragraph.paragraph_format.left_indent = Cm(HANGING_INDENT_CM)
        paragraph.paragraph_format.first_line_indent = Cm(-HANGING_INDENT_CM)
        font_name = "标宋黑体"
        font_size = 15
        bold = False
    elif level == 2:
        format_paragraph(paragraph, align=WD_ALIGN_PARAGRAPH.CENTER, space_before_pt=15.6, space_after_pt=0)
        paragraph.paragraph_format.left_indent = Cm(HANGING_INDENT_CM)
        paragraph.paragraph_format.first_line_indent = Cm(-HANGING_INDENT_CM)
        font_name = "黑体"
        font_size = 14
        bold = True
    elif level == 3:
        format_paragraph(paragraph, align=WD_ALIGN_PARAGRAPH.LEFT, space_before_pt=0, space_after_pt=0)
        font_name = "楷体"
        font_size = 12
        bold = False
    else:
        format_paragraph(paragraph, align=WD_ALIGN_PARAGRAPH.LEFT, space_before_pt=0, space_after_pt=0)
        font_name = "黑体"
        font_size = 12
        bold = True
    run = paragraph.add_run(text)
    set_run_font(run, font_name=font_name, size=font_size, bold=bold)
    return paragraph


def add_caption(document: Document, text: str):
    p = document.add_paragraph()
    format_paragraph(p, align=WD_ALIGN_PARAGRAPH.CENTER)
    run = p.add_run(text)
    set_run_font(run, font_name="黑体", size=CAPTION_FONT_SIZE)


def add_picture(document: Document, path: Path, width_cm: float, caption: str):
    p = document.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.first_line_indent = None
    p.paragraph_format.left_indent = None
    p.paragraph_format.line_spacing = 1.0
    p.add_run().add_picture(str(path), width=Cm(width_cm))
    add_caption(document, caption)


def add_code_block(document: Document, lines: list[str]):
    code = document.add_paragraph()
    format_paragraph(code, align=WD_ALIGN_PARAGRAPH.LEFT, left_indent_cm=0.8, first_line_indent=False)
    for idx, line in enumerate(lines):
        run = code.add_run(line)
        set_run_font(run, font_name="Consolas", size=10)
        if idx < len(lines) - 1:
            run.add_break()
    return code


def add_table(document: Document, rows: Iterable[Iterable[str]], column_widths: list[float] | None = None):
    rows = list(rows)
    table = document.add_table(rows=len(rows), cols=len(rows[0]))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for r_idx, row in enumerate(rows):
        for c_idx, value in enumerate(row):
            cell = table.cell(r_idx, c_idx)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            if column_widths:
                cell.width = Cm(column_widths[c_idx])
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if r_idx == 0 else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = Pt(LINE_SPACING_PT)
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(value)
            set_run_font(run, font_name="宋体", size=CAPTION_FONT_SIZE, bold=(r_idx == 0))
    return table


def add_cover(document: Document, title_text: str, subtitle: str, labels: list[tuple[str, str]]):
    spacer = document.add_paragraph()
    spacer.paragraph_format.space_after = Pt(36)
    title = document.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.paragraph_format.space_before = Pt(96)
    run = title.add_run(title_text)
    set_run_font(run, font_name="黑体", size=22, bold=True)

    sub = document.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub.paragraph_format.space_before = Pt(24)
    sub.paragraph_format.space_after = Pt(32)
    run = sub.add_run(subtitle)
    set_run_font(run, font_name="黑体", size=18, bold=True)

    table = document.add_table(rows=len(labels), cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    for row, (label, value) in zip(table.rows, labels):
        row.cells[0].width = Cm(4)
        row.cells[1].width = Cm(11)
        for idx, cell in enumerate(row.cells):
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if idx == 0 else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
        run = row.cells[0].paragraphs[0].add_run(label)
        set_run_font(run, font_name="黑体", size=12, bold=True)
        run = row.cells[1].paragraphs[0].add_run(value)
        set_run_font(run, font_name="宋体", size=12)

    date_p = document.add_paragraph()
    date_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    date_p.paragraph_format.space_before = Pt(30)
    run = date_p.add_run(f"完成日期：{DOC_DATE}")
    set_run_font(run, font_name="宋体", size=12)
    document.add_page_break()


def add_toc_page(document: Document) -> None:
    title = document.add_paragraph(style="TOC Heading")
    format_paragraph(title, align=WD_ALIGN_PARAGRAPH.CENTER, space_before_pt=0, space_after_pt=15.6)
    run = title.add_run("目录")
    set_run_font(run, font_name="黑体", size=16, bold=True)

    toc_p = document.add_paragraph()
    format_paragraph(toc_p, align=WD_ALIGN_PARAGRAPH.LEFT)
    add_toc(toc_p)
    document.add_page_break()


def build_report(diagrams: dict[str, Path]):
    document = Document()
    configure_page(document, "课程结业实验报告")
    add_cover(
        document,
        "课程结业实验报告",
        "多模态AI课程成果平台",
        [
            ("题    目", "基于 React 与 TypeScript 的多模态 AI 课程成果平台设计与实现"),
            ("学    院", "计算机学院"),
            ("专    业", "待补充"),
            ("学生姓名", "待补充"),
            ("学    号", "待补充"),
            ("指导教师", "待补充"),
        ],
    )
    add_toc_page(document)

    add_heading(document, "1 系统概述", 1)
    add_paragraph(
        document,
        "多模态 AI 课程成果平台面向课程实验展示、课堂答辩与项目交付场景，目标是把图像识别、文本情感分析、文案生成、博物馆图像理解以及历史记录沉淀等分散实验统一到一个可运行、可验证、可导出的完整系统中。当前项目已经形成以 `multimodal-ai-course-platform/` 为唯一工程根目录的正式仓库结构，内部同时包含 `web/` 前端应用、`backend/` 后端服务、`data/experiments/` 课程数据、`docs/` 架构与课程资料，以及 `scripts/` 自动化工具脚本，能够支撑从开发、验证到答辩交付的完整链路。",
    )
    add_paragraph(
        document,
        "本课题的意义主要体现在三个方面。第一，它把课程阶段性实验成果从零散脚本、静态页面和原始数据整理为统一系统成果，更适合教学展示和答辩说明。第二，它通过 `React + TypeScript + Vite` 与 `FastAPI + Pydantic + SQLite` 的前后端协作结构，把真实课程数据、运行时缓存、OpenAPI 合同、历史记录和导出能力统一起来，显著降低了后续扩展成本。第三，它将课程模板、生成文档、运行时验证和交付产物一起沉淀在项目目录中，使系统不仅可运行，而且具备可验证、可恢复和可交接的工程特征。",
    )

    add_heading(document, "2 系统开发的核心技术", 1)
    add_paragraph(
        document,
        "本系统属于典型的课程型多模态 Web 应用，既要快速迭代，又要确保展示效果、数据链路和后续扩展都足够稳定。因此在技术选型上，本项目并未将重心放在复杂的企业级基础设施，而是优先使用适合课程场景、开发门槛适中且社区成熟的工程组合：前端负责交互与可视化，后端负责推理封装与历史沉淀，数据与文档目录则负责支撑系统的实验复现与成果交付。",
    )
    add_heading(document, "2.1 React 组件化技术", 2)
    add_paragraph(
        document,
        "React 是当前 Web 前端开发中应用非常广泛的组件化框架。其核心思想是以组件为基本单元组织界面，通过状态驱动视图更新，并将重复结构抽象为可复用模块。本项目之所以采用 React，主要是因为系统同时包含首页总览、图像识别、情感分析、文案生成、博物馆图像理解和历史记录六个页面，这些页面在导航、卡片、按钮、状态标签、上传区和说明面板上具有较高的一致性。使用 React 可以显著减少重复代码，把统一布局和通用交互收拢到 `shared/` 目录中，保证整个平台在视觉和交互上的连续性。",
    )
    add_paragraph(
        document,
        "在本项目中，React 的价值不仅体现在页面拆分上，还体现在模块扩展能力上。例如首页总览页已经可以同时承载运行时资源状态面板、历史摘要和交付导出入口；图像识别与文本模块也能够在统一骨架下对接不同的后端接口、元信息合同和错误提示。这样的组合式开发方式使平台能够在保持页面结构稳定的前提下，持续扩展真实能力和课程展示细节。",
    )
    add_heading(document, "2.2 FastAPI、Pydantic 与运行时数据服务", 2)
    add_paragraph(
        document,
        "后端服务采用 `FastAPI + Pydantic + SQLite` 组合。FastAPI 负责提供统一 API 入口，Pydantic 负责定义响应与请求合同，SQLite 负责沉淀历史记录与导出基础数据。这样的技术路线既保留了 Python 生态在课程实验中的便利性，又能够用比较清晰的结构承接图片上传、文本分析、文案生成、博物馆图像匹配、全局搜索、交付包导出等多条业务链路。",
    )
    add_paragraph(
        document,
        "在课程数据接入方面，后端已经不再停留于空目录预留状态，而是直接消费真实课程资源：图像识别模块会读取中药样本数据并训练轻量分类器，文案生成会读取诗词语料，情感分析会从 IMDb 数据构建词典，博物馆图像理解会基于真实馆藏图像做相似度匹配。与此同时，系统还把中药分类器和博物馆特征索引分别缓存到 `backend/var/`，并提供运行时预热接口，保证答辩演示时的首次体验更加稳定。",
    )
    add_heading(document, "2.3 TypeScript、OpenAPI 合同与验证链路", 2)
    add_paragraph(
        document,
        "TypeScript 为前端提供了静态类型约束，而 OpenAPI 合同同步则进一步把前后端协作收拢到统一接口描述上。当前项目可以由后端自动生成 `docs/api/openapi.json` 与 `web/src/shared/api/generated-contract.ts`，前端 `client.ts` 再根据 operation 级合同读取请求路径、方法、查询参数、默认值和错误响应结构，从而减少手写接口信息带来的漂移风险。",
    )
    add_paragraph(
        document,
        "在验证链路上，项目已经形成 `./init.sh` 统一入口，能够自动执行前端 `lint + test + build`、后端 `uv sync + pytest`、合同一致性校验以及扩展性的 `warmup` 与 `e2e` 模式。配合 Playwright 烟雾回归、Vitest 组件测试和 API 测试，系统从课程演示项目进一步迈向了“可重复验证”的工程化交付形态。",
    )

    add_heading(document, "3 系统分析与设计", 1)
    add_paragraph(
        document,
        "系统分析与设计阶段围绕“统一展示课程实验成果”这一核心目标展开。分析阶段重点回答系统需要服务哪些使用场景、处理哪些数据以及提供哪些功能；设计阶段则关注如何通过前端工程结构、页面路由、共享组件和资源管理方式来承载这些需求。本项目采用自顶向下的思路，先明确总体模块边界，再细化到页面层、组件层和展示数据层。",
    )

    add_heading(document, "3.1 系统需求分析与建模", 2)
    add_heading(document, "3.1.1 系统需求概述", 3)
    add_paragraph(
        document,
        "课程成果平台的主要服务对象是课程学生、指导教师和答辩评审人员。学生希望系统能够集中展示课程实验内容并降低演示切换成本；教师希望通过统一界面快速查看模块结构、数据来源和实现状态；评审人员则更关注系统是否形成了完整的“输入、处理、结果、留痕、导出”闭环，而不仅仅是零散代码或独立截图。基于这些需求，系统必须具备统一入口、模块化导航、真实数据接入、结果说明、历史记录和交付导出等能力。",
    )
    add_paragraph(
        document,
        "在需求获取方法上，本项目综合参考了高保真原型图、实验数据目录、已有前后端代码、架构文档、测试基线与课程交付模板。通过对这些内容的统一梳理，可以明确系统不仅要“看起来完整”，更要“结构上能继续演进、功能上可验证、资料上能交付”。因此在需求评审时，本项目将页面可运行性、接口可维护性、目录可恢复性和成果可导出性一并纳入质量标准。",
    )
    add_heading(document, "3.1.2 系统数据分析", 3)
    add_paragraph(
        document,
        "系统当前涉及四类核心数据。第一类是课程实验源数据，包括中药图像分类数据、IMDb 影评数据、诗词语料以及博物馆图像数据集，统一存放在 `data/experiments/` 下。第二类是运行时业务数据，包括历史记录、全局搜索建议、导出记录与页面元信息，其中历史记录默认落在 `backend/var/history.db` 中。第三类是运行时缓存数据，包括中药分类器缓存和博物馆特征索引缓存，分别落在 `backend/var/herbal-classifier.pkl` 与 `backend/var/museum-feature-index.pkl`。第四类是文档与合同数据，包括高保真原型、架构说明、OpenAPI 快照以及课程文档生成产物，它们共同支撑系统的展示与交付。",
    )
    add_paragraph(
        document,
        "从数据流角度看，用户在浏览器中的输入会先进入前端页面，再通过统一 API 发送至后端处理。后端根据具体模块读取真实课程数据或运行时缓存，完成图像识别、文本分析、文案生成或博物馆匹配后返回结果，并在需要时写入历史记录、生成导出文件或更新运行时状态。与此同时，后端还会继续把接口合同同步给前端，使展示层和服务层的数据语义保持一致。",
    )
    add_heading(document, "3.1.3 系统功能分析", 3)
    add_paragraph(
        document,
        "结合课程展示目标与当前工程实现，系统功能可以归并为三组相互衔接的核心模块。第一组是首页总览模块，用于聚合平台简介、模块入口、运行时资源状态、最近实验记录和交付导出入口，帮助用户快速建立对平台整体结构的认识。第二组是图像识别与文本分析模块，用于完成图片分类、情感判断、关键词提取和文案生成等实验展示任务，体现多模态 AI 在不同输入类型下的应用能力。第三组是博物馆图像识别与历史记录模块，用于展示馆藏来源识别、描述生成、任务留痕、项目说明、搜索建议与导出能力，强化系统的讲述性、可追溯性与交付完整性。",
    )
    add_paragraph(
        document,
        "这样的功能划分将作为后文 3.3 系统详细设计与 4.2 主要程序模块描述的统一展开顺序，确保需求分析、设计说明与实现说明在章节结构上前后对应。",
    )
    add_picture(document, diagrams["figure_3_6"], 15.5, "图3.6 系统功能结构图")
    add_paragraph(
        document,
        "如图 3.6 所示，系统采用“统一平台壳层 + 多模块业务页面 + 历史记录沉淀”的结构。这样既保证了导航与交互风格的一致性，也便于继续沿既有分层拓展更多业务能力。当前图像识别、情感分析、文案生成和博物馆图像理解均已接入真实后端接口，首页与历史页也已经承接运行时状态、筛选、搜索与导出能力，因此该结构既适合课程展示，也适合后续继续深化工程实现。",
    )
    add_heading(document, "3.1.4 系统行为分析", 3)
    add_paragraph(
        document,
        "从用户行为角度看，系统的典型使用流程是先进入首页了解平台概况与运行时状态，再根据任务目标进入具体实验页面，在页面中上传图片或输入文本后触发分析，随后查看结果、回到历史页筛选记录，必要时继续执行导出标签、导出历史、导出演示报告或导出交付包等操作。该流程强调“低切换成本”和“高可理解性”，即用户不需要掌握复杂的技术背景，也能够在统一界面中顺畅完成演示、说明与交付。",
    )
    add_picture(document, diagrams["figure_3_7"], 15.5, "图3.7 用户操作流程图")
    add_paragraph(
        document,
        "如图 3.7 所示，系统行为遵循典型的输入、处理、输出和记录闭环。这样的流程不仅有利于用户理解，也有利于后续把历史记录和导出功能补齐，使平台从纯展示进一步演进为可留痕、可追踪的实验系统。",
    )
    add_heading(document, "3.1.5 系统性能分析", 3)
    add_paragraph(
        document,
        "由于本系统定位于课程成果展示与答辩平台，因此性能需求重点集中在首屏加载速度、模块切换流畅性、运行时缓存稳定性、导出接口可用性和开发环境可重复性上。前端页面需要在普通笔记本环境中快速启动，后端接口需要在本地环境下稳定返回结果，首次访问图像与博物馆模块时还应尽量避免明显的等待抖动，因此系统专门为模型缓存与特征索引提供了预热能力。",
    )
    add_paragraph(
        document,
        "结合现有工程，系统性能约束可概括为：一是运行环境需满足 Node 20.19.0+ 与 Python 3.12+ 的基础要求；二是缓存预热、接口合同同步和浏览器烟雾回归需要在本地环境中稳定复现；三是统一验收命令必须保持简洁，便于在答辩前快速确认项目状态。基于这些约束，系统通过 `./init.sh` 与 `./init.sh e2e` 把关键检查、预热和回归收敛为固定流程。",
    )

    add_heading(document, "3.2 系统概要设计与建模", 2)
    add_heading(document, "3.2.1 系统概要设计概述", 3)
    add_paragraph(
        document,
        "系统概要设计围绕“可演示、可维护、可扩展、可交付”四个原则展开。可演示意味着界面完整且流程连贯；可维护意味着目录结构、类型定义和共享组件足够清晰；可扩展意味着继续增加真实能力时不需要推倒重来；可交付意味着课程报告、部署说明书、演示报告和 ZIP 交付包能够与项目代码保持一致。为满足这些要求，系统在概要层面上采用单一 canonical project root，统一组织前端、后端、数据、文档与脚本。",
    )
    add_heading(document, "3.2.2 系统软件架构设计", 3)
    add_paragraph(
        document,
        "在软件架构上，系统采用“浏览器 - Web 前端 - 后端服务 - 数据与缓存 - 交付产物”的分层方式。用户通过浏览器访问前端页面，React 与 React Router 负责路由切换和组件渲染；前端再通过统一 API client 调用 FastAPI 接口；后端根据业务场景读取课程数据集、运行时缓存和 SQLite 历史记录，最终将处理结果回传给页面，或生成 JSON、CSV、TXT、ZIP 等交付文件。这样的架构既适合课程阶段快速推进，也便于随着需求增加继续扩展服务能力。",
    )
    add_picture(document, diagrams["figure_3_11"], 15.5, "图3.11 系统部署架构图")
    add_paragraph(
        document,
        "如图 3.11 所示，系统把浏览器、前端应用、课程数据与运行时缓存、后端服务层以及结果沉淀与交付层明确区分开来。这样既避免了各类职责混在同一层，也便于围绕课程答辩需要持续增加交付物，例如历史导出、演示报告导出、标签导出和 ZIP 交付包导出等能力。",
    )
    add_heading(document, "3.2.3 系统运行界面设计", 3)
    add_paragraph(
        document,
        "系统界面设计以高保真原型为主要基准，强调中文语境、一致的卡片层级、清晰的模块顺序和适合答辩演示的讲述节奏。首页采用总览式布局，通过模块卡片、摘要信息与运行时状态快速传达系统定位；具体实验页面普遍采用左右分栏布局，把输入区、结果区和说明区清晰分开；历史记录页面则承载结果沉淀、项目说明和导出入口，增强系统整体的完整性与可讲述性。",
    )
    add_paragraph(
        document,
        "首页总览原型如图 3.12 所示，博物馆识别页面原型如图 3.13 所示。两类页面共同体现了平台“统一导航、模块清晰、便于答辩讲解”的界面策略。",
    )
    add_picture(document, UI_DIR / "dashboard-overview.png", 15.5, "图3.12 首页总览原型图")
    add_picture(document, UI_DIR / "museum-vision.png", 15.5, "图3.13 博物馆识别页面原型图")
    add_paragraph(
        document,
        "从界面建模角度看，平台采用统一导航加模块内容区的布局模式，减少了页面之间的认知跳转。通过固定的工具栏、统一的面板样式和状态标签，系统在视觉上形成了较强的一致性，这对于课程项目演示尤其重要。",
    )

    add_heading(document, "3.3 系统详细设计与建模", 2)
    add_heading(document, "3.3.1 首页总览模块设计", 3)
    add_paragraph(
        document,
        "首页总览模块承担平台入口与信息聚合职责。页面顶部通过 Hero 区介绍平台定位和实验范围，中部通过模块卡片展示图像识别、情感分析、文案生成和博物馆图像理解等子系统，页面下半部分则通过运行时资源状态、最近实验记录和交付导出入口突出平台的展示性、验证性与组织性。该模块的设计重点不在复杂交互，而在于帮助用户迅速建立对系统结构、当前状态和可交付能力的整体认知。",
    )
    add_heading(document, "3.3.2 图像识别与文本分析模块设计", 3)
    add_paragraph(
        document,
        "图像识别与文本分析模块在详细设计上采用统一的“输入区 + 结果区 + 说明区”骨架。图像识别模块采用“上传区 + 预测结果 + 概率解释 + 模型信息区”的布局，符合课程中对模型输入输出链路的展示需求；情感分析模块采用“文本输入 + 情绪分类 + 关键词分析 + 强度可视化”的结构，突出文本任务在解释性上的优势；文案生成模块则采用模板化输入与结果输出组合，强调生成内容的可展示性。三类页面虽然处理对象不同，但都遵循统一的交互模式：先输入，再分析，后展示，并辅以后端元信息初始化和错误提示兜底。",
    )
    add_heading(document, "3.3.3 博物馆图像识别与历史记录模块设计", 3)
    add_paragraph(
        document,
        "博物馆图像识别与历史记录模块强调“识别结果 + 项目沉淀 + 交付导出”的协同展示。博物馆图像理解页面左侧负责图像输入与样例切换，右侧负责结果摘要、描述信息和匹配度显示，下方给出候选馆藏列表、数据来源说明以及标签导出入口。历史记录与项目说明页面则负责统一沉淀任务轨迹、模块说明、筛选条件和导出能力，并通过搜索建议、演示报告导出和 ZIP 交付包导出补足平台的交付深度，使系统不仅能看结果，也能把结果带走。",
    )

    add_heading(document, "4 系统实现", 1)
    add_paragraph(
        document,
        "系统实现阶段重点完成四个层面的工作：一是建立可运行的 `React + TypeScript + Vite` 前端工程；二是落下 `FastAPI + Pydantic + SQLite` 后端服务并接入真实课程数据；三是把六个页面按照统一路由、共享壳层与 API client 组织起来；四是将高保真原型、OpenAPI 合同、课程文档和自动化验证整合到标准目录下。相比于直接复用零散静态页面，本系统更强调工程组织、数据接入与交付能力，因此实现过程中优先完成目录治理、共享组件抽象、接口合同同步和验证入口统一。",
    )
    add_heading(document, "4.1 实现环境与工具", 2)
    add_table(
        document,
        [
            ["类别", "工具或版本", "说明"],
            ["操作系统", "macOS / Windows 10+ / Ubuntu 22.04+", "普通开发机即可完成运行与演示"],
            ["Node.js", "20.19.0 及以上", "满足 Vite 8 的运行要求"],
            ["Python", "3.12 及以上", "满足 FastAPI 与数据处理脚本运行要求"],
            ["包管理工具", "npm 10+ / uv", "分别负责前端依赖与后端依赖管理"],
            ["前端框架", "React 19.2.6 + React Router 7.17.0", "负责页面组件化开发与路由切换"],
            ["工程语言", "TypeScript 6", "负责前端类型约束与工程可维护性"],
            ["后端框架", "FastAPI 0.116.0 + Pydantic 2.11.0", "负责接口、合同与数据响应"],
            ["数据与算法", "SQLite + NumPy + Pillow + scikit-learn", "负责历史沉淀、图像特征与轻量分类能力"],
            ["构建与测试", "Vite 8.0.16 + Vitest 4.1.8 + Playwright 1.60.0", "负责构建、组件回归与浏览器烟雾回归"],
        ],
        column_widths=[3.1, 4.7, 7.2],
    )
    document.add_paragraph()
    add_heading(document, "4.2 主要程序模块描述", 2)
    add_paragraph(
        document,
        "为与 3.1.3 的功能分析和 3.3 的详细设计保持一致，本节按照相同的三组模块顺序说明当前工程中的实现方式。整体代码结构以 `app`、`features`、`shared`、`assets`、`backend`、`docs` 和 `scripts` 为主，其中前端 `app/router.tsx` 负责组织页面路由，`shared/` 负责复用布局与通用组件，`features/` 负责承载各模块页面实现；后端 `backend/app/api/routes.py` 与 `backend/app/services/core.py` 则负责接口编排、数据处理和导出逻辑。",
    )
    add_heading(document, "4.2.1 首页总览模块实现", 3)
    add_paragraph(
        document,
        "首页总览模块主要位于首页相关页面实现中，承担平台定位说明、模块导航入口、统计卡片、运行时资源状态和最近实验记录聚合展示职责。实现上通过 Hero 区、模块卡片区、运行时状态面板和历史摘要面板组合完成，既服务于首次进入平台的总览认知，也为后续进入图像识别、文本分析和博物馆识别页面提供统一入口。与此同时，首页还承接了导出演示报告与下载交付包等平台级动作，使其成为系统级操作的主要入口。",
    )
    add_heading(document, "4.2.2 图像识别与文本分析模块实现", 3)
    add_paragraph(
        document,
        "图像识别与文本分析模块在实现层面采用高度一致的面板化结构。图像识别页面负责图片输入、预测结果和概率解释，并通过后端真实中药样本训练出的轻量分类器返回 5 类概率；情感分析页面负责文本输入、情绪分类与关键词展示，并基于 IMDb 数据构建词典；文案生成页面负责模板化输入和结果输出，并读取诗词语料生成内容。三类页面都复用了统一的容器、状态标签与信息面板，同时还通过后端元信息接口完成默认样例、页面说明和表单配置初始化。",
    )
    add_heading(document, "4.2.3 博物馆图像识别与历史记录模块实现", 3)
    add_paragraph(
        document,
        "博物馆图像识别与历史记录模块强调“结果展示 + 项目沉淀 + 交付导出”的结合。博物馆识别页面负责来源判断、候选匹配和描述生成展示，后端会把上传图像与课程馆藏数据集做相似度比对，并支持标签导出。历史记录与项目说明页面负责统一沉淀任务轨迹、模块说明、筛选条件与导出能力，后端则进一步提供历史导出、全局搜索、演示报告导出和 ZIP 交付包导出接口。与此同时，系统还通过 `sync_api_contracts.py`、`warm_runtime_assets.py` 与 `run_e2e_smoke.sh` 等脚本把合同同步、缓存预热和端到端验证一起固化下来。",
    )
    add_heading(document, "4.3 系统运行", 2)
    add_paragraph(
        document,
        "系统运行时，开发者通常从项目根目录开始。首先执行 `./init.sh` 完成前端、后端和合同的一致性检查；需要完整验收时，再执行 `./init.sh e2e` 继续串行完成缓存预热与真实浏览器烟雾回归。若需要手动开发联调，可在 `backend/` 目录下执行 `uv run uvicorn app.main:app --reload --port 8000` 启动后端服务，再在 `web/` 目录下执行 `npm run dev` 启动前端开发服务。浏览器访问本地地址后，即可依次体验首页、图像识别、情感分析、文案生成、博物馆图像理解和历史记录页面。",
    )
    add_paragraph(
        document,
        "图像识别模块的运行效果如图 4.1 所示。页面在统一壳层下展示输入区、结果区与解释区，并能够通过真实图片上传触发后端分类能力，直接服务于课程演示。",
    )
    add_picture(document, UI_DIR / "image-recognition.png", 15.5, "图4.1 图像识别模块运行效果图")
    add_paragraph(
        document,
        "历史记录与项目说明页面的运行效果如图 4.2 所示。该页面用于集中展示任务轨迹、筛选条件、模块摘要与项目说明，并为历史导出、演示报告导出和交付包导出提供统一入口，补足平台的成果沉淀与课程交付能力。",
    )
    add_picture(document, UI_DIR / "history-and-project.png", 15.5, "图4.2 历史记录与项目说明页面效果图")
    add_paragraph(
        document,
        "首页总览模块的运行效果如图 4.3 所示。页面聚合了模块导航入口、统计卡片、运行时资源状态面板和最近实验记录摘要，同时承接了演示报告导出与交付包下载等平台级操作。",
    )
    add_picture(document, UI_DIR / "dashboard-overview.png", 15.5, "图4.3 首页总览模块运行效果图")
    add_paragraph(
        document,
        "情感分析模块的运行效果如图 4.4 所示。页面采用\"文本输入 + 情绪分类 + 关键词分析\"的结构，后端基于 IMDb 数据构建词典并完成情绪判断。",
    )
    add_picture(document, UI_DIR / "sentiment-analysis.png", 15.5, "图4.4 情感分析模块运行效果图")
    add_paragraph(
        document,
        "文案生成模块的运行效果如图 4.5 所示。页面提供模板化输入区域与结果展示区域，后端读取诗词语料并生成标题、宣传语等短文案内容。",
    )
    add_picture(document, UI_DIR / "text-generation.png", 15.5, "图4.5 文案生成模块运行效果图")
    add_paragraph(
        document,
        "博物馆图像识别模块的运行效果如图 4.6 所示。页面支持馆藏图像上传、来源匹配、描述展示与标签导出，能够直观体现多模态图像理解模块的完整处理流程。",
    )
    add_picture(document, UI_DIR / "museum-vision.png", 15.5, "图4.6 博物馆图像识别模块运行效果图")
    add_paragraph(
        document,
        "从当前运行效果来看，系统已经能够较完整地承载课程成果展示任务：页面结构统一、模块入口明确、真实课程数据已接入关键功能、缓存预热与接口合同具备稳定入口，且目录组织、测试命令和交付产物都较为规范。后续仍可继续补强异常场景、离线模型与更深入的自动化验证，但现阶段已经形成了一个兼顾演示性、工程性与交付性的多模态课程成果平台。",
    )

    document.save(REPORT_OUTPUT)


def build_deployment_doc():
    document = Document()
    configure_page(document, "项目部署说明书")
    add_cover(
        document,
        "项目部署说明书",
        "多模态AI课程成果平台",
        [
            ("适用目录", "multimodal-ai-course-platform"),
            ("部署目标", "本地运行、联调、验证与课程交付"),
            ("当前范围", "前端、后端、缓存预热与自动化回归"),
            ("文档日期", "2026 年 6 月 6 日"),
            ("编写说明", "遵循课程模板排版规范"),
        ],
    )
    add_toc_page(document)

    add_heading(document, "1 文档目的", 1)
    add_paragraph(
        document,
        "本说明书用于指导多模态 AI 课程成果平台的本地部署、调试、构建、联调、预热与验收。当前仓库已经形成完整的前后端协作结构，正式项目根目录为 `multimodal-ai-course-platform/`，其中 `web/` 负责前端页面展示，`backend/` 负责接口、历史记录与导出能力，`data/experiments/` 负责课程数据，`docs/` 与 `scripts/` 则负责架构说明、课程文档和自动化工具。本文档的目标是让使用者能够在新机器上复现系统运行环境，并完成课程答辩前所需的验证工作。",
    )

    add_heading(document, "2 系统概述", 1)
    add_paragraph(
        document,
        "项目采用 `React + TypeScript + Vite` 构建前端界面，使用 `React Router` 管理六个核心页面路由；后端采用 `FastAPI + Pydantic + SQLite`，负责首页摘要、运行时资源状态、图像识别、情感分析、文案生成、博物馆图像理解、历史记录、导出和搜索等能力。部署目标不是直接上线生产服务器，而是为课程演示、功能联调、缓存预热和交付物生成提供一个稳定、可重复启动的本地运行环境。",
    )

    add_heading(document, "3 部署架构说明", 1)
    add_paragraph(
        document,
        "系统部署采用前后端分层运行方式。浏览器访问前端开发服务，前端页面再调用后端统一接口；后端根据不同模块读取课程数据目录、运行时缓存与 SQLite 历史记录，并在需要时生成 CSV、JSON、TXT 或 ZIP 导出文件。课程答辩前建议先完成缓存预热与浏览器烟雾回归，以保证展示过程更稳定。",
    )
    add_picture(document, ASSET_DIR / "figure-3-11-deployment-architecture.png", 15.5, "图3.1 多模态AI课程成果平台部署架构图")
    add_paragraph(
        document,
        "如图 3.1 所示，系统中的前端、后端、课程数据、缓存产物和交付层已经形成清晰边界。这样的结构不仅便于本地部署，也便于后续继续扩展课程文档生成、导出演示报告和 ZIP 交付包等能力。",
    )

    add_heading(document, "4 运行环境要求", 1)
    add_table(
        document,
        [
            ["项目", "最低要求", "说明"],
            ["操作系统", "Windows 10 / macOS 12 / Ubuntu 22.04", "任选其一即可"],
            ["Node.js", "20.19.0 或更高", "Vite 8 的引擎要求"],
            ["npm", "10.0.0 或更高", "执行依赖安装和脚本命令"],
            ["Python", "3.12 或更高", "后端接口、合同同步与预热脚本要求"],
            ["uv", "最新版稳定版", "用于同步后端依赖与执行 Python 脚本"],
            ["磁盘空间", "2 GB 以上可用空间", "用于依赖、构建产物、数据库和缓存"],
            ["浏览器", "Chrome / Edge 最新版", "用于本地访问和效果验证"],
            ["网络", "首次安装依赖需联网", "若依赖已存在，可离线启动"],
        ],
        column_widths=[3.4, 4.2, 7.4],
    )
    document.add_paragraph()
    add_paragraph(
        document,
        "说明：项目内 `web/node_modules` 与 `backend/.venv` 若已存在，通常可以直接执行启动与验证命令；若目录被清理或迁移到新环境，则需要重新安装依赖。当前部署不依赖额外数据库中间件，但后端会在本地维护 SQLite 历史记录，并在 `backend/var/` 下生成运行时缓存文件。",
    )

    add_heading(document, "5 项目目录说明", 1)
    add_paragraph(
        document,
        "部署时主要关注以下目录。建议在启动项目前先确认这些目录完整，避免因为素材缺失、数据缺失或脚本缺失导致运行失败。",
    )
    add_table(
        document,
        [
            ["目录", "作用说明"],
            ["multimodal-ai-course-platform/web", "前端工程根目录，负责页面渲染、交互和浏览器端回归脚本"],
            ["multimodal-ai-course-platform/backend", "后端工程根目录，负责 API、缓存预热、历史记录与导出能力"],
            ["multimodal-ai-course-platform/data/experiments", "课程三组实验数据目录，供图像、文本和博物馆模块读取"],
            ["multimodal-ai-course-platform/docs", "架构文档、课程文档、接口合同和 UI 参考资料目录"],
            ["multimodal-ai-course-platform/scripts", "统一验收与课程文档生成等项目脚本目录"],
        ],
        column_widths=[5.2, 10.0],
    )
    document.add_paragraph()

    add_heading(document, "6 安装与启动步骤", 1)
    add_heading(document, "6.1 获取项目并进入根目录", 2)
    add_paragraph(
        document,
        "确保已经获得完整项目目录，并能访问 `multimodal-ai-course-platform/README.md`、`web/package.json` 与 `backend/pyproject.toml`。若项目通过压缩包分发，建议先解压到英文或中文均可正常访问的本地目录，然后在终端中切换到 `multimodal-ai-course-platform/`。",
    )
    add_code_block(document, ["cd multimodal-ai-course-platform"])

    add_heading(document, "6.2 检查 Node、npm、Python 与 uv 版本", 2)
    add_paragraph(
        document,
        "在终端执行以下命令，确认版本满足要求：",
        first_line_indent=False,
    )
    add_code_block(document, ["node -v", "npm -v", "python3 -V", "uv --version"])
    add_paragraph(
        document,
        "若 Node 版本低于 20.19.0，或 Python 版本低于 3.12，建议先升级后再继续安装依赖，否则可能无法正常运行前端构建或后端脚本。",
    )

    add_heading(document, "6.3 执行项目基线初始化", 2)
    add_paragraph(document, "建议优先在项目根目录执行统一初始化命令：", first_line_indent=False)
    add_code_block(document, ["./init.sh"])
    add_paragraph(
        document,
        "该命令会自动检查必需文档、确认前端依赖、运行前端 `lint + test + build`、同步后端依赖、检查 OpenAPI 合同产物并执行后端测试。若统一命令可以通过，说明项目已经具备稳定的本地运行基础。",
    )

    add_heading(document, "6.4 启动后端服务", 2)
    add_paragraph(document, "若需要手动联调后端，可在新终端执行：", first_line_indent=False)
    add_code_block(
        document,
        [
            "cd backend",
            "uv sync",
            "uv run uvicorn app.main:app --reload --port 8000",
        ],
    )
    add_paragraph(
        document,
        "后端启动后会监听本地 `8000` 端口，并为首页摘要、图像识别、情感分析、文案生成、博物馆图像理解、历史记录、搜索与导出等模块提供统一接口。",
    )

    add_heading(document, "6.5 启动前端服务", 2)
    add_paragraph(document, "随后在另一终端执行前端开发命令：", first_line_indent=False)
    add_code_block(
        document,
        [
            "cd web",
            "npm install",
            "npm run dev",
        ],
    )
    add_paragraph(
        document,
        "命令执行后，终端会输出本地访问地址，通常为 `http://localhost:5173/`。在浏览器中打开该地址，即可进入平台首页并体验首页、图像识别、情感分析、文案生成、博物馆图像理解和历史记录等页面。",
    )

    add_heading(document, "7 验收、预热与导出", 1)
    add_paragraph(
        document,
        "完成基础联调后，建议继续执行运行时预热、合同校验和端到端烟雾回归，以保证答辩演示与课程交付更加稳定。",
        first_line_indent=False,
    )
    add_table(
        document,
        [
            ["命令", "用途", "说明"],
            ["cd backend && uv run python scripts/warm_runtime_assets.py", "运行时缓存预热", "提前生成中药分类器与博物馆特征索引缓存"],
            ["cd backend && uv run python scripts/sync_api_contracts.py --check", "接口合同校验", "确认 OpenAPI 快照与前端生成合同未漂移"],
            ["./init.sh e2e", "完整验收", "串行执行验证、预热和 Playwright 烟雾回归"],
            ["cd web && npm run preview", "本地预览构建结果", "基于构建产物启动预览服务"],
        ],
        column_widths=[6.4, 3.0, 5.6],
    )
    document.add_paragraph()
    add_paragraph(
        document,
        "建议在答辩或交付前至少执行一次 `./init.sh e2e`。这样能够同时检查前后端基础功能、运行时缓存状态、接口合同一致性以及关键页面的浏览器级行为，避免临场启动或演示失败。",
    )
    add_paragraph(
        document,
        "系统首页运行效果如图 7.1 所示，历史记录与项目说明页面运行效果如图 7.2 所示。它们分别能够帮助部署人员快速确认平台总览状态和历史导出能力是否正常。",
    )
    add_picture(document, UI_DIR / "dashboard-overview.png", 15.5, "图7.1 首页总览运行效果图")
    add_picture(document, UI_DIR / "history-and-project.png", 15.5, "图7.2 历史记录与项目说明页面运行效果图")

    add_heading(document, "8 常见问题处理", 1)
    add_paragraph(
        document,
        "（1）若执行 `npm install` 或 `uv sync` 时报网络错误，应先检查网络连接或镜像源配置，再重新安装依赖。（2）若执行 `npm run dev` 或 `uvicorn` 后端口被占用，可关闭已有本地开发服务，或直接使用项目内自动选端口的烟雾脚本。（3）若页面图片未正确显示，应检查 `web/src/assets/`、`docs/ui-reference/high-fidelity/` 与 `data/experiments/` 是否完整。（4）若图像识别或博物馆模块首个请求明显变慢，可先执行缓存预热脚本。（5）若合同校验失败，应先运行 `cd backend && uv run python scripts/sync_api_contracts.py` 重新生成最新产物。",
    )

    add_heading(document, "9 交付与停机说明", 1)
    add_paragraph(
        document,
        "完成课程演示后，可按需通过历史页导出 `JSON / CSV`、通过博物馆模块导出标签文件、通过顶栏下载演示报告或 ZIP 交付包。若仅需停止服务，直接在前后端终端中使用 `Ctrl + C` 中断即可；若后续继续深化部署流程，建议优先沿用现有的 `./init.sh`、`warm_runtime_assets.py`、`sync_api_contracts.py` 与 `run_e2e_smoke.sh`，避免另起一套不一致的交付命令。",
    )

    document.save(DEPLOY_OUTPUT)


def update_word_fields(paths: Iterable[Path]) -> None:
    path_list = ",\n  ".join(f"Path('{path}')" for path in paths)
    jxa_script = f"""
ObjC.import('Foundation');
const word = Application('Microsoft Word');
word.launch();
word.activate();
word.visible = false;
const paths = [
  {path_list}
];
for (const path of paths) {{
  word.open(path);
  $.NSThread.sleepForTimeInterval(1);
  const doc = word.documents()[0];
  try {{
    doc.fields().update();
  }} catch (error) {{
  }}
  const tocs = doc.tablesOfContents();
  for (const toc of tocs) {{
    toc.update();
  }}
  try {{
    doc.repaginate();
  }} catch (error) {{
  }}
  doc.save();
  doc.close({{saving: 'yes'}});
}}
word.quit();
"""
    result = subprocess.run(
        ["osascript", "-l", "JavaScript"],
        input=jxa_script,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Failed to update Word fields: {result.stderr.strip()}")


def enforce_black_text(path: Path) -> None:
    document = Document(path)
    for style_name in ("Normal", "Heading 1", "Heading 2", "Heading 3", "TOC Heading", "TOC 1", "TOC 2", "TOC 3", "Hyperlink", "FollowedHyperlink"):
        if style_name not in document.styles:
            continue
        style = document.styles[style_name]
        style.font.color.rgb = RGBColor(*BLACK)
        if style_name in ("Hyperlink", "FollowedHyperlink"):
            style.font.underline = False

    def paint_paragraph(paragraph) -> None:
        for run in paragraph.runs:
            run.font.color.rgb = RGBColor(*BLACK)

    for paragraph in document.paragraphs:
        paint_paragraph(paragraph)

    for table in document.tables:
        for row in table.rows:
            for cell in row.cells:
                for paragraph in cell.paragraphs:
                    paint_paragraph(paragraph)

    document.save(path)


def sanitize_footer_page_suffix(path: Path) -> None:
    with zipfile.ZipFile(path, "r") as source:
        entries = {name: source.read(name) for name in source.namelist()}

    changed = False
    for name, data in list(entries.items()):
        if not name.startswith("word/footer") or not name.endswith(".xml"):
            continue
        updated = data.replace(b">1 \xe9\xa1\xb5<", b">\xe9\xa1\xb5<")
        if updated != data:
            entries[name] = updated
            changed = True

    if not changed:
        return

    with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
        temp_path = Path(tmp.name)

    try:
        with zipfile.ZipFile(temp_path, "w", compression=zipfile.ZIP_DEFLATED) as target:
            for name, data in entries.items():
                target.writestr(name, data)
        temp_path.replace(path)
    finally:
        if temp_path.exists():
            temp_path.unlink()


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    diagrams = create_diagrams()
    build_report(diagrams)
    build_deployment_doc()
    enforce_black_text(REPORT_OUTPUT)
    enforce_black_text(DEPLOY_OUTPUT)
    update_word_fields([REPORT_OUTPUT, DEPLOY_OUTPUT])
    sanitize_footer_page_suffix(REPORT_OUTPUT)
    sanitize_footer_page_suffix(DEPLOY_OUTPUT)
    print(f"Generated: {REPORT_OUTPUT}")
    print(f"Generated: {DEPLOY_OUTPUT}")


if __name__ == "__main__":
    main()
