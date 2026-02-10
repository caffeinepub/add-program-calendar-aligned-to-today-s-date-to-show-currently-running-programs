import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Program } from '../backend';

interface RelatedProgramComboboxProps {
  programs: Program[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export default function RelatedProgramCombobox({
  programs,
  value,
  onValueChange,
  disabled = false,
}: RelatedProgramComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedProgram = programs.find((p) => p.id.toString() === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || programs.length === 0}
        >
          {selectedProgram ? selectedProgram.name : 'Pilih program...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Cari program..." className="h-9" />
          <CommandList className="max-h-[300px] overflow-y-auto overscroll-contain">
            <CommandEmpty>
              {programs.length === 0 ? 'Belum ada program.' : 'Program tidak ditemukan.'}
            </CommandEmpty>
            <CommandGroup>
              {programs.map((program) => (
                <CommandItem
                  key={program.id.toString()}
                  value={program.name}
                  onSelect={() => {
                    onValueChange(program.id.toString());
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  {program.name}
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      value === program.id.toString() ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
