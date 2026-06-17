import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { mealName, ingredients } = await req.json();

  const ingredientText = ingredients
    .map((ing: { name: string; amount: string }) => `${ing.name} ${ing.amount}`)
    .join("、");

  const prompt = `料理「${mealName}」の詳細なレシピを教えてください。
使用食材（1人分）：${ingredientText}

以下のJSON形式のみで出力してください。説明文やコードブロックは不要です。

{"steps":["①下準備の手順（具体的に）","②加熱の手順（火加減・時間を明記）","③仕上げの手順"],"tips":"おいしく作るコツを1文で"}

ルール：
- stepsは3〜5ステップ
- 各ステップに火加減（強火・中火・弱火）と時間（〇分）を含める
- 初心者でもわかる具体的な表現`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "レシピの取得に失敗しました" }, { status: 500 });
    }

    const recipe = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ recipe });
  } catch (error) {
    console.error("Recipe API error:", error);
    return NextResponse.json({ error: "レシピの取得に失敗しました" }, { status: 500 });
  }
}
