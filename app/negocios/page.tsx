"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/acciones/components/ui/card";
import { Input } from "@/app/acciones/components/ui/input";
import { Button } from "@/app/acciones/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/acciones/components/ui/select";
import { toast } from 'react-hot-toast';

interface BusinessInfo {
  location: string;
  businessName: string;
  address: string;
  phone: string;
  taxId: string;
}

const BusinessInfoPage: React.FC = () => {
  const [businesses, setBusinesses] = useState<BusinessInfo[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessInfo | null>(null);
  const [newBusiness, setNewBusiness] = useState<BusinessInfo>({
    location: '',
    businessName: '',
    address: '',
    phone: '',
    taxId: ''
  });
  const router = useRouter();

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/business');
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data);
      } else {
        toast.error('Error al obtener la información de los negocios');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al conectar con el servidor');
    }
  };

  const handleSelectBusiness = (location: string) => {
    const business = businesses.find(b => b.location === location);
    setSelectedBusiness(business || null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewBusiness({
      ...newBusiness,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBusiness),
      });

      if (response.ok) {
        toast.success('Nuevo negocio añadido');
        fetchBusinesses();
        setNewBusiness({
          location: '',
          businessName: '',
          address: '',
          phone: '',
          taxId: ''
        });
      } else {
        toast.error('Error al guardar la información del negocio');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al conectar con el servidor');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Crear Nuevo Negocio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              name="businessName"
              value={newBusiness.businessName}
              onChange={handleInputChange}
              placeholder="Nombre del Negocio"
            />
            <Input
              name="location"
              value={newBusiness.location}
              onChange={handleInputChange}
              placeholder="Ubicación"
            />
            <Input
              name="address"
              value={newBusiness.address}
              onChange={handleInputChange}
              placeholder="Dirección"
            />
            <Input
              name="phone"
              value={newBusiness.phone}
              onChange={handleInputChange}
              placeholder="Teléfono"
            />
            <Input
              name="taxId"
              value={newBusiness.taxId}
              onChange={handleInputChange}
              placeholder="RFC"
            />
            <Button onClick={handleSave} className="w-full">Crear Negocio</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consultar Negocios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select 
              value={selectedBusiness?.location || ''} 
              onValueChange={handleSelectBusiness}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un negocio" />
              </SelectTrigger>
              <SelectContent>
                {businesses.map((business) => (
                  <SelectItem key={business.location} value={business.location}>
                    {business.businessName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBusiness && (
              <div className="space-y-2">
                <p><strong>Nombre:</strong> {selectedBusiness.businessName}</p>
                <p><strong>Ubicación:</strong> {selectedBusiness.location}</p>
                <p><strong>Dirección:</strong> {selectedBusiness.address}</p>
                <p><strong>Teléfono:</strong> {selectedBusiness.phone}</p>
                <p><strong>RFC:</strong> {selectedBusiness.taxId}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Button onClick={() => router.push('/ventas')} variant="outline" className="w-full mt-4">
        Volver a Ventas
      </Button>
    </div>
  );
};

export default BusinessInfoPage;