import { PrismaClient } from "../src/generated/prisma/client";

export const DEMO_EVENT_ID = "demo-event-local-001";
export const DEMO_JOIN_CODE = "DEMO26";
export const DEMO_ADMIN_TOKEN = "demo-admin-token-local";

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

const GROUPS = ["営業部", "開発部", "人事部", "マーケ部"];

const ANSWER_OPTIONS: Record<string, string[]> = {
  "好きな食べ物は？": ["ラーメン", "寿司", "カレー", "ピザ", "焼肉"],
  "趣味は？": ["キャンプ", "読書", "映画鑑賞", "ランニング", "料理"],
  "休日の過ごし方は？": ["散歩", "カフェ巡り", "家族と過ごす", "ゲーム", "ショッピング"],
  "好きな映画は？": ["千と千尋", "インセプション", "アベンジャーズ", "君の名は", "タイタニック"],
  "最近ハマっていることは？": ["筋トレ", "写真", "プログラミング", "旅行計画", "ガーデニング"],
};

function pick<T>(items: T[], index: number): T {
  return items[index % items.length];
}

export function logDemoCredentials(event: {
  id: string;
  title: string;
  joinCode: string;
  adminToken: string;
}) {
  console.log("");
  console.log("=== デモデータ ===");
  console.log(`イベント名: ${event.title}`);
  console.log(`イベントID: ${event.id}`);
  console.log(`参加コード: ${event.joinCode}`);
  console.log(`管理者トークン: ${event.adminToken}`);
  console.log(`参加者: ${SAMPLE_NAMES.length} 人`);
  console.log(`質問: ${SAMPLE_QUESTIONS.length} 件`);
  console.log("");
  console.log("トップページ: http://localhost:3000 （参加コード DEMO26）");
  console.log("管理画面: http://localhost:3000/admin");
  console.log(`イベント管理: http://localhost:3000/admin/events/${event.id}`);
}

export async function seedDemoData(
  prisma: PrismaClient,
  options: { force?: boolean } = {}
) {
  const existing = await prisma.event.findUnique({
    where: { joinCode: DEMO_JOIN_CODE },
  });

  if (existing && !options.force) {
    logDemoCredentials(existing);
    return existing;
  }

  if (options.force) {
    await prisma.bingoCell.deleteMany();
    await prisma.bingoCard.deleteMany();
    await prisma.userAnswer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.question.deleteMany();
    await prisma.event.deleteMany();
  }

  const event = await prisma.event.create({
    data: {
      id: DEMO_EVENT_ID,
      title: "デモ交流会 2026",
      joinCode: DEMO_JOIN_CODE,
      adminToken: DEMO_ADMIN_TOKEN,
      excludeSelf: true,
    },
  });

  for (const text of SAMPLE_QUESTIONS) {
    await prisma.question.create({ data: { eventId: event.id, text } });
  }

  const questions = await prisma.question.findMany({
    where: { eventId: event.id },
  });

  for (let i = 0; i < SAMPLE_NAMES.length; i++) {
    const name = SAMPLE_NAMES[i];
    const user = await prisma.user.create({
      data: {
        eventId: event.id,
        name,
        profile: `${name}です。よろしくお願いします！`,
        groupId: pick(GROUPS, i),
      },
    });

    for (let j = 0; j < questions.length; j++) {
      const q = questions[j];
      const options = ANSWER_OPTIONS[q.text] ?? ["秘密"];
      await prisma.userAnswer.create({
        data: {
          userId: user.id,
          questionId: q.id,
          answer: pick(options, i + j),
        },
      });
    }
  }

  logDemoCredentials(event);
  return event;
}
