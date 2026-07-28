"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface Props {
  fileUrl: string | null;
}

export function PdfViewer({ fileUrl }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: nextNumPages }: { numPages: number }) => {
      setNumPages(nextNumPages);
      setCurrentPage(1);
    },
    []
  );

  if (!fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center text-muted-foreground gap-4">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center max-w-sm">
          <FileText className="h-20 w-20 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-lg font-medium text-foreground/70">No document loaded</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a PDF to preview it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
      <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
          disabled={scale <= 0.5}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground min-w-[40px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setScale((s) => Math.min(2, s + 0.1))}
          disabled={scale >= 2}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground">
          {currentPage} / {numPages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
          disabled={currentPage >= numPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-auto max-h-[calc(100vh-160px)] w-full flex justify-center">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="bg-white shadow-xl rounded-lg p-20 text-center">
              <div className="animate-pulse text-muted-foreground">Loading PDF...</div>
            </div>
          }
          error={
            <div className="bg-white shadow-xl rounded-lg p-20 text-center text-destructive">
              Failed to load PDF.
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            scale={scale}
            className="shadow-xl rounded-lg overflow-hidden"
          />
        </Document>
      </div>
    </div>
  );
}
