"use client";

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="18" cy="5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="6" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="18" cy="19" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8.4 13.2l7.2 4.1M15.6 6.7L8.4 10.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PngIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
      <path
        d="M21 15l-5-5-5 5-4-4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CsvIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M8 13h8M8 17h8" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

interface Props {
  onShare?: () => void;
  onPng?: () => void;
  onCsv?: () => void;
  className?: string;
  /** block: fila completa encima del gráfico; inline: alineado a la derecha del panel del mapa */
  variant?: "block" | "inline";
}

/** Botones Compartir / PNG / CSV con ícono + texto. */
export default function ExportToolbar({
  onShare,
  onPng,
  onCsv,
  className = "",
  variant = "inline",
}: Props) {
  return (
    <div
      className={`export-toolbar export-toolbar--${variant} ${className}`.trim()}
      role="toolbar"
      aria-label="Exportar visualización"
    >
      {onShare ? (
        <button type="button" className="export-btn" onClick={onShare}>
          <ShareIcon />
          <span>Compartir</span>
        </button>
      ) : null}
      {onPng ? (
        <button type="button" className="export-btn" onClick={onPng}>
          <PngIcon />
          <span>PNG</span>
        </button>
      ) : null}
      {onCsv ? (
        <button type="button" className="export-btn" onClick={onCsv}>
          <CsvIcon />
          <span>CSV</span>
        </button>
      ) : null}
    </div>
  );
}
