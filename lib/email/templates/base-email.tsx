import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface BaseEmailProps {
  preview: string;
  children: React.ReactNode;
  locale?: 'sv' | 'en';
}

export function BaseEmail({ preview, children, locale = 'sv' }: BaseEmailProps) {
  const isSv = locale === 'sv';
  
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with logo */}
          <Section style={header}>
            <Img
              src="https://georgiobandera.se/logo.png"
              width="180"
              height="40"
              alt="Georgio Bandera"
              style={logo}
            />
          </Section>

          {/* Main content */}
          <Section style={content}>
            {children}
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Georgio Bandera. {isSv ? 'Alla rättigheter förbehållna.' : 'All rights reserved.'}
            </Text>
            <Text style={footerLinks}>
              <Link href="https://georgiobandera.se" style={footerLink}>
                {isSv ? 'Besök vår hemsida' : 'Visit our website'}
              </Link>
              {' • '}
              <Link href="https://georgiobandera.se/contact" style={footerLink}>
                {isSv ? 'Kontakta oss' : 'Contact us'}
              </Link>
            </Text>
            <Text style={footerAddress}>
              Georgio Bandera<br />
              Stockholm, Sweden
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f6f6',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#000000',
  padding: '30px 40px',
  borderRadius: '8px 8px 0 0',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const content = {
  backgroundColor: '#ffffff',
  padding: '40px',
  borderRadius: '0 0 8px 8px',
};

const divider = {
  borderColor: '#e6e6e6',
  margin: '30px 0',
};

const footer = {
  textAlign: 'center' as const,
  padding: '0 40px',
};

const footerText = {
  color: '#666666',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0 0 10px',
};

const footerLinks = {
  color: '#666666',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0 0 10px',
};

const footerLink = {
  color: '#000000',
  textDecoration: 'underline',
};

const footerAddress = {
  color: '#999999',
  fontSize: '11px',
  lineHeight: '18px',
  margin: '10px 0 0',
};

// Shared styles for email content
export const emailStyles = {
  heading: {
    color: '#000000',
    fontSize: '24px',
    fontWeight: '600' as const,
    lineHeight: '32px',
    margin: '0 0 20px',
  },
  paragraph: {
    color: '#333333',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '0 0 20px',
  },
  button: {
    backgroundColor: '#000000',
    borderRadius: '6px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '600' as const,
    padding: '14px 28px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    border: '2px solid #000000',
    borderRadius: '6px',
    color: '#000000',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '600' as const,
    padding: '12px 26px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  infoBox: {
    backgroundColor: '#f8f8f8',
    borderRadius: '6px',
    padding: '20px',
    margin: '20px 0',
  },
  label: {
    color: '#666666',
    fontSize: '12px',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '0 0 5px',
  },
  value: {
    color: '#000000',
    fontSize: '16px',
    fontWeight: '500' as const,
    margin: '0 0 15px',
  },
  divider: {
    borderColor: '#e6e6e6',
    margin: '25px 0',
  },
  smallText: {
    color: '#666666',
    fontSize: '14px',
    lineHeight: '22px',
  },
};

