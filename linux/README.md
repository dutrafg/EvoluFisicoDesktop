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
