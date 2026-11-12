# EvoluFísico Desktop 3.1.37 — migração da interface integral

Fonte: EvoluFísico2 Web 3.1.37, commit 486ef975f97aff52388624c7edcd95089b66e9e7, HTML blob 0385866926cf897162c1c48132cb7d420eb75a2f.

- Substituída a interface HTML antiga pela versão Web integral, incluindo Dashboard, Perfil Unificado, EvoStore, Análises Completas e os demais recursos.
- Inicialização das avaliações com `EFNativeStorage`; registros clínicos continuam armazenados em SQLite protegido por Windows DPAPI/AES-GCM, com IDs `ef-eval-`.
- Leitura, gravação, exclusão e substituição/importação transacionais de avaliações passam pela ponte nativa; não usar um segundo IndexedDB para avaliações no Windows.
- Mesmo versionamento **3.1.37** em frontend, janela C#, assembly, instalador, version.json e atualizador. Canal RC não altera a numeração do produto.
- AppId do instalador e caminho dos dados preservados. Backup recomendado antes da atualização.
- Preferências, billing e outros estados não clínicos ainda podem usar WebView2 localStorage: auditar persistência e backups antes de considerar equivalência total de dados.
- Testes do instalador e do banco de dados via GitHub Actions não provam o comportamento gráfico real. Homologar todos os módulos, miniapps e PDFs usando quatro alunos com quatro avaliações, modo claro/escuro, tablets e pastas.
- Sem publicação automática em main antes da homologação.
