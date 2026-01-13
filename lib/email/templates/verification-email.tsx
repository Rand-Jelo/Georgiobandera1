import { Button, Link, Text, Section } from '@react-email/components';
import * as React from 'react';
import { BaseEmail, emailStyles } from './base-email';

interface VerificationEmailProps {
  name: string;
  verificationUrl: string;
  locale?: 'sv' | 'en';
}

export function VerificationEmail({ name, verificationUrl, locale = 'sv' }: VerificationEmailProps) {
  const isSv = locale === 'sv';

  const content = {
    sv: {
      preview: 'Verifiera din e-postadress för Georgio Bandera',
      greeting: `Hej ${name}!`,
      intro: 'Tack för att du skapade ett konto hos Georgio Bandera. För att slutföra din registrering, vänligen verifiera din e-postadress genom att klicka på knappen nedan.',
      button: 'Verifiera e-postadress',
      linkText: 'Om knappen inte fungerar, kopiera och klistra in denna länk i din webbläsare:',
      expiry: 'Denna länk är giltig i 24 timmar.',
      ignore: 'Om du inte skapade ett konto hos oss kan du ignorera detta e-postmeddelande.',
    },
    en: {
      preview: 'Verify your email address for Georgio Bandera',
      greeting: `Hello ${name}!`,
      intro: 'Thank you for creating an account with Georgio Bandera. To complete your registration, please verify your email address by clicking the button below.',
      button: 'Verify Email Address',
      linkText: "If the button doesn't work, copy and paste this link into your browser:",
      expiry: 'This link is valid for 24 hours.',
      ignore: "If you didn't create an account with us, you can ignore this email.",
    },
  };

  const t = content[isSv ? 'sv' : 'en'];

  return (
    <BaseEmail preview={t.preview} locale={locale}>
      <Text style={emailStyles.heading}>{t.greeting}</Text>
      
      <Text style={emailStyles.paragraph}>{t.intro}</Text>

      <Section style={{ textAlign: 'center', margin: '30px 0' }}>
        <Button href={verificationUrl} style={emailStyles.button}>
          {t.button}
        </Button>
      </Section>

      <Text style={emailStyles.smallText}>{t.linkText}</Text>
      <Text style={{ ...emailStyles.smallText, wordBreak: 'break-all' }}>
        <Link href={verificationUrl} style={{ color: '#000000' }}>
          {verificationUrl}
        </Link>
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={{ ...emailStyles.smallText, margin: 0 }}>
          {t.expiry}
        </Text>
      </Section>

      <Text style={emailStyles.smallText}>{t.ignore}</Text>
    </BaseEmail>
  );
}

export default VerificationEmail;

