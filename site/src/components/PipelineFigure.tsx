"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
};

export default function PipelineFigure({ src, alt, width, height, caption }: Props) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <>
      <figure className="acerca-pipeline-figure">
        <button
          type="button"
          className="acerca-pipeline-img-btn"
          onClick={() => setOpen(true)}
          aria-label={`Ampliar diagrama: ${alt}`}
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="acerca-pipeline-img"
          />
        </button>
        <figcaption>{caption}</figcaption>
      </figure>

      {open ? (
        <div className="acerca-lightbox-overlay" onClick={close} role="presentation">
          <div
            className="acerca-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="acerca-lightbox-close"
              onClick={close}
              aria-label="Cerrar"
            >
              ×
            </button>
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              className="acerca-lightbox-img"
            />
            <p className="acerca-lightbox-caption">{caption}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
