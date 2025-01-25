const stripe = require('stripe')(''); // Replace with your actual secret key

(async () => {
    try {
        // Test the secret key by creating a PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 1000, // Amount in cents (e.g., $10.00)
            currency: 'usd',
            payment_method_types: ['card'],
            description: 'Test PaymentIntent',
        });

        console.log('Success! Your secret key works.');
        console.log('Created PaymentIntent:', paymentIntent.id);
    } catch (error) {
        console.error('Error: Invalid Stripe Secret Key or other issue.');
        console.error(error.message);
    }
})();
