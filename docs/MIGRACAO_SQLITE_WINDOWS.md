# Migração para armazenamento SQLite nativo no Windows

Atualizado em 24/10/2026.

## Estado atual

O Desktop possui uma ponte nativa restrita à origem local do WebView2 e usa SQLite como armazenamento nativo transacional. Os registros ficam em `%LOCALAPPDATA%/EvoluFisicoDesktop/Data/records.sqlite`; a Alpha usa diretório separado para não compartilhar banco, perfil WebView2 ou modelos com a versão estável.

A tabela `protected_records` guarda envelopes autenticados por registro. `ProtectedVault` usa AES-256-GCM; no modo automático, a chave aleatória é protegida por DPAPI CurrentUser. Há também suporte criptográfico a senha mestre no armazenamento; a interface e troca/recuperação de chave ainda não estão homologadas como fluxo completo. A versão inicial do schema é `user_version=1`; versões futuras são recusadas sem downgrade. A ponte valida a origem, o formato e o tamanho das operações.

A SQLite nativa está ativa para os registros atendidos pela API do Desktop. A migração legada continua em modo conservador: `29-legacy-migration.js` copia itens do `localStorage` para envelopes SQLite e confere cada cópia, sem remover nem alterar a origem. Os dados legados de IndexedDB não são cortados automaticamente. O app ainda contém caminhos WebView2 e snapshots que precisam ser inventariados e migrados antes de declarar o SQLite como fonte única para toda a aplicação.

## Validação automatizada

A workflow Windows executa `tests/StorageSmoke` com banco temporário e dados fictícios. O smoke cobre:

- Cifragem DPAPI e senha mestre, round-trip e rejeição de senha incorreta/adulteração.
- Upsert e lote transacional, conflito de IDs e rollback sem sobrescrever registros anteriores.
- Integridade do banco e recusa de schema futuro preservando sua versão.
- Exclusão em lote e exclusão de avaliação com atualizações vinculadas, de forma atômica.
- Snapshot, restauração, isolamento da cópia e proteção do backup anterior se a verificação falhar.
- Preservação de registros financeiros ao substituir o conjunto de avaliações.

A execução passou no run Windows [40130819687](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40130819687). Isso valida a camada de armazenamento com dados sintéticos. Não valida uma migração de perfil real do IndexedDB, atualização in-place de instalação existente, interrupção de processo durante migração ou restauração sob outra conta Windows.

## Regras antes de ampliar a migração

- Fazer backup verificado antes da operação e manter a origem intocada até a cópia e a verificação terminarem.
- Não agrupar alunos legados pelo nome ou por contatos compartilhados. Exigir seleção explícita para vínculos ambíguos.
- Migrar em lotes limitados e retomáveis, com IDs estáveis, contagem e comparação de bytes.
- Só realizar corte para SQLite depois da leitura, gravação, backup e restauração terem homologação com cópias de bancos reais; sem apagar a origem na mesma etapa da cópia.
- Preservar registros financeiros e outras tabelas durante restauração apenas de avaliações.
- Usar transações e rollback; rejeitar bancos de versão mais nova sem alteração.
- Manter logs livres de conteúdo pessoal/clínico e limitar exposição na ponte WebView2.

## Próximos testes necessários

- Migração de cópia sintética de cada versão antiga de IndexedDB e LocalStorage para SQLite e reexecução após falha/interrupção.
- Atualização Alpha sobre Alpha anterior, preservando avaliações, perfis, cobrança e chave local.
- Restauração em nova pasta e sob outra conta Windows, conforme política DPAPI e senha independente.
- Homologação manual do aplicativo com criação, edição, leitura, backup e restauração de um banco de teste.
- Auditoria final de privacidade/LGPD para finalidades, retenção, exportação, exclusão e compartilhamento.

SQLite, DPAPI e backups protegidos são controles técnicos; não estabelecem conformidade LGPD sozinhos. A avaliação depende das finalidades, bases legais e processos do responsável pelo tratamento.
