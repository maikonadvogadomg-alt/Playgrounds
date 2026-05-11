# Iara — SK Assistente Jurídico
## Manual Completo
**Versão:** 2.0 — Maikon Caldeira · OAB/MG 183712  
**Data:** Maio 2026

---

## O que é o Iara

O Iara é um assistente de inteligência artificial com voz integrada, desenvolvido para uso jurídico e geral. Funciona como PWA (instala no celular como app) e pode ser empacotado como APK nativo via Capacitor.

---

## Funcionalidades

| Recurso | Status |
|---|---|
| Chat de voz (fala e ouve) | ✅ Funcionando |
| Chat por texto | ✅ Funcionando |
| Seleção de voz neural | ✅ (vozes do Android/Chrome) |
| Controle de velocidade, tom e volume | ✅ Funcionando |
| Múltiplos provedores de IA | ✅ OpenAI, Groq, OpenRouter |
| Chave de API salva no celular | ✅ Nunca vai para servidor externo |
| Modo escuro/claro | ✅ Funcionando |
| Assistente Jurídico completo | ✅ /juridico |
| Jurisprudência | ✅ /jurisprudencia |
| Comparador Jurídico | ✅ /comparador |
| Auditoria Financeira | ✅ /auditoria |
| Campo Livre (Iara) | ✅ / (tela inicial) |
| PWA instalável | ✅ Manifesto configurado |
| Capacitor (APK nativo) | ✅ Configurado |

---

## Como usar o chat de voz

1. Abra o app — a tela da Iara aparece direto
2. Toque no **botão redondo do microfone**
3. Fale normalmente em português
4. A Iara pensa e responde em voz alta automaticamente
5. Toque no botão vermelho para parar a fala dela
6. Para digitar: use o campo de texto e clique em **Enviar** (seta azul)

---

## Configurar a chave de API

1. Toque no ícone de engrenagem (⚙️) no canto superior direito
2. Escolha o provedor:
   - **Groq** — gratuito, rápido, recomendado para começar
   - **OpenAI** — pago, mais poderoso
   - **OpenRouter** — acessa vários modelos
3. Cole sua chave de API no campo
4. Selecione o modelo desejado
5. Toque em **Salvar**

> A chave fica salva APENAS no seu celular (localStorage). Nunca é enviada para outro lugar.

### Onde pegar chave gratuita (Groq)
1. Acesse: https://console.groq.com/keys
2. Crie uma conta grátis
3. Clique em "Create API Key"
4. Copie e cole no app

---

## Controles de voz

Toque em ⚙️ → painel de voz abre:

| Controle | Descrição |
|---|---|
| Voz | Seleciona a voz neural disponível no dispositivo |
| Velocidade | 0.5× (lenta) até 2.0× (rápida) |
| Tom | 0.5 (grave) até 2.0 (agudo) |
| Volume | 0% a 100% |
| Testar voz | Reproduz frase de teste |

---

## Estrutura de pastas

```
assistente-juridico/
├── src/
│   ├── pages/
│   │   ├── campo-livre.tsx      ← Iara (tela inicial, voz + texto)
│   │   ├── legal-assistant.tsx  ← Assistente Jurídico
│   │   ├── jurisprudencia.tsx
│   │   ├── comparador-juridico.tsx
│   │   └── ... (outros módulos)
│   ├── lib/
│   │   ├── ai-service.ts        ← Chamadas à IA
│   │   └── settings.ts          ← Salvar/ler configurações
│   └── components/
│       ├── settings-panel.tsx   ← Painel de configuração de API
│       └── ...
├── dist/                        ← Build para Capacitor/APK
├── capacitor.config.ts          ← Config do Capacitor
├── vite.config.ts               ← Build para web/preview
├── vite.config.apk.ts           ← Build para APK (base: "./")
└── package.json
```

---

## Scripts disponíveis

```bash
# Rodar em desenvolvimento
pnpm run dev

# Build para web (preview Replit)
pnpm run build

# Build para APK/Capacitor (usa caminhos relativos ./assets/...)
pnpm run build:apk

# Adicionar plataforma Android ao Capacitor
pnpm run cap:add:android

# Sincronizar arquivos com o projeto Android
pnpm run cap:sync

# Abrir no Android Studio
pnpm run cap:open
```

---

## Gerar APK com Capacitor (sem EAS, sem custo)

### Pré-requisitos
- Android Studio instalado no computador
- Java 17+
- Android SDK instalado

### Passo a passo

```bash
# 1. Instalar dependências
pnpm install

# 2. Build com caminhos relativos (OBRIGATÓRIO para APK)
pnpm run build:apk

# 3. Adicionar Android (só na primeira vez)
pnpm run cap:add:android

# 4. Sincronizar arquivos
pnpm run cap:sync

# 5. Abrir Android Studio
pnpm run cap:open
```

No Android Studio:
1. Aguardar indexação do projeto
2. Menu → Build → Generate Signed Bundle / APK
3. Escolher APK
4. Criar ou usar keystore existente
5. Selecionar "release"
6. O APK fica em: `android/app/build/outputs/apk/release/`

---

## Variáveis de ambiente

Não há variáveis de ambiente obrigatórias. Todas as configurações ficam no localStorage do dispositivo:

| Chave | Descrição | Padrão |
|---|---|---|
| `sk_juridico_api_key` | Chave de API da IA | (vazio) |
| `sk_juridico_base_url` | URL base do provedor | `https://api.openai.com/v1` |
| `sk_juridico_model` | Modelo de IA | `gpt-4o` |

---

## Provedores de IA suportados

| Provedor | URL | Modelos | Custo |
|---|---|---|---|
| Groq | https://api.groq.com/openai/v1 | llama-3.3-70b, mixtral-8x7b | Gratuito |
| OpenAI | https://api.openai.com/v1 | gpt-4o, gpt-4o-mini | Pago |
| OpenRouter | https://openrouter.ai/api/v1 | gpt-4o, claude-3.5, gemini | Misto |
| Personalizado | Qualquer URL OpenAI-compatível | Qualquer modelo | Depende |

---

## Rotas disponíveis

| Rota | Tela |
|---|---|
| `/` | Iara — Campo Livre (voz + texto) |
| `/juridico` | Assistente Jurídico especializado |
| `/jurisprudencia` | Pesquisa de jurisprudência |
| `/comparador` | Comparador de documentos jurídicos |
| `/auditoria` | Auditoria financeira |
| `/playground` | Área de testes |
| `/token` | Gerador de tokens |
| `/consulta` | Consulta processual |
| `/painel` | Painel de processos |

---

## O que foi corrigido nesta versão

- Tela inicial agora abre direto na Iara (Campo Livre)
- Botão Enviar funciona ao digitar texto
- Microfone e texto funcionam juntos na mesma tela
- Reconhecimento de voz em português (pt-BR)
- TTS com vozes neurais do dispositivo
- Controles de velocidade, tom e volume
- Botão "repetir" em cada resposta da Iara
- Caminhos `./assets/...` corrigidos para funcionar em APK WebView
- Importação aceita qualquer tipo de arquivo
- Filtro de importação desligado por padrão

---

## Suporte e contato

Desenvolvido por: Maikon Caldeira  
OAB/MG 183712  
Projeto: Iara — SK Assistente Jurídico
