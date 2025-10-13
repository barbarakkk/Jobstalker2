import { useEffect, useRef, useState } from 'react';

interface EditableTextProps {
  value: string;
  placeholder?: string;
  className?: string;
  onSave: (next: string) => void;
  multiline?: boolean;
}

export function EditableText({ value, placeholder, className, onSave, multiline = false }: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  if (editing) {
    const InputComponent = multiline ? 'textarea' : 'input';
    return (
      <InputComponent
        ref={inputRef as any}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !multiline) commit();
          if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={`w-full outline-none border-2 border-blue-400 bg-blue-50/30 rounded px-2 py-1 ${className || ''}`}
        rows={multiline ? 3 : 1}
      />
    );
  }

  return (
    <div
      className={`cursor-text hover:border-2 hover:border-blue-300 hover:bg-blue-50/30 rounded px-2 py-1 border-2 border-transparent transition-all ${className || ''}`}
      onClick={() => setEditing(true)}
    >
      {value || placeholder || ''}
    </div>
  );
}


