'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onSearch: (query: string) => Promise<void>;
  placeholder: string;
  isLoading?: boolean;
  items: any[];
  onSelect: (value: string) => void;
  formatLabel?: (item: any) => string;
}

export function SearchInput({
  value,
  onSearch,
  placeholder,
  isLoading,
  items,
  onSelect,
  formatLabel = (item) => item.nombre
}: SearchInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Actualizar el input cuando cambia la selección
  useEffect(() => {
    if (value && value !== "none" && items?.length) {
      const selectedItem = items.find(item => item.id === value);
      if (selectedItem) {
        setInputValue(formatLabel(selectedItem));
      }
    } else if (value === "none") {
      setInputValue("");
    }
  }, [value, items, formatLabel]);

  // Cerrar el dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setOpen(true);
    await onSearch(newValue);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="flex items-center border rounded-md px-3">
        <Search className="h-4 w-4 shrink-0 opacity-50" />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            setOpen(true);
            if (!inputValue) onSearch("");
          }}
          className="flex-1 h-10 px-3 py-2 text-sm bg-transparent border-0 outline-none focus:ring-0"
          placeholder={placeholder}
        />
        {isLoading && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
      </div>
      
      {open && (
        <div className="absolute w-full z-50 mt-1 bg-white rounded-md border shadow-lg max-h-[200px] overflow-y-auto">
          <div 
            className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
            onClick={() => {
              onSelect("none");
              setInputValue("");
              setOpen(false);
            }}
          >
            -- Ninguno --
          </div>
          
          {items?.length === 0 ? (
            <div className="p-2 text-sm text-gray-500 text-center">
              {isLoading ? "Cargando..." : "No se encontraron resultados"}
            </div>
          ) : (
            items?.map((item) => (
              <div
                key={item.id}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => {
                  onSelect(item.id);
                  setInputValue(formatLabel(item));
                  setOpen(false);
                }}
              >
                {formatLabel(item)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 