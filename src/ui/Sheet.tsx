import { useEffect, useRef, type ReactNode } from "react";
import { IconClose } from "./icons";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  flush?: boolean;
  action?: ReactNode;
}

/** Bottom sheet. Single layer, iOS-style grab handle, scroll body. */
export function Sheet({ title, onClose, children, flush, action }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const body = document.body;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panel}
        tabIndex={-1}
      >
        <div className="sheet-grab" />
        <div className="sheet-head">
          <h2 className="sheet-title">{title}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {action}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ width: 34, height: 34, display: "grid", placeItems: "center", color: "var(--muted)" }}
            >
              <IconClose width={18} height={18} />
            </button>
          </div>
        </div>
        <div className={flush ? "sheet-body flush" : "sheet-body"}>{children}</div>
      </div>
    </>
  );
}
