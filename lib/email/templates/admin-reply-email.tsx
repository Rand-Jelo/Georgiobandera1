import { Text, Section, Hr } from '@react-email/components';
import * as React from 'react';
import { BaseEmail, emailStyles } from './base-email';

interface AdminReplyEmailProps {
  customerName: string;
  originalSubject?: string;
  originalMessage: string;
  replyMessage: string;
  adminName?: string;
  locale?: 'sv' | 'en';
}

export function AdminReplyEmail({
  customerName,
  originalSubject,
  originalMessage,
  replyMessage,
  adminName = 'Kundtjänst',
  locale = 'sv',
}: AdminReplyEmailProps) {
  const isSv = locale === 'sv';

  const content = {
    sv: {
      preview: `Svar på ditt meddelande - Georgio Bandera`,
      greeting: `Hej ${customerName}!`,
      intro: 'Vi har svarat på ditt meddelande.',
      ourReply: 'Vårt svar',
      yourOriginalMessage: 'Ditt ursprungliga meddelande',
      subjectLabel: 'Ämne',
      followUp: 'Om du har fler frågor, svara gärna på detta e-postmeddelande så hjälper vi dig.',
      signature: 'Vänliga hälsningar,',
    },
    en: {
      preview: `Reply to your message - Georgio Bandera`,
      greeting: `Hello ${customerName}!`,
      intro: 'We have replied to your message.',
      ourReply: 'Our Reply',
      yourOriginalMessage: 'Your Original Message',
      subjectLabel: 'Subject',
      followUp: 'If you have more questions, feel free to reply to this email and we will help you.',
      signature: 'Best regards,',
    },
  };

  const t = content[isSv ? 'sv' : 'en'];

  return (
    <BaseEmail preview={t.preview} locale={locale}>
      <Text style={emailStyles.heading}>{t.greeting}</Text>
      
      <Text style={emailStyles.paragraph}>{t.intro}</Text>

      {/* Admin Reply */}
      <Section style={{ ...emailStyles.infoBox, backgroundColor: '#f0f9f0', borderLeft: '4px solid #22c55e' }}>
        <Text style={{ ...emailStyles.paragraph, fontWeight: 600, margin: '0 0 10px' }}>
          {t.ourReply}
        </Text>
        <Text style={{ ...emailStyles.paragraph, margin: 0, whiteSpace: 'pre-wrap' }}>
          {replyMessage}
        </Text>
      </Section>

      <Hr style={emailStyles.divider} />

      {/* Original Message */}
      <Section style={{ ...emailStyles.infoBox, backgroundColor: '#f5f5f5' }}>
        <Text style={{ ...emailStyles.smallText, fontWeight: 600, margin: '0 0 10px' }}>
          {t.yourOriginalMessage}
        </Text>
        
        {originalSubject && (
          <>
            <Text style={{ ...emailStyles.label, fontSize: '11px' }}>{t.subjectLabel}</Text>
            <Text style={{ ...emailStyles.smallText, margin: '0 0 10px' }}>{originalSubject}</Text>
          </>
        )}
        
        <Text style={{ ...emailStyles.smallText, margin: 0, whiteSpace: 'pre-wrap', color: '#666666' }}>
          {originalMessage}
        </Text>
      </Section>

      <Text style={emailStyles.smallText}>{t.followUp}</Text>

      <Text style={emailStyles.paragraph}>
        {t.signature}<br />
        <strong>{adminName}</strong><br />
        Georgio Bandera
      </Text>
    </BaseEmail>
  );
}

export default AdminReplyEmail;

