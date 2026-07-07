# 交流ビンゴ

イベント参加者同士が会場を歩き回り、お互いを探して質問しながらビンゴを完成させる交流型ゲームの Web アプリです。

## 機能

### 管理者
- イベント作成・編集・終了
- 質問の追加・削除
- 参加者一覧と回答状況の確認
- ゲーム開始（全参加者の 4×4 ビンゴカードを自動生成）
- ランキング表示

### 参加者
- 参加コードでイベントに参加
- プロフィール登録（名前・アイコン・自己紹介・グループ）
- 全質問への回答登録（本人以外非公開）
- ビンゴカードでマスを開く（人物を探す → 質問 → 回答入力 → 正誤判定）
- ランキング確認

## 技術スタック

- **Next.js 16** (App Router)
- **TypeScript**
- **Prisma 7** + **Supabase (PostgreSQL)**
- **Tailwind CSS 4**

## セットアップ

### 1. Supabase プロジェクト作成

1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. **Project Settings → Database → Connection string** を開く
3. 次の 2 つをコピー:
   - **Transaction pooler**（port `6543`）→ `DATABASE_URL`
   - **Direct connection**（port `5432`）→ `DIRECT_URL`

### 2. 環境変数

`.env.example` を `.env` にコピーし、Supabase の接続文字列を設定:

```env
DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...:5432/postgres"
```

### 3. 起動

```bash
npm install
npm run dev
```

`npm run dev` 実行時に、マイグレーションとデモデータの投入が自動で行われます（初回のみ）。

http://localhost:3000 でアクセスできます。

## Vercel デプロイ

### 1. マイグレーション（初回・スキーマ変更時）

Vercel のビルド環境から Supabase の Direct 接続（5432）に届かないため、**マイグレーションはローカルで実行**します。

```bash
npm run db:migrate
```

（`.env` に `DIRECT_URL` が必要）

### 2. 環境変数

**Settings → Environment Variables**（Production / Preview 両方）:

| 変数 | 必須 | 値 |
|------|------|-----|
| `DATABASE_URL` | ✅ | Supabase **Transaction pooler**（port `6543`）+ `?pgbouncer=true` |
| `DIRECT_URL` | ローカルのみ | Vercel には **不要**（ビルドで使いません） |

### 3. Build Command

```bash
npm run build
```

`prisma generate` → `next build` のみ実行します（ビルド中に DB 接続しません）。

### 4. デプロイ後

ローカルで `npm run db:init` 済みなら、Supabase 上にテーブルとデモデータがあります。未実行の場合はローカルから `npm run db:migrate` と `npm run db:seed` を実行してください。

## デモデータ（最初から入っています）

| 項目 | 値 |
|------|-----|
| イベント ID | `demo-event-local-001` |
| 参加コード | `DEMO26` |
| 管理者トークン | `demo-admin-token-local` |

- 参加者 20 人・質問 5 件が登録済み
- 管理画面 → 「既存イベントにログイン」でイベント ID と上記トークンを入力

デモデータを作り直す場合:

```bash
# 全データ削除 → マイグレーション再適用 → デモ seed（DB 丸ごとリセット）
npm run db:reset

# データのみ削除してデモ seed し直す（スキーマはそのまま）
npm run db:reset-demo
```

`db:reset` は **接続先 DB の全データを削除** します。`.env` の `DIRECT_URL` が必要です。

## 使い方

### 1. 管理者：デモイベントで試す
1. http://localhost:3000/admin にアクセス
2. 「既存イベントにログイン」でイベント ID `demo-event-local-001` と管理者トークン `demo-admin-token-local` を入力
3. 「ゲーム開始」でビンゴカードを生成（参加者 16 人以上必要）

### 2. 参加者：デモで試す
1. http://localhost:3000 で参加コード `DEMO26` を入力
2. 新規登録するか、既存のデモ参加者として別ブラウザでプレイ

### 3. 管理者：新規イベント作成
1. http://localhost:3000/admin にアクセス
2. イベント名を入力して「イベントを作成」
3. 表示される **参加コード** を参加者に共有
4. **管理者トークン** は管理画面ログイン用に保管

### 4. 管理者：質問登録
管理画面で質問を追加（例: 好きな食べ物、趣味 など）

### 5. 参加者：登録
1. トップページで参加コードを入力
2. プロフィールを登録
3. 「質問への回答」で全質問に回答

### 6. 管理者：ゲーム開始
- 参加者が **16 人以上** 揃ったら「ゲーム開始」をクリック
- 全参加者に 4×4 ビンゴカードが生成されます

### 7. 参加者：プレイ
1. ビンゴカードで表示された人を会場で探す
2. 本人に質問してマスをタップ
3. 表示された質問の答えを入力
4. 正解でマスが開き、ビンゴ成立を目指す

## ゲームルール

- カードは 4×4（16 マス）
- 各マスに参加者が 1 人ずつ配置（重複なし、自分は除外）
- 各マスには質問が 1 つ割り当て（未出題優先）
- 正誤判定: 完全一致（前後空白除去・大文字小文字無視）
- ビンゴ: 横 4・縦 4・斜め 2 の計 10 ライン
- ランキング: ビンゴ数 → 開いたマス数 → クリア時間 の順

## データベース

Supabase（PostgreSQL）上にテーブルを作成します。

主要モデル: `Event`, `User`, `Question`, `UserAnswer`, `BingoCard`, `BingoCell`

## 開発

```bash
npm run dev      # 開発サーバー
npm run build    # ビルド
npm run lint     # Lint
npx prisma studio  # DB ブラウザ
```
