import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface EditorToolbarProps {
  onReset?: () => void;
}

export function EditorToolbar({ onReset }: EditorToolbarProps) {
  const [headerFont, setHeaderFont] = useState('PT Serif');
  const [bodyFont, setBodyFont] = useState('Open Sans');
  const [fontSize, setFontSize] = useState(14);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  return (
    <div className="w-full border rounded-lg bg-white/90 backdrop-blur px-3 py-2 shadow-sm flex items-center gap-3 flex-wrap">
      <label className="text-xs text-gray-600">Header Font</label>
      <select
        className="text-sm border rounded px-2 py-1"
        value={headerFont}
        onChange={(e) => setHeaderFont(e.target.value)}
      >
        <option>PT Serif</option>
        <option>Inter</option>
        <option>Roboto Slab</option>
      </select>

      <label className="text-xs text-gray-600">Body Font</label>
      <select
        className="text-sm border rounded px-2 py-1"
        value={bodyFont}
        onChange={(e) => setBodyFont(e.target.value)}
      >
        <option>Open Sans</option>
        <option>Inter</option>
        <option>Roboto</option>
      </select>

      <label className="text-xs text-gray-600">Font Size</label>
      <select
        className="text-sm border rounded px-2 py-1"
        value={fontSize}
        onChange={(e) => setFontSize(Number(e.target.value))}
      >
        {[12, 13, 14, 15, 16].map((s) => (
          <option key={s} value={s}>{s}px</option>
        ))}
      </select>

      <div className="ml-2 flex items-center gap-2">
        {["#111827", "#2563eb", "#059669", "#f59e0b"].map((c) => (
          <button key={c} className="w-4 h-4 rounded-full border" style={{ backgroundColor: c }} aria-label="color" />
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <label className="text-xs text-gray-600 flex items-center gap-2">
          <input type="checkbox" checked={showPageNumbers} onChange={() => setShowPageNumbers((v) => !v)} />
          Page numbers
        </label>
        <Button variant="outline" size="sm" className="text-xs" onClick={onReset}>Reset styling</Button>
        <label className="text-xs text-gray-600 flex items-center gap-2">
          <input type="checkbox" checked={previewMode} onChange={() => setPreviewMode((v) => !v)} />
          Preview mode
        </label>
      </div>
    </div>
  );
}


