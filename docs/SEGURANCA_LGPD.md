# Plano de proteção de dados — LGPD (Windows)

## Escopo e riscos
Cadastros, avaliações físicas, medidas e histórico podem conter dados pessoais e dados de saúde (sensíveis). O tratamento deve respeitar finalidade, necessidade, transparência, segurança e direitos do titular. Criptografia isolada não assegura conformidade legal.

## Arquitetura aprovada para implementação incremental
1. **Automático (padrão):** chave aleatória AES-256-GCM por cofre, protegida com Windows DPAPI CurrentUser. O aplicativo desbloqueia apenas na mesma conta Windows. Nunca salvar a chave em texto puro.
2. **Senha mestre opcional:** derivar chave de proteção da senha com KDF resistente a ataques offline (preferir Argon2id com parâmetros versionados e biblioteca auditada). Sal e parâmetros individuais; não guardar a senha. A opção de senha deve exigir desbloqueio na abertura do cofre e oferecer procedimento explícito para alterar a senha.
3. **Armazenamento:** persistir dados pessoais criptografados em repouso, com nonce aleatório por gravação, autenticação de integridade e versão de formato; nunca reutilizar nonce com a mesma chave. Metadados mínimos fora do cofre.
4. **Migração:** criar backup verificado antes de qualquer conversão; migrar por etapas com transação/arquivo temporário, checagem de leitura e substituição atômica. Em erro, preservar originais sem perda. Não declarar a migração concluída antes de testes reais de restauração.
5. **Backups/exportações:** proteger cópias com senha independente quando destinadas a outro computador. DPAPI CurrentUser sozinho não permite restauração em outra máquina; explicar isso na interface.
6. **PDFs:** arquivos exportados e fila de impressão podem ficar fora do cofre; exibir aviso antes de exportar dados sensíveis e evitar diretórios temporários permanentes.
7. **Acesso e privacidade:** bloqueio de sessão, minimização de coleta, exclusão/exportação sob solicitação, política de retenção, informação clara ao titular, registro de incidentes sem dados clínicos em logs.
8. **Validação:** testes de troca de conta Windows, senha errada, dados adulterados, falha de energia durante migração, backup/restauração, atualização de aplicativo e instalação limpa.

## Estado atual
**Este documento é especificação, não uma declaração de que todos os cadastros atuais já estão criptografados.** Não ativar migração automática sem implementar e testar o fluxo completo, incluindo recuperação e compatibilidade com armazenamento WebView2/IndexedDB.

## Referências
- Lei 13.709/2018 (LGPD), arts. 6, 11, 18, 46–49.
- ANPD: Guia orientativo sobre segurança da informação para agentes de tratamento de pequeno porte: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte
- ANPD: Resolução CD/ANPD 2/2022: https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022

## Implementação incremental — 2026-10-19
- `ProtectedVault.cs`: primitivas de AES-256-GCM, DPAPI CurrentUser e modo de senha mestre com PBKDF2-SHA256 (600.000 iterações), nonce e sal aleatórios, formato versionado e autenticação.
- **Ainda não integrado** à persistência WebView2/IndexedDB. Não declarar dados existentes criptografados.
- **Ainda pendente:** testes automatizados criptográficos (round-trip, senha incorreta, corrupção, conta Windows diferente), migração transacional com rollback, interface para definir/alterar senha mestre, recuperação/exportação entre máquinas e avaliação jurídica/operacional da LGPD.
- No modo DPAPI, perder o perfil/credenciais Windows pode impedir recuperação; exigir backup portátil independente antes de habilitar.
