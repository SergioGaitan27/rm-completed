// app/catalogo/SearchSection.tsx
import React from 'react';
import { Box, Input, Button, HStack } from "@chakra-ui/react";

interface SearchSectionProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: () => void;
  isUpdating: boolean;
}

const SearchSection: React.FC<SearchSectionProps> = ({
  searchTerm,
  setSearchTerm,
  handleSearch,
  isUpdating
}) => {
  return (
    <Box mb={6}>
      <HStack spacing={4}>
        <Input
          placeholder="Buscar por código o nombre"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        {/* <Button
          onClick={handleSearch}
          isLoading={isUpdating}
          loadingText="Actualizando"
          colorScheme="blue"
        >
          Buscar
        </Button> */}
      </HStack>
    </Box>
  );
};

export default SearchSection;