import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions, StyleDictionary } from 'pdfmake/interfaces';
import fetch from 'node-fetch';

interface ITransferItem {
    productId: string;
    productName: string;
    productCode: string;
    boxCode: string;
    fromLocation: string;
    toLocation: string;
    quantity: number;
}

pdfMake.vfs = pdfFonts.pdfMake.vfs;

async function getImageDataUrl(url: string): Promise<string> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = response.headers.get('content-type');
    return `data:${mimeType};base64,${base64}`;
}

export async function generateTransferPDF(transfers: ITransferItem[], evidenceImageUrl: string): Promise<string> {
  const tableBody = [
    ['Producto', 'Desde', 'Hacia', 'Cantidad']
  ];

  transfers.forEach(transfer => {
    tableBody.push([
      transfer.productName,
      transfer.fromLocation,
      transfer.toLocation,
      transfer.quantity.toString()
    ]);
  });

  const imageDataUrl = await getImageDataUrl(evidenceImageUrl);

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: 'Detalle de Transferencia', style: 'header' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', '*'],
          body: tableBody
        }
      },
      { text: 'Evidencia:', style: 'subheader' },
      {
        image: imageDataUrl,
        width: 500
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5]
      }
    } as StyleDictionary
  };

  const pdfDoc = pdfMake.createPdf(docDefinition);
  
  return new Promise((resolve, reject) => {
    pdfDoc.getBase64((data) => {
      resolve(`data:application/pdf;base64,${data}`);
    });
  });
}