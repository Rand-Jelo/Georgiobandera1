import { Button, Text, Section, Row, Column, Hr } from '@react-email/components';
import * as React from 'react';
import { BaseEmail, emailStyles } from './base-email';

interface OrderItem {
  name: string;
  variant?: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationEmailProps {
  name: string;
  orderNumber: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  locale?: 'sv' | 'en';
}

export function OrderConfirmationEmail({
  name,
  orderNumber,
  orderDate,
  items,
  subtotal,
  shipping,
  total,
  shippingAddress,
  locale = 'sv',
}: OrderConfirmationEmailProps) {
  const isSv = locale === 'sv';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://georgiobandera1.pages.dev';
  const orderUrl = `${baseUrl}/account/orders/${orderNumber}`;

  const formatPrice = (price: number) => {
    return `${price.toLocaleString(isSv ? 'sv-SE' : 'en-SE')} SEK`;
  };

  const content = {
    sv: {
      preview: `Orderbekräftelse - Order ${orderNumber}`,
      greeting: `Tack för din beställning, ${name}!`,
      intro: 'Vi har mottagit din beställning och börjar förbereda den för leverans.',
      orderDetails: 'Orderdetaljer',
      orderNumberLabel: 'Ordernummer',
      orderDateLabel: 'Orderdatum',
      items: 'Artiklar',
      quantity: 'Antal',
      price: 'Pris',
      subtotal: 'Delsumma',
      shipping: 'Frakt',
      total: 'Totalt',
      shippingAddress: 'Leveransadress',
      button: 'Visa order',
      nextSteps: 'Du kommer att få ett e-postmeddelande när din beställning har skickats med spårningsinformation.',
      questions: 'Har du frågor om din beställning? Kontakta oss på order@georgiobandera.se',
    },
    en: {
      preview: `Order Confirmation - Order ${orderNumber}`,
      greeting: `Thank you for your order, ${name}!`,
      intro: 'We have received your order and are preparing it for delivery.',
      orderDetails: 'Order Details',
      orderNumberLabel: 'Order Number',
      orderDateLabel: 'Order Date',
      items: 'Items',
      quantity: 'Qty',
      price: 'Price',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      total: 'Total',
      shippingAddress: 'Shipping Address',
      button: 'View Order',
      nextSteps: 'You will receive an email when your order has been shipped with tracking information.',
      questions: 'Have questions about your order? Contact us at order@georgiobandera.se',
    },
  };

  const t = content[isSv ? 'sv' : 'en'];

  return (
    <BaseEmail preview={t.preview} locale={locale}>
      <Text style={emailStyles.heading}>{t.greeting}</Text>
      
      <Text style={emailStyles.paragraph}>{t.intro}</Text>

      {/* Order Info */}
      <Section style={emailStyles.infoBox}>
        <Row>
          <Column>
            <Text style={emailStyles.label}>{t.orderNumberLabel}</Text>
            <Text style={emailStyles.value}>{orderNumber}</Text>
          </Column>
          <Column>
            <Text style={emailStyles.label}>{t.orderDateLabel}</Text>
            <Text style={emailStyles.value}>{orderDate}</Text>
          </Column>
        </Row>
      </Section>

      {/* Order Items */}
      <Text style={{ ...emailStyles.paragraph, fontWeight: 600 }}>{t.items}</Text>
      
      {items.map((item, index) => (
        <Section key={index} style={{ marginBottom: '15px' }}>
          <Row>
            <Column style={{ width: '60%' }}>
              <Text style={{ ...emailStyles.paragraph, margin: 0, fontWeight: 500 }}>
                {item.name}
              </Text>
              {item.variant && (
                <Text style={{ ...emailStyles.smallText, margin: '5px 0 0' }}>
                  {item.variant}
                </Text>
              )}
            </Column>
            <Column style={{ width: '20%', textAlign: 'center' }}>
              <Text style={{ ...emailStyles.smallText, margin: 0 }}>
                {t.quantity}: {item.quantity}
              </Text>
            </Column>
            <Column style={{ width: '20%', textAlign: 'right' }}>
              <Text style={{ ...emailStyles.paragraph, margin: 0 }}>
                {formatPrice(item.price)}
              </Text>
            </Column>
          </Row>
        </Section>
      ))}

      <Hr style={emailStyles.divider} />

      {/* Totals */}
      <Section>
        <Row>
          <Column style={{ width: '70%' }}>
            <Text style={{ ...emailStyles.paragraph, margin: '0 0 10px', textAlign: 'right' }}>
              {t.subtotal}:
            </Text>
          </Column>
          <Column style={{ width: '30%' }}>
            <Text style={{ ...emailStyles.paragraph, margin: '0 0 10px', textAlign: 'right' }}>
              {formatPrice(subtotal)}
            </Text>
          </Column>
        </Row>
        <Row>
          <Column style={{ width: '70%' }}>
            <Text style={{ ...emailStyles.paragraph, margin: '0 0 10px', textAlign: 'right' }}>
              {t.shipping}:
            </Text>
          </Column>
          <Column style={{ width: '30%' }}>
            <Text style={{ ...emailStyles.paragraph, margin: '0 0 10px', textAlign: 'right' }}>
              {shipping === 0 ? (isSv ? 'Gratis' : 'Free') : formatPrice(shipping)}
            </Text>
          </Column>
        </Row>
        <Row>
          <Column style={{ width: '70%' }}>
            <Text style={{ ...emailStyles.paragraph, margin: 0, textAlign: 'right', fontWeight: 600 }}>
              {t.total}:
            </Text>
          </Column>
          <Column style={{ width: '30%' }}>
            <Text style={{ ...emailStyles.paragraph, margin: 0, textAlign: 'right', fontWeight: 600 }}>
              {formatPrice(total)}
            </Text>
          </Column>
        </Row>
      </Section>

      <Hr style={emailStyles.divider} />

      {/* Shipping Address */}
      <Text style={emailStyles.label}>{t.shippingAddress}</Text>
      <Text style={emailStyles.paragraph}>
        {shippingAddress.street}<br />
        {shippingAddress.postalCode} {shippingAddress.city}<br />
        {shippingAddress.country}
      </Text>

      <Section style={{ textAlign: 'center', margin: '30px 0' }}>
        <Button href={orderUrl} style={emailStyles.button}>
          {t.button}
        </Button>
      </Section>

      <Section style={emailStyles.infoBox}>
        <Text style={{ ...emailStyles.smallText, margin: 0 }}>
          {t.nextSteps}
        </Text>
      </Section>

      <Text style={emailStyles.smallText}>{t.questions}</Text>
    </BaseEmail>
  );
}

export default OrderConfirmationEmail;

