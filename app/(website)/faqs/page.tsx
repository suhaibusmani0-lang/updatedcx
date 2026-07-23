import React from 'react';

export default function FAQ() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-gray-800 font-sans">
      <h1 className="text-3xl font-bold mb-10 text-black">Frequently Asked Questions</h1>

      <div className="space-y-12 leading-relaxed">
        
        {/* Payments Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-black border-b pb-2">Payments</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">1. How do I pay for my order?</h3>
              <p className="text-gray-700">We have a number of payment methods. Choose the one that is most convenient for you. The options are: Online Bank Transfer through your Credit, Debit, or Cash Card, and Cash on Delivery (COD).</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">2. Do you offer a Cash On Delivery (COD) payment option? How does it work?</h3>
              <p className="text-gray-700">Yes, we support the COD payment method. You can make the payment in cash to the delivery agent once the product reaches you.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">3. What should I do if my payment doesn't get through or fails?</h3>
              <p className="text-gray-700">If your payment transaction fails, please contact our Customer Service immediately on 8595124718 or email us at support@cosmoxs.com.</p>
            </div>
          </div>
        </section>

        {/* Shipping and Delivery Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-black border-b pb-2">Shipping and Delivery</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">1. Do I have to pay shipping charges?</h3>
              <p className="text-gray-700">No, you don't have to pay any shipping charges as the shipping will be free for all the products on cosmoxs.com.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">2. By when will I receive the ordered products?</h3>
              <p className="text-gray-700">Delivery will be done within 6-7 working days.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">3. How do I know whether the product can be delivered to my area? Can I opt for Cash On Delivery (COD) payment in my area?</h3>
              <p className="text-gray-700">Cosmopolitan Xccessories is trying its best to ship its products as far and wide as possible. However, there are still a few areas where we are unable to ship. While placing an order, you will receive an intimation of the same. Similarly, you will also be informed on whether or not the Cash On Delivery (COD) payment option is available in your respective area.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">4. A few months ago, I had ordered from Cosmopolitan Xccessories and the order was delivered successfully. However, this time, I am unable to place an order as my Pincode is not being recognised. Why so?</h3>
              <p className="text-gray-700">There were a few areas and Pincodes that were serviced by Cosmopolitan Xccessories earlier; however, they are unserviceable now due to courier issues. If you are trying to place an order using one of these Pincodes, we won't be able to take your order. We regret the inconvenience. To place your order successfully, we request you to provide a different/alternate address with a serviceable Pincode. Please get in touch with our Customer Service on 8595124718 to know which Pincodes are serviceable.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">5. What is the mode of delivery at Cosmopolitan Xccessories?</h3>
              <p className="text-gray-700">We have partnered with few best courier services for the shipment of products across India. Depending upon your location and reach, we also make use of several other trustworthy domestic service providers to deliver products.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">6. Why have I received only a part of my order?</h3>
              <p className="text-gray-700">As mentioned in our Product details page, each product has its own delivery duration. Please note that, if you have ordered multiple items, the entire order may not be delivered together and you would be receiving partial shipments, as each product may be delivered as per the individual delivery timeline. However, we try and send maximum products from your order in one shipment.</p>
            </div>
          </div>
        </section>

        {/* Order Tracking Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-black border-b pb-2">Order Tracking</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">1. How do I know if my order has been placed successfully?</h3>
              <p className="text-gray-700">Within a few minutes of successfully placing your order, you will receive an email confirmation from Cosmopolitan Xccessories. This email will include all the important details related to your order. Please do not delete this email, as it, more or less, acts as an order receipt.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">2. How do I check the status of my order?</h3>
              <p className="text-gray-700 mb-2">Simply follow the below-mentioned steps:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Click on 'Login / Sign Up' on the top left of the page and log in to your account.</li>
                <li>Go to 'Cosmopolitan Xccessories' on the top right of the website.</li>
                <li>Click on the 'Orders' tab.</li>
                <li>Go to the relevant Order No. and click on it to check its status.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Cancellation / Modification Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-black border-b pb-2">Cancellation / Modification</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">1. Can I cancel an order?</h3>
              <p className="text-gray-700">Though the Cosmopolitan Xccessories website itself does not have an option to cancel an order once the payment is made, you can definitely get in touch with our Customer Service on 8595124718 at the earliest (within 24 hours of placing the order) with your Order No. to cancel it. If your order has not been processed, we can cancel the same.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">2. Can I modify or change my order?</h3>
              <p className="text-gray-700">Our helpful and friendly Customer Service Executives are always at your service in case you want to modify your order; simply call 8595124718. They will also be happy to help you if you want to update your shipping address. Remember to be as quick as possible and contact our Customer Service at the earliest for anything like this.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">3. Can I mix and match items from different sets and collections? In other words, can you personalise a set?</h3>
              <p className="text-gray-700">Sorry, that's not possible. We cannot personalise things. The exact set, as shown on the Cosmopolitan Xccessories website, will be delivered to you.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">4. How do I contact ‘Cosmopolitan Xccessories' Customer Service Team?</h3>
              <p className="text-gray-700">You can get in touch with our Customer Service by sending us an email to support@cosmoxs.com or can call us on 8595124718 between 9.30 a.m. and 6 p.m.</p>
            </div>
          </div>
        </section>

        {/* Return Policy Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-black border-b pb-2">Return Policy</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">1. What is the Friendly Returns policy of Cosmopolitan Xccessories?</h3>
              <div className="text-gray-700 space-y-3">
                <p>At Cosmopolitan Xccessories, we understand how much you value your every purchase and for us, good customer experience is utmost important. Hence, to fulfil our word, we are committed to making your shopping experience with us as delightful as possible.</p>
                <p>Even after this if you are not fully satisfied with your purchase, don’t worry as we have an excellent Return policy. The process is pretty simple. All you need to do is raise a return request, within a period of “15 days”, from the date of delivery (48 hours for damaged and defective) following the below steps:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>You can raise a refund request by simply calling or customer care number 8595124718.</li>
                  <li>You can also raise a refund by emailing us on our support email id support@cosmoxs.com.</li>
                </ul>
                <p>While you choose any of the above options, we will ensure that you get a resolution at the earliest.</p>
                <p>At Cosmopolitan Xccessories, we assure you that all products are checked properly before shipping them but even then, the product you receive is “Damaged, Defective”, our friendly returns policy will solve your problem.</p>
                <div className="bg-gray-50 p-4 border-l-4 border-gray-400">
                  <p><strong>Note:</strong> For damaged and defective products, please share the product images along with the packaging images on support@cosmxs.com and our support team will get back to you for your refund processing.</p>
                </div>
                <p><strong>The possible solutions covered in the returns policy are:</strong></p>
                <p><strong>Refund:</strong> We have a facility of refund if in case the product delivered is (Damaged, Defective). Refund is not available for dislike in a customised product like wallpapers.</p>
                <div className="bg-gray-50 p-4 border-l-4 border-gray-400">
                  <p><strong>Note:</strong> If the order value becomes zero on usage of any gift vouchers or discount coupon codes, for such instances, there will be no refund provided and in return we will reinstate the “Gift Voucher” or “Discount Coupon Code” with the respective amount, which you can use to redeem any other product of your choice from the Cosmopolitan Xccessories website.</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-black mb-2">2. How do I return an item purchased on Cosmopolitan Xccessories?</h3>
              <div className="text-gray-700 space-y-3">
                <p>Now with our easy returns policy, returning a product is very convenient. If you have received a product which is “Damaged, Defective, or Not as described” and you wish to return the product, you have 15 days to raise a return request by just following the below-mentioned procedures:</p>
                <div className="bg-gray-50 p-4 border-l-4 border-gray-400">
                  <p><strong>Note:</strong> For damaged and defective products, please share the product images along with the packaging images on support@cosmoxss.com and our support team will get back to you for your refund processing.</p>
                </div>
                <ul className="list-decimal pl-6 space-y-1">
                  <li>Raise a return request by calling our customer number at 02248931878 or by sending us the return request mail on our customer support email id support@cosmoxs.com.</li>
                  <li>Once we have received your request, one of our Customer Service Executive will get in touch with you to further understand the issue and will process the request for refund.</li>
                </ul>
                <p>Ideally, we do a reverse pickup of the product which is “Damaged, Defective, or Not as described (Customer not liking)” from the customer’s place in an unused/undamaged condition with all tags, bills and original packaging intact. We provide a "Refund" of the product amount paid while purchasing.</p>
                <div className="bg-gray-50 p-4 border-l-4 border-gray-400">
                  <p><strong>Note:</strong> If the order value becomes zero on usage of any gift vouchers or discount coupon codes, for such instances, there will be no refund provided and in return we will reinstate the “Gift Voucher” or “Discount Coupon Code” with the respective amount, which you can use to redeem any other product of your choice from the Cosmopolitan Xccessories website.</p>
                </div>
                <p><strong>Exceptions:</strong> Although we will try our level best to assure you a hassle-free return, there are certain exceptions where it will be difficult to support returns as mentioned below:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>If the return request is made after the specified time frame (15 days from the date of delivery for dislike and 48 hours for damaged and defective).</li>
                  <li>Anything missing from the package like the price tag, accessories, labels, original packing, etc.</li>
                  <li>Product is damaged due to misuse, physical damage or any other damage done by human error, etc.</li>
                  <li>Any customer had requested and placed an order for a Customized product than a refund will be done only if the product is received in a Damaged or Defective condition. There will be no refund for customer dislike. Examples like – Wallart, Wallpaper, etc.</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-black mb-2">3. When are returns not possible?</h3>
              <div className="text-gray-700 space-y-3">
                <p>At Cosmopolitan Xccessories, we try our level best to give you the best customer service experience but even though there are certain scenarios where it will be difficult to support returns. The scenarios are as below:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>If the return request is made after the specified time frame (15 days from the date of delivery for dislike and 48 hours for damaged and defective).</li>
                  <li>Anything missing from the package like the price tag, accessories, labels, original packing, etc.</li>
                  <li>Product is damaged due to misuse, physical damage done by human error, etc.</li>
                  <li>Any customer had requested and placed an order for a Customized product than a refund will be done only if the product is received in a Damaged or Defective condition. There will be no refund for customer dislike. Examples like – Wallart, Wallpaper, etc.</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-black mb-2">4. Is there a refund facility available?</h3>
              <p className="text-gray-700">Ideally, we would not like our valuable customers to leave unhappy or unsatisfied but even if after all our efforts, a customer is willing to have a refund for his/her order; we do have a facility of refund as per the refund policy.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-black mb-2">5. How will I receive my refund / what is the refund policy at Cosmopolitan Xccessories?</h3>
              <div className="text-gray-700 space-y-3">
                <p>Ideally, we would not like our valuable customers to leave unhappy or unsatisfied but even if after all our efforts, a customer is willing to have a refund for his/her order; we do have a facility of refund as per the refund policy described as below:</p>
                <p>We provide a refund to the customer in case the product delivered is “Damaged, Defective, Dislike”. Customized Products like Wallpaper, etc. will not be covered under refund policy in case of customer dislike. Such products will not be applicable Refund in case of customer dislike.</p>
                <p>For damaged and defective products, please share the product images along with the packaging images on support@cosmoxs.com and our support team will get back to you for your refund processing.</p>
                <p>Once we get a refund request from your end, we process your refund as per the mode of payment you selected while placing your order which is described below:</p>
                
                <h4 className="font-semibold text-black mt-4">Prepaid Order (Credit Card/Debit Card/Net Banking)</h4>
                <p>In this, the order amount will be remitted back to your card or net-banking account. The process for initiating this takes 3-4 business days however it may take approximately 5-7 business days to get the amount reflect in your card / net-banking account.</p>
                
                <h4 className="font-semibold text-black mt-4">Cash On Delivery Order</h4>
                <p>If you have placed an order using cash on delivery mode and had requested a refund: We take your bank account details along with a copy of the cancelled cheque and we do a bank transfer. In this, the money will get credited in your account within 5-7 working days.</p>
                
                <div className="bg-gray-50 p-4 border-l-4 border-gray-400 mt-4">
                  <p><strong>Important Note:</strong> If the order value becomes zero on usage of any gift vouchers or discount coupon codes, for such instances, there will be no refund provided and in return we will reinstate the “Gift Voucher” or “Discount Coupon Code” with the respective amount, which you can use to redeem any other product of your choice from the Cosmopolitan Xccessories website.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}