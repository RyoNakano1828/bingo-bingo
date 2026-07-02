import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { generateJoinCode } from "../src/lib/game";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const SAMPLE_NAMES = [
  "山田太郎", "佐藤花子", "鈴木一郎", "田中美咲", "高橋健太",
  "伊藤さくら", "渡辺大輔", "中村愛", "小林翔", "加藤優子",
  "吉田直樹", "山本彩", "松本拓也", "井上真由", "木村聡",
  "林恵美", "清水浩二", "山口智子", "阿部剛", "石川麻衣",
];

const SAMPLE_QUESTIONS = [
  "好きな食べ物は？",
  "趣味は？",
  "休日の過ごし方は？",
  "好きな映画は？",
  "最近ハマっていることは？",
];

async function main() {
  await prisma.bingoCell.deleteMany();
  await prisma.bingoCard.deleteMany();
  await prisma.userAnswer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.question.deleteMany();
  await prisma.event.deleteMany();

  const event = await prisma.event.create({
    data: {
      title: "デモ交流会 2026",
      joinCode: generateJoinCode(),
      excludeSelf: true,
    },
  });

  for (const text of SAMPLE_QUESTIONS) {
    await prisma.question.create({ data: { eventId: event.id, text } });
  }

  const questions = await prisma.question.findMany({
    where: { eventId: event.id },
  });

  for (const name of SAMPLE_NAMES) {
    const user = await prisma.user.create({
      data: {
        eventId: event.id,
        name,
        profile: `${name}です。よろしくお願いします！`,
        groupId: ["営業部", "開発部", "人事部", "マーケ部"][Math.floor(Math.random() * 4)],
      },
    });

    for (const q of questions) {
      const answers: Record<string, string> = {
        "好きな食べ物は？": ["ラーメン", "寿司", "カレー", "ピザ", "焼肉"][Math.floor(Math.random() * 5)],
        "趣味は？": ["キャンプ", "読書", "映画鑑賞", "ランニング", "料理"][Math.floor(Math.random() * 5)],
        "休日の過ごし方は？": ["散歩", "カフェ巡り", "家族と過ごす", "ゲーム", "ショッピング"][Math.floor(Math.random() * 5)],
        "好きな映画は？": ["千と千尋", "インセプション", "アベンジャーズ", "君の名は", "タイタニック"][Math.floor(Math.random() * 5)],
        "最近ハマっていることは？": ["筋トレ", "写真", "プログラミング", "旅行計画", "ガーデニング"][Math.floor(Math.random() * 5)],
      };
      await prisma.userAnswer.create({
        data: {
          userId: user.id,
          questionId: q.id,
          answer: answers[q.text] ?? "秘密",
        },
      });
    }
  }

  console.log("=== シード完了 ===");
  console.log(`イベント名: ${event.title}`);
  console.log(`イベントID: ${event.id}`);
  console.log(`参加コード: ${event.joinCode}`);
  console.log(`管理者トークン: ${event.adminToken}`);
  console.log(`参加者: ${SAMPLE_NAMES.length} 人`);
  console.log(`質問: ${SAMPLE_QUESTIONS.length} 件`);
  console.log("");
  console.log("管理画面: http://localhost:3000/admin");
  console.log(`イベント管理: http://localhost:3000/admin/events/${event.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
