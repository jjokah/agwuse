"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  searchMembers,
  type MemberSearchResult,
} from "@/lib/actions/member-search-actions";

export interface MemberComboboxProps {
  name?: string;
  defaultValue?: string;
  defaultMemberName?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  onSelect?: (member: MemberSearchResult | null) => void;
}

export function MemberCombobox({
  name = "memberId",
  defaultValue = "",
  defaultMemberName = "",
  placeholder = "Select or search member...",
  className,
  onSelect,
}: MemberComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<MemberSearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<{ id: string; name: string } | null>(
    defaultValue
      ? { id: defaultValue, name: defaultMemberName || defaultValue }
      : null,
  );

  // Debounced member search
  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchMembers(query);
        setResults(found);
      } catch (err) {
        console.error("Member search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (member: MemberSearchResult | null) => {
    setSelected(member ? { id: member.id, name: member.name } : null);
    setOpen(false);
    onSelect?.(member);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleSelect(null);
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Hidden input for standard form submission */}
      <input type="hidden" name={name} value={selected?.id || ""} />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal text-left h-9 px-3"
            />
          }
        >
          <span className="truncate flex-1 flex items-center gap-2">
            <User className="size-4 text-muted-foreground shrink-0" />
            {selected ? (
              <span className="font-medium text-foreground">{selected.name}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>

          <div className="flex items-center gap-1 shrink-0 ml-1">
            {selected && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear selected member"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(null);
                  }
                }}
                className="rounded-xs p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </span>
            )}
            <ChevronsUpDown className="size-3.5 text-muted-foreground opacity-50" />
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Type name, email or phone..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {loading && (
                <div className="flex items-center justify-center p-4 text-sm text-muted-foreground gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Searching...
                </div>
              )}

              {!loading && query.trim().length < 2 && (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Type at least 2 characters to search members
                </div>
              )}

              {!loading && query.trim().length >= 2 && results.length === 0 && (
                <CommandEmpty>No members found</CommandEmpty>
              )}

              {!loading && results.length > 0 && (
                <CommandGroup heading="Active Members">
                  {results.map((member) => (
                    <CommandItem
                      key={member.id}
                      value={member.id}
                      onSelect={() => handleSelect(member)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{member.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {member.email}
                          {member.phone ? ` • ${member.phone}` : ""}
                        </span>
                      </div>
                      <Check
                        className={cn(
                          "size-4 shrink-0",
                          selected?.id === member.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
