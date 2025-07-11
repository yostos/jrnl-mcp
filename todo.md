# TODO: jrnl-mcp改善タスク

## 🚨 重要な問題点

### 1. テストの根本的問題
- **単体テスト**: `JrnlExecutor`を直接テストしているが、実際の問題（コマンド引数の重複）を検出できない
- **統合テスト**: MCPサーバーは起動するが、実際のツール呼び出し（`search_entries`等）をテストしていない
- **結果**: 基本的な動作不良が本番（Claude Desktop）まで発見されない

### 2. コード品質・一貫性の問題
- その場しのぎの修正により、コード全体の一貫性が疑わしい
- デバッグログが本番コードに残存している
- エラーハンドリングが断片的

## 📋 具体的なタスク

### テスト改善
- [ ] **統合テストの拡充**: 実際のMCPツール呼び出しをテスト
  - `search_entries`（条件なし、日付フィルター、タグフィルター）
  - `list_tags`
  - `get_statistics`
  - `analyze_tag_cooccurrence`
- [ ] **エンドツーエンドテスト**: 実際のjrnl出力をモックしたテスト
- [ ] **エラーケーステスト**: 空の結果、無効な引数、jrnl実行失敗等

### コードクリーンアップ
- [ ] **デバッグログ除去**: 本番コードからconsole.errorを削除
- [ ] **エラーハンドリング統一**: 一貫したエラー処理パターンの実装
- [ ] **型安全性向上**: 引数の型チェック強化

### アーキテクチャ見直し
- [ ] **コマンドビルダーの検証**: 生成されるコマンドの妥当性テスト
- [ ] **jrnl出力パーサーの堅牢化**: 様々なjrnl出力形式への対応
- [ ] **設定の外部化**: ハードコードされた値の設定ファイル化

### ドキュメント整備
- [ ] **README.md完成**: 実際の動作確認後の正確な設定手順
- [ ] **API仕様書更新**: 実装と仕様の整合性確認
- [ ] **トラブルシューティングガイド**: 今回発見した問題の対処法

## 🔄 実行順序
1. テスト改善（特に統合テスト）
2. コードクリーンアップ
3. アーキテクチャ見直し
4. ドキュメント整備

## 📝 教訓
- MCPサーバーのテストは実際のツール呼び出しまで含めて行う必要がある
- コマンド生成ロジックは特に注意深くテストする必要がある
- デバッグ時の変更は本番コードに残さない

---

## ✅ 完了済み（本日の作業）
- jrnl-mcp基本実装
- Claude Desktopでの動作確認
- 主要バグ（コマンド引数重複）の修正
