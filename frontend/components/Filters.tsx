import React from 'react';

interface FiltersProps {
  gerencias: string[];
  selected: string;
  onSelect: (gerencia: string) => void;
}

export const Filters: React.FC<FiltersProps> = ({ gerencias, selected, onSelect }) => {
  return (
    <select
      value={selected}
      onChange={(e) => onSelect(e.target.value)}
      className="p-2 border rounded-md"
    >
      <option value="">Todas as Gerências</option>
      {gerencias.map((g) => (
        <option key={g} value={g}>{g}</option>
      ))}
    </select>
  );
};
