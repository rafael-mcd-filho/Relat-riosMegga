# Painel de Analise de Atendimentos

Base inicial em `Vite + React + TypeScript` para montar um painel de analise de atendimentos com filtros por canal, usuario, equipe e periodo.

## Rodar localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## O que ja esta pronto

- painel responsivo com visual moderno
- filtros de canal, equipe, usuario e intervalo manual
- presets de periodo: hoje, ontem, esta semana, semana anterior, este mes, mes anterior, ultimos 7 dias e ultimos 30 dias
- cards de resumo, grafico de volume, ranking por equipe e tabela de atendimentos recentes
- dados mockados para desenvolver antes da API chegar

## Onde plugar a API

- `src/data/mockDashboard.ts`: dados base e flag inicial de integracao
- `src/lib/dashboard.ts`: funcoes de filtro e agregacao
- `src/App.tsx`: composicao da UI e estado dos filtros

Quando voce enviar os endpoints e IDs, a troca principal vai ficar concentrada nessas camadas sem precisar refazer a interface.
