import { Buffer } from "buffer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function sanitize(value) {
  return String(value ?? "")
    .replace(/₹/g, "Rs. ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    // Strip characters outside WinAnsi to avoid pdf-lib encoding errors
    .replace(/[^\x20-\x7E]/g, "");
}

function money(value) {
  const n = Number(value || 0);
  return `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

async function fetchImage(pdfDoc, url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const bytes = await res.arrayBuffer();
    return await pdfDoc.embedPng(bytes);
  } catch {
    return null;
  }
}

export async function generateOrderInvoicePdf(order) {
  const pdfDoc = await PDFDocument.create();
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  let page = pdfDoc.addPage([pageWidth, pageHeight]);

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const brandDark = rgb(26 / 255, 26 / 255, 26 / 255);
  const brandBlue = rgb(20 / 255, 45 / 255, 75 / 255);
  const brandGold = rgb(139 / 255, 111 / 255, 82 / 255);
  const lightBg = rgb(248 / 255, 243 / 255, 234 / 255);
  const border = rgb(227 / 255, 217 / 255, 201 / 255);
  const green = rgb(34 / 255, 139 / 255, 34 / 255);
  const white = rgb(1, 1, 1);

  const draw = (text, x, y, size = 10, isBold = false, color = brandDark) => {
    page.drawText(sanitize(text), { x, y, size, font: isBold ? bold : regular, color });
  };

  const ensureSpace = (needed, marginBottom = 90) => {
    if (y - needed < marginBottom) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 60;
    }
  };

  const barcodeUrl = `https://quickchart.io/barcode?type=code128&text=${order._id}&height=40&margin=0`;
  const trackingUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://cosmoxs.com"}/track-order?orderId=${order._id}`;
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(trackingUrl)}&size=100`;

  const [barcodeImage, qrImage] = await Promise.all([
    fetchImage(pdfDoc, barcodeUrl),
    fetchImage(pdfDoc, qrUrl),
  ]);

  let y = pageHeight - 60;

  // Header - Brand name centered with letter spacing
  const brandText = "COSMOPOLITAN XCESSORIES";
  const brandSize = 20;
  const letterSpacing = 3.5;
  let brandWidth = 0;
  for (const ch of brandText) {
    brandWidth += bold.widthOfTextAtSize(ch, brandSize) + letterSpacing;
  }
  brandWidth -= letterSpacing;
  let x = (pageWidth - brandWidth) / 2;
  for (const ch of brandText) {
    page.drawText(ch, { x, y, size: brandSize, font: bold, color: brandBlue });
    x += bold.widthOfTextAtSize(ch, brandSize) + letterSpacing;
  }

  y -= 24;
  const invoiceTitle = "INVOICE";
  const titleWidth = bold.widthOfTextAtSize(invoiceTitle, 11);
  draw(invoiceTitle, (pageWidth - titleWidth) / 2, y, 11, true, brandGold);

  y -= 22;
  page.drawLine({ start: { x: 50, y }, end: { x: pageWidth - 50, y }, thickness: 1, color: border });
  y -= 30;

  // Order info block
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const invoiceNo = `INV-${orderDate.getFullYear()}-${String(order._id).slice(-5).toUpperCase()}`;

  draw("Invoice No:", 50, y, 10, true);
  draw(invoiceNo, 130, y, 10);
  if (barcodeImage) {
    page.drawImage(barcodeImage, { x: 395, y: y - 25, width: 140, height: 35 });
  }
  y -= 16;

  draw("Order ID:", 50, y, 10, true);
  draw(`#${String(order._id).slice(-6).toUpperCase()}`, 130, y, 10);
  y -= 16;

  draw("Date:", 50, y, 10, true);
  draw(orderDate.toLocaleDateString("en-IN"), 130, y, 10);
  y -= 16;

  draw("Payment:", 50, y, 10, true);
  draw(order.paymentMethod || "N/A", 130, y, 10);
  y -= 16;

  draw("Status:", 50, y, 10, true);
  draw(order.status || "N/A", 130, y, 10);
  y -= 28;

  // Address blocks
  const boxHeight = 100;
  page.drawRectangle({ x: 50, y: y - boxHeight, width: 235, height: boxHeight, color: lightBg, borderColor: border, borderWidth: 1 });
  page.drawRectangle({ x: 310, y: y - boxHeight, width: 235, height: boxHeight, color: lightBg, borderColor: border, borderWidth: 1 });

  const drawAddress = (title, addr, startX) => {
    let ay = y - 18;
    draw(title, startX + 10, ay, 10, true, brandGold);
    ay -= 16;
    draw(addr?.name || "N/A", startX + 10, ay, 10, true);
    ay -= 14;
    const line1 = (addr?.address || "").substring(0, 40);
    draw(line1 || "N/A", startX + 10, ay, 9);
    ay -= 14;
    draw(`${addr?.city || ""}, ${addr?.state || ""} - ${addr?.pincode || ""}`, startX + 10, ay, 9);
    ay -= 14;
    draw(`Phone: ${addr?.phone || "N/A"}`, startX + 10, ay, 9);
  };
  drawAddress("BILLING TO", order.billingAddress, 50);
  drawAddress("SHIPPING TO", order.shippingAddress, 310);

  y -= boxHeight + 20;

  // Item table header
  page.drawRectangle({ x: 50, y: y - 8, width: pageWidth - 100, height: 25, color: brandDark });
  draw("ITEM DESCRIPTION", 60, y, 10, true, white);
  draw("QTY", 370, y, 10, true, white);
  draw("PRICE", 420, y, 10, true, white);
  draw("TOTAL", 495, y, 10, true, white);
  y -= 28;

  // Item rows
  let subtotal = 0;
  (order.items || []).forEach((item, index) => {
    ensureSpace(28);
    const qty = Number(item.qty || 1);
    const price = Number(item.price || 0);
    const line = qty * price;
    subtotal += line;

    let name = item.name || "Product";
    if (name.length > 42) name = name.substring(0, 39) + "...";
    if (order.hasGiftWrap) name = `${name} [Gift Wrapped]`;

    draw(`${index + 1}. ${name}`, 60, y, 10);
    draw(String(qty), 375, y, 10);
    draw(money(price), 420, y, 10);
    draw(money(line), 495, y, 10);

    y -= 16;
    page.drawLine({ start: { x: 50, y: y + 3 }, end: { x: pageWidth - 50, y: y + 3 }, thickness: 0.5, color: border });
    y -= 8;
  });

  // Totals
  ensureSpace(160);
  y -= 12;
  const labelX = 350;
  const valueX = 490;

  const shippingCost = Number(order.shippingCost || 0);
  const isCod = String(order.paymentMethod).toUpperCase() === "COD";

  draw("Subtotal:", labelX, y, 10, true);
  draw(money(subtotal), valueX, y, 10);
  y -= 18;

  draw("Shipping:", labelX, y, 10, true);
  if (shippingCost === 0) {
    const shippedText = "Rs. 99";
    draw(shippedText, valueX, y, 10);
    const strikeWidth = regular.widthOfTextAtSize(shippedText, 10);
    page.drawLine({ start: { x: valueX, y: y + 3 }, end: { x: valueX + strikeWidth, y: y + 3 }, thickness: 1, color: brandDark });
    draw("FREE", valueX + strikeWidth + 8, y, 10, true, green);
  } else {
    draw(money(shippingCost), valueX, y, 10);
  }
  y -= 18;

  if (order.hasGiftWrap) {
    draw("Gift Wrap:", labelX, y, 10, true);
    draw(money(99), valueX, y, 10);
    y -= 18;
  }

  if (isCod) {
    draw("COD Fee:", labelX, y, 10, true);
    draw(money(59), valueX, y, 10);
    y -= 18;
  }

  // Grand total box - properly spaced
  y -= 6;
  page.drawRectangle({
    x: labelX - 15,
    y: y - 18,
    width: pageWidth - labelX - 35 + 15,
    height: 34,
    color: brandDark,
    borderColor: brandGold,
    borderWidth: 1,
  });
  draw("GRAND TOTAL", labelX - 5, y - 6, 12, true, white);
  const totalText = money(order.totalAmount || 0);
  const totalWidth = bold.widthOfTextAtSize(totalText, 14);
  draw(totalText, pageWidth - 60 - totalWidth, y - 8, 14, true, brandGold);
  y -= 40;

  // Footer with QR
  if (qrImage) {
    page.drawImage(qrImage, { x: 50, y: 40, width: 55, height: 55 });
    draw("Scan QR to track", 115, 75, 10, true, brandGold);
    draw("your live order status.", 115, 60, 9, false, brandDark);
  }
  draw("Thank you for shopping with Cosmopolitan Xccessories!", 250, 55, 10, true, brandGold);
  draw("For queries, contact our support.", 250, 40, 9, false, brandDark);

  const bytes = await pdfDoc.save();
  return { pdfBuffer: Buffer.from(bytes), invoiceNo };
}
