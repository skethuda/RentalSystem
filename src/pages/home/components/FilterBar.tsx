import { useState } from 'react';

interface FilterBarProps {
  onFilterChange: (propertyType: string) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'Tümü', icon: 'ri-home-line', value: '' },
    { id: 'villa', label: 'Villalar', icon: 'ri-home-4-line', value: 'Villa' },
    { id: 'apartment', label: 'Daireler', icon: 'ri-building-line', value: 'Daire' },
    { id: 'boutique', label: 'Butik Oteller', icon: 'ri-store-2-line', value: 'Butik Otel' },
    { id: 'bungalow', label: 'Bungalovlar', icon: 'ri-landscape-line', value: 'Bungalov' },
    { id: 'farmhouse', label: 'Çiftlik Evleri', icon: 'ri-plant-line', value: 'Çiftlik Evi' },
  ];

  const handleFilterClick = (filterId: string, value: string) => {
    setSelectedFilter(filterId);
    onFilterChange(value);
  };

  return (
    <div className="sticky top-20 z-20 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center space-x-3 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterClick(filter.id, filter.value)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full border-2 transition-all whitespace-nowrap ${
                selectedFilter === filter.id
                  ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#2C2C2C]'
              }`}
            >
              <i className={`${filter.icon} text-lg`}></i>
              <span className="font-medium text-sm">{filter.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
