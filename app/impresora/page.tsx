"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Cambiado de 'next/router' a 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/app/acciones/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/acciones/components/ui/select";
import { Button } from "@/app/acciones/components/ui/button";
import { toast } from 'react-hot-toast';
import ConectorPluginV3 from '@/app/utils/ConectorPluginV3';

interface PrinterConfig {
  printerName: string;
  paperSize: string;
}

const paperSizes = [
  { value: '58mm', label: '58mm (pequeño)' },
  { value: '80mm', label: '80mm (estándar)' },
  { value: 'A4', label: 'A4 (grande)' },
];

const PrinterConfigPage: React.FC = () => {
  const [printers, setPrinters] = useState<string[]>([]);
  const [config, setConfig] = useState<PrinterConfig>({
    printerName: '',
    paperSize: '80mm',
  });
  const router = useRouter();

  useEffect(() => {
    const fetchPrinters = async () => {
      try {
        const impresoras = await ConectorPluginV3.obtenerImpresoras();
        setPrinters(impresoras);
      } catch (error) {
        console.error('Error al obtener impresoras:', error);
        toast.error('Error al obtener la lista de impresoras');
      }
    };

    fetchPrinters();

    // Cargar la configuración guardada
    const savedConfig = localStorage.getItem('printerConfig');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const handleSaveConfig = () => {
    localStorage.setItem('printerConfig', JSON.stringify(config));
    toast.success('Configuración de impresora guardada');
    router.push('/ventas');
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Impresora</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Seleccionar Impresora</label>
              <Select 
                value={config.printerName} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, printerName: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una impresora" />
                </SelectTrigger>
                <SelectContent>
                  {printers.map((printer) => (
                    <SelectItem key={printer} value={printer}>
                      {printer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tamaño del Papel</label>
              <Select 
                value={config.paperSize} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, paperSize: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el tamaño del papel" />
                </SelectTrigger>
                <SelectContent>
                  {paperSizes.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveConfig} className="w-full">
              Guardar Configuración
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrinterConfigPage;