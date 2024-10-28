// src/app/api/test/route.js
import OpenAI from "openai";
const openai = new OpenAI();

export async function POST(req) {
    const { message } = await req.json(); // Get the message from the request body

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are a creative dungeon master who narrates the adventure" },
            { role: "user", content: message },
        ],
    });

    const assistantMessage = completion.choices[0].message;

    return new Response(JSON.stringify(assistantMessage), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}