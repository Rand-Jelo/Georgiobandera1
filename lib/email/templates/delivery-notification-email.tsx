import { Button, Text, Section, Link } from '@react-email/components';
import * as React from 'react';
import { BaseEmail, emailStyles } from './base-email';

interface DeliveryNotificationEmailProps {
  name: string;
  orderNumber: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  estimatedDelivery?: string;
  locale?: 'sv' | 'en';
  baseUrl?: string;
}

export function DeliveryNotificationEmail({
  name,
  orderNumber,
  trackingNumber,
  trackingUrl,
  carrier,
  estimatedDelivery,
  locale = 'sv',
  baseUrl,
}: DeliveryNotificationEmailProps) {
  const isSv = locale === 'sv';
  const finalBaseUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://georgiobandera1.pages.dev';
  const localePath = isSv ? 'sv' : 'en';
  const orderUrl = `${finalBaseUrl}/${localePath}/orders/${orderNumber}`;

  const content = {
    sv: {
      preview: `Din beställning ${orderNumber} är på väg!`,
      greeting: `Hej ${name}!`,
      intro: 'Goda nyheter! Din beställning är nu på väg till dig.',
      orderNumber: 'Ordernummer',
      carrier: 'Transportör',
      trackingNumber: 'Spårningsnummer',
      estimatedDelivery: 'Beräknad leverans',
      trackButton: 'Spåra försändelse',
      viewOrderButton: 'Visa order',
      noTracking: 'Spårningsinformation kommer att skickas separat när den är tillgänglig.',
      questions: 'Har du frågor om din leverans? Kontakta oss på order@georgiobandera.se',
      thanks: 'Tack för att du handlar hos Georgio Bandera!',
    },
    en: {
      preview: `Your order ${orderNumber} is on its way!`,
      greeting: `Hello ${name}!`,
      intro: 'Great news! Your order is now on its way to you.',
      orderNumber: 'Order Number',
      carrier: 'Carrier',
      trackingNumber: 'Tracking Number',
      estimatedDelivery: 'Estimated Delivery',
      trackButton: 'Track Shipment',
      viewOrderButton: 'View Order',
      noTracking: 'Tracking information will be sent separately when available.',
      questions: 'Have questions about your delivery? Contact us at order@georgiobandera.se',
      thanks: 'Thank you for shopping with Georgio Bandera!',
    },
  };

  const t = content[isSv ? 'sv' : 'en'];

  return (
    <BaseEmail preview={t.preview} locale={locale}>
      <Text style={emailStyles.heading}>{t.greeting}</Text>
      
      <Text style={emailStyles.paragraph}>{t.intro}</Text>

      {/* Shipping Info */}
      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.label}>{t.orderNumber}</Text>
        <Text style={emailStyles.value}>{orderNumber}</Text>

        {carrier && (
          <>
            <Text style={emailStyles.label}>{t.carrier}</Text>
            <Text style={emailStyles.value}>{carrier}</Text>
          </>
        )}

        {trackingNumber && (
          <>
            <Text style={emailStyles.label}>{t.trackingNumber}</Text>
            <Text style={emailStyles.value}>{trackingNumber}</Text>
          </>
        )}

        {estimatedDelivery && (
          <>
            <Text style={emailStyles.label}>{t.estimatedDelivery}</Text>
            <Text style={{ ...emailStyles.value, margin: 0 }}>{estimatedDelivery}</Text>
          </>
        )}
      </Section>

      {/* Buttons */}
      <Section style={{ textAlign: 'center', margin: '30px 0' }}>
        {trackingUrl ? (
          <>
            <Button href={trackingUrl} style={emailStyles.button}>
              {t.trackButton}
            </Button>
            <Text style={{ margin: '15px 0' }}>
              <Link href={orderUrl} style={{ color: '#000000', textDecoration: 'underline' }}>
                {t.viewOrderButton}
              </Link>
            </Text>
          </>
        ) : (
          <>
            <Button href={orderUrl} style={emailStyles.button}>
              {t.viewOrderButton}
            </Button>
            <Text style={{ ...emailStyles.smallText, marginTop: '15px' }}>
              {t.noTracking}
            </Text>
          </>
        )}
      </Section>

      <Text style={emailStyles.paragraph}>{t.thanks}</Text>

      <Text style={emailStyles.smallText}>{t.questions}</Text>
    </BaseEmail>
  );
}

export default DeliveryNotificationEmail;

