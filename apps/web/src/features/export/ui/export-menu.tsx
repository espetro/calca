import { getLogger } from "@app/logger";
import { ChevronDown, Clipboard, ClipboardCopy, Download, Loader, LucideProps } from "lucide-react";
import { ReactNode, useCallback, useState } from "react";
import { BsFiletypeHtml, BsFiletypeJpg, BsFiletypePng, BsFiletypeSvg } from "react-icons/bs";
import { IconBaseProps } from "react-icons/lib";
import { toast } from "sonner";

import { m } from "#/lib/i18n";
import { Popover, PopoverContent, PopoverTrigger } from "#/shared/components/ui/popover";

import { canvasToBlob, renderFrame } from "../lib/rasterize";
import { buildStandaloneHtml, downloadBlob, slugify } from "../lib/standalone-html";

type ImageExportFormat = "png" | "jpg" | "svg" | "copy-image";
type CodeExportFormat = "html" | "copy-html";
type ExportFormat = ImageExportFormat | CodeExportFormat;

interface MenuOption<T extends string> {
  id: T;
  label: () => string;
  icon: (_: LucideProps | IconBaseProps) => ReactNode;
}

const logger = getLogger(["calca", "web", "export"]);

const IMAGE_FORMATS: MenuOption<ImageExportFormat>[] = [
  { icon: BsFiletypePng, id: "png", label: () => "PNG" },
  { icon: BsFiletypeJpg, id: "jpg", label: () => "JPG" },
  { icon: BsFiletypeSvg, id: "svg", label: () => "SVG" },
  { icon: Clipboard, id: "copy-image", label: m.export_copyAsImage },
];

const CODE_FORMATS: MenuOption<CodeExportFormat>[] = [
  { icon: BsFiletypeHtml, id: "html", label: m.export_html },
  { icon: ClipboardCopy, id: "copy-html", label: m.export_copyHtml },
];

interface ExportMenuProps {
  html: string;
  label: string;
  width?: number;
}

const runExport = async (format: ExportFormat, html: string, label: string, width: number) => {
  const name = slugify(label);

  switch (format) {
    case "html": {
      const doc = buildStandaloneHtml(html, width, label);
      downloadBlob(new Blob([doc], { type: "text/html" }), `${name}.html`);
      return;
    }
    case "copy-html":
      await navigator.clipboard.writeText(buildStandaloneHtml(html, width, label));
      toast.success(m.export_copied());
      return;
    case "svg": {
      const { svg } = await renderFrame(html, width);
      downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${name}.svg`);
      return;
    }
    case "png":
    case "jpg":
    case "copy-image": {
      const { canvas } = await renderFrame(html, width);
      const blob = await canvasToBlob(canvas, format === "jpg" ? "image/jpeg" : "image/png");
      if (format !== "copy-image") {
        downloadBlob(blob, `${name}.${format}`);
        return;
      }
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        toast.success(m.export_copied());
      } catch (error) {
        logger.warn("Clipboard image write failed, downloading instead", {
          error: error instanceof Error ? error.message : String(error),
        });
        downloadBlob(blob, `${name}.png`);
      }
    }
  }
};

export function ExportMenu({ html, label, width = 480 }: ExportMenuProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setMenuOpen(false);
      setExporting(format);
      try {
        await runExport(format, html, label, width);
      } catch (error) {
        logger.error("Export failed", {
          error: error instanceof Error ? error.message : String(error),
          format,
        });
        toast.error(m.export_failed());
      } finally {
        setExporting(null);
      }
    },
    [html, label, width],
  );

  const renderSection = <T extends ExportFormat>(title: string, options: MenuOption<T>[]) => (
    <>
      <div className="px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </div>
      {options.map((fmt) => (
        <button
          key={fmt.id}
          onClick={() => handleExport(fmt.id)}
          disabled={exporting !== null}
          className="w-full rounded-lg text-[13px] text-foreground hover:bg-foreground/5 cursor-pointer text-left px-2.5 py-1.5 flex items-center gap-2 disabled:opacity-40"
        >
          <fmt.icon className="h-4 w-4" />
          <span>{fmt.label()}</span>
          {exporting === fmt.id && <Loader className="w-3 h-3 animate-spin ml-auto text-primary" />}
        </button>
      ))}
    </>
  );

  return (
    <Popover open={menuOpen} onOpenChange={setMenuOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-all duration-200 rounded-xl group">
          {exporting ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{m.export_export()}</span>
          <ChevronDown className="w-3 h-3 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="center"
        side="bottom"
        sideOffset={8}
        className="w-[240px] bg-glass-bg backdrop-blur-2xl border border-glass-border shadow-glass p-1 rounded-xl"
      >
        {renderSection(m.export_imageSection(), IMAGE_FORMATS)}
        <div className="my-1 border-t border-border/30" />
        {renderSection(m.export_codeSection(), CODE_FORMATS)}
      </PopoverContent>
    </Popover>
  );
}
