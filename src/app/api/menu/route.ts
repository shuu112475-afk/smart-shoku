import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const maxDuration = 60;

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { targetCalories, excludedIngredients, weeklyBudget, saleInfo } =
    await req.json();

  const excluded =
    excludedIngredients?.length > 0
      ? excludedIngredients.join("、")
      : "なし";

  const saleText =
    saleInfo && Object.keys(saleInfo).length > 0
      ? Object.entries(saleInfo)
          .map(([day, items]) => `${day}曜日: ${(items as string[]).join("、")}`)
          .join("\n")
      : "特売情報なし";

  const prompt = `あなたはプロの栄養士AIです。以下の条件で1週間分の献立概要をJSON形式で出力してください。

【条件】
- 1日の目標カロリー: ${targetCalories} kcal
- 除外食材: ${excluded}
- 週の食費予算: ${weeklyBudget}円
- 今週の特売情報: ${saleText}

【出力形式】コードブロックや説明文は不要。JSONのみ出力。

{"月":{"breakfast":{"name":"料理名","kcal":数値,"ingredients":[{"name":"食材名","amount":"分量"}]},"lunch":{"name":"料理名","kcal":数値,"ingredients":[{"name":"食材名","amount":"分量"}]},"dinner":{"name":"料理名","kcal":数値,"ingredients":[{"name":"食材名","amount":"分量"}]},"totalKcal":数値},"火":{...},"水":{...},"木":{...},"金":{...},"土":{...},"日":{...}}

【ルール】
- 朝食400kcal前後、昼食500kcal前後、夕食は残りカロリーで調整
- 食材の分量は1人分の具体的な数値（150g、大さじ1、2個など）
- 食材の使い回しを意識してコスト削減
- recipeフィールドは含めない
- 栄養バランスを考慮`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        let fullText = "";

        const messageStream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        });

        // 5秒ごとにkeep-aliveを送信して接続を維持
        const keepAlive = setInterval(() => {
          controller.enqueue(encoder.encode(": ping\n\n"));
        }, 5000);

        for await (const chunk of messageStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            fullText += chunk.delta.text;
          }
        }

        clearInterval(keepAlive);

        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          send({ error: "AIの返答形式が不正です。もう一度お試しください。" });
          controller.close();
          return;
        }

        const menu = JSON.parse(jsonMatch[0]);
        send({ menu });
      } catch (error) {
        console.error("Claude API error:", error);
        send({ error: "献立の生成に失敗しました。もう一度お試しください。" });
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
