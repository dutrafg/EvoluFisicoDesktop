# QA — EvoluFísico Desktop EFI Alpha

Data: 24/10/2026. Os resultados abaixo distinguem verificações automatizadas de homologação prática.

## Execuções Windows desta rodada

| Verificação | Resultado observado |
|---|---|
| Run [40124088830](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40124088830), commit `e78d7bc0eaa0248a84cddf3416b96f806523523a` | Sucesso: teste de Perfil/tema, fixtures, build Windows, runtime EFI, instalador, smoke de instalação/desinstalação e upload do artefato. |
| Run [40124398686](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40124398686), commit `0cbd82fbb6ecf186861161f544a6abdcbd4a482a` | Falhou somente no smoke: a busca ainda usava o nome antigo do instalador e não encontrou o EXE. O setup havia compilado; nenhum artefato foi publicado. |
| Run [40124552552](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40124552552), commit `6de5dd77587a04a3bda0d572c492effb80316a79` | Sucesso completo. Busca por nome corrigida; os testes novos de etapa 2 e rascunhos passaram; instalador instalado/desinstalado no runner e artefato enviado. |

## Testes executados

- Sintaxe EFI JavaScript: passou nos runs acima.
- Perfil Unificado e regressão de tema: passou em `tests/unified-students-profile.cjs`; cobre separação de homônimos, agrupamento por ID persistente, cronologia, métricas e leitura conservadora de registros sem ID.
- Avaliação em seis etapas: passou em `tests/evaluation-objectives.cjs`; confirma Objetivos na etapa 2, persistência de seleções múltiplas, edição e recuperação de rascunhos.
- Quatro alunos demonstrativos e 16 avaliações: fixtures/elegibilidade passaram nos runs Windows.
- Build completo Windows x64 com .NET 8, integração EFI e bundle CPU: passou.
- Inno Setup e smoke de instalação/desinstalação isolada Alpha: passaram no run `40124552552`.
- Inferência real Qwen3.5-2B Q4_K_M: o run independente [40119653945](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40119653945) concluiu inferência sintética em CPU e verificou o checksum do modelo. Isso não é homologação clínica nem teste do fluxo dentro do aplicativo instalado.

## Campanha sintética anterior

Em execução local anterior desta sessão foram exercitadas 10.000 entradas determinísticas contra EF78–EF82: 0 exceções e 0 valores não finitos. A campanha não está incorporada ao repositório e não cobre ponta a ponta os oito motores (EF68/EF70/EF77/EF78–EF82), migração SQLite ou invalidação persistida de pareceres.

## Testes ainda não executados

- Migração transacional de bancos legados, backup prévio, interrupção, rollback e preservação de dados reais.
- Atualização in-place sobre Alpha anterior com banco contendo dados e validação de preservação na desinstalação.
- Inicialização manual do aplicativo instalado e fluxo real de gravação/leitura por módulo.
- Homologação visual do Perfil em Windows/WebView2, avaliação em diferentes resoluções/escalas, navegação por teclado/toque e contraste completo.
- Validação visual e impressão dos PDFs A4, backup/restauração e separação de relatório privado e compartilhável.
- Estados EFI/Qwen: runtime ausente, modelo ausente/corrompido, retomada, cancelamento, timeout, falta de RAM e uso offline dentro do aplicativo.
- Campanha de 10.000 cenários integrada aos oito motores científicos.

## Resultado

A branch possui build Windows e smoke automatizado de instalação/desinstalação aprovados no run `40124552552`. A implementação do Perfil e o novo fluxo de objetivos têm testes automatizados, mas a homologação manual do aplicativo instalado, migração de dados, atualização in-place e a cobertura científica integrada continuam pendentes. A versão não é candidata a estável.
