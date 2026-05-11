# 🗓️ Agendei — Guia de Instalação

## O que é isso?
Este é o código completo do Agendei, seu app de agenda para profissionais autônomas.

---

## Passo a Passo para colocar no ar

### PASSO 1 — Criar conta no Supabase (banco de dados)

1. Acesse https://supabase.com e clique em **Start your project**
2. Entre com sua conta do Google
3. Clique em **New project**
4. Preencha:
   - Name: `agendei`
   - Database Password: crie uma senha forte (guarde ela!)
   - Region: `South America (São Paulo)`
5. Aguarde ~2 minutos para criar

### PASSO 2 — Criar as tabelas no banco

1. No Supabase, clique em **SQL Editor** no menu lateral
2. Clique em **New query**
3. Abra o arquivo `supabase_schema.sql` deste projeto
4. Copie todo o conteúdo e cole no editor
5. Clique em **RUN**
6. Deve aparecer "Success" — pronto!

### PASSO 3 — Ativar login com Google (opcional)

1. No Supabase, vá em **Authentication > Providers**
2. Clique em **Google**
3. Ative e siga as instruções para criar credenciais no Google Console
4. (Você também pode usar só e-mail/senha — já funciona sem configurar o Google)

### PASSO 4 — Pegar suas chaves do Supabase

1. No Supabase, vá em **Settings > API**
2. Copie:
   - **Project URL** (ex: https://xyzxyz.supabase.co)
   - **anon public key** (começa com "eyJ...")

### PASSO 5 — Subir na Vercel (hospedagem gratuita)

1. Acesse https://vercel.com e crie uma conta com Google
2. Clique em **Add New > Project**
3. Importe seu repositório GitHub (ou faça upload da pasta)
4. Antes de finalizar, clique em **Environment Variables** e adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = cole a URL do passo 4
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = cole a chave do passo 4
5. Clique em **Deploy**
6. Em ~2 minutos seu app estará em: `agendei.vercel.app`

### PASSO 6 — Conectar domínio próprio (opcional)

1. Compre `agendei.com.br` em https://registro.br (~R$40/ano)
2. No Vercel, vá em **Settings > Domains**
3. Adicione seu domínio e siga as instruções de DNS

---

## Estrutura dos arquivos

```
agendei/
├── pages/
│   ├── index.js        ← Tela de login
│   └── app.js          ← App principal (agenda, clientes, resumo)
├── lib/
│   └── supabase.js     ← Conexão com o banco
├── styles/
│   └── globals.css     ← Estilos visuais
├── supabase_schema.sql ← SQL para criar as tabelas
├── .env.local.example  ← Modelo de configuração
└── package.json        ← Dependências
```

---

## Dúvidas?

Qualquer problema, entre em contato: contato@agendei.com.br

---

*Agendei © 2025 — Todos os direitos reservados*
