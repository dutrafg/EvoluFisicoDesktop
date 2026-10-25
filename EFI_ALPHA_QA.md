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
| Run [40130819687](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40130819687), commit `760fb46a7319c1c57493f6fde1b49e4516901396` | Sucesso completo: smoke de armazenamento SQLite em Windows, build EFI, instalador e inicialização/instalação/desinstalação. |
| Run [40131660142](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40131660142), commit `d53963eab7afdf071f294b6a4f2d7db23cc2c552` | Sucesso completo: regressões extras de formulário, avaliação/cobrança, Início, agenda, toque, privacidade e paleta, além de SQLite, 10.000 casos EFIA, build e smoke Windows. |
| Run [40132081529](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40132081529), commit `cdae50309127f652ae7ef1cf72dadfd74b3ec04b` | Sucesso: 30.000 cenários EFIA, 166.500 verificações, SQLite, regressões, build Windows x64 e smoke completo do instalador. |

## Testes executados

- Sintaxe EFI JavaScript: passou nos runs acima.
- Formulários, cliente nativo de storage e avaliação/cobrança: passaram no run `40131660142`; incluem integração Windows/anamnese, round-trip binário/JSON e erros da ponte, regras de recebimento de cobrança e 9 assertions de regressão de avaliação/cobrança.
- Início, agenda, layout e aparência: passaram as regressões de resumo semanal, recorrências, layout/empacotamento, redimensionamento, rolagem por toque, privacidade e paleta no run `40131660142`. São testes Node estáticos/comportamentais, não homologação visual interativa.
- SQLite: `tests/StorageSmoke` passou no run Windows `40130819687`; cobriu criptografia/DPAPI e senha mestre, leituras/gravações, batches e rollback, integridade, rejeição de schema futuro sem downgrade, backup/restauração, exclusão atômica, adulteração e preservação de backup anterior em falha.
- Rascunhos do relatório: passou `tests/analysis-report-staleness.cjs`; quando a versão do estado muda, o editor preserva o texto, bloqueia a emissão do PDF e orienta reabrir o relatório para revisar os dados atuais.
- Perfil Unificado e regressão de tema: passou em `tests/unified-students-profile.cjs`; cobre separação de homônimos, agrupamento por ID persistente, cronologia, métricas e leitura conservadora de registros sem ID.
- Avaliação em seis etapas: passou em `tests/evaluation-objectives.cjs`; confirma Objetivos na etapa 2, persistência de seleções múltiplas, edição e recuperação de rascunhos.
- Identidade legada: passou em `tests/client-identity-migration.cjs`; comprova leitura sem mutação, separação de homônimos e contato compartilhado, vínculo explícito e exigência de backup antes da gravação.
- Campanha integrada de `tests/efia-integration-10000.cjs`: 10.000 cenários passaram; 1.000 séries válidas executaram EF68/EF70/EF77/EF78–EF82; 0 exceções e 0 valores não finitos. Os 5.000 casos com datas duplicadas/inválidas, mistura de aluno, identidade ausente ou série total de 18 dias foram bloqueados. Os 1.000 casos com dados faltantes geraram avisos. Nos 1.000 casos fisiologicamente inconsistentes e nos 2.000 com troca de método/protocolo, a série permaneceu elegível para outros indicadores, mas a tendência de gordura foi suprimida e a comparação longitudinal marcada insuficiente.
- Campanha da referência EvoluFísico2 portada para motores Desktop: 30.000 históricos (1.500 em cada uma de 20 classes), 60.000 execuções de pipeline, 166.500 assertions, 18.000 elegíveis, 12.000 bloqueados e 21.000 execuções dos oito motores. Falhas=0; mutações de entrada=0; divergências de determinismo=0; NaN/Infinity=0. Seed `0xef242026`; entrada SHA-256 `0c6ff81508c4275792a9915146ee5bfeedbe4ab412d7b836d42289a0ce7c67bb`; saída SHA-256 `e9cd4a66a1fd3cd2370ce5d99e465ba1c6b01e83e051f0ad5700816241063dc2`. Node VM sobre motores da aplicação; não é teste de navegador/IndexedDB nem validação científica externa.
- Quatro alunos demonstrativos e 16 avaliações: fixtures/elegibilidade passaram nos runs Windows.
- Build completo Windows x64 com .NET 8, integração EFI e bundle CPU: passou.
- Inno Setup, inicialização do processo `EvoluFisico.Desktop.exe` por 8 segundos e smoke de instalação/desinstalação isolada Alpha: passaram no run `40126910352`. A verificação confirma que o processo permanece ativo, não é uma homologação visual da interface.
- Inferência real Qwen3.5-2B Q4_K_M: o run independente [40119653945](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40119653945) concluiu inferência sintética em CPU e verificou o checksum do modelo. Isso não é homologação clínica nem teste do fluxo dentro do aplicativo instalado.

## Escopo das campanhas integradas

A campanha Desktop de 10.000 cenários executa o host EFIA com os oito motores; 1.000 séries válidas executaram todos, 5.000 casos foram bloqueados e houve 0 exceções/valores não finitos. A campanha oficial portada da Web, `tests/efia-campaign-30000.cjs`, executou 30.000 históricos/60.000 pipelines e 166.500 verificações com semente fixa. Foram 18.000 elegíveis, 12.000 bloqueados e 21.000 execuções dos oito motores; sem falhas de assertions, mutações, divergências de determinismo ou saídas não finitas. Não valida migração completa do perfil de usuário, invalidação persistida de pareceres nem fórmulas contra referências científicas externas. O log mostrou mensagem isolada `EF77: ponto de montagem não encontrado`; o passo e todas as assertions concluíram com sucesso, a origem foi identificada: o teste executa em Node VM sem os elementos DOM `.nav-tabs`/`#tab-comparison`, então o `mount()` visual do EF77 emite esse aviso previsto. A montagem interativa no WebView2 continua pendente de homologação.

## Testes ainda não executados

- Migração real de IndexedDB/LocalStorage para SQLite com dados existentes, corte de fonte de verdade, interrupção durante migração e atualização in-place preservando banco real. O smoke cobre atomicidade e rollback do armazenamento sintético, não a migração aplicada ao perfil de um usuário.
- Atualização in-place sobre Alpha anterior com banco contendo dados e validação de preservação na desinstalação.
- Abertura manual da interface instalada e fluxo real de gravação/leitura por módulo; o smoke só confirmou que o processo iniciou e permaneceu ativo por 8 segundos.
- Homologação visual do Perfil em Windows/WebView2, avaliação em diferentes resoluções/escalas, navegação por teclado/toque e contraste completo.
- Validação visual/impressão dos PDFs A4, backup/restauração pelo fluxo do aplicativo, compatibilidade de formatos antigos e separação de relatório privado e compartilhável.
- Estados EFI/Qwen: runtime ausente, modelo ausente/corrompido, retomada, cancelamento, timeout, falta de RAM e uso offline dentro do aplicativo.
- Validação independente das fórmulas científicas contra referências externas e testes de invalidação persistida de pareceres.

## Resultado

A branch possui build Windows, startup/instalação/desinstalação e regressões de módulos aprovados no run `40132081529`; passaram o smoke SQLite, as campanhas de 10.000 e 30.000 cenários, a detecção de rascunho desatualizado e o smoke de processo inicializado. A implementação do Perfil e o novo fluxo de objetivos têm testes automatizados, mas a homologação manual do aplicativo instalado, migração de dados e atualização in-place continuam pendentes; a campanha integrada passou; a validação externa das fórmulas e a invalidação persistida seguem pendentes. A migração individual de identidade exige backup e foi coberta por teste estático/CI; a interação manual do diálogo de backup e consolidação de históricos reais ainda não foram homologadas. A versão não é candidata a estável.


## Execução final Windows 3.0 — 25/10/2026

Workflow [EFI AI Alpha Build Validation #136](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40162151708), commit `5727343fef7b97bdc5d34c18d77508a5cc9d8669`, em Windows Server 2025, concluiu com **success**. O primeiro run do commit anterior falhou porque a fixture ainda exigia o AppVersion antigo `1.0.14.0`; a expectativa foi atualizada para o nome e versão reais do instalador 3.0, e o run seguinte concluiu integralmente.

Aprovados: sintaxe EFI; Perfil Unificado/tema; fluxo de seis etapas e persistência de objetivos; migração de identidade legada segura; 10.000 cenários sintéticos integrados (1.000 execuções completas dos oito motores, zero exceções/valores não finitos); campanha EFIA de 30.000 históricos (60.000 execuções da pipeline e 166.500 verificações, zero falhas registradas); SQLite criptografado, transações, recuperação e backups; formulários, armazenamento nativo, avaliações/cobranças; Home/agenda/toque/privacidade/paleta; invalidação de análise desatualizada; quatro séries demonstrativas com 16 avaliações e elegibilidade EFIA; build .NET; chat EFI; runtime nativo CPU; instalador Alpha e smoke test de isolamento.

O instalador foi empacotado e disponibilizado como artefato Actions. Os testes automáticos de isolamento passaram. Não foi realizada instalação manual assistida em uma máquina física de usuário nem homologação visual nas quatro escalas Windows de DPI; essa limitação não é coberta por CI. O run anterior `40161961820` foi reprovado pela asserção de versão desatualizada, corrigida antes do run final, portanto não é contabilizado como teste aprovado.
