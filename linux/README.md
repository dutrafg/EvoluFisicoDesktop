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
