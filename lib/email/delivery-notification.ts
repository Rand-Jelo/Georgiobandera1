import { Resend } from 'resend';
import type { Order } from '@/types/database';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface DeliveryNotificationData {
  order: Order;
  trackingNumber?: string;
  locale?: string;
}

export async function sendDeliveryNotificationEmail(data: DeliveryNotificationData) {
  try {
    // Only send if Resend API key is configured
    if (!process.env.RESEND_API_KEY || !resend) {
      console.log('Resend API key not configured, skipping email');
      return;
    }

    const storeEmail = process.env.EMAIL_FROM || 'noreply@georgiobandera.se';
    const isSwedish = data.locale === 'sv';

    const subject = isSwedish
      ? `Din beställning ${data.order.order_number} har skickats`
      : `Your order ${data.order.order_number} has shipped`;

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
              ${isSwedish ? 'Din beställning har skickats!' : 'Your order has shipped!'}
            </h2>
            
            <p style="color: #666;">
              ${isSwedish 
                ? `Vi är glada att meddela att din beställning ${data.order.order_number} har skickats.`
                : `We're excited to let you know that your order ${data.order.order_number} has shipped.`}
            </p>

            ${data.trackingNumber ? `
            <div style="background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #171717;">
              <h3 style="color: #171717; margin-top: 0;">
                ${isSwedish ? 'Spårningsnummer' : 'Tracking Number'}
              </h3>
              <p style="font-size: 18px; font-weight: bold; color: #171717; font-family: monospace; margin: 10px 0;">
                ${data.trackingNumber}
              </p>
              <a href="https://tracking.postnord.com/track/${data.trackingNumber}" 
                 style="display: inline-block; margin-top: 10px; padding: 10px 20px; background-color: #171717; color: white; text-decoration: none; border-radius: 6px;">
                ${isSwedish ? 'Spåra paket' : 'Track Package'}
              </a>
            </div>
            ` : ''}

            <div style="background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3 style="color: #171717; margin-top: 0;">
                ${isSwedish ? 'Leveransadress' : 'Delivery Address'}
              </h3>
              <p style="margin: 5px 0;">
                ${data.order.shipping_name}<br>
                ${data.order.shipping_address_line1}<br>
                ${data.order.shipping_address_line2 ? `${data.order.shipping_address_line2}<br>` : ''}
                ${data.order.shipping_postal_code} ${data.order.shipping_city}<br>
                ${data.order.shipping_country}
              </p>
            </div>

            <p style="color: #666; margin-top: 20px;">
              ${isSwedish 
                ? 'Du kommer att få ett meddelande när paketet har levererats.'
                : 'You will receive a notification when your package is delivered.'}
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px;">
            <p>
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

    console.log(`Delivery notification email sent to ${data.order.email}`);
  } catch (error) {
    console.error('Error sending delivery notification email:', error);
    // Don't throw - email failure shouldn't break order updates
  }
}

