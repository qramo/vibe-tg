# scratch-blocks 2.1.19（同梱）

[scratchfoundation/scratch-blocks](https://github.com/scratchfoundation/scratch-blocks) の npm パッケージ `scratch-blocks@2.1.19` から、次のファイルをそのままコピーしています（Apache License 2.0、`LICENSE` 参照）。

- `main.js` … `dist/main.mjs`（Blockly 12 を含む単一の ES module）。どの静的サーバーでも JavaScript として配信されるよう、拡張子を `.js` に変えています
- `media/` … `media/`（効果音のファイルは使わないので除外）
- `LICENSE`、`TRADEMARK`

CDN からの読み込みをやめて同梱しているのは、配信元が改ざんされたときに訪問者のブラウザーで想定外のコードが動くのを避けるためです。

確認した値：

- npm の integrity：`sha512-FgRoGhUkiGEmjblwmd5k+0HPlonoXkk1arwnnZBcSE05MKoZjWiP/ksHCfCcr2w/qqYQBrCynBk6flmwkcsUnA==`（パッケージ全体）
- `main.js`（元の `main.mjs`）の SHA-256：`1f54f44fbef63884613041ece13787c27e003c2686485619eaf0832272fdafc9`（jsDelivr の配信ファイルと一致）

更新するときは、新しい版を `npm pack scratch-blocks@<版>` で取得し、同じ手順で置き換えて、`js/blocks.js` の版の記述も直してください。
