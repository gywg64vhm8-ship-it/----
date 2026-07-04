# 昆明民宿获客与智能接待网站

React + Vite 构建的移动优先民宿展示与本地关键词问答网站。资料集中在 `src/data/homestay.json`，可直接替换为其他民宿信息。

## 本地运行

```bash
pnpm install
pnpm dev
```

## 构建

```bash
pnpm build
```

## Cloudflare Pages

- Framework preset: `Vite`
- Build command: `pnpm build`
- Build output directory: `dist`
- Node version: `20` 或更新

当前项目不依赖数据库，也不调用真实大模型 API。
