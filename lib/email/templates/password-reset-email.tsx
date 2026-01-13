import { Button, Link, Text, Section } from '@react-email/components';
import * as React from 'react';
import { BaseEmail, emailStyles } from './base-email';

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
  locale?: 'sv' | 'en';
}

export function PasswordResetEmail({ name, resetUrl, locale = 'sv' }: PasswordResetEmailProps) {
  const isSv = locale === 'sv';

  const content = {
    sv: {
      preview: 'Återställ ditt lösenord för Georgio Bandera',
      greeting: `Hej ${name}!`,
      intro: 'Vi har fått en begäran om att återställa lösenordet för ditt konto. Klicka på knappen nedan för att välja ett nytt lösenord.',
      button: 'Återställ lösenord',
      linkText: 'Om knappen inte fungerar, kopiera och klistra in denna länk i din webbläsare:',
      expiry: 'Denna länk är giltig i 1 timme.',
      ignore: 'Om du inte begärde en lösenordsåterställning kan du ignorera detta e-postmeddelande. Ditt lösenord kommer inte att ändras.',
      security: 'Av säkerhetsskäl, dela aldrig denna länk med någon annan.',
    },
    en: {
      preview: 'Reset your password for Georgio Bandera',
      greeting: `Hello ${name}!`,
      intro: "We received a request to reset the password for your account. Click the button below to choose a new password.",
      button: 'Reset Password',
      linkText: "If the button doesn't work, copy and paste this link into your browser:",
      expiry: 'This link is valid for 1 hour.',
      ignore: "If you didn't request a password reset, you can ignore this email. Your password will not be changed.",
      security: 'For security reasons, never share this link with anyone else.',
    },
  };

  const t = content[isSv ? 'sv' : 'en'];

  return (
    <BaseEmail preview={t.preview} locale={locale}>
      <Text style={emailStyles.heading}>{t.greeting}</Text>
      
      <Text style={emailStyles.paragraph}>{t.intro}</Text>

      <Section style={{ textAlign: 'center', margin: '30px 0' }}>
        <Button href={resetUrl} style={emailStyles.button}>
          {t.button}
        </Button>
      </Section>

      <Text style={emailStyles.smallText}>{t.linkText}</Text>
      <Text style={{ ...emailStyles.smallText, wordBreak: 'break-all' }}>
        <Link href={resetUrl} style={{ color: '#000000' }}>
          {resetUrl}
        </Link>
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={{ ...emailStyles.smallText, margin: '0 0 10px' }}>
          {t.expiry}
        </Text>
        <Text style={{ ...emailStyles.smallText, margin: 0, fontWeight: 600 }}>
          {t.security}
        </Text>
      </Section>

      <Text style={emailStyles.smallText}>{t.ignore}</Text>
    </BaseEmail>
  );
}

export default PasswordResetEmail;

