import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import * as fs from 'fs';
import * as path from 'path';

// This is the data structure we will pass to the PDF generator
export interface PaymentReceiptData {
  folio: string; // e.g. "PAG-12345"
  date: string;
  type: string; // ANTICIPO, LIQUIDACION, etc.
  method: string;
  amount: number;
  reference: string;
  notes: string;
  clientName: string;
  locationName: string;
}

@Injectable()
export class PdfService {
  private readonly logoPath =
    'C:\\Users\\bjara\\Documents\\Universidad\\Estadias\\Sistema de Reservas\\sistema-reservas-frontend\\public\\brand\\cielito-logo.png';
  private readonly primaryColor = '#16a34a'; // A nice green
  private readonly textColor = '#333333';

  async generatePaymentReceipt(data: PaymentReceiptData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Background / Header accent
        doc.rect(0, 0, doc.page.width, 100).fill('white');

        // Logo
        if (fs.existsSync(this.logoPath)) {
          doc.image(this.logoPath, 50, 20, { height: 60 });
        } else {
          // Fallback if logo is missing
          doc.fillColor(this.primaryColor).fontSize(24).text('Cielito', 50, 40);
        }

        // Header Text
        doc
          .fillColor(this.primaryColor)
          .fontSize(28)
          .font('Helvetica-Bold')
          .text('RECIBO DE PAGO', 200, 40, { align: 'right' });

        doc.moveDown(4);

        // Folio and Date
        doc.fillColor(this.textColor).fontSize(12).font('Helvetica-Bold');
        doc.text(`Folio:`, 50, 130);
        doc.font('Helvetica').text(data.folio, 100, 130);

        doc.font('Helvetica-Bold').text(`Fecha:`, 400, 130);
        doc.font('Helvetica').text(data.date, 450, 130);

        // Separator line
        doc
          .moveTo(50, 160)
          .lineTo(doc.page.width - 50, 160)
          .strokeColor('#e5e7eb')
          .stroke();

        // Client and Location Info
        doc.moveDown(2);
        doc.font('Helvetica-Bold').fontSize(14).text('Información de la Reserva', 50, 180);
        doc.font('Helvetica').fontSize(12);
        doc.text(`Cliente: ${data.clientName}`, 50, 205);
        doc.text(`Ubicación: ${data.locationName}`, 50, 225);

        // Payment Info Block
        const startY = 270;
        doc
          .roundedRect(50, startY, doc.page.width - 100, 160, 5)
          .fillAndStroke('#f9fafb', '#e5e7eb');

        doc.fillColor(this.primaryColor).font('Helvetica-Bold').fontSize(14);
        doc.text('Detalles del Movimiento', 70, startY + 20);

        doc.fillColor(this.textColor).font('Helvetica').fontSize(12);
        
        doc.text('Monto Pagado:', 70, startY + 50);
        doc.font('Helvetica-Bold').text(`$${data.amount.toFixed(2)} MXN`, 200, startY + 50);
        doc.font('Helvetica');

        doc.text('Tipo de Pago:', 70, startY + 75);
        doc.text(data.type, 200, startY + 75);

        doc.text('Método de Pago:', 70, startY + 100);
        doc.text(data.method, 200, startY + 100);

        if (data.reference) {
          doc.text('Referencia:', 70, startY + 125);
          doc.text(data.reference, 200, startY + 125);
        }

        // Notes section
        if (data.notes) {
          doc.moveDown(3);
          doc.font('Helvetica-Bold').text('Notas adicionales:', 50, doc.y);
          doc.font('Helvetica').text(data.notes, 50, doc.y + 15, {
            width: doc.page.width - 100,
          });
        }

        // Footer
        const bottomY = doc.page.height - 100;
        doc
          .moveTo(50, bottomY)
          .lineTo(doc.page.width - 50, bottomY)
          .strokeColor('#e5e7eb')
          .stroke();

        doc
          .fillColor('#6b7280')
          .fontSize(10)
          .text(
            'Este documento es un comprobante de pago emitido por el Sistema de Reservas Cielito.',
            50,
            bottomY + 20,
            { align: 'center' }
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
