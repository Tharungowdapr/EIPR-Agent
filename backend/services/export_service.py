import io
import json
from datetime import datetime


def generate_docx(report: dict) -> bytes:
    try:
        from docx import Document
        from docx.shared import Inches, Pt, RGBColor
        from docx.enum.text import WD_ALIGN_PARAGRAPH
    except ImportError:
        return _fallback_docx(report)

    doc = Document()

    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(11)

    title = report.get("title", "EIPR Case Study Report")
    doc.add_heading(title, level=0)

    abstract = report.get("abstract", "")
    if abstract:
        doc.add_heading("Abstract", level=1)
        doc.add_paragraph(abstract)

    case_study = report.get("case_study", {})
    sections = [
        ("1. Introduction", "introduction"),
        ("2. Opportunity Analysis", "opportunity_analysis"),
        ("3. Business Strategy", "business_strategy"),
        ("4. IP Strategy", "ip_strategy"),
        ("5. Conclusion", "conclusion"),
    ]

    for heading, key in sections:
        content = case_study.get(key, "")
        if content:
            doc.add_heading(heading, level=1)
            doc.add_paragraph(content)

    eipr_mapping = report.get("eipr_mapping", [])
    if eipr_mapping:
        doc.add_heading("EIPR Curriculum Mapping", level=1)
        for mapping in eipr_mapping:
            doc.add_heading(f"Unit {mapping.get('unit', '')}: {mapping.get('topic', '')}", level=2)
            doc.add_paragraph(mapping.get("coverage", ""))

    learning = report.get("learning_outcomes", [])
    if learning:
        doc.add_heading("Learning Outcomes", level=1)
        for item in learning:
            doc.add_paragraph(item, style='List Bullet')

    questions = report.get("discussion_questions", [])
    if questions:
        doc.add_heading("Discussion Questions", level=1)
        for q in questions:
            doc.add_paragraph(q, style='List Number')

    keywords = report.get("keywords", [])
    if keywords:
        doc.add_heading("Keywords", level=1)
        doc.add_paragraph(", ".join(keywords))

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()


def generate_pdf_html(report: dict) -> str:
    title = report.get("title", "EIPR Case Study Report")
    abstract = report.get("abstract", "")
    case_study = report.get("case_study", {})
    eipr_mapping = report.get("eipr_mapping", [])
    learning = report.get("learning_outcomes", [])
    questions = report.get("discussion_questions", [])
    keywords = report.get("keywords", [])

    sections_html = ""
    for key, label in [("introduction", "1. Introduction"), ("opportunity_analysis", "2. Opportunity Analysis"),
                       ("business_strategy", "3. Business Strategy"), ("ip_strategy", "4. IP Strategy"),
                       ("conclusion", "5. Conclusion")]:
        content = case_study.get(key, "")
        if content:
            sections_html += f"<h2>{label}</h2><p>{content}</p>"

    mapping_html = ""
    for m in eipr_mapping:
        mapping_html += f"<h3>Unit {m.get('unit', '')}: {m.get('topic', '')}</h3><p>{m.get('coverage', '')}</p>"

    learning_html = "<ul>" + "".join(f"<li>{l}</li>" for l in learning) + "</ul>" if learning else ""
    questions_html = "<ol>" + "".join(f"<li>{q}</li>" for q in questions) + "</ol>" if questions else ""

    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>{title}</title>
<style>
body {{ font-family: 'Times New Roman', serif; margin: 1in; font-size: 11pt; line-height: 1.6; }}
h1 {{ font-size: 18pt; text-align: center; margin-bottom: 20px; }}
h2 {{ font-size: 14pt; margin-top: 20px; border-bottom: 1px solid #ccc; }}
h3 {{ font-size: 12pt; margin-top: 15px; }}
p {{ text-align: justify; }}
ul, ol {{ margin-left: 20px; }}
</style></head><body>
<h1>{title}</h1>
<h2>Abstract</h2><p>{abstract}</p>
{sections_html}
<h2>EIPR Curriculum Mapping</h2>{mapping_html}
<h2>Learning Outcomes</h2>{learning_html}
<h2>Discussion Questions</h2>{questions_html}
<p><strong>Keywords:</strong> {', '.join(keywords)}</p>
</body></html>"""


def _fallback_docx(report: dict) -> bytes:
    text = f"""
{report.get('title', 'EIPR Report')}

Abstract:
{report.get('abstract', '')}

Case Study:
{json.dumps(report.get('case_study', {}), indent=2)}

Keywords: {', '.join(report.get('keywords', []))}
"""
    return text.encode("utf-8")
