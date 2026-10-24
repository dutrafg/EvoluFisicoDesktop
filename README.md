# EvoluFísico Desktop 1.0.11 estável

Aplicativo Windows x64 criado em **C#/.NET 8, WPF e WebView2**, com interface HTML/CSS/JavaScript. Esta versão integra as novidades do [Evolufisico2 1.0 estável](https://github.com/dutrafg/Evolufisico2), mantendo o armazenamento SQLite nativo criptografado e o fluxo de atualização do Windows.

## Módulos e funcionalidades

- **Início:** agenda rápida, calendário, compromissos do dia/semana, retornos atrasados, pré-cadastros e organização de cartões; resumo com acesso às Análises.
- **Avaliações:** cadastros, fichas, medidas, dobras, bioimpedância, histórico e impressão/PDF. Alunos homônimos são separados por identificador.
  - **Nova avaliação pelo histórico:** reaproveita somente identificação, contato, sexo, idade, altura e dados profissionais, nunca peso, dobras, perimetria, fotos ou parecer anterior; mantém o ID permanente do aluno.
  - **Aderência para iniciantes:** “Nunca treinou” e “Nunca fez dieta” são opções não aplicáveis, sem redução indevida do score; se ambos os planos não começaram, exibe “Não avaliável”, inclusive no relatório.
  - **Perimetria:** soma salva como valor numérico (ou nulo quando ausente), sem transformar em texto.
- **Evolução:** acompanhamento longitudinal, comparações entre datas e indicadores derivados com ressalvas de metodologia.
- **Calculadora/Laboratório EF77:** estimativas antropométricas e energéticas, índices, verificação de valores fora do domínio e diferenças entre métodos.
- **Formulários:** anamneses por níveis e modelos personalizáveis, com vínculo ao aluno e persistência protegida.
- **Análises:** página própria após Formulários, ícone de cérebro e ajuda **?**. Integra EF68 (tendência), EF70 (trajetória e sinais) e EF77 (evidências laboratoriais), com seleção de três ou quatro avaliações distintas do mesmo aluno.
- **Cobranças:** controle de serviços, recebimentos, pendências e histórico financeiro.
- **Configurações:** aparência, dez cores (cinco suaves e cinco tons profissionais), dados do personal/CREF, armazenamento, segurança, backup, restauração, manutenção e atualizações.

### Regras de Análises

A interpretação exige **ao menos 3 datas distintas e intervalo mínimo de 21 dias**. Séries com dados ausentes/inválidos, mudanças de método ou pouco intervalo entre coletas recebem bloqueios ou ressalvas. Pontuações (0–100) são **indicadores heurísticos da suficiência dos dados**, não porcentagens de acurácia clínica ou diagnósticos. O relatório por aluno pode ser editado em memória antes de **Imprimir / salvar PDF**, sem alterar fichas originais.

## Sincronização de 22/10/2026 — Evolufisico2 1.0

Base verificada: `dutrafg/Evolufisico2@7381ed1884ff` (branch `main`).

- **Avaliações agrupadas por aluno:** cada pasta usa o identificador permanente do aluno (`cliente_id`), sem misturar homônimos. Pastas em ordem alfabética **A–Z**, com avaliações da mais recente à mais antiga.
- **Lista ou grade:** escolha gravada localmente; a grade apresenta até quatro pastas por linha em telas grandes e reduz automaticamente para três, duas ou uma conforme a largura. Os botões de avaliação, edição, impressão, detalhes e nova avaliação continuam dentro das pastas.
- **PDF cancelável no Desktop:** prévia em janela interna com **Voltar / Cancelar**, **Esc** e **Salvar como PDF / Imprimir**. Ao cancelar, nenhum diálogo de impressão é iniciado. O fluxo original de impressão via Windows WebView2 é preservado.
- A integração mantém o banco SQLite criptografado, os backups, os IDs das avaliações e o identificador do instalador 1.0.0.
- Testes adicionais: `node tests/windows-sync-20261022.cjs`. A impressão visual, a persistência após fechar o programa e a atualização com dados reais ainda exigem homologação prática.

## Atualização 1.0.4 estável — 22/10/2026

Sincronizada com `dutrafg/Evolufisico2@04d8e317`, incluindo:

- **Início**: painel operacional com alertas, indicadores de avaliações, próximos compromissos, análise de evolução, resumo de cobranças e atalhos para ações reais. Cabeçalho inicial simplificado.
- **Organização**: agenda/calendário, notas, tarefas e metas; pesquisa, edição, filtros, exportação/importação e cards configuráveis. O módulo novo ainda usa a persistência local WebView2 para notas e metas; faça exportação própria desses registros antes de reinstalar ou limpar o perfil.
- **Cobranças**: caixa mensal que reinicia a competência a cada dia 1 sem apagar registros anteriores, histórico por mês e relatórios PDF do mês ou completos. Consulta as cobranças existentes no SQLite nativo; prévia financeira cancelável na janela do próprio aplicativo.
- **Pesquisa global**: módulos, avaliações, clientes, agenda, notas, tarefas e configurações com Ctrl+K e atalhos de teclado, sem upload dos registros.
- **Aparência**: Avançada ou Essencial; no Windows, o modo Avançado recebeu **20% a mais** de desfoque, elevação 3D e intensidade de sombras frente ao 1.0.4 web. O modo Essencial permanece leve e o sistema respeita a preferência por movimento reduzido.
- **Identificação profissional**: primeira abertura sem nome cadastrado orienta o preenchimento; as preferências existentes permanecem.
- **Navegação**: integração de Organização à sidebar, atalhos do Início e barras responsivas.

Versão nativa, instalador e atualizador: **1.0.4 estável**. Identificador de instalação anterior preservado para atualizações. A versão 2.0 **não** será usada antes do marco 2.0 do Evolufisico2.

A homologação automatizada verifica navegação, compatibilidade do instalador, cálculo financeiro com mudança de mês, persistência dos módulos anteriores, segurança SQLite, renderização sintática e o acréscimo de 20% nos efeitos. Testes em Windows real com dados do usuário, prévia de impressão e fidelidade visual ainda dependem de validação prática.

## Atualização 1.0.5 estável — 23/10/2026

O Evolufisico2 publicou 1.0.29 **pré-beta** (commit a95067c), acrescentando ícones SVG acessíveis e invalidação de cache PWA. O Desktop incorporou especificamente o sistema de ícones, sem importar o HTML completo experimental.

- Ícones SVG padronizados para imprimir, editar, salvar, excluir, pesquisar, alertas, calendários, cobranças e componentes relacionados.
- Conversão restrita à apresentação, com aria-label; campos editáveis, dados sensíveis e navegação lateral permanecem intactos.
- Preservados o ícone de cérebro no módulo Análises, o modo Avançado com +20% de efeitos e o modo Essencial.
- Cache offline WebView2/PWA renovado com os recursos de ícones.
- Desktop 1.0.5 estável: mesmo AppId, banco SQLite cifrado, backups e versão principal 1.0. O salto para 2.0 só ocorrerá quando o Evolufisico2 lançar a própria versão principal 2.0.

QA: node tests/windows-svg-icons-1-0-5.cjs
node tests/windows-sync-1-0-31.cjs
node tests/windows-whats-new-1-0-7.cjs
node tests/windows-sync-1-0-33.cjs, integrado à regressão Windows e testes do SQLite. A validação visual em monitores reais permanece necessária.
## Sincronização 1.0.6 — 23/10/2026

Verificada a versão web **Evolufisico2 1.0.31 Pré-Beta** (`09850d5`; auditoria em `docs/qa/QA_1.0.31.md`). As correções aplicáveis ao Desktop foram integradas, mantendo o canal **1.0.6 estável** do instalador Windows.

- **Configurações → Geral:** opção para proteger contra recarga acidental, ativa inicialmente, com bloqueio de F5, Shift+F5, Ctrl/Cmd+R e avisos nativos de saída sempre que o WebView2 permitir. Preferência persistente e opção de desativação.
- **Cobranças:** bloqueio de cliques simultâneos em Salvar, reabertura de pagamento somente com confirmação e nova leitura do SQLite, tratamento de nomes especiais como `__proto__` no agrupamento financeiro, modal com foco restaurado e histórico financeiro inválido impedindo sobrescrita.
- **Organização:** os formulários de notas, tarefas e metas não são fechados nem tratados como salvos se o armazenamento local falhar. Alterações são aplicadas somente após confirmar a gravação; falhas são mostradas.
- **Avaliações:** o cálculo de Pollock valida números finitos e idade entre 18 e 80 anos antes de fornecer o resultado; fórmulas e classificações anteriores são mantidas.
- **Aparência e responsividade:** cinco tons novos (Grafite, Bordeaux, Oliva, Cobre e Turquesa), além dos dez anteriores, com correção de contraste. Melhor alinhamento das ações na barra lateral e abas de Organização em duas colunas quando a tela é estreita.
- Os efeitos **Avançados +20%** do Desktop e o modo Essencial continuam sem mudanças.
- Cache offline e versão do instalador atualizados para **1.0.6**, com o mesmo `AppId`, SQLite cifrado e padrão de releases `desktop-v1.0-...`.

**Escopo intencionalmente distinto:** o mecanismo de espelhamento de pastas via IndexedDB e permissões do navegador da versão web não foi copiado para o Desktop, que mantém persistência SQLite nativa e procedimentos próprios de backup. Os dados de notas/metas de Organização ainda exigem exportação separada antes de limpar o perfil WebView2. O atualizador do Desktop continua buscando releases Windows do GitHub; não aplica automaticamente o HTML pré-beta.

**Testes adicionados:** `node tests/windows-sync-1-0-31.cjs`, integrados ao QA e à compilação do instalador. A validação automatizada não substitui testar impressão, atualização com dados existentes, teclas de recarga e layouts no Windows real.

## Sincronização Desktop 1.0.7 estável — 23/10/2026

Origem: `Evolufisico2@9fc2f68`, versão web **1.0.32 Pré-Beta**. O commit de funcionalidade `dd1af333` acrescentou o card **O que há de novidade** em Configurações → Manutenção, logo abaixo de Verificar Atualizações. As demais mudanças desse commit são atualização de versões, testes e cache; as correções 1.0.31 já estavam integradas ao Desktop 1.0.6.

- **Configurações → Manutenção:** card de novidades imediatamente abaixo do verificador de atualizações próprio do Desktop, com ícone SVG acessível, versão 1.0.7 estável e resumo das melhorias anteriores (proteção contra F5, Cobranças, Organização, Avaliações, cores e layout).
- **Integração:** sem chamadas externas nem acesso a registros de alunos; card permanece disponível offline, acompanha os temas e layout responsivo. Preserva as regras e mensagens do atualizador nativo Windows.
- **Compatibilidade:** a versão técnica e o instalador foram alterados para 1.0.7, dentro da linha principal 1.0; AppId e SQLite criptografado não foram alterados. A mudança para 2.0 aguarda lançamento correspondente do Evolufisico2.
- **QA adicional:** `node tests/windows-whats-new-1-0-7.cjs`; disponível nas pipelines de PR e geração do instalador Windows. A inspeção visual final no Windows ainda deve ser realizada após instalar.

## Sincronização 1.0.8 estável — 23/10/2026

Origem: `dutrafg/Evolufisico2@1698f430`, versão web **1.0.33 Pré-Beta**, com as novidades dos commits `3b460014`, `f3c44ac4`, `6482036e` e `52449ee4`.

- **Avaliações:** a ação contextual **Nova avaliação** foi retirada da sidebar e posicionada dentro da tela de Avaliações, junto à pesquisa. Ela fica oculta nos demais módulos e preserva o comportamento de criação de avaliação e os IDs dos alunos.
- **Relatórios PDF:** padrão `EvolufisicoNomeDoAluno.pdf` em Avaliação Física, Comparativos, Laboratório, Formulários, Análises e Cobranças. Remove acentos/caracteres especiais e capitaliza as palavras: `João da Silva` gera `EvolufisicoJoaoDaSilva.pdf`. Em relatórios financeiros com múltiplos alunos, usa `Evolufisico.pdf`.
- **Impressão Windows:** relatórios impressos usam o título normalizado, que orienta a sugestão de nome do diálogo de salvar PDF, mantendo as prévias canceláveis. O nome final ainda pode ser alterado pelo usuário ou pela impressora Windows selecionada; exportações diretas definem o arquivo.
- **Compatibilidade:** versão técnica `1.0.8`, mesmo AppId do instalador, SQLite criptografado, backups, Organização, quinze cores e efeitos Avançados +20%. Não antecipar a versão 2.0.
- **QA:** `node tests/windows-sync-1-0-33.cjs`, integrado à CI e compilação; testes em um Windows real permanecem necessários para validar a sugestão de nome no diálogo de impressão.

## Dados, migração e segurança

O Desktop permanece com banco **SQLite cifrado por mecanismos nativos do Windows**, distinto do IndexedDB usado no aplicativo web. Não substitua o frontend Windows pelos arquivos de armazenamento do Evolufisico2: os módulos de Análises foram integrados preservando o bridge de armazenamento e o cofre existentes. O perfil WebView2 permanece em `%LOCALAPPDATA%\EvoluFisicoDesktop\WebView2`.

O instalador 1.0.0 utiliza o **mesmo AppId Inno Setup** das versões anteriores: `C89493D0-1C8B-4717-A6C8-42F45B3FBD0B`. Faça backup verificável antes de instalar. Compatibilidade in-place com todos os ambientes precisa ser confirmada em teste no computador que contém os dados.

## Compilar e testar

Requer Windows x64, .NET 8 SDK, Microsoft Edge WebView2 Runtime e Inno Setup 6.

```powershell
node tests/windows-stable-1-0.cjs
node tests/windows-sync-1-0-4.cjs
node tests/windows-svg-icons-1-0-5.cjs
node tests/windows-sync-evolufisico2-1-0.cjs
node tests/windows-sync-20261022.cjs
node tests/desktop-integration.cjs
node tests/windows-release-911-beta4.cjs
node tests/windows-billing-navigation-91.cjs
powershell -ExecutionPolicy Bypass -File scripts/build-windows.ps1
```

Para gerar o instalador, compile `installer/EvoluFisico.iss` com o Inno Setup, ou baixe um release **desktop-v1.0-...** publicado pelo workflow `Windows Desktop Build`, após a execução de todas as verificações.

O build automatizado executa testes de frontend, formulários, navegação, layout, agenda, banco SQLite criptografado, backup, impressão, instalação e desinstalação silenciosa. A suíte 1.0 inclui mil históricos sintéticos determinísticos para checagem de limites, validação temporal e bloqueios; isso não substitui calibração clínica nem testes em dados reais.

## Versionamento

- **Produto:** EvoluFísico Desktop 1.0.11 estável
- **Versão técnica:** `1.0.11`
- **Tags Windows:** `desktop-v1.0-<hash>`
- **Release:** estável (não prerelease)
- **Origem funcional:** Evolufisico2 1.0, 21/10/2026

“Estável” descreve o conjunto de funcionalidades e testes automatizados. PDFs em impressoras reais, reabertura offline, atualização com base de clientes existente e concordância com instrumentos clínicos permanecem pontos de homologação prática.


## Migração candidata EFIA 2.0.1 — 23/10/2026

Origem web `dutrafg/Evolufisico2@225184a684b5`. Cinco componentes EFIA incorporados e conectados à seleção de Análises. Usa as avaliações existentes no SQLite criptografado; sem banco paralelo. Impressão adaptada para iframe compatível com WebView2. Editor antigo de cards desativado sem exclusão de dados. A Dock nova e a central de trabalho da web ainda não foram portadas. Validação em Windows real e homologação de PDFs continuam pendentes.


## Release Desktop 1.0.9 — EFIA 2.0.1

- Importados motores EF78–EF82 integrados ao EF68/EF70/EF77 e ao cadastro do aluno já persistido no SQLite criptografado.
- Resumo, Visão Profissional e Relatório do Aluno, com checagens de qualidade e impressão via iframe no WebView2.
- Editor legado de cards desativado sem exclusão de dados do usuário.
- AppId e atualizador Windows preservados; executável e instalador gerados em CI.
- Escopo não migrado: Dock Padrão/Moderna e redesenho integral do Início da versão web.
- A aprovação dos testes automatizados não substitui homologação dos PDFs e do armazenamento no Windows real com dados existentes.


## Sincronização seletiva do Web 2.0.28 — Desktop 1.0.10

Em 24/10/2026, o EvoluFisico2 passou a **2.0.28 Pré-Beta**. Esta versão Desktop adota a correção de layout do botão **Imprimir Comparativo PDF** no módulo Evolução (4/2/1 colunas), ajuste dos filtros e do seletor **Nível do questionário** nos Formulários, e a atualização da identificação no rodapé do relatório EFIA. As regras de negócio, a seleção de alunos/datas, a impressão em iframe e o SQLite cifrado existentes permanecem inalterados.

**Não incorporados nesta versão estável:** o novo Perfil Unificado de Alunos, a Avaliação em seis etapas e os widgets experimentais do Web 2.0.28. Essas funcionalidades ainda não passaram por integração com o banco nativo e homologação em Windows. Não substituir o frontend Windows pelo HTML de pré-beta. Validar os fluxos nativos e os relatórios em ambiente Windows real antes de utilizar dados reais.


## Atualização Desktop 1.0.11 — Correção de rolagem com toque (24/10/2026)

Origem: `Evolufisico2@b0eca6ba1094`, correção Web de rolagem dos miniaplicativos em tablet. Os miniaplicativos `.efw-tile-body` da web **não estão presentes no Desktop 1.0.10**; portanto, não foram copiados para o Windows. Adaptação seletiva: as áreas roláveis já existentes do Início/Análises e da Organização passam a usar `overscroll-behavior-y:auto` e `touch-action:pan-y`, com rolagem natural em telas sensíveis ao toque. O banco criptografado SQLite, as avaliações, a navegação, a impressão PDF e os backups permanecem inalterados.

QA de regressão automatizado em `tests/windows-touch-scroll-1-0-11.cjs`. Testes em notebook/tablet Windows com toque e gesto real ainda são recomendados. O Perfil Unificado e os miniaplicativos web da versão 2.0.28 continuam fora do escopo deste instalador.
