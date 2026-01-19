import { resend, emailConfig, isEmailConfigured } from './index';
import { VerificationEmail } from './templates/verification-email';
import { PasswordResetEmail } from './templates/password-reset-email';
import { WelcomeEmail } from './templates/welcome-email';
import { OrderConfirmationEmail } from './templates/order-confirmation-email';
import { DeliveryNotificationEmail } from './templates/delivery-notification-email';
import { ContactConfirmationEmail } from './templates/contact-confirmation-email';
import { AdminReplyEmail } from './templates/admin-reply-email';
import { render } from '@react-email/components';

type Locale = 'sv' | 'en';

// Helper to render React email to HTML
async function renderEmail(component: React.ReactElement): Promise<string> {
  return await render(component);
}

// ============================================
// VERIFICATION EMAIL
// ============================================
export async function sendVerificationEmail({
  to,
  name,
  verificationUrl,
  locale = 'sv',
}: {
  to: string;
  name: string;
  verificationUrl: string;
  locale?: Locale;
}) {
  if (!isEmailConfigured() || !resend) {
    console.log('Email not configured, skipping verification email to:', to);
    return { success: false, error: 'Email not configured' };
  }

  try {
    const html = await renderEmail(
      VerificationEmail({ name, verificationUrl, locale })
    );

    const { data, error } = await resend.emails.send({
      from: emailConfig.from.noreply,
      to,
      subject: locale === 'sv' 
        ? 'Verifiera din e-postadress - Georgio Bandera' 
        : 'Verify your email address - Georgio Bandera',
      html,
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      return { success: false, error };
    }

    console.log('Verification email sent to:', to);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error };
  }
}

// ============================================
// PASSWORD RESET EMAIL
// ============================================
export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
  locale = 'sv',
}: {
  to: string;
  name: string;
  resetUrl: string;
  locale?: Locale;
}) {
  if (!isEmailConfigured() || !resend) {
    console.log('Email not configured, skipping password reset email to:', to);
    return { success: false, error: 'Email not configured' };
  }

  try {
    const html = await renderEmail(
      PasswordResetEmail({ name, resetUrl, locale })
    );

    const { data, error } = await resend.emails.send({
      from: emailConfig.from.noreply,
      to,
      subject: locale === 'sv' 
        ? 'Återställ ditt lösenord - Georgio Bandera' 
        : 'Reset your password - Georgio Bandera',
      html,
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      return { success: false, error };
    }

    console.log('Password reset email sent to:', to);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
}

// ============================================
// WELCOME EMAIL
// ============================================
export async function sendWelcomeEmail({
  to,
  name,
  locale = 'sv',
}: {
  to: string;
  name: string;
  locale?: Locale;
}) {
  if (!isEmailConfigured() || !resend) {
    console.log('Email not configured, skipping welcome email to:', to);
    return { success: false, error: 'Email not configured' };
  }

  try {
    const html = await renderEmail(
      WelcomeEmail({ name, locale })
    );

    const { data, error } = await resend.emails.send({
      from: emailConfig.from.info,
      replyTo: emailConfig.replyTo.info,
      to,
      subject: locale === 'sv' 
        ? 'Välkommen till Georgio Bandera!' 
        : 'Welcome to Georgio Bandera!',
      html,
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error };
    }

    console.log('Welcome email sent to:', to);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error };
  }
}

// ============================================
// ORDER CONFIRMATION EMAIL
// ============================================
interface OrderItem {
  name: string;
  variant?: string;
  quantity: number;
  price: number;
}

interface ShippingAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export async function sendOrderConfirmationEmail({
  to,
  name,
  orderNumber,
  orderDate,
  items,
  subtotal,
  shipping,
  total,
  shippingAddress,
  locale = 'sv',
}: {
  to: string;
  name: string;
  orderNumber: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: ShippingAddress;
  locale?: Locale;
}) {
  if (!isEmailConfigured() || !resend) {
    console.log('Email not configured, skipping order confirmation email to:', to);
    return { success: false, error: 'Email not configured' };
  }

  try {
    const html = await renderEmail(
      OrderConfirmationEmail({
        name,
        orderNumber,
        orderDate,
        items,
        subtotal,
        shipping,
        total,
        shippingAddress,
        locale,
      })
    );

    const { data, error } = await resend.emails.send({
      from: emailConfig.from.order,
      replyTo: emailConfig.replyTo.order,
      to,
      subject: locale === 'sv' 
        ? `Orderbekräftelse - Order ${orderNumber}` 
        : `Order Confirmation - Order ${orderNumber}`,
      html,
    });

    if (error) {
      console.error('Failed to send order confirmation email:', error);
      return { success: false, error };
    }

    console.log('Order confirmation email sent to:', to);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error };
  }
}

// ============================================
// DELIVERY NOTIFICATION EMAIL
// ============================================
export async function sendDeliveryNotificationEmail({
  to,
  name,
  orderNumber,
  trackingNumber,
  trackingUrl,
  carrier,
  estimatedDelivery,
  locale = 'sv',
}: {
  to: string;
  name: string;
  orderNumber: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  estimatedDelivery?: string;
  locale?: Locale;
}) {
  if (!isEmailConfigured() || !resend) {
    console.log('Email not configured, skipping delivery notification email to:', to);
    return { success: false, error: 'Email not configured' };
  }

  try {
    const html = await renderEmail(
      DeliveryNotificationEmail({
        name,
        orderNumber,
        trackingNumber,
        trackingUrl,
        carrier,
        estimatedDelivery,
        locale,
      })
    );

    const { data, error } = await resend.emails.send({
      from: emailConfig.from.order,
      replyTo: emailConfig.replyTo.order,
      to,
      subject: locale === 'sv' 
        ? `Din beställning ${orderNumber} är på väg!` 
        : `Your order ${orderNumber} is on its way!`,
      html,
    });

    if (error) {
      console.error('Failed to send delivery notification email:', error);
      return { success: false, error };
    }

    console.log('Delivery notification email sent to:', to);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending delivery notification email:', error);
    return { success: false, error };
  }
}

// ============================================
// CONTACT CONFIRMATION EMAIL
// ============================================
export async function sendContactConfirmationEmail({
  to,
  name,
  subject,
  message,
  locale = 'sv',
}: {
  to: string;
  name: string;
  subject?: string;
  message: string;
  locale?: Locale;
}) {
  if (!isEmailConfigured() || !resend) {
    console.log('Email not configured, skipping contact confirmation email to:', to);
    return { success: false, error: 'Email not configured' };
  }

  try {
    const html = await renderEmail(
      ContactConfirmationEmail({ name, subject, message, locale })
    );

    const { data, error } = await resend.emails.send({
      from: emailConfig.from.info,
      replyTo: emailConfig.replyTo.info,
      to,
      subject: locale === 'sv' 
        ? 'Vi har mottagit ditt meddelande - Georgio Bandera' 
        : 'We have received your message - Georgio Bandera',
      html,
    });

    if (error) {
      console.error('Failed to send contact confirmation email:', error);
      return { success: false, error };
    }

    console.log('Contact confirmation email sent to:', to);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending contact confirmation email:', error);
    return { success: false, error };
  }
}

// ============================================
// ADMIN REPLY EMAIL (to customer)
// ============================================
export async function sendAdminReplyEmail({
  to,
  customerName,
  originalSubject,
  originalMessage,
  replyMessage,
  adminName,
  locale = 'sv',
}: {
  to: string;
  customerName: string;
  originalSubject?: string;
  originalMessage: string;
  replyMessage: string;
  adminName?: string;
  locale?: Locale;
}) {
  if (!isEmailConfigured() || !resend) {
    console.log('Email not configured, skipping admin reply email to:', to);
    return { success: false, error: 'Email not configured' };
  }

  try {
    const html = await renderEmail(
      AdminReplyEmail({
        customerName,
        originalSubject,
        originalMessage,
        replyMessage,
        adminName,
        locale,
      })
    );

    const { data, error } = await resend.emails.send({
      from: emailConfig.from.info,
      replyTo: emailConfig.replyTo.info,
      to,
      subject: locale === 'sv' 
        ? `Svar på ditt meddelande${originalSubject ? `: ${originalSubject}` : ''} - Georgio Bandera`
        : `Reply to your message${originalSubject ? `: ${originalSubject}` : ''} - Georgio Bandera`,
      html,
    });

    if (error) {
      console.error('Failed to send admin reply email:', error);
      return { success: false, error };
    }

    console.log('Admin reply email sent to:', to);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending admin reply email:', error);
    return { success: false, error };
  }
}

// ============================================
// ADMIN NOTIFICATION EMAIL (new contact message)
// ============================================
export async function sendAdminNotificationEmail({
  customerName,
  customerEmail,
  subject,
  message,
}: {
  customerName: string;
  customerEmail: string;
  subject?: string;
  message: string;
}) {
  if (!isEmailConfigured() || !resend) {
    console.log('Email not configured, skipping admin notification email');
    return { success: false, error: 'Email not configured' };
  }

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'info@georgiobandera.se';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://georgiobandera1.pages.dev';

  try {
    const { data, error } = await resend.emails.send({
      from: emailConfig.from.noreply,
      to: adminEmail,
      subject: `Nytt kontaktmeddelande från ${customerName}`,
      html: `
        <h2>Nytt meddelande från kontaktformuläret</h2>
        <p><strong>Från:</strong> ${customerName} (${customerEmail})</p>
        ${subject ? `<p><strong>Ämne:</strong> ${subject}</p>` : ''}
        <p><strong>Meddelande:</strong></p>
        <p style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px;">${message}</p>
        <p><a href="${baseUrl}/admin/messages">Visa i admin-panelen</a></p>
      `,
    });

    if (error) {
      console.error('Failed to send admin notification email:', error);
      return { success: false, error };
    }

    console.log('Admin notification email sent');
    return { success: true, data };
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return { success: false, error };
  }
}

// ============================================
// ORDER NOTIFICATION EMAIL (to admin)
// ============================================
export async function sendOrderNotificationEmail({
  orderNumber,
  customerName,
  customerEmail,
  orderDate,
  items,
  subtotal,
  shipping,
  total,
  shippingAddress,
}: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  items: Array<{ name: string; variant?: string; quantity: number; price: number }>;
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}) {
  if (!isEmailConfigured() || !resend) {
    console.log('Email not configured, skipping order notification email');
    return { success: false, error: 'Email not configured' };
  }

  const orderEmail = process.env.ORDER_NOTIFICATION_EMAIL || 'order@georgiobandera.se';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://georgiobandera1.pages.dev';

  const formatPrice = (price: number) => {
    return `${price.toLocaleString('sv-SE')} SEK`;
  };

  try {
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}${item.variant ? ` (${item.variant})` : ''}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price)}</td>
      </tr>
    `).join('');

    const { data, error } = await resend.emails.send({
      from: emailConfig.from.order,
      to: orderEmail,
      subject: `Ny beställning - Order ${orderNumber}`,
      html: `
        <h2>Ny beställning mottagen</h2>
        <p><strong>Ordernummer:</strong> ${orderNumber}</p>
        <p><strong>Datum:</strong> ${orderDate}</p>
        
        <h3>Kundinformation</h3>
        <p><strong>Namn:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        
        <h3>Leveransadress</h3>
        <p>${shippingAddress.street}<br />
        ${shippingAddress.postalCode} ${shippingAddress.city}<br />
        ${shippingAddress.country}</p>
        
        <h3>Orderdetaljer</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Produkt</th>
              <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd;">Antal</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Pris</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <table style="width: 100%; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; text-align: right;"><strong>Delsumma:</strong></td>
            <td style="padding: 8px; text-align: right;">${formatPrice(subtotal)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; text-align: right;"><strong>Frakt:</strong></td>
            <td style="padding: 8px; text-align: right;">${formatPrice(shipping)}</td>
          </tr>
          <tr style="font-size: 18px; font-weight: bold;">
            <td style="padding: 8px; text-align: right;"><strong>Totalt:</strong></td>
            <td style="padding: 8px; text-align: right;">${formatPrice(total)}</td>
          </tr>
        </table>
        
        <p style="margin-top: 30px;"><a href="${baseUrl}/admin/orders/${orderNumber}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Visa order i admin-panelen</a></p>
      `,
    });

    if (error) {
      console.error('Failed to send order notification email:', error);
      return { success: false, error };
    }

    console.log('Order notification email sent to:', orderEmail);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending order notification email:', error);
    return { success: false, error };
  }
}

