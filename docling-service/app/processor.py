from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.backend.pypdfium2_backend import PyPdfiumDocumentBackend
import re


class DoclingProcessor:
    def __init__(self):
        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_ocr = False
        pipeline_options.do_table_structure = False
        pipeline_options.do_code_enrichment = False
        pipeline_options.do_formula_enrichment = False
        pipeline_options.do_picture_classification = False
        pipeline_options.do_picture_description = False
        pipeline_options.generate_page_images = False
        pipeline_options.generate_picture_images = False

        self.converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(
                    pipeline_options=pipeline_options,
                    backend=PyPdfiumDocumentBackend,
                )
            }
        )

    def _clean_text(self, text: str) -> str:
        if not text: return ""
        text = re.sub(r'\\u[0-9a-fA-F]{4}', '', text)
        return " ".join(text.split())

    def _table_to_narrative(self, table_data: dict) -> str:
        narrative = ["Tabla encontrada:"]

        cells = table_data.get("data", {}).get("table_cells", [])
        for cell in cells:
            text = self._clean_text(cell.get("text", ""))
            if text:
                narrative.append(f"- {text}")
        return "\n".join(narrative)

    def process_document(self, file_path: str):
        result = self.converter.convert(file_path)
        doc = result.document
        
        doc_dict = doc.export_to_dict()

        final_payload = {
            "metadata": {
                "filename": result.input.file.name,
                "pages": len(doc.pages)
            },
            "content_blocks": doc.export_to_markdown(),
            "tables_summary": [],
            "entities": {"key_value_block": []}
        }

        for table in doc_dict.get("tables", []):
            final_payload["tables_summary"].append(self._table_to_narrative(table))

        for group in doc.groups:
            if group.label == "key_value_area":
                for child in group.children:
                    try:
                        resolved = child.resolve(doc)
                        if hasattr(resolved, 'text'):
                            text = self._clean_text(resolved.text)
                            if text:
                                final_payload["entities"]["key_value_block"].append(text)
                    except Exception:
                        continue
        
        return final_payload