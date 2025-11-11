import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface EditorToolbarProps {
  onReset?: () => void;
  selectedColor?: string | null;
  onColorChange?: (color: string) => void;
  fontSettings?: {
    headerFont?: string;
    bodyFont?: string;
    fontSize?: number;
  };
  onFontSettingsChange?: (settings: { headerFont?: string; bodyFont?: string; fontSize?: number }) => void;
}

export function EditorToolbar({ 
  onReset, 
  selectedColor, 
  onColorChange,
  fontSettings = {},
  onFontSettingsChange
}: EditorToolbarProps) {
  const [headerFont, setHeaderFont] = useState(fontSettings.headerFont || 'PT Serif');
  const [bodyFont, setBodyFont] = useState(fontSettings.bodyFont || 'Open Sans');
  const [fontSize, setFontSize] = useState(fontSettings.fontSize || 14);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  // Update parent when fonts change
  const handleHeaderFontChange = (font: string) => {
    setHeaderFont(font);
    onFontSettingsChange?.({ ...fontSettings, headerFont: font });
  };

  const handleBodyFontChange = (font: string) => {
    setBodyFont(font);
    onFontSettingsChange?.({ ...fontSettings, bodyFont: font });
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    onFontSettingsChange?.({ ...fontSettings, fontSize: size });
  };

  // Sync local state when props change
  useEffect(() => {
    if (fontSettings.headerFont) setHeaderFont(fontSettings.headerFont);
    if (fontSettings.bodyFont) setBodyFont(fontSettings.bodyFont);
    if (fontSettings.fontSize) setFontSize(fontSettings.fontSize);
  }, [fontSettings]);

  return (
    <div className="w-full border rounded-lg bg-white/90 backdrop-blur px-3 py-2 shadow-sm flex items-center gap-3 flex-wrap">
      <label className="text-xs text-gray-600">Header Font</label>
      <select
        className="text-sm border rounded px-2 py-1"
        value={headerFont}
        onChange={(e) => handleHeaderFontChange(e.target.value)}
      >
        <option>PT Serif</option>
        <option>Inter</option>
        <option>Roboto Slab</option>
      </select>

      <label className="text-xs text-gray-600">Body Font</label>
      <select
        className="text-sm border rounded px-2 py-1"
        value={bodyFont}
        onChange={(e) => handleBodyFontChange(e.target.value)}
      >
        <option>Open Sans</option>
        <option>Inter</option>
        <option>Roboto</option>
      </select>

      <label className="text-xs text-gray-600">Font Size</label>
      <select
        className="text-sm border rounded px-2 py-1"
        value={fontSize}
        onChange={(e) => handleFontSizeChange(Number(e.target.value))}
      >
        {[12, 13, 14, 15, 16].map((s) => (
          <option key={s} value={s}>{s}px</option>
        ))}
      </select>

      <div className="ml-2 flex items-center gap-2">
        <label className="text-xs text-gray-600">Color:</label>
        {["#111827", "#2563eb", "#059669", "#f59e0b"].map((c) => (
          <button 
            key={c} 
            onClick={() => onColorChange?.(c)}
            className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
              selectedColor === c ? 'border-gray-800 ring-2 ring-offset-1 ring-gray-400' : 'border-gray-300'
            }`}
            style={{ backgroundColor: c }}
            aria-label={`Select color ${c}`}
            title={`Select ${c}`}
          />
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


