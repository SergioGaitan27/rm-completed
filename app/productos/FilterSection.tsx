// app/catalogo/FilterSection.tsx
import React from 'react';
import { Box, Button, VStack, Tabs, TabList, Tab } from "@chakra-ui/react";

interface FilterSectionProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  activeAvailability: 'all' | 'available' | 'unavailable';
  setActiveAvailability: (availability: 'all' | 'available' | 'unavailable') => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  activeCategory,
  setActiveCategory,
  activeAvailability,
  setActiveAvailability
}) => {
  return (
    <Box mb={6}>
      <VStack spacing={4} align="stretch">
        <Button
          onClick={() => {
            setActiveCategory('');
            setActiveAvailability('all');
          }}
          colorScheme={activeCategory === '' ? 'blue' : 'gray'}
        >
          Todos
        </Button>
        <Button
          onClick={() => {
            setActiveCategory('inStock');
            setActiveAvailability('all');
          }}
          colorScheme={activeCategory === 'inStock' ? 'blue' : 'gray'}
        >
          Con existencia y stock en tu ubicación
        </Button>
        <Button
          onClick={() => {
            setActiveCategory('available');
            setActiveAvailability('all');
          }}
          colorScheme={activeCategory === 'available' ? 'blue' : 'gray'}
        >
          Con existencia y sin stock en tu ubicación
        </Button>
        <Button
          onClick={() => {
            setActiveCategory('unavailable');
            setActiveAvailability('all');
          }}
          colorScheme={activeCategory === 'unavailable' ? 'blue' : 'gray'}
        >
          Sin existencia
        </Button>
      </VStack>
      {activeCategory !== '' && activeCategory !== 'unavailable' && (
        <Tabs mt={4} onChange={(index) => setActiveAvailability(['all', 'available', 'unavailable'][index] as 'all' | 'available' | 'unavailable')}>
          <TabList>
            <Tab>Todos</Tab>
            <Tab>Disponibles</Tab>
            <Tab>No Disponibles</Tab>
          </TabList>
        </Tabs>
      )}
    </Box>
  );
};

export default FilterSection;