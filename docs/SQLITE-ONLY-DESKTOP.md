# SQLite-only Desktop (pré-homologação)

A pedido do responsável pelo projeto, o aplicativo desktop ainda não utilizado em produção passa a usar SQLite criptografado como armazenamento principal para **avaliações e cobranças**. Os dados antigos de IndexedDB/localStorage não são importados automaticamente.

## Implementado
- Avaliações: leitura, inclusão, alteração e exclusão via `EFNativeStorage` com IDs `ef-eval-<id>`.
- Cobranças: leitura e gravação via `EFNativeStorage`, registro `ef-billing-main`.
- O SQLite criptografa cada registro com AES-GCM e DPAPI no Windows.
- Scripts de migração do IndexedDB removidos da página carregada.
- Backup nativo SQLite com verificação de integridade.

## Restrições antes da versão estável
- **Não remover arquivos legados do repositório** antes de revisar rotinas internas de senha mestre, restauração, importação, fotos e preferências que ainda podem chamar IndexedDB/localStorage.
- A interface legada da senha mestre e os caminhos de troca de chave ainda exigem integração com SQLite; não declarar esse fluxo pronto.
- Excluir uma avaliação altera registros relacionados em gravações separadas; falta uma operação transacional de conjunto.
- O módulo de cobranças pode possuir outros caminhos de leitura/gravação além de `loadBilling`/`writeBilling`; todos precisam ser auditados.
- O aplicativo precisa passar por testes funcionais reais: cadastro, edição, exclusão, histórico, fotos, cobranças, PDF, backup, reinício e reinstalação.
- O backup DPAPI não é portátil entre contas Windows sem mecanismo adicional.
- Não usar o resultado verde do CI como homologação funcional.

**Status: beta, ainda não estável.**
