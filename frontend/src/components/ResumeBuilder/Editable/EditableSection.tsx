import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EditableSectionProps {
  title: string;
  children: ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  showAddButton?: boolean;
}

export function EditableSection({ 
  title, 
  children, 
  onAdd, 
  addLabel = "Add Entry", 
  showAddButton = true 
}: EditableSectionProps) {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-800">{title}</h2>
        {showAddButton && onAdd && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="text-[#295acf] border-[#295acf]/30 hover:bg-[#295acf]/10 text-xs px-2 py-1 h-6"
          >
            <Plus className="w-3 h-3 mr-1" />
            {addLabel}
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}
