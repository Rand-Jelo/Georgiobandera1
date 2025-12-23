import { Resend } from 'resend';
import type { Order } from '@/types/database';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface OrderConfirmationEmailData {
  order: Order;
  items: Array<{
    productName: string;
    variantName?: string;
    quantity: number;
    price: number;
  }>;
  locale?: string;
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationEmailData) {
  try {
    // Only send if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend API key not configured, skipping email');
      return;
    }

    const storeEmail = process.env.EMAIL_FROM || 'noreply@georgiobandera.se';
    
    // Initialize Resend only if API key exists
    if (!resend) {
      console.log('Resend not initialized, skipping email');
      return;
    }
    const isSwedish = data.locale === 'sv';

    const subject = isSwedish
      ? `Orderbekräftelse - Order ${data.order.order_number}`
      : `Order Confirmation - Order ${data.order.order_number}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #171717; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 300;">GEORGIO BANDERA</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 30px; margin-top: 20px;">
            <h2 style="color: #171717; margin-top: 0;">
              ${isSwedish ? 'Tack för din beställning!' : 'Thank you for your order!'}
            </h2>
            
            <p style="color: #666;">
              ${isSwedish 
                ? `Din beställning ${data.order.order_number} har mottagits och behandlas nu.`
                : `Your order ${data.order.order_number} has been received and is being processed.`}
            </p>

            <div style="background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3 style="color: #171717; margin-top: 0;">
                ${isSwedish ? 'Beställningsdetaljer' : 'Order Details'}
              </h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                ${data.items.map(item => `
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0;">
                      <strong>${item.productName}</strong>
                      ${item.variantName ? `<br><span style="color: #666; font-size: 14px;">${item.variantName}</span>` : ''}
                      <br><span style="color: #666; font-size: 14px;">${isSwedish ? 'Antal' : 'Quantity'}: ${item.quantity}</span>
                    </td>
                    <td style="text-align: right; padding: 10px 0;">
                      ${(item.price * item.quantity).toFixed(2)} SEK
                    </td>
                  </tr>
                `).join('')}
              </table>

              <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #171717;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span>${isSwedish ? 'Delsumma' : 'Subtotal'}:</span>
                  <strong>${data.order.subtotal.toFixed(2)} SEK</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span>${isSwedish ? 'Frakt' : 'Shipping'}:</span>
                  <strong>${data.order.shipping_cost === 0 ? (isSwedish ? 'Gratis' : 'Free') : `${data.order.shipping_cost.toFixed(2)} SEK`}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                  <span>${isSwedish ? 'Totalt' : 'Total'}:</span>
                  <span>${data.order.total.toFixed(2)} SEK</span>
                </div>
              </div>
            </div>

            <div style="background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3 style="color: #171717; margin-top: 0;">
                ${isSwedish ? 'Leveransadress' : 'Shipping Address'}
              </h3>
              <p style="margin: 5px 0;">
                ${data.order.shipping_name}<br>
                ${data.order.shipping_address_line1}<br>
                ${data.order.shipping_address_line2 ? `${data.order.shipping_address_line2}<br>` : ''}
                ${data.order.shipping_postal_code} ${data.order.shipping_city}<br>
                ${data.order.shipping_country}
              </p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px;">
            <p>${isSwedish ? 'Vi skickar dig en uppdatering när din beställning skickas.' : "We'll send you an update when your order ships."}</p>
            <p style="margin-top: 20px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://georgiobandera1.pages.dev'}/orders/${data.order.order_number}" 
                 style="color: #171717; text-decoration: underline;">
                ${isSwedish ? 'Visa beställning' : 'View Order'}
              </a>
            </p>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: storeEmail,
      to: data.order.email,
      subject,
      html,
    });

    console.log(`Order confirmation email sent to ${data.order.email}`);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    // Don't throw - email failure shouldn't break order creation
  }
}

