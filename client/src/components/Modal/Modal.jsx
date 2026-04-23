import { useEffect } from "react";
import "./Modal.css";

function Modal({ open, onClose, title, children, maxWidth = 520, fullBleed = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-sheet"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />
        <header className="modal-head">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-x" onClick={onClose} aria-label="סגור">
            ✕
          </button>
        </header>
        <div className={`modal-body ${fullBleed ? "full-bleed" : ""}`}>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
