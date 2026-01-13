import { Text, Section } from '@react-email/components';
import * as React from 'react';
import { BaseEmail, emailStyles } from './base-email';

interface ContactConfirmationEmailProps {
  name: string;
  subject?: string;
  message: string;
  locale?: 'sv' | 'en';
}

export function ContactConfirmationEmail({
  name,
  subject,
  message,
  locale = 'sv',
}: ContactConfirmationEmailProps) {
  const isSv = locale === 'sv';

  const content = {
    sv: {
      preview: 'Vi har mottagit ditt meddelande',
      greeting: `Hej ${name}!`,
      intro: 'Tack för att du kontaktade oss. Vi har mottagit ditt meddelande och återkommer till dig så snart som möjligt, vanligtvis inom 1-2 arbetsdagar.',
      yourMessage: 'Ditt meddelande',
      subjectLabel: 'Ämne',
      messageLabel: 'Meddelande',
      response: 'Vi svarar vanligtvis inom 24-48 timmar under vardagar.',
      thanks: 'Tack för ditt tålamod!',
      signature: 'Vänliga hälsningar,',
      team: 'Kundtjänst på Georgio Bandera',
    },
    en: {
      preview: 'We have received your message',
      greeting: `Hello ${name}!`,
      intro: 'Thank you for contacting us. We have received your message and will get back to you as soon as possible, usually within 1-2 business days.',
      yourMessage: 'Your Message',
      subjectLabel: 'Subject',
      messageLabel: 'Message',
      response: 'We typically respond within 24-48 hours on business days.',
      thanks: 'Thank you for your patience!',
      signature: 'Best regards,',
      team: 'Customer Service at Georgio Bandera',
    },
  };

  const t = content[isSv ? 'sv' : 'en'];

  return (
    <BaseEmail preview={t.preview} locale={locale}>
      <Text style={emailStyles.heading}>{t.greeting}</Text>
      
      <Text style={emailStyles.paragraph}>{t.intro}</Text>

      {/* Message Summary */}
      <Section style={emailStyles.infoBox}>
        <Text style={{ ...emailStyles.paragraph, fontWeight: 600, margin: '0 0 15px' }}>
          {t.yourMessage}
        </Text>
        
        {subject && (
          <>
            <Text style={emailStyles.label}>{t.subjectLabel}</Text>
            <Text style={emailStyles.value}>{subject}</Text>
          </>
        )}
        
        <Text style={emailStyles.label}>{t.messageLabel}</Text>
        <Text style={{ ...emailStyles.smallText, margin: 0, whiteSpace: 'pre-wrap' }}>
          {message}
        </Text>
      </Section>

      <Text style={emailStyles.smallText}>{t.response}</Text>

      <Text style={emailStyles.paragraph}>{t.thanks}</Text>

      <Text style={emailStyles.paragraph}>
        {t.signature}<br />
        <strong>{t.team}</strong>
      </Text>
    </BaseEmail>
  );
}

export default ContactConfirmationEmail;

