/// <reference types="@cloudflare/workers-types" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Database
      DATABASE_URL?: string;
      
      // Stripe
      STRIPE_SECRET_KEY?: string;
      STRIPE_WEBHOOK_SECRET?: string;
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
      
      // PayPal
      PAYPAL_CLIENT_ID?: string;
      PAYPAL_CLIENT_SECRET?: string;
      NEXT_PUBLIC_PAYPAL_CLIENT_ID?: string;
      
      // Cloudflare R2
      R2_ACCOUNT_ID?: string;
      R2_ACCESS_KEY_ID?: string;
      R2_SECRET_ACCESS_KEY?: string;
      
      // Email
      EMAIL_FROM?: string;
      EMAIL_SMTP_HOST?: string;
      EMAIL_SMTP_PORT?: string;
      EMAIL_SMTP_USER?: string;
      EMAIL_SMTP_PASS?: string;
      
      // Auth
      NEXTAUTH_SECRET?: string;
      NEXTAUTH_URL?: string;
      
      // App
      NEXT_PUBLIC_APP_URL?: string;
    }
  }
}

export {};

