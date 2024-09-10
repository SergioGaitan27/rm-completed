// app/productos/modificar/[id]/ProductForm.tsx
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
  Grid,
  GridItem,
  Text,
  useToast,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, ArrowBackIcon, CloseIcon } from '@chakra-ui/icons';
import { IProduct } from '@/app/lib/models/Producto';
import { IStockLocation } from '@/app/types/product';

interface ProductFormProps {
  product: IProduct;
  onSubmit: (values: IProduct) => void;
  onBack: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSubmit, onBack }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(product.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

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
        initialValues={product}
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
          onSubmit(values);
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
                  value={values.boxCode}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Código de producto</FormLabel>
                <Field
                  as={Input}
                  name="productCode"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUppercaseChange(e, handleChange)}
                  onBlur={handleBlur}
                  value={values.productCode}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Nombre</FormLabel>
                <Field
                  as={Input}
                  name="name"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUppercaseChange(e, handleChange)}
                  onBlur={handleBlur}
                  value={values.name}
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
                    value={values.piecesPerBox}
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
                    value={values.cost}
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
                            value={values[price as keyof IProduct]}
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
                            value={values[`${price}MinQty` as keyof IProduct]}
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
                  value={values.category}
                >
                  <option value="SIN CATEGORÍA">SIN CATEGORÍA</option>
                  <option value="PAPELERÍA">PAPELERÍA</option>
                  <option value="NAVIDAD">NAVIDAD</option>
                </Field>
              </FormControl>

              <FormControl>
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
                      {imagePreviewUrl ? "Cambiar imagen" : "Seleccionar imagen"}
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
              </FormControl>

              <FormControl>
                <FormLabel>Disponibilidad</FormLabel>
                <Field
                  as={Checkbox}
                  name="availability"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isChecked={values.availability}
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
                          />
                          <Field
                            as={NumberInput}
                            name={`stockLocations.${index}.quantity`}
                            min={0}
                          >
                            <NumberInputField placeholder="Cantidad" />
                          </Field>
                          <IconButton
                            aria-label="Eliminar ubicación"
                            icon={<DeleteIcon />}
                            onClick={() => remove(index)}
                          />
                        </HStack>
                      ))}
                      <Button
                        leftIcon={<AddIcon />}
                        onClick={() => push({ location: '', quantity: 0 })}
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
                Guardar cambios
              </Button>
            </VStack>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default ProductForm;