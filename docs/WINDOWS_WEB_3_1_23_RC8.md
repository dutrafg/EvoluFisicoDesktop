# EvoluFísico Desktop Windows 3.1.23 RC-8 — integração seletiva

Fonte: `dutrafg/Evolufisico2/main` 3.1.23, commit `6d0628eacf6f5efd8a0312cdf2b7f0a2663f3982` (manifesto atualizado em 27/10/2026). Base Windows: `windows-sync-3-1-22-rc7`, commit `f057a35fc8b02dbf9980553180486c6758a0bfe4`.

## Implementado
- **Dados profissionais:** nova avaliação reaplica Nome, Registro e Clínica das preferências de Configurações, sem exigir redigitação ou impedir edição manual. Não transfere informações clínicas entre alunos.
- **Bioimpedância:** seção e dobras abertas por padrão; edição de avaliação mantém BIA acessível mesmo quando os campos estão vazios.
- **Pastas dos alunos:** preserva estado expandido/recolhido em memória ao redesenhar o Histórico; a pesquisa não altera a escolha de expansão.
- **QA:** testes RC-8 com execução VM da reaplicação profissional e da expansão/recolhimento; regressões anteriores para objetivos opcionais, PDF, sidebar, temas, salvamento, SQLite e backup permanecem na pipeline.
- **Pacote:** versão de origem 3.1.23, novo cache e nome de instalador/artefatos RC-8. A versão do produto nativo e o AppId foram mantidos.

## Preservado
- WPF, WebView2, ponte de dados nativa, SQLite cifrado, transações, cofre Windows e backup nativo. Nenhuma migração para IndexedDB ou substituição do armazenamento.
- Nenhum merge na `main`, publicação estável ou alteração do instalador estável.

## Limitações e homologação
- Não houve importação integral do HTML web 3.1.23, pois seu armazenamento é diferente.
- O Desktop não tem paridade completa com Perfil Unificado, EvoStore e acompanhamento automático de objetivos.
- Testes Node/VM e compilação Windows não equivalem a testes interativos com dados reais: validar no WebView2 o fluxo de seis etapas, bioimpedância, PDF impresso, pastas, restauração de backup e contraste em claro/escuro.
- O fluxo de `main` ainda contém publicação estável, mas esta branch não pode disparar essa etapa porque a condição exige `refs/heads/main`.
