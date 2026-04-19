import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json().catch(() => ({}));
  if (!prompt) return NextResponse.json({ error: 'No prompt' }, { status: 400 });

  const seed = Math.floor(Math.random() * 999999);
  // nofeed=true keeps images out of public Pollinations feed
  // enhance=false prevents auto-rewrite of our carefully built prompt
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=1024&height=576&nologo=true&nofeed=true&enhance=false&seed=${seed}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(45000),
      headers: { 'User-Agent': 'PixelMuse-Present/1.0' },
    });
    if (!res.ok) throw new Error(`Pollinations returned ${res.status}`);

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    return NextResponse.json({ url: `data:${contentType};base64,${base64}` });
  } catch (e: any) {
    console.error('Image gen failed:', e?.message);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
