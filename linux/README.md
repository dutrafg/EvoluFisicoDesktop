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
