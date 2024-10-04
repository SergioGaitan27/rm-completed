"use client"

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UpdateResult {
  success: boolean;
  message: string;
}

async function updateAllProducts() {
  try {
    const response = await fetch('/api/updateAll', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('La respuesta de la red no fue ok');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al actualizar los productos:', error);
    throw error;
  }
}

const MassUpdatePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateResult | null>(null);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    router.push('/login');
    return null;
  }

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const result = await updateAllProducts();
      setUpdateResult({ success: true, message: result.message });
    } catch (error) {
      setUpdateResult({ success: false, message: 'Error al actualizar los productos.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const userCategories = [
    { name: 'Punto de venta', allowedRoles: ['vendedor'], icon: '💰' },
    { name: 'Créditos', allowedRoles: ['super_administrador', 'administrador'], icon: '💳' },
    { name: 'Catálogo', allowedRoles: ['super_administrador', 'administrador'], icon: '📚' },
    { name: 'Administración', allowedRoles: ['super_administrador', 'administrador'], icon: '⚙️' },
    { name: 'Dashboard', allowedRoles: ['super_administrador', 'administrador'], icon: '🗂️' },
  ].filter(category => category.allowedRoles.includes(session.user?.role as string));

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col justify-between">
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Actualización Masiva de Productos</h1>
        <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
          <p className="mb-4">Esta acción actualizará todos los productos con los siguientes valores:</p>
          <ul className="list-disc list-inside mb-4">
            <li>Ajustado: false</li>
          </ul>
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
            <p className="font-bold">Advertencia</p>
            <p>Esta acción agregará el campo 'ajustado' a todos los productos y lo establecerá en false.</p>
          </div>
          <button 
            onClick={handleUpdate} 
            disabled={isUpdating}
            className={`w-full p-2 rounded bg-blue-500 text-white hover:bg-blue-600 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isUpdating ? 'Actualizando...' : 'Actualizar Todos los Productos'}
          </button>
        </div>
        
        {updateResult && (
          <div className={`mt-4 p-4 rounded-lg ${updateResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            <h5 className="font-bold">{updateResult.success ? 'Éxito' : 'Error'}</h5>
            <p>{updateResult.message}</p>
          </div>
        )}
      </div>
      <div className="bg-gray-200 p-4">
        <nav>
          <ul className="flex justify-around">
            {userCategories.map((category, index) => (
              <li key={index} className="text-center">
                <a href="#" className="flex flex-col items-center">
                  <span className="text-2xl">{category.icon}</span>
                  <span className="mt-1 text-xs">{category.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default MassUpdatePage;