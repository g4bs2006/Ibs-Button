# IBS Agendamentos

Botão de agendamento integrado para clínicas odontológicas. Conecta o CRM **Helena** (white label) ao sistema de gestão **Clinicorp**, permitindo que o time comercial crie agendamentos diretamente no atendimento — sem sair da tela, sem duplicar dados.

---

## O Problema

O time comercial de clínicas odontológicas precisava alternar entre múltiplas ferramentas para registrar um agendamento:

1. Abrir o Clinicorp para verificar horários disponíveis
2. Marcar o horário manualmente no sistema
3. Voltar ao CRM Helena para atualizar o card do paciente
4. Registrar anotações e mover o card de etapa

Esse fluxo gerava perda de tempo, erros de digitação e inconsistências entre os sistemas.

---

## A Solução

Um botão integrado diretamente no atendimento do CRM Helena. Com um único fluxo o comercial:

- Visualiza os horários disponíveis no Clinicorp em tempo real
- Seleciona o horário e o dentista
- Cria ou atualiza o card no CRM automaticamente
- Registra o agendamento no Clinicorp com paciente vinculado
- Tudo em menos de 1 minuto

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                     Usuário (CRC)                        │
│          Abre o botão via link no Helena CRM             │
└───────────────────────┬─────────────────────────────────┘
                        │ ?contactId=xxx
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Frontend — React + Vite                     │
│                  (Vercel CDN)                            │
│                                                          │
│  Etapa 1: Dados do paciente + unidade + CRC              │
│  Etapa 2: Calendário + horários disponíveis              │
└──────────┬────────────────────────┬─────────────────────┘
           │                        │
           ▼                        ▼
┌──────────────────┐    ┌──────────────────────────────────┐
│  Vercel Proxy    │    │  Vercel Serverless Function       │
│  /api/proxy      │    │  /api/clinicorp                   │
│                  │    │                                   │
│  Repassa calls   │    │  GET  → busca horários livres     │
│  ao Helena CRM   │    │  POST → busca/cria paciente       │
│  evitando CORS   │    │         cria agendamento          │
└────────┬─────────┘    └──────────────┬───────────────────┘
         │                             │
         ▼                             ▼
┌─────────────────┐        ┌──────────────────────────────┐
│   Helena CRM    │        │        Clinicorp API          │
│   (white label) │        │   api.clinicorp.com/rest/v1   │
│                 │        │                               │
│ - Contatos      │        │ - Horários disponíveis        │
│ - Cards/Kanban  │        │ - Cadastro de pacientes       │
│ - Etapas        │        │ - Criação de agendamentos     │
│ - Labels (CRC)  │        │ - Dentistas por unidade       │
└─────────────────┘        └──────────────────────────────┘
```

---

## Fluxo de Uso

```
CRC abre o botão
      │
      ▼
Dados do paciente carregados automaticamente via contactId
      │
      ▼
CRC seleciona unidade (Bueno / Eldorado) + CRC responsável
      │
      ▼
Calendário exibe os dias do mês
      │
      ▼
CRC clica em um dia → sistema busca horários livres no Clinicorp
      │
      ▼
CRC seleciona o horário (exibe nome do dentista disponível)
      │
      ▼
Clica em "Criar Card"
      │
      ├── Card já existe? → Atualiza etapa + data + label
      └── Card novo?      → Cria card com contato vinculado
      │
      ▼
Agendamento criado no Clinicorp (paciente buscado ou criado automaticamente)
      │
      ▼
Confirmação exibida na tela ✓
```

---

## Tecnologias

| Camada | Tecnologia | Uso |
|---|---|---|
| Frontend | React 19 | Interface do usuário |
| Build | Vite 8 | Bundler e dev server |
| Deploy | Vercel | Hospedagem + Serverless Functions |
| CRM | Helena (white label) | Gestão de contatos e cards |
| Clínica | Clinicorp API | Agenda, pacientes e agendamentos |
| Estilo | CSS puro | Design customizado IBS |

---

## Unidades Suportadas

| Unidade | Dentistas |
|---|---|
| **Bueno** | Dra. Fernanda Borges |
| **Eldorado** | Dra. Fernanda Borges, Dra. Wellen Leticia |

---

## Estrutura do Projeto

```
IBS AGENDAMENTOS/
├── api/
│   ├── clinicorp.js      # Serverless: integração Clinicorp (GET horários, POST agendamento)
│   └── proxy.js          # Serverless: proxy para o Helena CRM (evita CORS)
├── src/
│   ├── App.jsx           # Componente principal — fluxo de 2 etapas
│   ├── App.css           # Estilos
│   ├── api.js            # Funções de chamada ao Helena CRM
│   └── config.js         # Configuração de unidades, profissionais e labels
├── .env.example          # Modelo de variáveis de ambiente
├── vercel.json           # Configuração de rotas e proxy Vercel
├── vite.config.js        # Configuração do Vite
└── package.json
```

---

## Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha os valores:

```bash
cp .env.example .env
```

| Variável | Descrição |
|---|---|
| `VITE_CRM_TOKEN` | Token de autenticação da API Helena CRM |
| `CLINICORP_USER_ELDORADO` | Usuário Clinicorp — Unidade Eldorado |
| `CLINICORP_PASS_ELDORADO` | Senha Clinicorp — Unidade Eldorado |
| `CLINICORP_BUSINESS_ELDORADO` | Business ID Clinicorp — Unidade Eldorado |
| `CLINICORP_USER_BUENO` | Usuário Clinicorp — Unidade Bueno |
| `CLINICORP_PASS_BUENO` | Senha Clinicorp — Unidade Bueno |
| `CLINICORP_BUSINESS_BUENO` | Business ID Clinicorp — Unidade Bueno |

> Em produção, configure essas variáveis em **Vercel → Settings → Environment Variables**.

---

## Instalação e Execução Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build
```

---

## Deploy

Hospedado na **Vercel**. Todo push na branch `main` dispara deploy automático.

```bash
git add .
git commit -m "feat: descrição da alteração"
git push origin main
```

---

## Contexto

Desenvolvido para **IBS Odonto** — rede de clínicas odontológicas com foco em implantes. O botão é acionado pelos CRCs (Consultores de Relacionamento com o Cliente) durante o atendimento no CRM Helena, eliminando a necessidade de alternar entre sistemas para concluir um agendamento.
