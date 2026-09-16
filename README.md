# Estate Machare

不動産の売買・賃貸と、引越しの相談をつなぐマッチングプラットフォーム。

現在の公開画面は物件写真、間取り・面積・築年・アクセス、売買価格・月額賃料を中心に構成しています。物件の問い合わせから内見や条件を相談でき、引越し依頼には物件所在地が入居先として引き継がれます。旧版の日額レンタル・購入切替データとAPIは互換性のため残しています。以下の旧取引機能に関する記述は、この互換機能を指します。

ブランド、情報設計、既存機能との対応は [リブランディング設計](docs/rebranding.md) を参照してください。

## 開発

Node.js は `.node-version`、pnpm は `package.json` の `packageManager` に指定したバージョンを使用します。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

http://localhost:3000 で確認できます。起動時にサンプル（物件 48 件・引越し案件 10 件を `lib/server/` で決定的に生成）に加え、数か月使われた後の状態を模したダミーの取引（`lib/server/demo-activity.ts`: 注文・レンタル・問い合わせと返信・運搬の応募と進行・レビュー・取引イベント・通知・審査待ちの出品と案件・停止中のアカウント）を投入します。`DEMO_ACTIVITY=off` にするとサンプルの出品と案件だけになります（テストはこの状態で走ります）。出品と運搬依頼は作成後に審査待ちとなり、運営が承認すると公開されます。問い合わせ・応募・運搬者登録・お問い合わせも保存されます。決済は未実装です。

## データストア

`DATA_STORE` 環境変数でストアを切り替えます。Docker やデータベースサーバーは不要です。

既知の制約: Vercel などのサーバーレス環境では実行環境ごとにメモリが分かれるため、インメモリのままでは操作で増えたデータが画面間で一致しないことや、しばらくして消えることがあります。デモ用途として許容しており、将来は永続ストアに置き換えます（サンプルデータは決定的に生成しているので常に同じです）。

| コマンド         | ストア                      | 用途                                                                                          |
| ---------------- | --------------------------- | --------------------------------------------------------------------------------------------- |
| `pnpm dev`       | インメモリ（既定）          | 通常の開発・Vercel などでのモック表示。プロセス再起動で初期状態に戻る。将来 PostgreSQL へ移行 |
| `pnpm dev:mock`  | インメモリ                  | `pnpm dev` と同じ。意図を明示したいとき                                                       |
| `pnpm dev:agent` | PGlite（組み込み Postgres） | エージェント環境・CI で DB を操作しながら実装する。データは `.data/pglite/` に永続化          |

- `lib/server/store/repository.ts` がコレクションごとの契約（`list` / `get` / `create` / `update` / `delete`、すべて非同期）です。
- `lib/server/store/memory.ts` が揮発性のインメモリ実装、`lib/server/store/pglite/` が PGlite 実装です。どちらも `lib/server/store/repository-contract.test.ts` の同じ契約テストを通ります。
- PGlite のスキーマは `db/migrations/*.sql`（PostgreSQL 向けの DDL）で管理し、起動時に未適用分を `schema_migrations` に記録しながら適用します。`listings` が空ならサンプルを投入します。PostgreSQL に移す際は `lib/server/store/pglite/sql-repository.ts` の接続先を差し替えるだけで、SQL とテーブル定義は共通です。
- `lib/server/store/index.ts` が `listings` / `transportJobs` / `submissions` を `globalThis` 上のシングルトンとして提供します（開発時の HMR で消えません）。テストでは `resetStore()` で初期化します。
- サービス（`lib/server/listings.ts` / `transport.ts` / `submissions.ts`）はストア経由でのみデータに触れます。
- 連絡先メールアドレスは公開エンティティに保存せず、物件・案件の公開フィールドにも含めません。
- 出品・運搬依頼・問い合わせ・応募はログインが必要で、作成者の ID を `ownerUserId`（submission は `userId`）として保存します。更新・削除は所有者または運営のみ、審査待ち・却下の行は所有者と運営だけが閲覧できます。

## 認証

Auth.js（next-auth v5）の Credentials プロバイダを使い、外部サービスなしで動きます。セッションは JWT を Cookie に保存します。ユーザーテーブルは持たず、デモアカウントを環境変数から読みます（`.env.example` 参照）。

| 環境変数                                     | 内容                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `AUTH_SECRET`                                | セッション署名用。本番では必須（未設定だと Auth.js がリクエストを拒否）。非本番は固定値に代替                 |
| `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD`   | 運営ロール（`admin`）のデモアカウント                                                                         |
| `DEMO_SELLER_EMAIL` / `DEMO_SELLER_PASSWORD` | 出品者役（`user`）のデモアカウント。サンプル出品の一部（trc-001 / cmb-002 など）と運搬案件を所有              |
| `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD`     | 買い手・運搬者役（`user`）のデモアカウント                                                                    |
| `DEMO_PERSONA_PASSWORD`                      | 登場人物アカウント共通のパスワード。非本番は `dev-persona` に代替、本番で未設定なら一覧には出るがログイン不可 |
| `DEMO_ACTIVITY`                              | `off` でダミーの取引データを投入しない（既定は投入）                                                          |

非本番でアカウントが未設定なら `admin@example.com` / `dev-admin`、`seller@example.com` / `dev-seller`、`user@example.com` / `dev-user` を使えます。本番（Vercel など）ではメールとパスワードの両方を設定したアカウントだけが有効になります。

環境変数のアカウントに加え、`lib/server/auth/accounts.ts` にコード定義の登場人物（出品者 10・買い手 3・運搬者 3、いずれも `user` ロール、メールは `<id>@example.com`）があり、サンプル出品・運搬案件・ダミーの取引の相手役になります。出品者ページの名前と出品の所有者はこの人物に対応しています。

- `auth.ts` が Auth.js の設定（`handlers` / `auth`）です。`app/api/auth/[...nextauth]` が Auth.js のエンドポイントです。
- `lib/server/auth/accounts.ts` が環境変数からアカウントを読み、定数時間比較で認証します。`lib/server/auth/session.ts` の `getCurrentUser()` / `requireUser()` / `requireAdmin()` / `canManage()` / `canView()` をページと API で使います。
- `/account`（マイページ）は `lib/server/account.ts` で自分の出品・運搬依頼と届いた問い合わせ・応募、送った問い合わせ・応募をまとめます。
- 問い合わせと応募はスレッドになります（`lib/server/threads.ts`）。参加者は送信者と対象の所有者で、運営は閲覧のみです。両参加者が返信でき（`messages` テーブル）、対象の所有者が状態（未対応 / 対応中 / 成約 / 見送り）を変えます。応募を成約にすると案件は「調整中」になり、所有者はマイページから「完了」にできます。応募を受け付けるのは「募集中」の案件だけで、「完了」の案件は公開ボードに出ません。
- 既読管理（`lib/server/thread-reads.ts`、`thread_reads` テーブル）: スレッドページを開くと参加者ごとに `readAt` を記録します。所有者は一度も開いていないスレッドと相手の新しい返信、送信者は所有者の新しい返信を未読とし、マイページに「未読」バッジと概要（未読のやり取り、未対応の問い合わせ・応募、申込中のレンタル、審査待ちの出品）を表示します。
- 運搬者プロフィール（`lib/server/carriers.ts`、`carrier_profiles` テーブル）: ログインしたユーザーが `/transport/register` で名前・区分・拠点・車両（複数）・対応地域（都道府県、複数）を登録・更新します。案件ページでは所有者と運営に「この案件に合う運搬者」（対応地域に出発地または届け先を含む運搬者。両方含むものを先に。重量が読める案件は積める車両を持つ運搬者だけ）を表示し、マイページには対応地域の募集中案件を表示します。応募フォームの車両はプロフィールの先頭の車両が初期値です。匿名の運搬者登録（submission）は廃止しました。
- 運搬の進行: 案件は `募集中` →（応募の成約で）`調整中` → `運搬中` → `完了`（`調整中` から直接 `完了` も可）。`運搬中` にできるのは成約した応募の送信者（受託運搬者）と所有者・運営、`完了` は所有者・運営で、開始・完了はそれぞれ相手に通知します。案件には応募せずに「質問する」（`transportInquiry` スレッド）こともでき、運営は問い合わせ・応募・質問のスレッドを終了（見送り）したり、申込中・レンタル中のレンタルを取り消したりできます（当事者に通知）。
- 購入注文（`lib/server/orders.ts`、`orders` テーブル）: 詳細ページの「購入する」で申込（`POST /api/listings/[id]/orders`）。申込時の販売価格を写し、`申込中` → 出品者が `承諾` / 辞退 → `引き渡し済み` → 買い手が `完了`（受け取り確認）。買い手は申込中のみキャンセル、運営は完了前ならいつでも取り消し（`PATCH /api/orders/[id]`）。申込中・承諾・引き渡し済みの注文がある出品には新しい申込を受け付けず、完了した出品は自動的に取り下げます。レンタルの購入切替は `引き渡し済み` の注文になり、完了した注文の買い手は出品者をレビューできます。
- 取引の履歴（`lib/server/deal-events.ts`、`deal_events` テーブル）: 注文・レンタル・運搬案件の状態が変わるたびに、誰が・いつ・何に変えたかを記録します（申込・作成、審査、応募の成約、運搬の開始・完了、運営の取り消しを含む）。`/account/deals/[kind]/[id]` は当事者と運営だけが開け、要約・時系列・関連するやり取り・関連する取引（レンタルと購入切替の注文）を表示します（`lib/server/deals.ts`）。マイページの「取引の履歴」と運営の注文・レンタル一覧から辿れます。
- レンタル購入は出品ごとの条件（`rentToOwnCreditRate` %、任意の `rentToOwnCreditCap` 円）で計算します（`lib/rent-to-own.ts`）。詳細ページのシミュレーターで日数から充当額と購入価格を確認でき、期間を指定してレンタルを申し込めます（`lib/server/rentals.ts`、`rentals` テーブル）。申込 → 所有者が承認（レンタル中）または辞退 → 申込者が購入に切り替え（申込時の条件で購入価格を確定）または所有者が返却を確認。申込中・レンタル中の期間は予約済みとして重複申込を 409 で拒否します。運営は閲覧のみです。
- アプリ内通知（`lib/server/notifications.ts`、`notifications` テーブル）: 問い合わせ / 応募の受信、返信、スレッドの状態変更、レンタルの申込と状態変更、審査結果を相手側のユーザーに通知します。各サービスが `notify()` を呼ぶだけで、メール送信はしません。ヘッダーのベルが未読数を 60 秒ごとに取得し、`/account/notifications` で一覧・既読化できます。
- レビュー（`lib/server/reviews.ts`、`reviews` テーブル）: 完了または購入に切り替えたレンタルの申込者、成約した問い合わせの送信者が出品者を 1〜5 で評価できます（取引ごとに 1 件）。投稿すると出品者が所有する全出品の `seller.rating` / `seller.reviews` を加重平均で更新し、詳細ページに出品者へのレビューを表示します。運営は取引管理 > レビューで一覧できます。出品者ページ（`/sellers/[id]`、`lib/server/sellers.ts`）では出品者アカウントごとに掲載中の出品、レビューから集計した平均評価、レビュー一覧を表示し、詳細ページの出品者ブロックからリンクします。
- 出品の取り下げ: 所有者または運営が `PATCH /api/listings/[id]/status` `{ status: 'withdrawn' | 'listed' }` で取り下げ・再掲載できます。取り下げ中は公開一覧・詳細・問い合わせ・レンタル申込から外れ（`isApproved()` が `withdrawnAt` も見ます）、審査状態はそのまま残ります。申込中・レンタル中のレンタルがある間は取り下げできません（409）。運営が取り下げると所有者に通知します。
- 出品の写真は外部ストレージを使わず、ブラウザ側で縮小した JPEG のデータ URL として保存します（`lib/images.ts`）。`Listing.images`（長辺 1200px、最大 5 枚）は詳細ページだけが返し、一覧系は先頭画像のサムネイル（長辺 400px）の `Listing.image` だけを持ちます。写真が無い出品はカテゴリの見本画像です。
- テストでは `test/mock-auth.ts` で `@/auth` を差し替え、`signInAs()` でログイン状態を切り替えます。
- 運営審査（`/admin`、`/api/admin/queue`）は「ログイン済みかつ `role === 'admin'`」で許可します。未ログインは 401（ページはログインへリダイレクト）、権限なしは 403 です。
- `/admin` 以下は `app/admin/layout.tsx` の管理者画面レイアウト（`components/admin/admin-shell.tsx`。サイドバーの運営メニューと上部バー）で描画し、利用者向けのヘッダー・フッターは使いません。認証ゲートはこのレイアウトで行い、配下のページは運営であることを前提にデータ取得だけ行います。メニューはダッシュボード / アカウント管理 / 取引管理 / 運搬管理（`components/admin/admin-nav.tsx`）で、各管理画面は上部タブ（`components/admin/admin-section.tsx`）で内容を切り替えます。一覧データは `lib/server/admin-overview.ts` から取得します。ダッシュボードには承諾待ちの注文・申込中のレンタル・運搬中の案件などの件数に加え、`deal_events` を新しい順に並べた「直近の取引の動き」（各行から取引の履歴ページへ移動）と「直近のレビュー」を表示します。
- アカウントの停止は `account_statuses` テーブル（行が無ければ有効）に記録します（`lib/server/auth/account-status.ts`）。停止中はログインが `code=suspended` で拒否され、既存セッションも `getCurrentUser()` が未ログイン扱いにします。資格情報は引き続き環境変数で、ユーザー登録を作るときは `users` テーブルに統合します。
- ヘッダーのログイン / ログアウトはクライアント側で `useSession()` を使い、ページの静的レンダリングを壊しません。

### PGlite の操作

| コマンド                   | 内容                                                      |
| -------------------------- | --------------------------------------------------------- |
| `pnpm db:migrate`          | 未適用のマイグレーションを適用（空ならサンプル投入）      |
| `pnpm db:reset`            | データディレクトリを削除して作り直す                      |
| `pnpm db:sql "select ..."` | SQL を 1 文実行して結果を表示（`dev:agent` 稼働中でも可） |
| `pnpm test:pglite`         | テスト全体を PGlite（`memory://`）上で実行                |

データディレクトリは `PGLITE_DATA_DIR` で変更できます（既定 `.data/pglite`、`memory://` で揮発）。新しいマイグレーションは `db/migrations/0002_xxx.sql` のように連番で追加します。

## ページ構成

| パス                           | 内容                                                                                                                                                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                            | トップ。目的別の検索、注目の農機具、運搬案件。ログイン済みなら「あなたの状況」（未読・未対応・申込中・審査待ち・対応地域の案件・通知の件数）                                                                                      |
| `/listings`                    | 農機具一覧。キーワード・カテゴリ・取引条件・ページネーション                                                                                                                                                                      |
| `/listings/new`                | 出品フォーム                                                                                                                                                                                                                      |
| `/sellers/[id]`                | 出品者ページ。掲載中の出品、平均評価、レビュー一覧                                                                                                                                                                                |
| `/listings/[id]`               | 農機具の詳細と同じカテゴリの農機具。所有者・運営には「編集する」                                                                                                                                                                  |
| `/listings/[id]/edit`          | 出品の編集（所有者・運営のみ）。写真の追加・削除もここで行う                                                                                                                                                                      |
| `/listings/[id]/inquiry`       | 出品者への連絡（購入・レンタル・レンタル購入・質問）                                                                                                                                                                              |
| `/transport`                   | 運搬案件ボード                                                                                                                                                                                                                    |
| `/transport/[id]`              | 運搬案件の詳細と応募フォーム。所有者・運営には合う運搬者と「編集する」                                                                                                                                                            |
| `/transport/[id]/edit`         | 運搬依頼の編集（所有者・運営のみ）                                                                                                                                                                                                |
| `/transport/[id]/inquiry`      | 案件に質問する（要ログイン、応募とは別のスレッド）                                                                                                                                                                                |
| `/transport/register`          | 運搬者プロフィールの登録・編集（要ログイン）                                                                                                                                                                                      |
| `/transport/pricing`           | 運搬料金のめやす                                                                                                                                                                                                                  |
| `/guide` / `/faq` / `/contact` | はじめての方へ / よくある質問 / お問い合わせフォーム                                                                                                                                                                              |
| `/login`                       | ログイン（メールアドレスとパスワード）                                                                                                                                                                                            |
| `/account`                     | マイページ。自分の出品・運搬依頼と届いた連絡、送った連絡、案件の完了、借りている / 貸している農機具の操作                                                                                                                         |
| `/account/threads/[id]`        | 問い合わせ・応募のやり取り（返信、所有者は状態変更）                                                                                                                                                                              |
| `/account/notifications`       | 通知一覧（クリックで既読にして遷移、すべて既読）                                                                                                                                                                                  |
| `/account/deals/[kind]/[id]`   | 取引の履歴（注文 / レンタル / 運搬案件の時系列。当事者と運営のみ）                                                                                                                                                                |
| `/transport/new`               | 運搬依頼フォーム（要ログイン）                                                                                                                                                                                                    |
| `/admin`                       | 運営画面（管理者レイアウト）。ダッシュボード、アカウント管理 `/admin/accounts`、取引管理 `/admin/deals`（出品審査 / 注文 / レンタル / 問い合わせ / レビュー）、運搬管理 `/admin/transport`（運搬依頼審査 / 応募 / 質問 / 運搬者） |

## 品質チェック

`pnpm check` で lint・整形・型・未使用コード・テストをまとめて確認できます。本番ビルドは `pnpm build` で別途確認します。既存の `next/font/google` はビルド時に Google Fonts へのネットワーク接続を使用します。

| コマンド             | 内容                                                |
| -------------------- | --------------------------------------------------- |
| `pnpm lint`          | Next.js / React / TanStack Query の ESLint チェック |
| `pnpm lint:fix`      | ESLint の自動修正                                   |
| `pnpm format`        | Prettier で整形                                     |
| `pnpm format:check`  | 整形の差分確認                                      |
| `pnpm typecheck`     | Next.js の型生成と `tsc --noEmit`                   |
| `pnpm knip`          | 未使用ファイル・依存関係・export の検出             |
| `pnpm test`          | Vitest の一括実行                                   |
| `pnpm test:watch`    | Vitest の監視実行                                   |
| `pnpm test:coverage` | テストとカバレッジ出力（`coverage/`）               |
| `pnpm build`         | 本番ビルド（型エラーも検出）                        |

変更時は失敗するテストを先に追加し、最小限の実装で通した後に整理します。サーバーサービスと API のテストに加え、画面では実際の QueryClient と Testing Library を使って取得・エラー・再試行を検証します。テスト環境だけ `server-only` をモックし、本番のサーバー境界は Next.js が検証します。

## データ取得と責務

- `lib/server/` は `server-only`。サンプルデータ、検索、取引方法の判定、運送料見積もりを管理します。
- `lib/data.ts` は共有の型・選択肢・表示用フォーマットです。クライアントにデータソースを含めません。
- トップと一覧ページの初期データは Server Component で取得して画面に渡します。条件を変えたあとの取得は TanStack Query から `GET /api/listings` を呼び出します。
- Query key はカテゴリ・取引条件・キーワード・ページを含みます。リクエストのキャンセル、キャッシュ、読込中・エラー・再試行を Query で管理します。
- 一覧ページの検索条件は URL（`q` / `category` / `deal` / `page`）と同期し、ブラウザの戻る・進むに追従します。
- 詳細ページと運搬一覧はサーバーでデータを取得します。クライアントには選択状態など表示に必要な処理を残します。
- 入力検証は `lib/validation/` に置き、フォーム（送信前）と API（受信時）の両方で同じ関数を使います。

`GET /api/listings` は `category`（`すべて` または画面のカテゴリ）、`deal`（`all` / `sale` / `rent` / `rentToOwn`）、`q`（キーワード、100 文字まで）、`page`、`pageSize`（1〜48、既定 12）を受け取り、`{ items, total, page, pageSize, pageCount }` を返します。不正条件は HTTP 400 です。

絞り込みの任意項目として `prefecture`（都道府県）、`priceMin` / `priceMax`（円。`deal=rent` のときは日額、それ以外は販売価格）、`sort`（`newest` / `priceAsc` / `priceDesc` / `rentAsc`。価格の無い出品は末尾）、`from` / `to`（YYYY-MM-DD。両方あるとき、レンタル可能で申込中・レンタル中の期間と重ならない出品だけ）も受け取ります。一覧画面の URL と TanStack Query のキーにも同じ項目を通します（`lib/listing-search-params.ts`）。

CRUD の API は次のとおりです。成功時は作成が HTTP 201、取得・更新が 200、削除が 204、検証エラーは 400 で `{ error, errors }`、対象がない場合は 404 を返します。

| メソッドとパス                                                       | 内容                                                                                                                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/listings`                                                 | 農機具を作成（要ログイン、`moderationStatus: pending`）。`{ id, receivedAt, listing }`                                                      |
| `GET / PUT / DELETE /api/listings/[id]`                              | 取得は承認済み、または所有者・運営。更新・削除は所有者・運営のみ（問い合わせも削除）                                                        |
| `PATCH /api/listings/[id]/status`                                    | 取り下げ / 再掲載 `{ status: 'withdrawn' \| 'listed' }`（所有者・運営。進行中のレンタルがあれば 409）                                       |
| `GET / POST /api/listings/[id]/rentals`                              | 予約済み期間の取得（公開）と申込 `{ startDate, endDate }`（要ログイン。重複・貸出不可は 409）                                               |
| `PATCH /api/rentals/[id]`                                            | レンタルの状態変更 `{ status }`（所有者: active / cancelled / completed、申込者: cancelled / converted、運営: cancelled。不正な遷移は 409） |
| `POST /api/listings/[id]/orders`                                     | 購入の申込 `{ message? }`（要ログイン。購入手続き中・購入不可は 409）                                                                       |
| `PATCH /api/orders/[id]`                                             | 注文の状態変更 `{ status }`（出品者: accepted / cancelled / delivered、買い手: cancelled / completed、運営: cancelled）                     |
| `GET /api/notifications`                                             | 自分の通知（新しい順）と `unreadCount`                                                                                                      |
| `POST /api/reviews`                                                  | レビュー `{ sourceKind: 'rental' \| 'thread', sourceId, rating, comment? }`（要ログイン。権限外 403、未完了・重複 409）                     |
| `PATCH /api/notifications/[id]` / `POST /api/notifications/read-all` | 既読にする（本人のみ）/ すべて既読                                                                                                          |
| `POST /api/listings/[id]/inquiries`                                  | 出品者への連絡を保存（要ログイン）。`{ id, receivedAt }`                                                                                    |
| `GET / POST /api/transport/jobs`                                     | 公開一覧は承認済みのみ。作成は要ログインで審査待ち `{ id, receivedAt, job }`                                                                |
| `GET / PUT / DELETE /api/transport/jobs/[id]`                        | 取得は承認済み、または所有者・運営。更新・削除は所有者・運営のみ（応募も削除）                                                              |
| `POST /api/transport/jobs/[id]/applications`                         | 案件への応募を保存（要ログイン、募集中のみ。それ以外は 409）                                                                                |
| `PATCH /api/transport/jobs/[id]/status`                              | 案件を「運搬中」（受託運搬者・所有者・運営）または「完了」（所有者・運営）にする。不正な遷移は 409                                          |
| `POST /api/transport/jobs/[id]/inquiries`                            | 案件への質問 `{ message }`（要ログイン。完了した案件は 409）                                                                                |
| `GET / PATCH /api/threads/[id]`                                      | スレッドの取得（参加者・運営）と状態変更 `{ status }`（対象の所有者のみ）                                                                   |
| `POST /api/threads/[id]/messages`                                    | 返信 `{ body }`（参加者のみ）。201                                                                                                          |
| `POST /api/contact`                                                  | お問い合わせを保存                                                                                                                          |
| `GET / PUT /api/transport/carrier-profile`                           | 自分の運搬者プロフィールの取得・保存（要ログイン）                                                                                          |
| `GET / POST /api/auth/*`                                             | Auth.js のエンドポイント（ログイン・ログアウト・セッション）                                                                                |
| `GET / POST /api/admin/queue`                                        | 審査キュー（運営ロールのみ）。`status=pending\|approved\|rejected\|all`。判定は `{ kind, id, status, note? }`                               |
| `PATCH /api/admin/accounts/[id]`                                     | アカウントの停止 / 解除 `{ status: 'active' \| 'suspended', note? }`（運営のみ。自分自身は 409）                                            |

TanStack Query の初期データとキャッシュの構成は [公式 SSR ガイド](https://tanstack.com/query/latest/docs/framework/react/guides/ssr) を参照してください。

## CI

GitHub Actions は PR と `main` への push で動作します。lint / format / typecheck / knip / test:coverage / test:pglite / build の 7 ジョブを並列実行し、ひとつが失敗しても他の結果を収集します。同じブランチの古い実行はキャンセルします。

各ジョブは `pnpm install --frozen-lockfile` で依存を固定し、テストのカバレッジを artifact に保存します。Dependabot が npm と GitHub Actions の更新 PR を作成します。
