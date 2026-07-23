/**
 * Carries the in-memory refresh callback across the short checkout/status
 * navigation transition. It is deliberately consumed once, and payment
 * status is never stored here.
 */
let completionHandler: (() => void) | undefined;

export function setPaymentCompletionHandler(handler?: () => void) {
  completionHandler = handler;
}

export function notifyPaymentCompleted() {
  const handler = completionHandler;
  completionHandler = undefined;
  handler?.();
}

export function clearPaymentCompletionHandler() {
  completionHandler = undefined;
}
