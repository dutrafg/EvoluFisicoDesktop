# QA — EvoluFísico Desktop EFI Alpha

Data: 24/10/2026. Os resultados abaixo distinguem verificações automatizadas de homologação prática.

## Execuções Windows desta rodada

| Verificação | Resultado observado |
|---|---|
| Run [40124088830](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40124088830), commit `e78d7bc0eaa0248a84cddf3416b96f806523523a` | Sucesso: teste de Perfil/tema, fixtures, build Windows, runtime EFI, instalador, smoke de instalação/desinstalação e upload do artefato. |
| Run [40124398686](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40124398686), commit `0cbd82fbb6ecf186861161f544a6abdcbd4a482a` | Falhou somente no smoke: a busca ainda usava o nome antigo do instalador e não encontrou o EXE. O setup havia compilado; nenhum artefato foi publicado. |
| Run [40124552552](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40124552552), commit `6de5dd77587a04a3bda0d572c492effb80316a79` | Sucesso completo. Busca por nome corrigida; os testes novos de etapa 2 e rascunhos passaram; instalador instalado/desinstalado no runner e artefato enviado. |
| Run [40125310587](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40125310587), commit `a6c0d9afc4e9a06bd307a923f0c57d4110fc2422` | Sucesso completo: teste de migração explícita com backup, build Windows, instalador, smoke de instalação/desinstalação e artefato enviado. |
| Run [40125997101](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40125997101), commit `af0584fff5819c3cd09c42e77efa66d600cedf7f` | Sucesso completo: suíte integrada de 10.000 cenários EFIA, build Windows, bundle CPU, instalador, smoke install/uninstall e artefato enviado. |

## Testes executados

- Sintaxe EFI JavaScript: passou nos runs acima.
- Perfil Unificado e regressão de tema: passou em `tests/unified-students-profile.cjs`; cobre separação de homônimos, agrupamento por ID persistente, cronologia, métricas e leitura conservadora de registros sem ID.
- Avaliação em seis etapas: passou em `tests/evaluation-objectives.cjs`; confirma Objetivos na etapa 2, persistência de seleções múltiplas, edição e recuperação de rascunhos.
- Identidade legada: passou em `tests/client-identity-migration.cjs`; comprova leitura sem mutação, separação de homônimos e contato compartilhado, vínculo explícito e exigência de backup antes da gravação.
- Campanha integrada de `tests/efia-integration-10000.cjs`: 10.000 cenários passaram; 1.000 séries válidas executaram os oito componentes EF68/EF70/EF77/EF78–EF82; 5.000 cenários foram bloqueados por regras de segurança; 0 exceções e 0 resultados não finitos. Os cenários cobrem datas duplicadas/inválidas, identidade ausente/misturada, valores ausentes/extremos, troca de método/protocolo e intervalo curto.
- Quatro alunos demonstrativos e 16 avaliações: fixtures/elegibilidade passaram nos runs Windows.
- Build completo Windows x64 com .NET 8, integração EFI e bundle CPU: passou.
- Inno Setup e smoke de instalação/desinstalação isolada Alpha: passaram no run `40125310587`.
- Inferência real Qwen3.5-2B Q4_K_M: o run independente [40119653945](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40119653945) concluiu inferência sintética em CPU e verificou o checksum do modelo. Isso não é homologação clínica nem teste do fluxo dentro do aplicativo instalado.

## Escopo da campanha integrada

A campanha agora está versionada e executa o host EFIA com os oito componentes deterministicamente. 1.000 dos 10.000 casos são séries válidas que executam todos os motores; os outros 9.000 exercitam cinco classes negativas, com bloqueio observado em 5.000 casos no total. A suíte valida ausência de exceções e de números não finitos. Ela não valida migração SQLite, invalidação persistida de pareceres nem a correção científica de fórmulas contra referências externas.

## Testes ainda não executados

- Migração em lote de banco legado, backup em cenário de interrupção/rollback e preservação de dados reais. A migração assistida de uma avaliação por vez já solicita backup e grava o registro individualmente.
- Atualização in-place sobre Alpha anterior com banco contendo dados e validação de preservação na desinstalação.
- Inicialização manual do aplicativo instalado e fluxo real de gravação/leitura por módulo.
- Homologação visual do Perfil em Windows/WebView2, avaliação em diferentes resoluções/escalas, navegação por teclado/toque e contraste completo.
- Validação visual e impressão dos PDFs A4, backup/restauração e separação de relatório privado e compartilhável.
- Estados EFI/Qwen: runtime ausente, modelo ausente/corrompido, retomada, cancelamento, timeout, falta de RAM e uso offline dentro do aplicativo.
- Validação independente das fórmulas científicas contra referências externas e testes de invalidação persistida de pareceres.

## Resultado

A branch possui build Windows e smoke automatizado de instalação/desinstalação aprovados no run `40125997101`; a suíte integrada de 10.000 cenários também passou. A implementação do Perfil e o novo fluxo de objetivos têm testes automatizados, mas a homologação manual do aplicativo instalado, migração de dados e atualização in-place continuam pendentes; a campanha integrada passou, enquanto a validação externa das fórmulas e a invalidação persistida seguem pendentes. A migração individual exige backup e foi coberta por teste estático/CI; a interação manual do diálogo de backup e consolidação de históricos reais ainda não foram homologadas. A versão não é candidata a estável.
