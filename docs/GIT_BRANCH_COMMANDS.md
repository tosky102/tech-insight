# ブランチ・コミット完了用コマンド

以下のコマンドを**リポジトリルート**で実行すると、各ブランチのコミットと main へのマージが完了します。

## 現在の状態

- **main**: スキャフォールド + doc/initial + feat/backend をマージ済み（docs, backend, data あり）
- **doc/initial**: 設計ドキュメント・完全版 README・推奨 Issue 一覧をコミット済み
- **feat/backend**: Backend + data をコミット済み
- **feat/frontend**: frontend をコミットしていない場合は、下記 1 を実行してから 2 でマージ

## 1. feat/frontend でコミット（未完了の場合）

```bash
git checkout feat/frontend
git add frontend/
git commit -m "feat(frontend): add Next.js app and article UI"
```

## 2. main に feat/frontend をマージ

```bash
git checkout main
git merge feat/frontend -m "Merge branch 'feat/frontend'"
```

## 3. マージ後の main の確認

```bash
git log --oneline -10
ls -la backend frontend docs
```

## Issue の作成

`docs/ISSUES.md` に記載した推奨 Issue を GitHubで作成し、各ブランチや PR と紐付けて利用できます。
