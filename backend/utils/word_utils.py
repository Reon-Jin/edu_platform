"""Utility for converting legacy Word documents."""

from pathlib import Path
from typing import Optional


def convert_doc_to_docx(doc_path: Path) -> Path:
    """Convert a .doc file to .docx using Windows COM automation.

    Returns the path to the converted .docx file.
    """
    try:
        import win32com.client  # type: ignore
        from win32com.client import constants
    except Exception as exc:  # pragma: no cover - platform dependent
        raise RuntimeError("pywin32 is required for .doc conversion") from exc

    out_path = doc_path.with_suffix(".docx")
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    try:
        doc = word.Documents.Open(str(doc_path))
        doc.SaveAs(str(out_path), FileFormat=constants.wdFormatXMLDocument)
        doc.Close()
    finally:  # pragma: no cover - ensure quit even if failing
        word.Quit()
    doc_path.unlink(missing_ok=True)
    return out_path
