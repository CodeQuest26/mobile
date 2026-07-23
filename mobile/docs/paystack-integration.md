# Paystack hosted checkout

The mobile app uses Paystack's hosted checkout and never treats a browser
redirect as proof that money was received.

## Production configuration

Set these variables in the backend Railway service (test keys for the initial
rollout):

```text
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_CALLBACK_URL=https://backendtest-production-9132.up.railway.app/api/v1/payments/callback
```

Configure the Paystack Dashboard webhook as:

```text
https://backendtest-production-9132.up.railway.app/webhooks/paystack
```

The callback and webhook have different jobs. The callback is a public browser
redirect marker for the app's WebView. It must not release escrow or mark an
order as paid. The signed webhook is the independent source of truth.

For a custom backend domain, set the matching app build-time value:

```text
EXPO_PUBLIC_PAYSTACK_CALLBACK_URL=https://your-backend.example/api/v1/payments/callback
```

## API contract

`POST /api/v1/payments/initiate` is authenticated and accepts an order ID. The
server must initialize Paystack with the order amount in pesewas, `currency:
"GHS"`, its generated reference, string metadata, and the configured callback
URL. It must return only a real hosted checkout URL:

```json
{
  "reference": "mh_...",
  "authorization_url": "https://checkout.paystack.com/<token>"
}
```

Never substitute `https://paystack.com/pay/<reference>`. If the secret is
missing or Paystack returns an unsuccessful/malformed response, initiation
must fail clearly. A retry of a still-pending transaction should reuse the
stored real checkout URL.

`POST /api/v1/payments/verify` is authenticated and accepts the original
reference:

```json
{ "reference": "mh_..." }
```

The backend must call Paystack's transaction-verification API server-side,
check the owner, reference, amount, GHS currency, and `success` status, then
idempotently update the escrow transaction and order. It returns:

```json
{ "verified": true }
```

For pending, cancelled, or failed transactions it returns `{ "verified":
false }` (or an appropriate non-2xx error). The client only presents a payment
success message when `verified` is exactly `true`.

Both this endpoint and a valid signed `charge.success` webhook must use the
same idempotent successful-charge update routine, so they cannot release
escrow twice. Invalid webhook signatures must be rejected.

## WebView behavior

The app loads only `https://checkout.paystack.com/...`. It permits normal
Paystack, bank, and 3DS redirects. It blocks only the exact configured callback
route and `https://standard.paystack.co/close`, invokes verification once using
the original reference, and keeps the checkout open with a pending message if
verification does not confirm payment. The close button is a user dismissal.
