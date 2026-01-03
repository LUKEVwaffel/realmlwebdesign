// Seed script to create maintenance subscription products in Stripe
// Run with: npx tsx server/seed-maintenance-products.ts

import { getUncachableStripeClient } from './stripeClient';

const maintenanceProducts = [
  {
    name: 'Standard Maintenance',
    description: 'Monthly maintenance: hosting, security updates, backups, and basic support',
    metadata: {
      tier: 'standard',
      included_services: 'hosting,security_updates,backups,basic_support',
    },
    price: 5000, // $50.00 in cents
  },
  {
    name: 'Business/Premium Maintenance',
    description: 'Monthly maintenance: includes CMS Editor access and priority support',
    metadata: {
      tier: 'business',
      included_services: 'hosting,security_updates,backups,cms_editor,priority_support',
    },
    price: 10000, // $100.00 in cents
  },
  {
    name: 'E-commerce Maintenance',
    description: 'Monthly maintenance: includes CMS Editor access, e-commerce maintenance, and priority support',
    metadata: {
      tier: 'ecommerce',
      included_services: 'hosting,security_updates,backups,cms_editor,ecommerce_maintenance,priority_support',
    },
    price: 20000, // $200.00 in cents
  },
];

async function seedMaintenanceProducts() {
  const stripe = await getUncachableStripeClient();
  
  console.log('Creating maintenance subscription products in Stripe...\n');

  for (const product of maintenanceProducts) {
    // Check if product already exists
    const existingProducts = await stripe.products.search({
      query: `name:'${product.name}'`,
    });

    if (existingProducts.data.length > 0) {
      console.log(`Product "${product.name}" already exists (${existingProducts.data[0].id})`);
      
      // Check if it has an active price
      const prices = await stripe.prices.list({
        product: existingProducts.data[0].id,
        active: true,
      });
      
      if (prices.data.length > 0) {
        console.log(`  - Price: $${prices.data[0].unit_amount! / 100}/month (${prices.data[0].id})\n`);
      } else {
        // Create price if missing
        const newPrice = await stripe.prices.create({
          product: existingProducts.data[0].id,
          unit_amount: product.price,
          currency: 'usd',
          recurring: { interval: 'month' },
        });
        console.log(`  - Created price: $${product.price / 100}/month (${newPrice.id})\n`);
      }
      continue;
    }

    // Create product
    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.description,
      metadata: product.metadata,
    });
    console.log(`Created product: ${product.name} (${stripeProduct.id})`);

    // Create monthly recurring price
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: product.price,
      currency: 'usd',
      recurring: { interval: 'month' },
    });
    console.log(`  - Price: $${product.price / 100}/month (${stripePrice.id})\n`);
  }

  console.log('Done! Maintenance products are ready in Stripe.');
  console.log('The stripe-replit-sync webhook will automatically sync these to your database.');
}

seedMaintenanceProducts().catch(console.error);
