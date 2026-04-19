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

function heuristicScore(text: string) {
  const words = text.split(' ').length;
  const hasStyle = /minimal|clean|bold|dark|light|blue|red|color|style|flat|gradient|cartoon|meme|vibrant/i.test(text);
  const hasContext = /presentation|slide|cover|diagram|school|class|project|deck|visual/i.test(text);
  const specificity = Math.min(100, 30 + words * 4);
  const style = hasStyle ? 75 : 35;
  const context = hasContext ? 80 : 45;
  const overall = Math.round((specificity + style + context) / 3);
  const tip = overall < 60
    ? "Add a visual style (e.g. 'minimal blue') and presentation context to improve your score."
    : overall < 80
    ? "Specify color palette and layout type to push above 80."
    : "Strong prompt — try adding a mood or audience to reach 95+.";
  return { specificity, style, context, overall, tip };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt: string = body?.prompt ?? '';

  if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const score = JSON.parse(text);
    return NextResponse.json(score);
  } catch (e: any) {
    console.error('Claude scorer failed, using heuristic:', e?.message);
    return NextResponse.json(heuristicScore(prompt));
  }
}
