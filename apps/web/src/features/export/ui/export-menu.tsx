import { getLogger } from "@app/logger";
import { Clipboard, Download, Loader, LucideProps } from "lucide-react";
import { ReactNode, useCallback, useState } from "react";
import { BsFiletypeJpg, BsFiletypePng, BsFiletypeSvg } from "react-icons/bs";
import { IconBaseProps } from "react-icons/lib";
import { SiReact, SiTailwindcss } from "react-icons/si";

import useExportCodeMutation from "#/features/design/hooks/use-export-code-mutation";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "#/shared/components/ui/navigation-menu";

type CodeExportFormat = "tailwind" | "react";
type ImageExportFormat = "svg" | "png" | "jpg" | "copy-image";

type ExportFormat = CodeExportFormat | ImageExportFormat;

interface Preview {
  format: ExportFormat;
  code: string;
}

interface MenuOption<T extends string = string> {
  id: T;
  label: string;
  icon: (_: LucideProps | IconBaseProps) => ReactNode;
  ext?: string;
}

const logger = getLogger(["calca", "web", "export"]);

const CODE_FORMATS: MenuOption<CodeExportFormat>[] = [
  { ext: "html", icon: SiTailwindcss, id: "tailwind", label: "Tailwind" },
  { ext: "tsx", icon: SiReact, id: "react", label: "React" },
];

const IMAGE_FORMATS: MenuOption<ImageExportFormat>[] = [
  { icon: BsFiletypeSvg, ext: "svg", id: "svg", label: "SVG" },
  { icon: BsFiletypePng, id: "png", label: "PNG" },
  { icon: BsFiletypeJpg, id: "jpg", label: "JPG" },
  { icon: Clipboard, id: "copy-image", label: "Copy as Image" },
];

const ALL_FORMATS = [...CODE_FORMATS, ...IMAGE_FORMATS];

async function htmlToImageBlob(
  html: string,
  width: number,
  type: "image/png" | "image/jpeg",
): Promise<Blob> {
  // Use a same-origin blob URL in an iframe so we can access its DOM
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:white;width:${width}px;}</style></head><body>${html}</body></html>`;
  const blob = new Blob([fullHtml], { type: "text/html" });
  const blobUrl = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.style.cssText = `position:fixed;left:-9999px;top:0;width:${width}px;height:12000px;border:none;`;
  document.body.appendChild(iframe);

  try {
    // Load via blob URL (same-origin, so we can access contentDocument)
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve();
      iframe.onerror = () => reject(new Error("Failed to load iframe"));
      iframe.src = blobUrl;
    });

    const doc = iframe.contentDocument;
    if (!doc) {
      throw new Error("No iframe document");
    }

    // Wait for images
    const images = doc.querySelectorAll("img");
    await Promise.all(
      [...images].map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              return resolve();
            }
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 3000);
          }),
      ),
    );

    // Wait for fonts to load in the iframe context
    if (doc.fonts && doc.fonts.ready) {
      await doc.fonts.ready;
    }

    await new Promise((r) => setTimeout(r, 500));

    const { body } = doc;
    const h = body.scrollHeight;
    iframe.style.height = h + "px";

    // Small delay after resize
    await new Promise((r) => setTimeout(r, 100));

    // Use html2canvas-pro for faithful DOM rasterization.
    // Html-to-image uses SVG foreignObject which measures text differently
    // And causes line breaks that don't exist in the live canvas.
    const html2canvas = (await import("html2canvas-pro")).default;
    const canvas = await html2canvas(body, {
      allowTaint: true,
      backgroundColor: null,
      height: h,
      scale: 2,
      useCORS: true,
      width,
    });

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
        type,
        0.95,
      );
    });
  } finally {
    document.body.removeChild(iframe);
    URL.revokeObjectURL(blobUrl);
  }
}

const LoadingIndicator = () => {
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 mt-2 bg-white/60 backdrop-blur-2xl rounded-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-3 py-2 z-30 flex items-center gap-2">
      <Loader className="w-3 h-3 animate-spin ml-auto text-blue-500" />
      <span className="text-[12px] text-gray-500">Converting...</span>
    </div>
  );
};

interface PreviewPanelProps {
  label: string;
  preview: Preview;
  onCancel: () => void;
}

const PreviewPanel = ({ label, preview, onCancel }: PreviewPanelProps) => {
  const handleCopy = useCallback(() => {
    if (!preview) {
      return;
    }
    navigator.clipboard.writeText(preview.code);
  }, [preview]);

  const handleDownload = useCallback(() => {
    if (!preview) {
      return;
    }
    const fmt = ALL_FORMATS.find((f) => f.id === preview.format);
    const mime = preview.format === "svg" ? "image/svg+xml" : "text/plain";
    const blob = new Blob([preview.code], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label.toLowerCase().replace(/\s+/g, "-")}.${fmt?.ext || "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [preview, label]);

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 mt-2 bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.7)] z-30 w-[420px] max-w-[80vw]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/40">
        <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
          {ALL_FORMATS.find((f) => f.id === preview.format)?.label} Export
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="text-[11px] font-medium text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded-lg hover:bg-black/5 transition-all"
          >
            Copy
          </button>
          <button
            onClick={handleDownload}
            className="text-[11px] font-medium text-white bg-blue-500/90 hover:bg-blue-500 px-2.5 py-1 rounded-lg transition-all"
          >
            Download
          </button>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded-lg hover:bg-black/5 ml-1 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
      <pre className="p-4 text-[12px] leading-relaxed text-gray-700 font-mono overflow-auto max-h-[320px] whitespace-pre-wrap break-all">
        {preview.code}
      </pre>
    </div>
  );
};

interface ExportMenuProps {
  html: string;
  label: string;
  width?: number;
  apiKey?: string;
  model?: string;
  providerType?: string;
  baseURL?: string;
}

export function ExportMenu({
  html,
  label,
  width = 480,
  apiKey,
  model,
  providerType,
  baseURL,
}: ExportMenuProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  const { mutateAsync } = useExportCodeMutation();

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setExporting(format);

      try {
        // Image exports — client-side
        if (format === "png" || format === "jpg" || format === "copy-image") {
          const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
          const blob = await htmlToImageBlob(html, width, mimeType as "image/png" | "image/jpeg");

          if (format === "copy-image") {
            try {
              await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            } catch (error) {
              logger.error("Clipboard write failed, falling back to download", {
                error: error instanceof Error ? error.message : String(error),
              });
              // Fallback: download instead
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${label.toLowerCase().replace(/\s+/g, "-")}.png`;
              a.click();
              URL.revokeObjectURL(url);
            }
            setExporting(null);
            return;
          }

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${label.toLowerCase().replace(/\s+/g, "-")}.${format}`;
          a.click();
          URL.revokeObjectURL(url);
          setExporting(null);
          return;
        }

        // Code exports — API call
        const data = await mutateAsync({
          apiKey,
          baseURL: baseURL || undefined,
          format,
          html,
          model,
          providerType: providerType || undefined,
        });
        if ("error" in data) {
          throw new Error(data.error);
        }
        setPreview({ code: data.result, format });
      } catch (error) {
        logger.error("Export failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        if (format === "png" || format === "jpg" || format === "copy-image") {
          // Can't show preview for image failures
          logger.error("Image export failed");
        } else {
          setPreview({ code: "// Export failed. Check API key and try again.", format });
        }
      } finally {
        setExporting(null);
      }
    },
    [html, width, label, mutateAsync],
  );

  const handleCancel = () => setPreview(null);

  return (
    <>
      <NavigationMenuItem>
        <NavigationMenuTrigger className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-100/80 hover:text-gray-800 transition-all duration-200 rounded-xl group">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </NavigationMenuTrigger>

        <NavigationMenuContent className="w-[240px] md:w-[240px] bg-white/60 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.7)] p-1 rounded-xl">
          <div className="px-2.5 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Image
          </div>
          {IMAGE_FORMATS.map((fmt) => (
            <button
              key={fmt.id}
              onPointerDown={() => handleExport(fmt.id)}
              disabled={exporting !== null}
              className="w-full rounded-lg text-[13px] text-gray-700 hover:bg-black/5 cursor-pointer text-left px-2.5 py-1.5 flex items-center gap-2 disabled:opacity-40"
            >
              <fmt.icon className="h-4 w-4" />
              <span>{fmt.label}</span>
              {exporting === fmt.id && (
                <Loader className="w-3 h-3 animate-spin ml-auto text-blue-500" />
              )}
            </button>
          ))}
          <div className="my-1 border-t border-gray-200/30" />

          <div className="px-2.5 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Code
          </div>
          {CODE_FORMATS.map((fmt) => (
            <button
              key={fmt.id}
              onPointerDown={() => handleExport(fmt.id)}
              disabled={exporting !== null}
              className="w-full rounded-lg text-[13px] text-gray-700 hover:bg-black/5 cursor-pointer text-left px-2.5 py-1.5 flex items-center gap-2 disabled:opacity-40"
            >
              <fmt.icon className="h-4 w-4" />
              <span>{fmt.label}</span>
              {exporting === fmt.id && (
                <Loader className="w-3 h-3 animate-spin ml-auto text-blue-500" />
              )}
            </button>
          ))}
        </NavigationMenuContent>
      </NavigationMenuItem>

      {/* Loading indicator */}
      {exporting && <LoadingIndicator />}

      {/* Preview panel */}
      {preview && <PreviewPanel label={label} preview={preview} onCancel={handleCancel} />}
    </>
  );
}
