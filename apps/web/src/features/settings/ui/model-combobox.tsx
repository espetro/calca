import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { m } from "#/lib/i18n";
import { cn } from "#/lib/utils";
import { Input } from "#/shared/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "#/shared/components/ui/popover";

import type { ModelInfo } from "../types";

interface ModelComboboxProps {
  models: ModelInfo[];
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ModelCombobox({
  models,
  value,
  onChange,
  disabled,
  placeholder,
}: ModelComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const query = value.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!query) return models;
    return models.filter((model) =>
      `${model.id} ${model.displayName}`.toLowerCase().includes(query),
    );
  }, [models, query]);

  const showList = open && filtered.length > 0;

  const scrollHighlightedIntoView = (index: number) => {
    listRef.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
  };

  const moveHighlight = (delta: number) => {
    const next = Math.max(0, Math.min(filtered.length - 1, highlightedIndex + delta));
    setHighlightedIndex(next);
    scrollHighlightedIntoView(next);
  };

  const selectModel = (modelId: string) => {
    onChange(modelId);
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open && filtered.length > 0) {
        setOpen(true);
        setHighlightedIndex(0);
      } else {
        moveHighlight(1);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveHighlight(-1);
    } else if (event.key === "Enter" && showList) {
      event.preventDefault();
      const model = filtered[Math.min(highlightedIndex, filtered.length - 1)];
      if (model) selectModel(model.id);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <Popover open={open && models.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Input
            role="combobox"
            aria-expanded={showList}
            aria-controls="model-combobox-listbox"
            aria-autocomplete="list"
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            onFocus={() => {
              setHighlightedIndex(0);
              setOpen(true);
            }}
            onChange={(e) => {
              onChange(e.target.value);
              setHighlightedIndex(0);
              setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className="pr-10"
          />
          <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-anchor-width) p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div
          id="model-combobox-listbox"
          role="listbox"
          ref={listRef}
          className="max-h-48 overflow-y-auto"
        >
          {filtered.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              {m.settings_noModelsMatch({ query: value.trim() })}
            </p>
          ) : (
            filtered.map((model, index) => (
              <button
                key={model.id}
                type="button"
                role="option"
                aria-selected={model.id === value}
                data-index={index}
                onClick={() => selectModel(model.id)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none",
                  index === highlightedIndex && "bg-accent text-accent-foreground",
                )}
              >
                <span className="truncate">{model.displayName || model.id}</span>
                {model.id === value && <Check className="size-3.5 shrink-0" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
