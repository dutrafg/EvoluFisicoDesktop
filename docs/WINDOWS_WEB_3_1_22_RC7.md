# EvoluFísico Desktop RC-7 — integração Web 3.1.22

Base RC-6: `f5480994001a998ca33855e41474dba8a4441114`.

- Objetivos opcionais persistidos na avaliação são exibidos no modal de detalhes e no relatório PDF individual.
- Indicador, valor-alvo, tolerância, prazo e notas incluídos quando informados, com HTML escapado para impedir injeção.
- Corrigido nome do instalador da RC-6 que permanecia RC-5; RC-7 identificada em build e artefatos.
- Invalidação do cache offline; cobertura por teste Node de API de objetivos, relatório PDF/modal e integração SQLite.
- Não foram modificados cofre, EncryptedSqliteStore ou contratos do banco; metas ainda não acionam motores automaticamente.
- Pendente homologação de PDF, gravação, edição e dados reais no WebView2; EvoStore e Perfil Unificado ainda não têm paridade.
- Branch de teste; `main` preservada.
