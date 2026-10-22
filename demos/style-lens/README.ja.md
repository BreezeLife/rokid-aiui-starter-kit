# Style Lens

[English](README.md) | [简体中文](README.zh-CN.md) | 日本語 · [Starter Kit](../../README.ja.md)

Rokid Glasses 向けの服装提案スターターです。仕事・週末・夜の場面を選んで、短い提案を3つ表示します。まず内蔵の Sample で流れを試し、準備ができたら自分の画像モデルに接続して撮影からの動作を検証します。

[![Style Lens の診断用ブラウザー画像：修正した Ink 0.19.0](../../verification/screenshots/style-sample-final.png)](media/demo.mp4)

[約30秒の診断用実演を見る（MP4）](media/demo.mp4)。修正した Ink 0.19.0 の実際の診断用ブラウザー画像を編集した動画です。連続したリアルタイム録画ではなく、Studio・眼鏡・実モデル接続のエビデンスでもありません。

修正した Ink 0.19.0 で実際に取得した Style Lens のブラウザー画像です。UI の診断用であり、AIUI Studio・物理眼鏡の検証ではありません。 Style Lens は Sample モードで、実モデルの結果は表示していません。

| 基本情報 | このデモ |
| --- | --- |
| 対象 / UI | AIUI 0.19.0、英語の Page UI、全画面 `_blank` |
| 初期モード | **Sample**：青いシャツ向けの内蔵例を使用。撮影・通信は行わず、現在の視野をモデルで分析した結果ではない |
| Live の流れ | Live を選ぶ → 撮影して送信 → 待機 → 最大3つの提案を読む、またはエラーから回復 |
| Live の要件 | カメラ権限、接続可能な HTTPS プロキシ、短期チームトークン、サーバー側のモデル用キー、画像対応モデル |
| ソースのインポートルート | Starter Kit ルートから `demos/style-lens/app` |
| バックエンド | `demos/style-lens/server`。別途配置し、Studio にはインポートしない |
| 開発ツール | 外部の `rokid-aiui-agent` DevKit Skill |

## 最短手順：インポート → 実行 → 変更

先に Starter Kit をクローンし、コーディングツールに [DevKit をインストールして読み込み](../../README.ja.md#1-devkit-をインストールして読み込む)ます。

1. **インポート：**AIUI Studio で `demos/style-lens/app` を選びます。下の GitHub 座標も使えます。`server/` はインポートしません。
2. **実行：**`pages/index/index` を `_blank` で開きます。**Sample** のまま **Work**、**Weekend**、**Evening** を試します。Sample にはカメラ・バックエンド・API キーは不要です。
3. **変更：**下の依頼例 1 を使い、DevKit に `app/data/samples.js` の内蔵提案を1つ変更させます。**Starter Kit のルート**で検証し、編集した App を開き直すか再インポートして Sample の文章の変化を確認します。

   ```bash
   npm ci --ignore-scripts --no-audit --no-fund
   npm test
   npm run verify
   ```

GitHub からは次の正確な座標でインポートします。記録済みのソースを再現する場合、`main` の代わりに対応する commit を指定してください。

```text
Repository: https://github.com/BreezeLife/rokid-aiui-starter-kit
Ref: main
Directory: demos/style-lens/app
```

Page は毎回 Sample で開始します。任意の `occasion` 入力には `work`、`weekend`、`evening` を指定でき、初期値は `work` です。この入力で Live には切り替わりません。撮影は利用者の明示的な操作で行います。

## Live に接続する

ローカル Node.js、Docker/Compose、マネージド HTTPS コンテナーの詳細は[バックエンド配置ガイド（英語）](server/README.md)を参照してください。テンプレートを使ってチームで配置します。コンテナー実行、外部 HTTPS、実モデル接続はここでは未検証です。

プロキシは `POST /api/style` で画像と場面を受け取り、設定した OpenAI 互換の画像 API を呼び出します。チームが利用でき、画像入力に対応するサービスとモデルを選んでください。特定のモデルやサービスの契約は付属しません。

Starter Kit のルートから実行します。

```bash
cd demos/style-lens/server
cp -n .env.example .env
# 起動前に .env を編集します。既存の .env は上書きせず、そのまま編集してください。
node --env-file=.env server.mjs
```

ルートの導入手順と同じ Node.js 22.20+ 環境を使います。サーバーの `.env` に以下を設定します。

| 変数 | 用途 |
| --- | --- |
| `VISION_API_KEY` | サービスのキー。サーバーだけに保存 |
| `VISION_MODEL` | 選んだサービスで利用できる画像対応モデル ID |
| `VISION_API_BASE_URL` | サービスのベース URL。テンプレートの初期値は `https://api.openai.com/v1` |
| `TEAM_TOKEN` | 32文字以上のランダムなチームトークン。同じ一時トークンをデモ App に設定 |
| `TEAM_TOKEN_EXPIRES_AT` | 24時間以内の将来の ISO タイムスタンプ。後日の実演では更新 |
| `HOST`、`PORT` | ローカル初期値は `127.0.0.1`、`8787` |
| `UPSTREAM_TIMEOUT_MS` | モデル要求のタイムアウト。初期値 `25000` |
| `ALLOWED_ORIGIN` | 任意。正確な HTTPS ブラウザー origin。空欄ではブラウザーのクロスオリジン接続を無効化 |

ローカルサーバーは開発用です。眼鏡では接続可能な **HTTPS** エンドポイントの背後に配置し、`app/config.js` を編集します。

```js
backendUrl: 'https://your-backend.example/api/style',
teamToken: 'your-temporary-per-team-token'
```

上のホスト名とトークンは例です。`VISION_API_KEY` を App のファイルに置かないでください。チームトークンはデモ用の一時認証情報で、本番の認証を代替しません。ソース共有前に取り除き、実演後に失効または更新してください。`.env` は Studio インポートルートとバージョン管理の外に置きます。

設定後に **Try Live**、**Capture & send** を選び、求められた場合はカメラ権限を許可します。Live はプロキシ経由で写真を設定先のサービスに送り、Sample は送りません。App とプロキシは写真を保存しませんが、サービス側の保存方針はここでは確認していません。取消操作でも、送信済みの写真や発生済みのモデル料金は取り消せません。初期制限は画像あたり4 MiB、App の待機45秒、モデル要求25秒です。取消、権限拒否、設定不足、ネットワーク・サービスエラー、不正な応答は、内容が分かり回復可能な状態で表示する必要があります。キー不要の Sample に戻せますが、実際の要求が成功したようには表示しません。

## 最初に変更する3か所

パスは `demos/style-lens/` からの相対パスです。まず次の**3か所**を変更します。

| 順序 | ファイル | 最初の変更 |
| --- | --- | --- |
| **1 · データ** | `app/data/samples.js` | Work・Weekend・Evening の内蔵提案 |
| **2 · UI** | `app/pages/index/index.ink` | 見出し、ボタン文言、場面・提案のレイアウト |
| **3 · API 設定** | `app/config.js` | 非公開のコピーで HTTPS バックエンド URL と一時チームトークンを指定。Sample では両方空欄 |

Live モデルの動作は `server/prompt.mjs` のシステムプロンプトで変更します。サーバー認証情報・設定は `server/.env.example` から非公開 `.env` に設定し、要求・認証処理は `server/server.mjs` にあります。実行時呼び出し・権限は `app/AGENTS.md` と `app/app.json`、回帰テストは `tests/` にあります。モデルのキーはサーバーだけに置きます。

## コピーして使える3つの依頼

呼び出し方は[ルートの手順](../../README.ja.md)を参照してください。以下は Codex 用で、チャットに送ります。

**1. API なしで場面を変える**

```text
$rokid-aiui-agent
demos/style-lens/app の Sample を、通学、就職面接、週末の散歩に変えて
ください。英語 UI と明確な Sample 表示を維持し、内蔵の提案とテストを
更新してください。Sample では撮影・バックエンド要求を行わないでください。
テストと AIUI 0.19.0 の厳格な検証を実行してください。
```

**2. Live のプロンプトを変える**

```text
$rokid-aiui-agent
demos/style-lens を旅行の荷造りアシスタントに変更してください。バックエンドの
画像プロンプトと Sample の文を変え、短い提案1～3件の応答形式を維持します。
モデル認証情報はサーバーに置き、テストはスタブを使い、有料モデルを呼び出さない
でください。正常系、エラー、取消、古い応答を検証し、実サービス確認は BLOCKED にしてください。
```

**3. チームの実演を準備する**

```text
$rokid-aiui-agent
ハッカソン向けに demos/style-lens/app と server をレビューしてください。
Sample/Live 表示、設定エラー、権限拒否、タイムアウト、トークン期限、取消、
unload 時の解放を確認します。ローカルテスト、厳格な検証、対応する AIX 操作を
実行し、UX・機能別の表を更新してください。正確なインポート・成果物パスを報告し、
Studio、眼鏡、実モデルの項目は実施しない限り BLOCKED にしてください。
```

## 短い実演手順

1. **Sample** を開き、**Work** を選んで3つの提案を表示します。例示データであることを伝えます。
2. **Weekend** または **Evening** に切り替えて結果を確認します。撮影やモデル要求は行いません。
3. **Try Live** を選びます。初期の未設定状態では **Setup needed** を確認し、**Use Sample** で戻ります。
4. Live を別途設定したら **Try Live** を選び、衣服に向けて **Capture & send** を実行します。待機状態と実際に返された提案を見せます。
5. バックエンドに接続できない状態や権限拒否を試してから Sample に戻ります。代替結果を実際の画像分析として紹介しないでください。

Live の応答時間はサービスとネットワークに依存するため、短い Sample 実演は Live の時間を保証しません。全画面 `_blank` を使い、フォーカス・タップ、取消、要求中の Page 離脱、再起動で Sample に戻ることも確認します。

ブラウザーで限定的なレイアウト・クリック確認を行う場合は、[任意の診断用プレビュー手順](../../README.ja.md#任意のブラウザー診断用プレビュー)を参照してください。ツールが修正するのは `output/` 配下の別ランタイムで、その結果は標準プレビュー・Studio・実機の PASS ではありません。

## 検証状況

決定論的なローカルテストと AIUI 0.19.0 の厳格なソース検証は合格しました。ソースに結び付いた UX・機能項目は [verification/AUDIT.md](verification/AUDIT.md)、実行した検証とパッケージの結果は[ルートの検証レポート](../../verification/README.md)を参照してください。未修正の AIX ブラウザープレビューは App 読み込み前に失敗し、別途修正した診断用プレビューで UI が描画されても標準プレビューの PASS にはなりません。Studio と物理眼鏡は **BLOCKED** です。 ローカルのプロキシテストは偽のサービスを使い、実際の画像サービスとカメラは **BLOCKED** です。Sample は Live 推論成功のエビデンスではありません。
