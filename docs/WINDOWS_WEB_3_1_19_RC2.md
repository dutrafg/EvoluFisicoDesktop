# EvoluFísico Windows 3.1.19 — RC-2 (integração progressiva)

- Fonte web conferida: `dutrafg/Evolufisico2@eb2001593da54e17476c42e39e5f28ee5a9efcea` em 26/10/2026; release `945080cdf628bf703aaae939078241e483fff898`.
- Base Windows original: `dutrafg/EvoluFisicoDesktop@242649d248d766b8d3dfeeb498ce3472cedf0699`.
- Integração anterior RC-1: `ead6e255a8ab00ceb292b75c19e971ffa1127242`.

## Implementado nesta RC-2
1. Conserva a RC-1: 20 wallpapers offline, contraste dos cartões, painel lateral minimizado e Insights inicialmente recolhidos.
2. Cinco temas profissionais configuráveis (Saúde, Academia, Educação Física, Musculação e Nutrição), cada um com cores fixas e um conjunto de ícones de navegação próprio. O ícone de cérebro de Análises permanece preservado.
3. Painel único de temas e wallpaper em Configurações → Aparência; aparência clara/escura utiliza as variáveis originais do Desktop.
4. Importada a camada de contrastes `73-theme-contrast.css` do projeto web para resultados, formulários, comparações e cobrança.
5. Cache offline expandido e identidade atualizada (sem apagar dados). `desktop-version.json` identifica o canal RC-2 e a origem Web 3.1.19.
6. Testes estáticos e automação Windows para compilação, instalador, instalação/desinstalação e regressões anteriores.

## Pendências que impedem lançar Desktop 3.1.19 completo
- Perfil Unificado e compartilhamento total de dados com Avaliações/Evolução.
- EvoStore com 50 mini aplicativos funcionais, não apenas atalhos.
- Nova dashboard 3.x e gerenciador de miniapps com persistência interoperável.
- Análises Completas dentro do Perfil e Evolução, com todos os motores e relatórios revisados.
- Compatibilização do cofre da versão web com SQLite nativo criptografado (não copiar IndexedDB ou substituir criptografia nativa).
- Auditoria dos fluxos de PDF, Anamnese, Cobrança, atualização e migração de registros, 4 alunos × 4 avaliações num banco de teste.
- Testes de interface visual e dados reais em Windows 11. Nenhuma homologação funcional da paridade total.

## Política de release
O código-base e instalador ficam em 1.0.12 no canal RC-2 para não anunciar uma falsa versão 3.1.19 completa. O workflow cria arquivos de build identificados RC-2, sem release estável na branch. `main` intocada. Gerar backup antes de instalar; testar preferencialmente em ambiente isolado.
