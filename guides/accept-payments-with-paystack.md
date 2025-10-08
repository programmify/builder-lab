# Accept Payments with Paystack

> **Paystack** is a leading payment gateway for Africa, enabling businesses to accept payments online via cards, bank transfers, USSD, and more. This guide walks you through integrating Paystack into your web app or site.

---

## 1. Create a Paystack Account

- Go to [Paystack Signup](https://paystack.com/signup) and register your business.
- Complete the onboarding and verification steps.
- Get your **API keys** from the dashboard (Test and Live keys).

## 2. Choose Your Integration Method

Paystack offers several ways to accept payments:
- **Paystack Inline**: Embed a payment form directly in your site.
- **Paystack Standard**: Redirect users to a secure Paystack-hosted payment page.
- **Paystack API**: For custom server-side integrations.

For most web apps, **Inline** or **Standard** is easiest.

## 3. Integrate Paystack Inline (Frontend Example)

Add the Paystack script to your HTML:
```html
<script src="https://js.paystack.co/v1/inline.js"></script>