import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

// Initialize OpenAI with API key from .env
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

(async () => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                {
                    role: "user",
                    content: "Write a haiku about recursion in programming.",
                },
            ],
        });

        console.log(completion.choices[0].message);
    } catch (error) {
        console.error("Error:", error);
    }
})();
