# Live Monitor - リアルタイムライブ配信監視システム

## 📺 プロジェクト紹介

Live Monitor はプロフェッショナルな**リアルタイムライブ配信監視システム**で、複数のライブルームを同時監視する必要があるシナリオ向けに設計されています。このシステムは Vue 3 + TypeScript + Vite で構築され、Tencent Cloud TRTC テクノロジーを活用して低遅延のリアルタイムストリーミング監視機能を提供します。

## 🚀 クイックスタート

### 📋 環境要件

- Node.js 16.0+ 
- npm 7.0+ (推奨) または npm 8.0+
- モダンブラウザ（Chrome 88+, Firefox 85+, Safari 14+）

### ⚙️ プロジェクト設定

#### 1. フロントエンド設定 (`src/config/index.ts`)

```typescript
// 以下の設定項目を変更
const sdkAppId = 0; // ご利用のTencent Cloud LiveKit sdkAppId
const secretKey = "your_secret_key_here"; // sdkAppIdに対応するシークレットキー
const defaultCoverUrl = "https://your-domain.com/default-cover.png"; // デフォルトカバー画像
const concurrentMonitors = 10; // 同時監視ライブルーム数
```

**TRTC設定の取得方法：**
1. [Tencent Cloudコンソールにログイン](https://console.trtc.io/)にログイン
2. TRTCアプリケーションを作成し、`SDKAppId` を取得
3. アプリケーション管理でシークレット情報を取得

#### 2. サーバー設定 (`server/config/.env`)

`server/config/.env` ファイルを作成：

```bash
# サーバーポート
PORT=3000

# TRTC設定 
SDK_APP_ID = 0               # ご利用のTencent Cloud LiveKit sdkAppId
SDK_SECRET_KEY = ""          # アプリケーションのSDK_SECRET_KEYに置き換え（文字列引用符不要）
IDENTIFIER = administrator   # ユーザーID（管理者権限必須）
PROTOCOL = https://
DOMAIN = console.tim.qq.com  # rest_apiインターフェースリクエストドメイン
```

### 🔧 依存関係のインストール

```bash
# フロントエンド依存関係のインストール
npm install

# サーバー依存関係のインストール  
cd server
npm install
cd ..
```

### ▶️ プロジェクト起動

#### 開発環境

```bash
# 1. サーバー起動 (ターミナル1)
cd server
npm run dev

# 2. フロントエンド起動 (ターミナル2) 
npm run dev
```

## 🎛️ ユーザーガイド

### 基本操作

1. **監視開始**
- 緑色の"監視開始"ボタンをクリック
   - システムが自動接続しライブルーム映像を表示

2. **グループ切替** 
   - "前の監視グループ"/"次の監視グループ"ボタンを使用
   - 異なるライブルーム組み合わせを高速切替

3. **追加読み込み**
   - "ライブルーム読み込み"ボタンをクリック
   - 監視可能なライブルームを追加取得

4. **監視停止**
   - 赤色の"監視停止"ボタンをクリック
   - 全監視接続を切断

### ステータス監視

インターフェース上部に主要監視指標を表示：
- **ライブルーム数**：現在読み込まれたライブルーム総数
- **監視中**：現在監視中のライブルーム数
- **同時監視数**：システム設定の最大同時監視可能数



### コア依存関係
- **TRTC Web SDK**：Tencent Cloudリアルタイムオーディオビデオ
- **Element Plus**：UIコンポーネントライブラリ
- **Day.js**：日時処理ライブラリ

## 🔧 開発ガイド

### プロジェクト構造

```
live-monitor-web-vite-vue3/
├── src/                    # フロントエンドソースコード
│   ├── components/         # Vueコンポーネント
│   ├── config/            # 設定ファイル ⭐
│   ├── manager/           # プレイヤー管理
│   ├── states/            # ステート管理
│   └── styles/            # スタイルファイル
├── server/                # サーバーソースコード  
│   ├── config/            # サーバー設定 ⭐
│   ├── src/               # サーバーソースコード   
└── └── scripts/           # ビルドスクリプト
```