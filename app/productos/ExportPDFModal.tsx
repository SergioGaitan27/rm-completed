import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Radio,
  RadioGroup,
  Text,
  Progress,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";

interface ExportPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (withImages: boolean) => Promise<void>;
}

const ExportPDFModal: React.FC<ExportPDFModalProps> = ({ isOpen, onClose, onExport }) => {
  const [exportOption, setExportOption] = useState<'withImages' | 'withoutImages'>('withoutImages');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(0);
    try {
      await onExport(exportOption === 'withImages');
    } catch (error) {
      console.error('Error during export:', error);
    }
    setIsExporting(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Exportar catálogo a PDF</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Alert status="info">
              <AlertIcon />
              Exportar con imágenes puede aumentar significativamente el tamaño del archivo y el tiempo de generación.
            </Alert>
            <RadioGroup onChange={(value) => setExportOption(value as 'withImages' | 'withoutImages')} value={exportOption}>
              <VStack align="start">
                <Radio value="withoutImages">Exportar sin imágenes</Radio>
                <Radio value="withImages">Exportar con imágenes</Radio>
              </VStack>
            </RadioGroup>
            {isExporting && (
              <Progress value={progress} size="sm" colorScheme="blue" />
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleExport} isLoading={isExporting}>
            Exportar
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ExportPDFModal;