import React from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Text,
} from "@chakra-ui/react";
import Image from 'next/image';

interface EvidenceImageProps {
  transferImage: File | null;
  onImageChange: (file: File | null) => void;
}

const EvidenceImage: React.FC<EvidenceImageProps> = ({ transferImage, onImageChange }) => {
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageChange(event.target.files[0]);
    }
  };

  return (
    <Box bg="white" p={6} borderRadius="md" boxShadow="md" w="full">
      <Heading as="h3" size="md" mb={4}>Imagen de evidencia:</Heading>
      <FormControl>
        <FormLabel htmlFor="evidenceImage" cursor="pointer">
          <Box
            border="2px dashed"
            borderColor="gray.300"
            borderRadius="md"
            p={4}
            textAlign="center"
          >
            <Text mb={2}>
              {transferImage ? transferImage.name : "Seleccionar archivo"}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Haga clic aquí para seleccionar una imagen
            </Text>
          </Box>
        </FormLabel>
        <Input
          type="file"
          id="evidenceImage"
          accept="image/*"
          onChange={handleImageChange}
          display="none"
        />
      </FormControl>
      {transferImage && (
        <Box mt={4} position="relative" height="200px">
          <Image
            src={URL.createObjectURL(transferImage)}
            alt="Vista previa de la evidencia"
            fill
            style={{ objectFit: 'contain' }}
          />
        </Box>
      )}
    </Box>
  );
};

export default EvidenceImage;