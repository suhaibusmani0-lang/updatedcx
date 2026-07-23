export function calculatePaymentSummary({ subtotal, shipping = 0, discount = 0, paymentMethod = "Razorpay", razorpayDiscountPercent = 10 }) {
  const normalizedPaymentMethod = paymentMethod === "COD" ? "COD" : "Razorpay";
  const paymentDiscount = normalizedPaymentMethod === "Razorpay"
    ? Math.round(subtotal * (razorpayDiscountPercent / 100))
    : 0;
  const totalAmount = Math.max(0, subtotal + shipping - discount - paymentDiscount);

  return {
    paymentMethod: normalizedPaymentMethod,
    paymentDiscount,
    totalAmount,
    finalDiscount: discount + paymentDiscount,
  };
}
