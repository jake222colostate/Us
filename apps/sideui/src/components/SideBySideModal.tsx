import { useEffect } from "react";

import "./SideBySideModal.css";

type Person = {
  title: string;
  subtitle?: string;
  imageUrl: string;
};

interface SideBySideModalProps {
  open: boolean;
  onClose: () => void;
  left: Person;
  right: Person;
}

export default function SideBySideModal({ open, onClose, left, right }: SideBySideModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="side-modal" role="dialog" aria-modal="true" aria-label="Compare photos">
      <div className="side-modal__backdrop" onClick={onClose} />
      <div className="side-modal__container">
        <header className="side-modal__header">
          <h2>Side-by-side preview</h2>
          <button type="button" className="side-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="side-modal__content">
          <figure>
            <img src={left.imageUrl} alt={left.title} />
            <figcaption>
              <strong>{left.title}</strong>
              {left.subtitle ? <span>{left.subtitle}</span> : null}
            </figcaption>
          </figure>
          <figure>
            <img src={right.imageUrl} alt={right.title} />
            <figcaption>
              <strong>{right.title}</strong>
              {right.subtitle ? <span>{right.subtitle}</span> : null}
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}
