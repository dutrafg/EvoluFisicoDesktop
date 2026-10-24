# QA — EvoluFísico Desktop EFI Alpha

Data: 24/10/2026. Os resultados abaixo distinguem verificações automatizadas de homologação prática.

## Execuções Windows desta rodada

| Verificação | Resultado observado |
|---|---|
| Run [40124088830](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40124088830), commit `e78d7bc0eaa0248a84cddf3416b96f806523523a` | Sucesso: teste de Perfil/tema, fixtures, build Windows, runtime EFI, instalador, smoke de instalação/desinstalação e upload do artefato. |
| Run [40124398686](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40124398686), commit `0cbd82fbb6ecf186861161f544a6abdcbd4a482a` | Falhou somente no smoke: a busca ainda usava o nome antigo do instalador e não encontrou o EXE. O setup havia compilado; nenhum artefato foi publicado. |
| Run [40124552552](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40124552552), commit `6de5dd77587a04a3bda0d572c492effb80316a79` | Sucesso completo. Busca por nome corrigida; os testes novos de etapa 2 e rascunhos passaram; instalador instalado/desinstalado no runner e artefato enviado. |
| Run [40125310587](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40125310587), commit `a6c0d9afc4e9a06bd307a923f0c57d4110fc2422` | Sucesso completo: teste de migração explícita com backup, build Windows, instalador, smoke de instalação/desinstalação e artefato enviado. |
| Run [40125997101](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40125997101), commit `af0584fff5819c3cd09c42e77efa66d600cedf7f` | Sucesso completo: primeira suíte integrada de 10.000 cenários EFIA, build Windows, bundle CPU, instalador, smoke install/uninstall e artefato enviado. |
| Run [40126487526](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40126487526), commit `cbda289cbd590c9a256cea086a42cc8a79c9c679` | Sucesso completo: bloqueios e supressão de tendências por tipo de cenário confirmados, build Windows, instalador, smoke install/uninstall e artefato enviado. |
| Run [40126910352](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40126910352), commit `2767f8817ee6c9f07556945b330381edfb68c2ef` | Sucesso completo: smoke iniciou o executável e verificou processo ativo, além da campanha EFIA, build, instalação/desinstalação e upload do EXE. |
| Run [40128372330](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40128372330), commit `08eee52b8d3c889b01d1a11491d04337563be5fb` | Sucesso completo: teste de bloqueio de PDF com rascunho desatualizado, build Windows e smoke de inicialização/instalação/desinstalação. |

## Testes executados

- Sintaxe EFI JavaScript: passou nos runs acima.
- Rascunhos do relatório: passou `tests/analysis-report-staleness.cjs`; quando a versão do estado muda, o editor preserva o texto, bloqueia a emissão do PDF e orienta reabrir o relatório para revisar os dados atuais.
- Perfil Unificado e regressão de tema: passou em `tests/unified-students-profile.cjs`; cobre separação de homônimos, agrupamento por ID persistente, cronologia, métricas e leitura conservadora de registros sem ID.
- Avaliação em seis etapas: passou em `tests/evaluation-objectives.cjs`; confirma Objetivos na etapa 2, persistência de seleções múltiplas, edição e recuperação de rascunhos.
- Identidade legada: passou em `tests/client-identity-migration.cjs`; comprova leitura sem mutação, separação de homônimos e contato compartilhado, vínculo explícito e exigência de backup antes da gravação.
- Campanha integrada de `tests/efia-integration-10000.cjs`: 10.000 cenários passaram; 1.000 séries válidas executaram EF68/EF70/EF77/EF78–EF82; 0 exceções e 0 valores não finitos. Os 5.000 casos com datas duplicadas/inválidas, mistura de aluno, identidade ausente ou série total de 18 dias foram bloqueados. Os 1.000 casos com dados faltantes geraram avisos. Nos 1.000 casos fisiologicamente inconsistentes e nos 2.000 com troca de método/protocolo, a série permaneceu elegível para outros indicadores, mas a tendência de gordura foi suprimida e a comparação longitudinal marcada insuficiente.
- Quatro alunos demonstrativos e 16 avaliações: fixtures/elegibilidade passaram nos runs Windows.
- Build completo Windows x64 com .NET 8, integração EFI e bundle CPU: passou.
- Inno Setup, inicialização do processo `EvoluFisico.Desktop.exe` por 8 segundos e smoke de instalação/desinstalação isolada Alpha: passaram no run `40126910352`. A verificação confirma que o processo permanece ativo, não é uma homologação visual da interface.
- Inferência real Qwen3.5-2B Q4_K_M: o run independente [40119653945](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40119653945) concluiu inferência sintética em CPU e verificou o checksum do modelo. Isso não é homologação clínica nem teste do fluxo dentro do aplicativo instalado.

## Escopo da campanha integrada

A campanha versionada executa o host EFIA com os oito componentes deterministicamente. 1.000 casos válidos executam todos os motores; as classes negativas exercitam bloqueio total, sinalização de valores ausentes e supressão de tendências não comparáveis. A série de menor duração tem 18 dias. O run `40126487526` passou com 5.000 bloqueios, 0 exceções e 0 valores não finitos. Ela não valida migração SQLite, invalidação persistida de pareceres nem a correção científica de fórmulas contra referências externas.

## Testes ainda não executados

- Migração em lote de banco legado, backup em cenário de interrupção/rollback e preservação de dados reais. A migração assistida de uma avaliação por vez já solicita backup e grava o registro individualmente.
- Atualização in-place sobre Alpha anterior com banco contendo dados e validação de preservação na desinstalação.
- Abertura manual da interface instalada e fluxo real de gravação/leitura por módulo; o smoke só confirmou que o processo iniciou e permaneceu ativo por 8 segundos.
- Homologação visual do Perfil em Windows/WebView2, avaliação em diferentes resoluções/escalas, navegação por teclado/toque e contraste completo.
- Validação visual e impressão dos PDFs A4, backup/restauração e separação de relatório privado e compartilhável.
- Estados EFI/Qwen: runtime ausente, modelo ausente/corrompido, retomada, cancelamento, timeout, falta de RAM e uso offline dentro do aplicativo.
- Validação independente das fórmulas científicas contra referências externas e testes de invalidação persistida de pareceres.

## Resultado

A branch possui build Windows e smoke automatizado de instalação/desinstalação aprovados no run `40128372330`; passaram a suíte integrada reforçada, a detecção de rascunho desatualizado e o smoke de processo inicializado. A implementação do Perfil e o novo fluxo de objetivos têm testes automatizados, mas a homologação manual do aplicativo instalado, migração de dados e atualização in-place continuam pendentes; a campanha integrada passou; a validação externa das fórmulas e a invalidação persistida seguem pendentes. A migração individual exige backup e foi coberta por teste estático/CI; a interação manual do diálogo de backup e consolidação de históricos reais ainda não foram homologadas. A versão não é candidata a estável.
