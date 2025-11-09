import { useState } from "react";

export default function ShowMoreBox({ label = "More details", children, maxHeight = "max-h-60" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
      >
        <span className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}>▸</span>
        {open ? "Hide details" : label}
      </button>
      {open && (
        <div className={`mt-2 overflow-auto ${maxHeight} rounded border border-gray-200 bg-gray-50 p-3`}>
          {children}
        </div>
      )}
    </div>
  );
}
