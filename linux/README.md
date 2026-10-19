# EvoluFisico Linux — GTK4

Prévia de desenvolvimento **não adequada para dados reais ou uso clínico**.

## Compilação (Ubuntu/Debian)

```bash
sudo apt-get install -y build-essential meson ninja-build pkg-config libgtk-4-dev libsqlite3-dev
meson setup linux/build linux --prefix=/usr
meson compile -C linux/build
./linux/build/evolufisico-linux
```

## Pacote .deb

Execute `bash linux/package-deb.sh` a partir da raiz do repositório depois de instalar as dependências. O pacote gerado fica em `linux/dist/`.

## Escopo atual

- Janela GTK4 nativa com navegação e cadastro básico de clientes persistido em SQLite.
- Atalho `.desktop` e instalador Debian.
- Sem migração automática de dados do Windows.
- O SQLite atual **não é criptografado**. Não inserir dados pessoais reais.
- Autenticação, avaliações, cobranças, PDF, backup, criptografia e testes de uso real ainda precisam ser implementados.

O código Windows em `main` permanece inalterado.

## Persistência e recuperação (fase experimental)

- Banco: `$XDG_DATA_HOME/evolufisico/records.sqlite` (ou `~/.local/share/evolufisico/records.sqlite`).
- Diretório privado (0700), arquivo SQLite (0600), validação de integridade e operações preparadas.
- API interna: `ef_store_backup` cria uma cópia SQLite consistente em arquivo temporário, verifica e renomeia para o destino; `ef_store_restore` verifica o backup antes de restaurar.
- **Atenção:** backups e banco ainda não são criptografados; não inserir dados pessoais reais, não compartilhar os arquivos e não usar para atendimento.
- A interface de restauração ainda não está disponível: a API será exposta após confirmação, criptografia e fluxo seguro de recuperação.
- Os testes de recuperação utilizam dados fictícios, não substituem homologação real.

## Interface GTK4 — etapa 30

- Clientes: cadastro, listagem e pesquisa em tempo real.
- Configurações: verificar integridade, criar backup sem sobrescrever destino e restaurar com confirmação explícita.
- O mecanismo de restauração mantém uma cópia temporária em memória para tentar reverter falhas durante a cópia. **Não substitui um backup externo independente.**
- A edição de nomes e exclusão continuam disponíveis apenas na API interna; ainda não estão ligadas à interface.
- **Segurança:** dados e backups continuam sem criptografia. Não usar dados pessoais reais nem considerar esta versão pronta para produção.

## Etapas 31–40

- Compilação da confirmação de restauração corrigida.
- Interface de clientes permite editar nomes informando ID e novo nome; listagem principal exibe IDs.
- Backups exigem caminho absoluto e não sobrescrevem arquivos existentes.
- A API de recuperação e os testes ainda estão sujeitos a homologação CI e revisão de segurança.
- **Importante:** a versão continua experimental, sem criptografia de banco ou backup; use apenas dados fictícios.

## Auditoria de bugs — etapas 41–50

Revisão estática identificou e corrigiu:
- risco de sobrescrever backup existente por corrida entre verificar e renomear: publicação sem sobrescrita via hard link no mesmo diretório;
- restauração acidental usando o próprio arquivo do banco ativo;
- backup com esquema SQLite de versão incompatível ou sem colunas essenciais;
- abertura do banco redefinindo silenciosamente a versão do esquema;
- pesquisa que ocultava IDs necessários à edição;
- ausência de testes específicos para esses cenários.

**Limitações:** sem criptografia, autenticação e testes de interface em desktop Linux real. A cópia de rollback da restauração está em memória e não garante recuperação diante de falha de energia ou encerramento do processo. A criação de backup não substitui estratégia de backup criptografado e externo. Não usar dados pessoais reais.

## Etapas 51–60 — modelos de avaliações e cobranças

- Banco SQLite inclui tabelas `assessments` e `charges`, ligadas a `clients` por chaves estrangeiras.
- Avaliações: data ISO, peso (kg), altura (cm), validação de limites e datas.
- Cobranças: valor armazenado em centavos inteiros e descrição.
- Backups preservam os novos dados; restauração rejeita esquemas sem as tabelas.
- **As novas operações ainda são APIs internas, não formulários GTK4.**
- **Nenhuma criptografia foi implementada nesta rodada.** Não utilizar dados reais, senhas ou informações clínicas. Não confundir validação de entradas com conformidade LGPD.

## Etapas 61–70 — formulários GTK4

- Avaliações: ID de cliente, data ISO, peso em kg, altura em cm, gravação e consulta de histórico.
- Cobranças: ID de cliente, valor em **centavos inteiros**, descrição, gravação e consulta.
- A seleção por ID é provisória. Não há autenticação, criptografia, relatórios PDF ou validação visual em desktop físico.
- Não use dados reais de pacientes ou clientes. Os testes usam registros fictícios.

## Etapas 71–80 — seleção de clientes

- Avaliações e cobranças passam a usar seletores GTK4 com ID estável e nome do cliente.
- A seleção é atualizada após operações de cadastro e edição, preservando o cliente selecionado quando ainda existir.
- Nenhum cliente é selecionado automaticamente: é preciso escolher explicitamente.
- O aplicativo permanece sem criptografia e sem autorização para uso com dados reais.

## Etapas 81–100 — gestão de registros e QA

- Listagens de avaliações e cobranças exibem IDs individuais.
- Exclusão de avaliações e cobranças exige confirmação explícita.
- Interface verifica que o registro pertence ao cliente selecionado antes de excluir.
- Testes cobrem exclusões válidas, IDs inválidos e tentativas de operar em outro cliente.
- Índices SQLite otimizam consultas por cliente.
- **Risco residual:** a API interna de exclusão por ID não incorpora cliente; a validação está na interface e pode ser melhorada com exclusão SQL atômica por `id` e `client_id`.
- Banco e backups seguem **sem criptografia**. Uso restrito a dados fictícios.

## Etapas 101–113 — revisão de segurança e usabilidade

- Permissões locais restritas a usuário, bloqueio de links simbólicos para banco e backups.
- Exclusão de cliente com confirmação explícita e aviso de exclusão em cascata.
- Listas roláveis, data de avaliação pré-preenchida e limpeza de formulário após salvar.
- Verificação da versão de esquema antes de criar tabelas.
- Testes adicionais de permissões, symlinks, versões e compilação estrita.
- **Não há criptografia de dados em repouso**; permissões POSIX não substituem criptografia, autenticação ou controles LGPD.

## Etapas 115–134 — modernização GTK4 e compilação estrita

- Seletor de clientes migrado de `GtkComboBoxText` para `GtkDropDown` e `GtkStringList`.
- A seleção permanece por ID estável e não escolhe automaticamente o primeiro cliente.
- Correções de erros nulos, confirmação de exclusão e formatação portável de inteiros SQLite.
- Compilação estrita mantém **exceção temporária somente para APIs GTK4 de diálogo obsoletas**; a migração dos diálogos ainda é pendente.
- QA cobre datas inválidas, IDs negativos, integridade, backup e restore.
- Banco SQLite e backups seguem sem criptografia; usar apenas dados fictícios.

## Segurança experimental SQLCipher e GTK4 (outubro de 2026)

- O banco passou a usar **SQLCipher** e exige `EVOLUFISICO_DB_PASSPHRASE` com pelo menos 12 caracteres. Sem chave ou com chave errada, a abertura é recusada. **Não é um login gráfico**: a autenticação por usuário e a gestão de credenciais continuam pendentes.
- **Atenção:** variáveis de ambiente podem expor a senha a processos e ferramentas de diagnóstico. Não coloque senhas em scripts versionados. A próxima fase deve usar diálogo de desbloqueio e armazenamento seguro de chaves (Secret Service/libsecret), com testes de segurança.
- Bancos SQLite legados sem criptografia são recusados. Não há migração automática; preserve backups anteriores até existir um migrador seguro e auditado.
- Backups são cópias do arquivo já criptografado, verificadas com SQLCipher. A restauração utiliza cópia de reversão e substituição do arquivo, com verificações de integridade.
- Diálogos de exclusão e restauração usam `GtkAlertDialog` (GTK 4.10+).
- CI executa captura de tela via Xvfb e publica um artefato visual. **Xvfb não é um computador Linux físico e não prova interação visual manual**.
- A proteção permanece experimental: faltam testes de concorrência, recuperação após queda de energia, políticas de credenciais, migração, autenticação de usuários e homologação presencial. Não utilizar dados clínicos reais.
