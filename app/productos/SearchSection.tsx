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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toUpperCase());
  };

  return (
    <Box mb={6}>
      <HStack spacing={4}>
        <Input
          placeholder="Buscar por código o nombre"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
      </HStack>
    </Box>
  );
};

export default SearchSection;