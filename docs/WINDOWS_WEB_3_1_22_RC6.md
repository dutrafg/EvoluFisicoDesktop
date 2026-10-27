# Windows RC-6 — integração seletiva EvoluFísico2 3.1.22 (27/10/2026)

Base técnica: `windows-sidebar-compact-3-1-19-rc5` (`e27da3d2c387f5d81e4e2e6343e5fc48f917a7f8`).
Origem web: `Evolufisico2/main`, versão `3.1.22`, commit funcional `04452c82d4d97b7f56323b9217ae3f38ea6add17` (manifesto no commit `d11addad8adeba74d85c1206a1a4c8af97c70b17`).

## Portado nesta RC
- Objetivo opcional no formulário de avaliação (inclusive **Definição muscular** sem déficit calórico presumido).
- Indicador, valor-alvo, tolerância, prazo e nota opcionais, preservados no JSON da avaliação.
- Restauração dos campos ao editar e limpeza ao iniciar nova avaliação; sem exigir meta numérica para salvar.
- Confirmação responsiva com cores dos temas claro/escuro e ocultação forçada da barra Voltar/Salvar após sucesso.
- Aviso de cópia física pendente preservado; SQLite criptografado permanece a fonte primária dos registros.
- Cache offline, manifesto de build RC-6, regressão de contrato/VM e pipeline Windows de instalação e desinstalação.

## Deliberadamente não portado / validação pendente
- Não há integração do objetivo ao motor automático de acompanhamento ou ao Perfil Unificado nesta RC.
- Não houve migração de banco, substituição de `EncryptedSqliteStore`, nem alteração do cofre.
- QA Node e build Windows não substituem homologação manual do fluxo real WebView2, impressão PDF e recuperação de backup.
- Não declarar paridade funcional integral com a versão web 3.1.22.
- Branch experimental; não publicar `main` ou release estável.
