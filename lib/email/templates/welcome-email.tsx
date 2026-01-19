import { Button, Text, Section } from '@react-email/components';
import * as React from 'react';
import { BaseEmail, emailStyles } from './base-email';

interface WelcomeEmailProps {
  name: string;
  locale?: 'sv' | 'en';
}

export function WelcomeEmail({ name, locale = 'sv' }: WelcomeEmailProps) {
  const isSv = locale === 'sv';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://georgiobandera1.pages.dev';
  const shopUrl = `${baseUrl}/shop`;

  const content = {
    sv: {
      preview: 'Välkommen till Georgio Bandera!',
      greeting: `Välkommen ${name}!`,
      intro: 'Tack för att du verifierade din e-postadress. Ditt konto är nu aktiverat och du kan börja handla hos oss.',
      benefits: 'Som medlem hos Georgio Bandera får du:',
      benefit1: 'Snabbare utcheckning med sparade uppgifter',
      benefit2: 'Orderhistorik och spårning',
      benefit3: 'Exklusiva erbjudanden och nyheter',
      button: 'Börja handla',
      outro: 'Vi ser fram emot att få vara en del av din resa mot en mer hållbar garderob.',
      signature: 'Varma hälsningar,',
      team: 'Teamet på Georgio Bandera',
    },
    en: {
      preview: 'Welcome to Georgio Bandera!',
      greeting: `Welcome ${name}!`,
      intro: 'Thank you for verifying your email address. Your account is now active and you can start shopping with us.',
      benefits: 'As a Georgio Bandera member, you get:',
      benefit1: 'Faster checkout with saved details',
      benefit2: 'Order history and tracking',
      benefit3: 'Exclusive offers and news',
      button: 'Start Shopping',
      outro: 'We look forward to being part of your journey towards a more sustainable wardrobe.',
      signature: 'Warm regards,',
      team: 'The Georgio Bandera Team',
    },
  };

  const t = content[isSv ? 'sv' : 'en'];

  return (
    <BaseEmail preview={t.preview} locale={locale}>
      <Text style={emailStyles.heading}>{t.greeting}</Text>
      
      <Text style={emailStyles.paragraph}>{t.intro}</Text>

      <Section style={emailStyles.infoBox}>
        <Text style={{ ...emailStyles.paragraph, margin: '0 0 15px', fontWeight: 600 }}>
          {t.benefits}
        </Text>
        <Text style={{ ...emailStyles.smallText, margin: '0 0 8px' }}>
          ✓ {t.benefit1}
        </Text>
        <Text style={{ ...emailStyles.smallText, margin: '0 0 8px' }}>
          ✓ {t.benefit2}
        </Text>
        <Text style={{ ...emailStyles.smallText, margin: 0 }}>
          ✓ {t.benefit3}
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '30px 0' }}>
        <Button href={shopUrl} style={emailStyles.button}>
          {t.button}
        </Button>
      </Section>

      <Text style={emailStyles.paragraph}>{t.outro}</Text>

      <Text style={emailStyles.paragraph}>
        {t.signature}<br />
        <strong>{t.team}</strong>
      </Text>
    </BaseEmail>
  );
}

export default WelcomeEmail;

