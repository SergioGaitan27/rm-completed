import React, { useState, useRef } from 'react';
import { Formik, Form, Field, FieldArray } from 'formik';
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Button,
  Checkbox,
  Select,
  HStack,
  IconButton,
  Image,
  Flex,
  Box,
  useToast,
  Grid,
  GridItem,
  Text,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, ArrowBackIcon, CloseIcon } from '@chakra-ui/icons';
import { IProductBase, IStockLocation } from '@/app/types/product';

interface CreateProductFormProps {
  onSubmit: (values: IProductBase) => void;
  onBack: () => void;
}

const CreateProductForm: React.FC<CreateProductFormProps> = ({ onSubmit, onBack }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const initialValues: IProductBase = {
    boxCode: '',
    productCode: '',
    name: '',
    piecesPerBox: 0,
    cost: 0,
    price1: 0,
    price1MinQty: 0,
    price2: 0,
    price2MinQty: 0,
    price3: 0,
    price3MinQty: 0,
    category: 'PAPELERÍA',
    availability: true,
    stockLocations: [{ location: '', quantity: '' }],
  };

  const handleUppercaseChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    handleChange: (event: React.ChangeEvent<any>) => void
  ) => {
    event.target.value = event.target.value.toUpperCase();
    handleChange(event);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStockQuantityChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
    setFieldValue: (field: string, value: any) => void
  ) => {
    const value = event.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setFieldValue(`stockLocations.${index}.quantity`, value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const target = e.currentTarget as HTMLInputElement | HTMLSelectElement;
      const form = target.form;
      if (form) {
        const index = Array.prototype.indexOf.call(form, target);
        const nextElement = form.elements[index + 1] as HTMLElement;
        if (nextElement) {
          nextElement.focus();
        }
      }
    }
  };

  return (
    <Box>
      <Button
        leftIcon={<ArrowBackIcon />}
        onClick={onBack}
        mb={4}
        variant="solid"
        colorScheme="blue"
        bg="blue.500"
        color="white"
        _hover={{ bg: "blue.600" }}
      >
        Volver a Productos
      </Button>
      <Formik
        initialValues={initialValues}
        onSubmit={async (values, actions) => {
          if (imageFile) {
            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('upload_preset', 'xgmwzgac');

            try {
              const imageResponse = await fetch('https://api.cloudinary.com/v1_1/dpsrtoyp7/image/upload', {
                method: 'POST',
                body: formData
              });
              if (!imageResponse.ok) {
                throw new Error('Error al subir la imagen');
              }
              const imageData = await imageResponse.json();
              values.imageUrl = imageData.secure_url;
            } catch (error) {
              console.error('Error al subir la imagen:', error);
              toast({
                title: "Error al subir la imagen",
                description: "Por favor, intenta de nuevo",
                status: "error",
                duration: 3000,
                isClosable: true,
              });
              return;
            }
          }

          const processedValues: IProductBase = {
            ...values,
            stockLocations: values.stockLocations.map(loc => ({
              ...loc,
              quantity: loc.quantity === '' ? 0 : parseInt(loc.quantity as string, 10)
            }))
          };
          onSubmit(processedValues);
        }}
      >
        {({ values, handleChange, handleBlur, isSubmitting, setFieldValue }) => (
          <Form>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Código de caja</FormLabel>
                <Field
                  as={Input}
                  name="boxCode"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUppercaseChange(e, handleChange)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Código de producto</FormLabel>
                <Field
                  as={Input}
                  name="productCode"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUppercaseChange(e, handleChange)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Nombre</FormLabel>
                <Field
                  as={Input}
                  name="name"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUppercaseChange(e, handleChange)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Piezas por caja</FormLabel>
                <Field
                  as={NumberInput}
                  name="piecesPerBox"
                >
                  <NumberInputField
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                  />
                </Field>
              </FormControl>

              <FormControl>
                <FormLabel>Costo</FormLabel>
                <Field
                  as={NumberInput}
                  name="cost"
                >
                  <NumberInputField
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                  />
                </Field>
              </FormControl>

              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                {['price1', 'price2', 'price3'].map((price, index) => (
                  <React.Fragment key={price}>
                    <GridItem>
                      <FormControl>
                        <FormLabel>Precio {index + 1}</FormLabel>
                        <Field
                          as={NumberInput}
                          name={price}
                        >
                          <NumberInputField
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                          />
                        </Field>
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <FormControl>
                        <FormLabel>Cantidad mínima para Precio {index + 1}</FormLabel>
                        <Field
                          as={NumberInput}
                          name={`${price}MinQty`}
                        >
                          <NumberInputField
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                          />
                        </Field>
                      </FormControl>
                    </GridItem>
                  </React.Fragment>
                ))}
              </Grid>

              <FormControl>
                <FormLabel>Categoría</FormLabel>
                <Field
                  as={Select}
                  name="category"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                >
                  <option value="SIN CATEGORÍA">SIN CATEGORÍA</option>
                  <option value="PAPELERÍA">PAPELERÍA</option>
                  <option value="BISUTERIA">BISUTERIA</option>
                  <option value="CERAMICA">CERAMICA</option>
                  <option value="NAVIDAD">NAVIDAD</option>
                </Field>
              </FormControl>

              {/* <FormControl>
                <FormLabel>Imagen del producto</FormLabel>
                <Flex direction="column" align="center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button as="span" leftIcon={<AddIcon />} colorScheme="blue">
                      Seleccionar imagen
                    </Button>
                  </label>
                  {imageFile && (
                    <Flex mt={2} align="center">
                      <Text fontSize="sm">{imageFile.name}</Text>
                      <IconButton
                        aria-label="Eliminar imagen"
                        icon={<CloseIcon />}
                        size="sm"
                        ml={2}
                        onClick={handleRemoveImage}
                      />
                    </Flex>
                  )}
                  {imagePreviewUrl && (
                    <Box mt={4} position="relative">
                      <Image
                        src={imagePreviewUrl}
                        alt="Vista previa del producto"
                        maxH="200px"
                        objectFit="contain"
                      />
                    </Box>
                  )}
                </Flex>
              </FormControl> */}

              <FormControl>
                <FormLabel>Disponibilidad</FormLabel>
                <Field
                  as={Checkbox}
                  name="availability"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  defaultChecked={true}
                >
                  Producto disponible
                </Field>
              </FormControl>

              <FormControl>
                <FormLabel>Stock por ubicación</FormLabel>
                <FieldArray name="stockLocations">
                  {({ push, remove }) => (
                    <VStack align="stretch">
                      {values.stockLocations.map((location: IStockLocation, index: number) => (
                        <HStack key={index}>
                          <Field
                            as={Input}
                            name={`stockLocations.${index}.location`}
                            placeholder="Ubicación"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUppercaseChange(e, handleChange)}
                            onKeyDown={handleKeyDown}
                          />
                          <Input
                            name={`stockLocations.${index}.quantity`}
                            placeholder="Cantidad"
                            value={location.quantity}
                            onChange={(e) => handleStockQuantityChange(e, index, setFieldValue)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                          />
                          {index > 0 && (
                            <IconButton
                              aria-label="Eliminar ubicación"
                              icon={<DeleteIcon />}
                              onClick={() => remove(index)}
                            />
                          )}
                        </HStack>
                      ))}
                      <Button
                        leftIcon={<AddIcon />}
                        onClick={() => push({ location: '', quantity: '' })}
                      >
                        Agregar ubicación
                      </Button>
                    </VStack>
                  )}
                </FieldArray>
              </FormControl>

              <Button
                mt={4}
                colorScheme="blue"
                isLoading={isSubmitting}
                type="submit"
              >
                Crear Producto
              </Button>
            </VStack>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default CreateProductForm;