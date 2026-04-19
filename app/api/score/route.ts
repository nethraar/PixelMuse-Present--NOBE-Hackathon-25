import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

const SYSTEM_PROMPT = `You score AI image prompts written by students for a presentation tool.
Score 0-100 on three axes:
- Specificity: how precise and detailed the prompt is (vague single words = low, rich descriptive phrases = high)
- Style: does it include visual style, color, mood, or aesthetic direction
- Context: is it tied to a clear use case (school, work, personal project, slide type)

The student's mode and project type are provided as context — factor them into your tips.

Return valid JSON only, no extra text:
{
  "specificity": <number>,
  "style": <number>,
  "context": <number>,
  "overall": <number>,
  "tip": "<one actionable coaching sentence targeting the weakest dimension>"
}`;

function heuristicScore(prompt: string, mode?: string, style?: string, category?: string) {
  const words = prompt.trim().split(/\s+/).length;
  const hasStyle = /minimal|clean|bold|dark|light|blue|red|green|purple|color|style|flat|gradient|cartoon|meme|vibrant|pastel|neon|monochrome|sharp|soft|bright|dark/i.test(prompt);
  const hasContext = /presentation|slide|cover|diagram|school|class|project|deck|visual|background|section|divider|header|chart|birthday|party|meme|invite|social/i.test(prompt);
  const hasDetail = words >= 6;
  const hasMood = /calm|energetic|serious|playful|professional|fun|elegant|modern|retro|futuristic|cozy|dramatic/i.test(prompt);

  const specificity = Math.min(100, 20 + words * 5 + (hasDetail ? 15 : 0));
  const styleScore = hasStyle ? (hasMood ? 85 : 65) : 30;
  const contextScore = hasContext ? 80 : (category ? 50 : 35);
  const overall = Math.round((specificity + styleScore + contextScore) / 3);

  let tip: string;
  if (specificity < styleScore && specificity < contextScore) {
    tip = 'Add more specific details — describe shapes, subjects, or layout rather than a single keyword.';
  } else if (styleScore < contextScore) {
    tip = `Include a visual style (e.g. "flat design", "pastel watercolor", "bold geometric") to boost your style score.`;
  } else if (!hasContext) {
    tip = `Mention what this visual is for (e.g. "for a school slide cover" or "birthday invite background") to sharpen context.`;
  } else if (overall >= 80) {
    tip = 'Great prompt! Add a mood or audience detail (e.g. "for a 5-year-old" or "corporate executive audience") to reach 95+.';
  } else {
    tip = 'Try combining style + subject + purpose in one prompt for a significantly higher score.';
  }

  return { specificity, style: styleScore, context: contextScore, overall, tip };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt: string = body?.prompt ?? '';
  const mode: string = body?.mode ?? '';
  const style: string = body?.style ?? '';
  const category: string = body?.category ?? '';

  if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });

  try {
    const contextLine = [
      mode && `Mode: ${mode}`,
      style && `Style preference: ${style}`,
      category && `Category: ${category}`,
    ].filter(Boolean).join(', ');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contextLine ? `${contextLine}\n\nPrompt: ${prompt}` : prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const score = JSON.parse(text);
    return NextResponse.json(score);
  } catch (e: any) {
    console.error('Claude scorer failed, using heuristic:', e?.message);
    return NextResponse.json(heuristicScore(prompt, mode, style, category));
  }
}
