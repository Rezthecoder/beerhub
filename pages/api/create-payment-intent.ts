import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../lib/stripe';
import { getProductById, createOrder } from '../../lib/products';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { productId, quantity = 1, customerEmail } = req.body;

        // Validate input
        if (!productId || !quantity) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get product details
        const product = await getProductById(parseInt(productId));
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const totalAmount = product.price * quantity;

        // Create order in database
        const order = await createOrder({
            product_id: product.id,
            quantity,
            total_amount: totalAmount,
            customer_email: customerEmail,
        });

        if (!order) {
            return res.status(500).json({ error: 'Failed to create order' });
        }

        // Create Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmount, // Amount in yen (smallest currency unit)
            currency: 'jpy',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                orderId: order.id.toString(),
                productId: product.id.toString(),
                quantity: quantity.toString(),
            },
            description: `BeerHub Order #${order.id} - ${product.name} x ${quantity}`,
            receipt_email: customerEmail || undefined,
        });

        res.status(200).json({
            success: true,
            orderId: order.id,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });

    } catch (error: any) {
        console.error('Payment Intent creation error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}