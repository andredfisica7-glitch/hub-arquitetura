# Studio Rocha · Hub de Arquitetura

Dashboard operacional single-file para gestão de projetos de arquitetura e interiores.

## O que faz

- **Projetos** — visualiza todos os boards do Trello com KPIs: projetos ativos, tarefas concluídas, horas na semana, tarefas em aberto
- **Operação** — horas por projeto via Toggl (últimos 7 dias) e tarefas em andamento
- **Financeiro** — registro de pagamentos e custos por projeto (custos de obra, honorários, materiais, serviços), resumo financeiro e exportação CSV para Google Sheets
- **Board Modal** — visão Kanban e "Meu Dia" por projeto, com detalhes de cada card

## Integrações

| Serviço | Uso |
|---------|-----|
| Trello | Boards, listas e cards dos projetos |
| Toggl | Registro de horas por projeto |
| Google Sheets | Exportação de dados financeiros (CSV) |

## Como rodar

O projeto é um único arquivo HTML sem dependências ou instalação.

**Opção 1 — Abrir direto no navegador**
```
Clique duas vezes no arquivo hub-arquitetura.html
```
> Toggl fica bloqueado neste modo por restrição do browser (CORS).

**Opção 2 — Servidor local (Toggl habilitado)**
```bash
python3 -m http.server 8080
```
Depois acesse: `http://localhost:8080/hub-arquitetura.html`

## Credenciais

As credenciais de API (Trello, Toggl) são configuradas diretamente no arquivo na seção `DEFAULT_CONFIG`.  
**Nunca suba tokens reais em repositório público.**

## Estrutura

```
hub-arquitetura.html   # arquivo único — HTML + CSS + JS
```

## Tecnologias

- HTML/CSS/JS puro (sem frameworks)
- APIs REST: Trello, Toggl
- Armazenamento: localStorage
