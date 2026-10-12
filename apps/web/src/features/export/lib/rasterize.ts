import { buildStandaloneHtml, buildSvgFromDocument } from "./standalone-html";

const EXPORT_SCALE = 3;
const RENDER_SURFACE_HEIGHT = 800;
const IMAGE_TIMEOUT_MS = 3000;
const SETTLE_MS = 600;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const waitForImages = (doc: Document) =>
  Promise.all(
    [...doc.querySelectorAll("img")].map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, IMAGE_TIMEOUT_MS);
        }),
    ),
  );

export interface RenderedFrame {
  canvas: HTMLCanvasElement;
  height: number;
  svg: string;
}

/**
 * Renders a frame's HTML off-screen and rasterizes ONLY the document body at
 * its measured content height. The render surface is a normal viewport height;
 * sizing it huge let `100vh`/`h-full` content stretch into mostly-blank
 * oversized captures.
 */
export const renderFrame = async (html: string, width: number): Promise<RenderedFrame> => {
  const blobUrl = URL.createObjectURL(
    new Blob([buildStandaloneHtml(html, width)], { type: "text/html" }),
  );
  const iframe = document.createElement("iframe");
  iframe.style.cssText = `position:fixed;left:-99999px;top:0;width:${width}px;height:${RENDER_SURFACE_HEIGHT}px;border:none;`;
  document.body.appendChild(iframe);

  try {
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve();
      iframe.onerror = () => reject(new Error("Failed to load export frame"));
      iframe.src = blobUrl;
    });

    const doc = iframe.contentDocument;
    if (!doc?.body) throw new Error("Export frame did not render");

    await waitForImages(doc);
    await doc.fonts?.ready;
    // Tailwind's runtime compiles utilities asynchronously after load.
    await sleep(SETTLE_MS);

    const height = Math.max(1, Math.ceil(doc.body.getBoundingClientRect().height));
    const html2canvas = (await import("html2canvas-pro")).default;
    const canvas = await html2canvas(doc.body, {
      backgroundColor: "#ffffff",
      height,
      scale: EXPORT_SCALE,
      useCORS: true,
      width,
      windowWidth: width,
    });
    // Serialize BEFORE the iframe detaches — computed styles die with it.
    const svg = buildSvgFromDocument(doc, width, height);
    return { canvas, height, svg };
  } finally {
    iframe.remove();
    URL.revokeObjectURL(blobUrl);
  }
};

export const canvasToBlob = (canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg") =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))), type, 0.95);
  });
