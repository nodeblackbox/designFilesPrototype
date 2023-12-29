const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const app = express();

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = "whsec_5c66d298cae0035cb60186ace659277b7a9d392b204ff38cce182dd0a73ad3e7";

app.post('/webhook', express.raw({ type: 'application/json' }), (request, response) => {
    const sig = request.headers['stripe-signature'];

    let event;

    // try {
    //     event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);


    // } catch (err) {
    //     response.status(400).send(`Webhook Error: ${err.message}`);
    //     return;
    // }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const checkoutSessionCompleted = event.data.object;
            // Then define and call a function to handle the event checkout.session.completed
            break;
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    console.log('finshed')

    // Return a 200 response to acknowledge receipt of the event
    response.send();
});

app.listen(3000, () => console.log('Running on port 4242'));