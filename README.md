# Ironmaxx

Landing page + checkout do Kit Halteres Ajustáveis Ironmaxx, com pagamento via Pix (SigiloPay) e tracking (Meta Pixel + Conversions API, UTMify).

## Rodando localmente

```
npm install
npm run dev
```

Acesse `http://localhost:3000`.

Crie um `.env` (baseado em `.env.example`) com:

- `SIGILOPAY_PUBLIC_KEY` / `SIGILOPAY_SECRET_KEY`
- `META_ACCESS_TOKEN` (Conversions API do Meta)
- `PUBLIC_BASE_URL` (preencher em produção, com domínio + HTTPS)

## Deploy

Hospedado na Vercel (`outputDirectory: public`, rotas de `/api` como serverless functions). As variáveis de ambiente acima precisam ser configuradas no painel do projeto na Vercel.
