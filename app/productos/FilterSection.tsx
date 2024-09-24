import React from 'react';
import { HStack, Button, Select } from "@chakra-ui/react";

type CategoryType = 'all' | 'inStock' | 'available' | 'unavailable';
type AvailabilityType = 'all' | 'available' | 'unavailable';

interface FilterSectionProps {
  activeCategory: CategoryType;
  setActiveCategory: React.Dispatch<React.SetStateAction<CategoryType>>;
  activeAvailability: AvailabilityType;
  setActiveAvailability: React.Dispatch<React.SetStateAction<AvailabilityType>>;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  activeCategory,
  setActiveCategory,
  activeAvailability,
  setActiveAvailability
}) => {
  return (
    <HStack spacing={4} mb={6}>
      <Select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value as CategoryType)}>
        <option value="all">Todos</option>
        <option value="inStock">Con existencia y stock en tu ubicación</option>
        <option value="available">Con existencia y sin stock en tu ubicación</option>
        <option value="unavailable">Sin existencia</option>
      </Select>
      <Select value={activeAvailability} onChange={(e) => setActiveAvailability(e.target.value as AvailabilityType)}>
        <option value="all">Todos</option>
        <option value="available">Disponibles</option>
        <option value="unavailable">No Disponibles</option>
      </Select>
    </HStack>
  );
};

export default FilterSection;