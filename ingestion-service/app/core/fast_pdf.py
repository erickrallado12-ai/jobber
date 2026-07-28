from __future__ import annotations

import logging
import tempfile
import os

logger = logging.getLogger(__name__)


def extract_text_pymupdf(file_content: bytes, file_extension: str) -> str:
    """Extract text from PDF/DOCX using PyMuPDF.

    Returns markdown-formatted text. Falls back to empty string if the PDF
    has no embedded text layer (scanned image PDF).
    """
    import pymupdf
    from pymupdf4llm import to_markdown

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(
            suffix=f".{file_extension}", delete=False, dir="/tmp"
        ) as tmp:
            tmp.write(file_content)
            tmp_path = tmp.name

        md_text = to_markdown(tmp_path)

        stripped = md_text.strip()
        if len(stripped) < 20:
            logger.info("PyMuPDF extracted too little text (%d chars), likely a scanned PDF", len(stripped))
            return ""

        logger.info("PyMuPDF extracted %d chars of markdown text", len(stripped))
        return stripped
    except Exception as e:
        logger.warning("PyMuPDF extraction failed: %s", e)
        return ""
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
