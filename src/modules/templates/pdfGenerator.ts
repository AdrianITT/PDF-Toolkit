import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface ContractClause {
  title: string;
  content: string;
}

export interface ReportSection {
  heading: string;
  paragraph: string;
}

export const generateTemplatePdf = async (category: string, title: string, values: any) => {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]);
  
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const drawTextWrapped = (text: string, x: number, y: number, maxWidth: number, size: number, font: PDFFont, color = rgb(0,0,0)): number => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    
    for (const word of words) {
      const testLine = line + word + ' ';
      const width = font.widthOfTextAtSize(testLine, size);
      if (width > maxWidth && line !== '') {
        page.drawText(line.trim(), { x, y: currentY, size, font, color });
        line = word + ' ';
        currentY -= (size + 4);
        
        // Pagination logic if text reaches bottom
        if (currentY < 50) {
          page = pdfDoc.addPage([595.28, 841.89]);
          currentY = 841.89 - 50;
        }
      } else {
        line = testLine;
      }
    }
    if (line.trim() !== '') {
      page.drawText(line.trim(), { x, y: currentY, size, font, color });
      currentY -= (size + 4);
    }
    return currentY;
  };

  const drawHeader = (titleText: string) => {
    const { width, height } = page.getSize();
    page.drawText(titleText, {
      x: 50,
      y: height - 80,
      size: 24,
      font: helveticaBold,
      color: rgb(0, 0.33, 0.71),
    });
    
    page.drawLine({
      start: { x: 50, y: height - 100 },
      end: { x: width - 50, y: height - 100 },
      thickness: 2,
      color: rgb(0.8, 0.8, 0.8),
    });
    return height - 140;
  };

  let currentY = drawHeader(title);

  if (category === 'invoice') {
    page.drawText(`Cliente: ${values.clientName || ''}`, { x: 50, y: currentY, size: 12, font: helveticaBold });
    currentY -= 20;
    page.drawText(`Fecha: ${values.date ? values.date.format('YYYY-MM-DD') : ''}`, { x: 50, y: currentY, size: 12, font: helveticaFont });
    currentY -= 20;
    page.drawText(`Factura Nº: ${values.invoiceNumber || '0001'}`, { x: 50, y: currentY, size: 12, font: helveticaFont });
    currentY -= 40;

    // Table Header
    page.drawRectangle({ x: 50, y: currentY - 5, width: 495, height: 25, color: rgb(0.9, 0.9, 0.9) });
    page.drawText('Descripción', { x: 60, y: currentY, size: 12, font: helveticaBold });
    page.drawText('Cant.', { x: 320, y: currentY, size: 12, font: helveticaBold });
    page.drawText('Precio U.', { x: 380, y: currentY, size: 12, font: helveticaBold });
    page.drawText('Total', { x: 480, y: currentY, size: 12, font: helveticaBold });
    currentY -= 30;

    const items: InvoiceItem[] = values.items || [];
    let subtotal = 0;

    for (const item of items) {
      if (currentY < 100) {
        page = pdfDoc.addPage([595.28, 841.89]);
        currentY = 841.89 - 80;
      }
      
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const total = qty * price;
      subtotal += total;

      const descY = drawTextWrapped(item.description || '-', 60, currentY, 250, 10, helveticaFont);
      page.drawText(qty.toString(), { x: 320, y: currentY, size: 10, font: helveticaFont });
      page.drawText(`$${price.toFixed(2)}`, { x: 380, y: currentY, size: 10, font: helveticaFont });
      page.drawText(`$${total.toFixed(2)}`, { x: 480, y: currentY, size: 10, font: helveticaFont });
      
      currentY = descY - 10;
      page.drawLine({ start: { x: 50, y: currentY + 5 }, end: { x: 545, y: currentY + 5 }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
    }

    currentY -= 20;
    const taxRate = Number(values.taxRate) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const grandTotal = subtotal + taxAmount;

    page.drawText('Subtotal:', { x: 380, y: currentY, size: 12, font: helveticaBold });
    page.drawText(`$${subtotal.toFixed(2)}`, { x: 480, y: currentY, size: 12, font: helveticaFont });
    currentY -= 20;
    
    if (taxRate > 0) {
      page.drawText(`Impuesto (${taxRate}%):`, { x: 380, y: currentY, size: 12, font: helveticaBold });
      page.drawText(`$${taxAmount.toFixed(2)}`, { x: 480, y: currentY, size: 12, font: helveticaFont });
      currentY -= 20;
    }

    page.drawText('Total a Pagar:', { x: 380, y: currentY, size: 14, font: helveticaBold, color: rgb(0, 0.33, 0.71) });
    page.drawText(`$${grandTotal.toFixed(2)}`, { x: 480, y: currentY, size: 14, font: helveticaBold, color: rgb(0, 0.5, 0) });
  } 
  
  else if (category === 'contract') {
    const text = `Este CONTRATO DE SERVICIOS se celebra el ${values.effectiveDate ? values.effectiveDate.format('DD/MM/YYYY') : '___'} entre ${values.partyA || '[Parte A]'} (en adelante "El Emisor") y ${values.partyB || '[Parte B]'} (en adelante "El Receptor"). Las partes acuerdan sujetarse a las siguientes cláusulas:`;
    currentY = drawTextWrapped(text, 50, currentY, 495, 12, helveticaFont);
    currentY -= 30;

    const clauses: ContractClause[] = values.clauses || [];
    clauses.forEach((clause, idx) => {
      if (currentY < 150) {
        page = pdfDoc.addPage([595.28, 841.89]);
        currentY = 841.89 - 80;
      }
      
      page.drawText(`${idx + 1}. ${clause.title || 'Cláusula'}`, { x: 50, y: currentY, size: 12, font: helveticaBold });
      currentY -= 20;
      currentY = drawTextWrapped(clause.content || '', 50, currentY, 495, 11, helveticaFont);
      currentY -= 20;
    });

    // Signatures
    if (currentY < 150) {
      page = pdfDoc.addPage([595.28, 841.89]);
      currentY = 841.89 - 80;
    }
    
    currentY -= 60;
    page.drawLine({ start: { x: 70, y: currentY }, end: { x: 250, y: currentY }, thickness: 1 });
    page.drawLine({ start: { x: 350, y: currentY }, end: { x: 530, y: currentY }, thickness: 1 });
    currentY -= 20;
    page.drawText(values.partyA || 'Firma Parte A', { x: 70, y: currentY, size: 10, font: helveticaBold });
    page.drawText(values.partyB || 'Firma Parte B', { x: 350, y: currentY, size: 10, font: helveticaBold });
  }
  
  else if (category === 'report') {
    page.drawText(`Autor: ${values.author || 'Anónimo'}`, { x: 50, y: currentY, size: 12, font: helveticaBold });
    currentY -= 20;
    page.drawText(`Fecha: ${values.date ? values.date.format('DD/MM/YYYY') : ''}`, { x: 50, y: currentY, size: 12, font: helveticaFont });
    currentY -= 40;

    const sections: ReportSection[] = values.sections || [];
    sections.forEach(section => {
      if (currentY < 100) {
        page = pdfDoc.addPage([595.28, 841.89]);
        currentY = 841.89 - 80;
      }
      page.drawText(section.heading || 'Sección', { x: 50, y: currentY, size: 14, font: helveticaBold, color: rgb(0, 0.33, 0.71) });
      currentY -= 20;
      currentY = drawTextWrapped(section.paragraph || '', 50, currentY, 495, 11, helveticaFont);
      currentY -= 30;
    });
  }

  else if (category === 'letter') {
    currentY = drawTextWrapped(values.senderName || '', 50, currentY, 250, 11, helveticaBold);
    currentY = drawTextWrapped(values.senderAddress || '', 50, currentY, 250, 11, helveticaFont);
    currentY -= 30;

    page.drawText(values.date ? values.date.format('DD MMMM, YYYY') : '', { x: 350, y: currentY + 30, size: 11, font: helveticaFont });

    currentY = drawTextWrapped(values.recipientName || '', 50, currentY, 250, 11, helveticaBold);
    currentY = drawTextWrapped(values.recipientAddress || '', 50, currentY, 250, 11, helveticaFont);
    currentY -= 30;

    page.drawText(`Asunto: ${values.subject || ''}`, { x: 50, y: currentY, size: 12, font: helveticaBold });
    currentY -= 30;

    currentY = drawTextWrapped(values.body || '', 50, currentY, 495, 11, helveticaFont);
    currentY -= 50;

    if (currentY < 100) {
      page = pdfDoc.addPage([595.28, 841.89]);
      currentY = 841.89 - 80;
    }

    page.drawText('Atentamente,', { x: 50, y: currentY, size: 11, font: helveticaFont });
    currentY -= 40;
    page.drawText(values.signOff || values.senderName || '', { x: 50, y: currentY, size: 11, font: helveticaBold });
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};
