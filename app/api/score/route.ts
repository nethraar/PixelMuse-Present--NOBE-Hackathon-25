import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

const SYSTEM_PROMPT = `You score AI image prompts for a student presentation tool.
Score 0-100 on three axes:
- Specificity: how precise and detailed is the prompt
- Style direction: does it include visual style, color, or tone
- Context clarity: is it tied to a clear presentation purpose

Return valid JSON only, no extra text:
{
  "specificity": <number>,
  "style": <number>,
  "context": <number>,
  "overall": <number>,
  "tip": "<one sentence coaching tip>"
}`;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const score = JSON.parse(text);
    return NextResponse.json(score);
  } catch {
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 });
  }
}
