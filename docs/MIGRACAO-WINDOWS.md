# Migração segura de dados — Windows beta

Este procedimento é **experimental** e não substitui a homologação funcional.

## Operações disponíveis
1. **Verificar bancos**: lista bancos IndexedDB e quantidade de registros, sem alterar dados.
2. **Copiar dados locais para SQLite**: cria cópias criptografadas dos registros localStorage.
3. **Copiar IndexedDB para SQLite**: copia registros compatíveis com JSON e confere a leitura posterior. Mostra progresso sem expor informações pessoais.

As cópias não alteram o armazenamento original. Não exclua dados do WebView2, não desinstale apagando o perfil e não remova os backups existentes.

## Limitações críticas
- Os módulos de pacientes, avaliações, cobranças e PDFs **ainda não utilizam o SQLite como armazenamento principal**.
- Registros IndexedDB que contenham Blob, ArrayBuffer, Date, Map, Set, referências circulares ou outros valores não compatíveis com JSON são recusados, não convertidos silenciosamente.
- Uma migração parcialmente concluída pode ser retomada quando os registros forem idênticos. Dados antigos modificados após a cópia geram conflito e exigem reconciliação; não são sobrescritos.
- A contagem de registros antes e depois ajuda a identificar alterações concorrentes, mas não substitui uma migração transacional entre bancos.
- A proteção automática DPAPI está vinculada à conta Windows. Uma cópia do arquivo SQLite, isoladamente, não constitui backup portátil entre computadores.
- A interface de senha mestre e o mecanismo de recuperação ainda não estão homologados. Não ativar modo de senha mestre sem migração e recuperação testadas.
- A verificação final deve incluir pacientes, avaliações, histórico, imagens/anexos, cobrança, geração de PDF, backup/restauração e reinicialização do aplicativo.

## Critérios mínimos antes da versão estável
- Inventário real dos esquemas e formatos de IndexedDB.
- Exportação/migração completa e verificável, inclusive anexos e tipos binários.
- Transição explícita de cada módulo para SQLite com rollback e prevenção de escrita divergente.
- Senha mestre com troca, desbloqueio, recuperação e testes de falha.
- Backup restaurável em outra instalação autorizada.
- QA funcional e instalação/atualização em Windows limpo.

A versão web estável e o projeto Linux não devem ser alterados durante este processo.
