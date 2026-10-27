# Windows RC-9 — consolidação da RC-8 e Web 3.1.37

Origem Web: `Evolufisico2@486ef975f97aff52388624c7edcd95089b66e9e7`.
Base Windows: `EvoluFisicoDesktop@677a0478656a4b49e2be27fac772cd33b105bcfa` (RC-8).

## Implementação
- Retém os ajustes funcionais RC-8 de bioimpedância, dados profissionais, pastas, barra lateral, objetivos, relatórios.
- Resultados em tempo real recolhíveis e acessíveis por teclado/toque; preferência de expansão persistida sem modificar a apuração dos cálculos.
- Layout com KPIs adaptados às larguras de janela menores; QA cobrindo botão Novo Check-in após edição e limpeza do ID antigo.
- Título e splash exibem RC-9; cache offline, instalador, manifestos e testes atualizados.
- CI publica exclusivamente **pré-versão** RC-9 quando a main passar em testes Windows; publicação automática de versão estável 1.0.12 exige variável `ENABLE_STABLE_RELEASE=true`.
- SQLite cifrado, cofre nativo, backups e ponte WebView2 não modificados.

## Ainda pendente de paridade
Perfil Unificado completo, EvoStore e mini-aplicativos da versão Web 3.1.37, novas rotinas de importação/exportação de Android (não aplicáveis ao Windows), integração total de análises e motores de acompanhamento e homologação manual com dados reais em Windows 11. A numeração 3.1.37 identifica origem web, não paridade total; instalação nativa segue 1.0.12 RC-9.
