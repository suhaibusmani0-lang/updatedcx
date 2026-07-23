import { Buffer } from "buffer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function sanitizeText(value) {
  return String(value ?? "")
    .replace(/₹/g, "Rs")
    .replace(/[\u0000-\u001F\u007F]/g, "");
}

function formatCurrency(value) {
  return `Rs${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export async function generateOrderPdf({ order, shippingAddress, billingAddress, totals }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const margin = 40;
  const lineHeight = 14;
  const contentWidth = 515;
  let y = 780;

  const drawText = (text, x = margin, size = 10, weight = font, color = rgb(0, 0, 0)) => {
    page.drawText(sanitizeText(text), { x, y, size, font: weight, color });
  };

  const drawSectionTitle = (title, x = margin) => {
    drawText(title, x, 13, boldFont);
    y -= 18;
  };

  const drawLine = (x1, y1, x2, y2, color = rgb(0.82, 0.82, 0.82)) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 1, color });
  };

  const drawLabelValue = (label, value, xLabel = margin, xValue = 200, size = 10) => {
    drawText(label, xLabel, size, boldFont);
    drawText(value, xValue, size, font);
    y -= lineHeight + 2;
  };

  const drawTableRow = (columns, rowHeight = 20, isHeader = false) => {
    const rowY = y;
    const fillColor = isHeader ? rgb(0.94, 0.95, 0.96) : rgb(1, 1, 1);
    page.drawRectangle({ x: margin, y: rowY - rowHeight + 4, width: contentWidth, height: rowHeight, color: fillColor, borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 0.7 });

    const colWidths = [260, 70, 70, 95];
    let currentX = margin + 8;
    columns.forEach((text, idx) => {
      const cellWidth = colWidths[idx] || 80;
      page.drawText(sanitizeText(text), {
        x: currentX,
        y: rowY - 12,
        size: isHeader ? 10 : 9,
        font: isHeader ? boldFont : font,
        color: rgb(0, 0, 0),
      });
      currentX += cellWidth;
    });

    y -= rowHeight;
  };

  page.drawRectangle({ x: 0, y: 0, width: 595.28, height: 841.89, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 0, y: 760, width: 595.28, height: 80, color: rgb(0.12, 0.16, 0.24) });
  drawText("Cosmopolitan Xccessories", 40, 20, boldFont, rgb(1, 1, 1));
  drawText("Shipping / Invoice", 40, 11, font, rgb(0.9, 0.93, 0.97));
  drawText(`Order ID: ${String(order._id).slice(-6)}`, 420, 11, font, rgb(0.9, 0.93, 0.97));
  drawText(`Date: ${new Date(order.createdAt).toLocaleString()}`, 420, 10, font, rgb(0.9, 0.93, 0.97));
  y = 720;

  drawSectionTitle("Billing & Shipping Details");
  drawLine(margin, y - 2, margin + 220, y - 2);
  y -= 6;

  drawLabelValue("Billing Name", billingAddress?.name || shippingAddress?.name || "Guest", margin, 180);
  drawLabelValue("Shipping Name", shippingAddress?.name || billingAddress?.name || "Guest", margin, 180);
  drawLabelValue("Address", billingAddress?.address || shippingAddress?.address || "N/A", margin, 180);
  drawLabelValue("City / State", `${billingAddress?.city || shippingAddress?.city || ""}, ${billingAddress?.state || shippingAddress?.state || ""}`.trim() || "N/A", margin, 180);
  drawLabelValue("Phone", billingAddress?.phone || shippingAddress?.phone || "N/A", margin, 180);
  y -= 4;

  drawSectionTitle("Order Items");
  drawTableRow(["Item", "Qty", "Price", "Line Total"], 22, true);
  (order.items || []).forEach((item) => {
    const unitPrice = Number(item.price || 0);
    const qty = Number(item.qty || 0);
    const lineTotal = unitPrice * qty;
    drawTableRow([
      sanitizeText(item.name || "Product"),
      String(qty),
      formatCurrency(unitPrice),
      formatCurrency(lineTotal),
    ], 20, false);
  });

  y -= 8;
  drawSectionTitle("Payment Summary");
  drawLabelValue("Subtotal", formatCurrency(totals.subtotal || 0), margin, 260, 10);
  drawLabelValue("Shipping", formatCurrency(totals.shipping || 0), margin, 260, 10);
  drawLabelValue("Discount", formatCurrency(totals.discount || 0), margin, 260, 10);
  drawLabelValue("Payment Discount", formatCurrency(totals.paymentDiscount || 0), margin, 260, 10);
  drawText("Total Amount", 300, 12, boldFont);
  drawText(formatCurrency(totals.totalAmount || 0), 430, 12, boldFont);
  y -= 12;

  drawLine(margin, y, margin + 300, y);
  drawText("Thank you for shopping with Cosmopolitan Xccessories", margin, 9, font);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
