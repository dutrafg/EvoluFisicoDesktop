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
