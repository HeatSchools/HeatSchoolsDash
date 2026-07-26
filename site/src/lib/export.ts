/** Utilidades para exportar y compartir visualizaciones. */

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const body = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  downloadBlob(filename, new Blob([body], { type: "text/csv;charset=utf-8;" }));
}

export function downloadPng(filename: string, dataUrl: string) {
  downloadBlob(filename, dataUrlToBlob(dataUrl));
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function downloadSvgAsPng(svg: SVGElement, filename: string) {
  const svgEl = svg as SVGSVGElement;
  const xml = new XMLSerializer().serializeToString(svgEl);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  const img = new Image();
  const width = svgEl.viewBox.baseVal.width || svgEl.clientWidth || 800;
  const height = svgEl.viewBox.baseVal.height || svgEl.clientHeight || 400;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    URL.revokeObjectURL(url);
    return;
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(url);
  downloadPng(filename, canvas.toDataURL("image/png"));
}

export async function shareLink(title: string, text: string) {
  const url = window.location.href;
  if (navigator.share) {
    await navigator.share({ title, text, url });
    return;
  }
  await navigator.clipboard.writeText(url);
  window.alert("Enlace copiado al portapapeles.");
}
