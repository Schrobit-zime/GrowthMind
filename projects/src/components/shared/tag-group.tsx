import { Button } from "@/components/ui/button";

interface TagGroupItem {
  key: string;
  label: string;
}

interface TagGroupProps {
  items: TagGroupItem[];
  selectedKeys: string[];
  onToggle: (key: string) => void;
  multiSelect?: boolean;
  className?: string;
}

export function TagGroup({ items, selectedKeys, onToggle, multiSelect = true, className }: TagGroupProps) {
  const handleClick = (key: string) => {
    if (!multiSelect) {
      onToggle(key);
      return;
    }
    onToggle(key);
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className || ""}`}>
      {items.map((item) => {
        const selected = selectedKeys.includes(item.key);
        return (
          <Button
            key={item.key}
            variant={selected ? "default" : "ghost"}
            size="sm"
            onClick={() => handleClick(item.key)}
            className={
              selected
                ? "bg-primary text-primary-foreground"
                : "bg-surface-container text-muted-foreground hover:text-foreground"
            }
          >
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}
