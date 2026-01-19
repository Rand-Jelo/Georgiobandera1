import { Resend } from 'resend';

// Initialize Resend client
export const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

// Email configuration
export const emailConfig = {
  from: {
    noreply: 'Georgio Bandera <noreply@georgiobandera.se>',
    info: 'Georgio Bandera <contact@georgiobandera.se>',
    order: 'Georgio Bandera <order@georgiobandera.se>',
  },
  replyTo: {
    info: 'contact@georgiobandera.se',
    order: 'order@georgiobandera.se',
  },
};

// Helper to check if email is configured
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!resend;
}

// Re-export all send functions
export {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendDeliveryNotificationEmail,
  sendContactConfirmationEmail,
  sendAdminReplyEmail,
  sendAdminNotificationEmail,
  sendOrderNotificationEmail,
} from './send';
