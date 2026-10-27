# EvoluFísico Desktop Windows 3.1.22 RC-7 — relatório de integração

Base: RC-6 (`f5480994001a998ca33855e41474dba8a4441114`). Fonte Web: `Evolufisico2/main` 3.1.22 (`04452c82d4d97b7f56323b9217ae3f38ea6add17`).

## Corrigido nesta RC
- Objetivos opcionais salvos em `objetivo_planejamento` agora aparecem no detalhamento da avaliação e no PDF individual.
- Valores de indicador, meta, tolerância, prazo e observações são renderizados com escape HTML (não executam conteúdo fornecido pelo usuário).
- Se não houver objetivo, nenhum bloco extra aparece e o salvamento permanece opcional.
- Identidade do instalador e dos artefatos Windows atualizada de RC-5/RC-6 para RC-7.
- Adicionado teste de regressão RC-7 ao pipeline Windows e invalidado cache offline.

## Preservado
- Persistência primária C#/.NET WebView2 + SQLite criptografado, cofre e backup nativo, sem migração.
- Compatibilidade da barra lateral compacta, temas, salvamento de avaliações e impressão existente.

## Limitações / homologação
- Objetivos ainda não alimentam o motor automático de acompanhamento nem o Perfil Unificado.
- Testes Node/VM e build Windows não substituem teste manual no WebView2, PDF impresso, recuperação de backup e validação clínica.
- Branch experimental, sem merge na `main` e sem release estável.
