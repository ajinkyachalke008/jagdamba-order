import jsPDF from 'jspdf';

export const generateOrderNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `HJ-${year}-${random}`;
};

export const generateReceiptPDF = (orderData: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: string;
  paymentMethod: string;
  items: Array<{
    nameEn: string;
    nameMr: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  gst: number;
  total: number;
  createdAt: string;
}) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Hotel Jagdamba', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Order Receipt', 105, 28, { align: 'center' });
  
  // Order Details
  doc.setFontSize(12);
  doc.text(`Order #: ${orderData.orderNumber}`, 20, 45);
  doc.text(`Date: ${new Date(orderData.createdAt).toLocaleString()}`, 20, 52);
  doc.text(`Customer: ${orderData.customerName}`, 20, 59);
  doc.text(`Phone: ${orderData.customerPhone}`, 20, 66);
  doc.text(`Delivery: ${orderData.deliveryMethod === 'pickup' ? 'Pickup' : 'Home Delivery'}`, 20, 73);
  doc.text(`Payment: ${orderData.paymentMethod === 'cash' ? 'Cash' : 'Online'}`, 20, 80);
  
  // Items Header
  doc.setFont('helvetica', 'bold');
  doc.text('Item', 20, 95);
  doc.text('Qty', 120, 95);
  doc.text('Price', 145, 95);
  doc.text('Total', 170, 95);
  doc.line(20, 97, 190, 97);
  
  // Items
  doc.setFont('helvetica', 'normal');
  let yPos = 105;
  orderData.items.forEach((item) => {
    doc.text(item.nameEn, 20, yPos);
    doc.text(item.quantity.toString(), 120, yPos);
    doc.text(`₹${item.price}`, 145, yPos);
    doc.text(`₹${item.subtotal}`, 170, yPos);
    yPos += 7;
  });
  
  // Totals
  yPos += 5;
  doc.line(20, yPos, 190, yPos);
  yPos += 8;
  doc.text('Subtotal:', 120, yPos);
  doc.text(`₹${orderData.subtotal.toFixed(2)}`, 170, yPos);
  yPos += 7;
  doc.text('GST (5%):', 120, yPos);
  doc.text(`₹${orderData.gst.toFixed(2)}`, 170, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 120, yPos);
  doc.text(`₹${orderData.total.toFixed(2)}`, 170, yPos);
  
  // Footer
  yPos += 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for ordering with Hotel Jagdamba!', 105, yPos, { align: 'center' });
  doc.text('Your food will be ready soon.', 105, yPos + 7, { align: 'center' });
  
  return doc;
};