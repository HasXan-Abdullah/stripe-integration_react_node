require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const stripe = require("stripe")("sk_test_51PUk3D07gSOU5azxAOSpkR9Fibzudt8hhdNgb96GnDo2tjkgFGBxQ1s8dAyTCMz64XsGFscx02OI9CyBWUtXOBwU00QmpVdyEp");
app.use(express.json());
app.use(cors());

// checkout api
app.post("/api/create-checkout-session", async (req, res) => {
    const { products } = req.body;

    // Calculate the total amount in cents (USD)
    let totalAmount = 0;
    products.forEach((product) => {
        totalAmount += product.price * product.qnty * 100; // Convert to cents in USD
    });

    console.log("Total Amount in cents (USD):", totalAmount);

    // Minimum amount check (50 cents in USD)
    if (totalAmount < 50) {
        return res.status(400).json({ error: 'The total amount must be at least 50 cents in USD.' });
    }

    const lineItems = products.map((product) => ({
        price_data: {
            currency: "usd", // Change currency to USD
            product_data: {
                name: product.dish,
                images: [product.imgdata]
            },
            unit_amount: Math.round(product.price * 100), // Convert price to cents in USD
        },
        quantity: product.qnty
    }));

    console.log("Line Items:", lineItems);

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: "http://localhost:3000/success",
            cancel_url: "http://localhost:3000/cancel",
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ error: "Failed to create checkout session" });
    }
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
