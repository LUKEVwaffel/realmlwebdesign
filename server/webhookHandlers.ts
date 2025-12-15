import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { storage } from './storage';
import { log } from './index';

export async function handleStripeWebhook(
  event: Stripe.Event,
  req: Request,
  res: Response
) {
  log(`Received Stripe event: ${event.type}`, 'stripe');

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }
      default:
        log(`Unhandled event type: ${event.type}`, 'stripe');
    }

    res.json({ received: true });
  } catch (error) {
    log(`Webhook error: ${error}`, 'stripe');
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.payment_id;
  if (!paymentId) {
    log('No payment_id in session metadata', 'stripe');
    return;
  }

  const payment = await storage.getPayment(paymentId);
  if (!payment) {
    log(`Payment not found: ${paymentId}`, 'stripe');
    return;
  }

  await storage.updatePayment(paymentId, {
    status: 'paid',
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: session.payment_intent as string,
    paidAt: new Date() as any,
    paidAmount: (session.amount_total! / 100).toString(),
  });

  if (payment.clientId) {
    await storage.createActivityLog({
      clientId: payment.clientId,
      action: 'payment_completed',
      description: `Payment #${payment.paymentNumber} of $${payment.amount} completed`,
    });
  }

  log(`Payment ${paymentId} marked as paid`, 'stripe');
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const paymentId = paymentIntent.metadata?.payment_id;
  if (!paymentId) return;

  const payment = await storage.getPayment(paymentId);
  if (!payment || payment.status === 'paid') return;

  await storage.updatePayment(paymentId, {
    status: 'paid',
    stripePaymentIntentId: paymentIntent.id,
    stripeTransactionId: paymentIntent.latest_charge as string,
    paidAt: new Date() as any,
    paidAmount: (paymentIntent.amount / 100).toString(),
  });

  log(`Payment ${paymentId} succeeded via payment_intent`, 'stripe');
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const paymentId = paymentIntent.metadata?.payment_id;
  if (!paymentId) return;

  log(`Payment ${paymentId} failed: ${paymentIntent.last_payment_error?.message}`, 'stripe');
}
