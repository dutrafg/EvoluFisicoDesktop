# Armazenamento SQLite-only — pré-homologação

Atualizado em 24/10/2026.

O Desktop usa SQLite criptografado como armazenamento nativo para avaliações e cobranças. A Alpha mantém diretório de dados separado da versão estável. A ponte WebView2 aceita chamadas somente da origem local empacotada e limita os tipos e tamanhos de operação.

## Implementado e validado

- Avaliações: leitura, inclusão, alteração e exclusão via `EFNativeStorage`, com IDs `ef-eval-<id>`.
- Cobranças: leitura e gravação nativas no registro `ef-billing-main`.
- SQLite v1: registros cifrados por AES-GCM; chave aleatória protegida por DPAPI CurrentUser no modo automático. O modo senha mestre existe na camada de armazenamento; a integração completa da interface ainda está pendente.
- Exclusão de avaliação e atualizações vinculadas em transação única.
- Backup nativo verificado e restauração que substitui apenas avaliações, mantendo cobranças.
- `tests/StorageSmoke` executado no Windows Actions run [40130819687](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40130819687). Cobriu round-trip de cofre, transações, conflitos, rollback, integrity check, rejeição de schema futuro, backup/restauração, exclusão atômica e adulteração autenticada.

## Migração legada e limites atuais

A migração não faz corte automático do armazenamento antigo. O helper `29-legacy-migration.js` copia itens do `localStorage` para SQLite, compara os bytes e deixa a origem intacta; IndexedDB e perfis existentes ainda precisam de migração e homologação específicas. Não remover os dados legados antes de verificar uma cópia de backup e uma restauração real.

O teste SQLite usa bancos temporários e dados fictícios. Ele não prova atualização sobre uma instalação com dados reais, migração de IndexedDB/LocalStorage em todas as versões, interrupção/retomada em perfil do usuário nem portabilidade DPAPI para outra conta Windows.

## Pendências antes da versão RC

- Integrar e homologar senha mestre e troca/recuperação de chave com o armazenamento nativo e backups.
- Migrar cada fonte legada com cópias de bancos de versões suportadas, conferência de contagem e conteúdo, retentativa após interrupção e origem preservada.
- Testar atualização in-place e desinstalação sem perda indevida de avaliações, perfil, cobranças e chave.
- Homologar no app instalado cadastro, edição, exclusão, histórico, fotos, cobrança, PDF, backup, restauração e reinício.
- Verificar backup/restauração entre pastas e, conforme a política DPAPI, entre contas Windows.
- Auditar preferências e caminhos não clínicos ainda atendidos por armazenamento de navegador antes de retirar a infraestrutura legada.

**Status: pré-homologação; não declarar estável.**
