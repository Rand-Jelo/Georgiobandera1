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
        <p><a href="https://georgiobandera.se/admin/messages">Visa i admin-panelen</a></p>
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

