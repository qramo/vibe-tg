# 上流プロジェクトとライセンス

このスターターのLOGOインタプリタは、[oliverius/logo](https://github.com/oliverius/logo) を基にしています。

- 上流リポジトリ：<https://github.com/oliverius/logo>
- 取得した上流コミット：`53c2e88`（2025-05-10）
- 上流著作権表示：`Copyright (c) 2025 Oliver`
- ライセンス：MIT License（全文は同梱の `LICENSE`）

上流由来の主なファイルは `js/logo.js`、`js/logo.i18n.js`、`test/` と `img/GitHub-Mark-Light-32px.png` です。上流の著作権表示およびMITライセンス通知を同梱し、上流由来コードの複製・配布でも維持してください。`css/logo.css` は元の表示を土台に、このスターター用にレスポンシブ調整を加えています。

`index.html`、`js/site.js`、このREADMEおよび本ファイルは、GitHub Pagesで使いやすくするために追加したスターター用ファイルです。

## 上流コードへの変更

`js/logo.js` には次の変更を加えています。

- 式の中で括弧 `( )` を使えるようにした（ブロックで組んだ入れ子の計算をテキストで表すため）。
- 条件が偽の `IF` を読み飛ばすとき、ブロック内の入れ子の `[ ]` を正しく数えるようにした（以前は最初の `]` で止まっていた）。
- 実行中にもう一度実行したとき、前の実行ループを止めてから始めるようにした（以前は2つのループが同時に動いていた）。
- 色番号が 0〜15 の外や小数のときに、描画で停止しないようにした（範囲外は黒、小数は切り捨て）。
- `[` が閉じられていないプログラムをエラーにした（エラー `CODEBLOCK_EXPECTED_CLOSING_BRACKET` と英語・スペイン語のメッセージを追加）。
- 手続きの外の `STOP` でプログラム全体を止めるようにした。
- 手続き内の `IF`/`REPEAT` から `STOP` で抜けたとき、呼び出し側の `REPEAT` が壊れないようにした。
- 変数名の2文字目以降と、英字で始まる定義名に数字を使えるようにした（`:r1`、`square2`）。
- 日本語のコマンド・定義名・変数名を読めるようにした（`Tokenizer.isLetter` の拡張と NFKC 正規化）。`js/logo.i18n.js` には日本語の別名・エラー文・サンプルを追加した。
- 「画面を消去」はプログラムを消さず、絵だけを消すようにした（プログラムは新しい `clearCode()` で消す）。
- 実行のたびに（「画面を消去」でも）ペンを初期状態（下ろす・黒・太さ1・既定の文字サイズ・タートル表示）に戻すようにした。前回の実行の `PENUP` などが持ち越されないようにするため。

`test/parsertests.js` には、これらの境界ケースのテストを追加しました。また、描画イベントの件数も比べ、エラーで実行を止めるようにテスト補助を変えています。`test/turtletests.js`、`test/blocktests.js`、`test/penchecktests.js` は、このプロジェクトで追加したテストです。

## ロゴとファビコン

`img/sea-turtle.svg`（ヘッダーのロゴとファビコン）と、そこから作った `img/favicon.ico`（16・32・48px）は、このプロジェクトのオリジナルです。[qramo/vibe-tg#1](https://github.com/qramo/vibe-tg/pull/1) で提案されたウミガメのアイコンを元に、配置・背景・形を調整しました。上流の favicon は置き換えています。

## Scratch Blocks

ブロックエディター（`js/blocks.js`）は [scratchfoundation/scratch-blocks](https://github.com/scratchfoundation/scratch-blocks)（Apache License 2.0、Blocklyを含む）を利用しています。リポジトリには同梱せず、実行時にjsDelivrから固定バージョン（`js/blocks.js` の `SCRATCH_BLOCKS_VERSION`）を読み込みます。Scratchの名称・ロゴ等はScratch Foundationの商標であり、本プロジェクトはScratch Foundationとは関係ありません。

## WebLLM と AI モデル

AI Chat（`js/chat.js`、`js/llm-worker.js`）は [mlc-ai/web-llm](https://github.com/mlc-ai/web-llm)（Apache License 2.0）を利用しています。リポジトリには同梱せず、実行時に jsDelivr から固定バージョン（`js/webllm.js`）を読み込みます。

モデルの重みは、利用者が「モデルを読み込む」を押したときに Hugging Face（mlc-ai）から利用者のブラウザーへ直接ダウンロードされます。本リポジトリでは再配布していません。各モデルにはそれぞれのライセンスがあります（例：Qwen は Apache 2.0、Phi-4-mini は MIT、Llama 3.2 は Llama 3.2 Community License）。
