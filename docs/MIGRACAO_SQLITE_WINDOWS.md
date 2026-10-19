# Migração segura para armazenamento nativo Windows

## Decisão
SQLite nativo via Microsoft.Data.Sqlite como armazenamento transacional futuro; UI WebView2 permanece. SQLite padrão **não é criptografado**. Dados sensíveis devem ser cifrados antes da gravação (AES-256-GCM com autenticação) ou utilizar solução de banco criptografado auditada. A existência de ProtectedVault.cs não significa que o banco atual já esteja protegido.

## Requisitos obrigatórios antes de ativar
- Inventariar **todos** os caminhos de gravação e leitura: IndexedDB, localStorage, sessionStorage, cache/service worker, exportação JSON, PDF, backups, dados de clientes, avaliações e preferências.
- Criar API nativa restrita para leitura/gravação por WebView2; validar origem e esquema de cada mensagem, limitar tamanho, validar IDs e bloquear chamadas de outras origens.
- SQLite em %LOCALAPPDATA%/EvoluFisicoDesktop/Data com permissões de usuário, schema versionado, transações, chaves estrangeiras e PRAGMA integrity_check; usar parâmetros SQL.
- Criptografar registros sensíveis em repouso; AES-GCM com nonces exclusivos e AAD contextual por registro. Chave aleatória envolvida por DPAPI CurrentUser; senha mestre opcional com derivação resistente e mecanismo seguro de troca de senha.
- **Não** manter cópia legível no IndexedDB/localStorage após migração. Desativar escrita legada apenas quando testes de leitura/escrita e restauração passarem. Limpar caches sensíveis de forma controlada.
- Migração em duas fases: backup íntegro e testado, cópia para base temporária, verificação de contagem e conteúdo, troca atômica; falha preserva dados originais.
- Backups portáteis com chave/senha independente do DPAPI; incluir verificação de integridade e teste real de restauração em outro Windows.
- Evitar logs com dados pessoais, estabelecer retenção, exclusão e exportação sob solicitação. PDF e impressão continuam superfícies de exposição.
- Criar testes automatizados com dados sintéticos para migração, rollback, queda de energia, senha errada, adulteração, conta Windows distinta e restauração.
- Realizar homologação Windows e revisão de privacidade antes de habilitar por padrão.

## Sequência de entregas
1. Inventário de persistência e testes de compatibilidade.
2. SQLite e repositório nativo em paralelo, inicialmente sem mudar o armazenamento ativo.
3. Cofre e fluxo de senha mestre com recuperação por backup.
4. Migração transacional assistida e verificações de integridade.
5. Ativar SQLite como fonte única e eliminar cópias antigas após confirmação.
6. Política de privacidade, registro de operações, direitos dos titulares, canal de contato, retenção e resposta a incidentes.

## Limite de conformidade
Nenhum banco garante sozinho conformidade com LGPD. A avaliação final depende das finalidades, bases legais aplicáveis (especialmente art. 11 para saúde), processos e medidas técnicas e organizacionais do responsável pelo tratamento.

Referências:
- https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte
- https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes
