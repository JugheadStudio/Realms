import OpenAI from "openai";
const openai = new OpenAI();

export async function POST(req) {
  const { message } = await req.json();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a creative dungeon master who narrates the adventure, but dont make your responses too long. Also dont add markdown styling to the messages" },
      { role: "user", content: message },
    ],
  });

  const apiResponse = completion.choices[0].message;

  return new Response(JSON.stringify(apiResponse), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
