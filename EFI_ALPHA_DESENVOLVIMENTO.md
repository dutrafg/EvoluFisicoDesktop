# EvoluFísico Desktop EFI Alpha — desenvolvimento

Data da auditoria: 24/10/2026 (America/Sao_Paulo).

## Referências registradas

| Repositório | Branch | SHA consultado | Observação |
|---|---|---|---|
| EvoluFísico2 | main | `b45a1f74ac5fd6053c598a9843ac62156e4ebf2a` | Inclui o manifesto atualizado; os commits recentes de contraste são `98a8d38` e `abadbef`. |
| EvoluFísicoDesktop | main | `242649d248d766b8d3dfeeb498ce3472cedf0699` | Desktop 1.0.12 com editor e auto-organização dos cards de Início. |
| EvoluFísicoDesktop | feature/efi-qwen35-2b-alpha | `39eac5834abd4e9208df5a4bbb43c00dc403684b` | Base Alpha 1.0.13-alpha auditada e compilada no workflow 40122126889. |

Os SHAs históricos informados no prompt foram conferidos contra os atuais. O SHA antigo do EvoluFísico2 (`a693fe1`) já não é o HEAD.

## O que a Alpha já contém

- Aplicativo Windows x64 em .NET 8/WPF/WebView2, com SQLite nativo criptografado e cofre do Windows.
- IDs persistentes para alunos e avaliações; avaliações do mesmo aluno são agrupadas por `cliente_id`. A criação pelo histórico reaproveita dados cadastrais permitidos e deixa medidas, fotos e pareceres sem cópia.
- Formulários vinculados, evolução, laboratório EF77, cobrança, organização, backup/restauração, navegação e relatórios.
- Integração EFIA determinística: EF68, EF70, EF77 e motores locais EF78–EF82, totalizando oito componentes científicos. O fluxo exige três ou quatro avaliações, datas distintas e intervalo mínimo de 21 dias, com bloqueios/ressalvas de elegibilidade.
- EFI local com catálogo de modelos, validação SHA-256, checagem de RAM e runtime llama.cpp local. Qwen3.5-2B Q4_K_M teve uma execução real de inferência concluída no workflow 40119653945.
- Quatro alunos fictícios isolados para Alpha, cada um com quatro avaliações a intervalos de 30 dias, inseridos uma única vez e sem substituir registros existentes.
- Instalador experimental separado, com AppId próprio. A validação mais recente instalou e desinstalou o pacote em Windows runner sem publicar na main.

## Diferenças principais identificadas

- **Alunos/Perfil Unificado:** a própria documentação da Alpha declara que o Perfil Unificado novo do EvoluFísico2 ainda não foi incorporado. Há identidade e histórico agrupado, mas não uma tela central com os blocos completos do perfil descritos no prompt.
- **Avaliações:** a tela e a persistência atuais permanecem; a equivalência integral às seis etapas do Web 2.0.28 não está demonstrada e precisa ser implementada/homologada sem mudar fórmulas.
- **Paridade Web:** após normalizar o prefixo `src/EvoluFisico.Desktop/wwwroot/`, 69 caminhos são compartilhados, 19 com o mesmo SHA e 50 com conteúdo diferente. Isso mede arquivos, não paridade funcional. As adaptações de SQLite/WebView2 explicam parte das diferenças.
- **Sincronização recente:** o branch Alpha ainda não inclui as correções de tema publicadas no EvoluFísico2 pelos commits `98a8d38` (confirmação de Avaliação em dark mode) e `abadbef` (contraste claro/escuro em Avaliações e módulos relacionados). O commit `b45a1f7` atualiza o manifesto após essas mudanças.
- **Organização:** notas e metas usam armazenamento do perfil WebView2 e exigem exportação própria antes de limpar esse perfil; não são parte do banco SQLite nativo.
- **Documentação:** README da branch ainda se apresenta como 1.0.11 estável, enquanto o instalador Alpha informa 1.0.13-alpha. A documentação precisa de revisão para não confundir versão estável e canal experimental.

## Próximas etapas por dependência

1. Projetar o Perfil Unificado sobre os IDs e relacionamentos SQLite existentes; migrar dados com backup, transação e rollback.
2. Fechar paridade das seis etapas da avaliação e validar não cópia de dados históricos.
3. Portar seletivamente as correções recentes de tema; executar testes visuais em WebView2.
4. Consolidar contratos e limites de cada motor EFIA; executar campanha sintética de pelo menos 10.000 casos no branch Desktop.
5. Completar checagens de ciclo de vida, cancelamento, retomada e erros do modelo/runtime; fazer teste real de EFI pelo aplicativo instalado.
6. Homologar relatórios, backup/restore, atualização in-place e inicialização em Windows com perfil de teste.
7. Repetir a auditoria contra um SHA fixo do EvoluFísico2 e registrar o delta posterior para a rodada seguinte.

## Limite desta rodada

Esta rodada registra a auditoria inicial e entrega o instalador que já foi gerado pela CI. Ela não implementa o Perfil Unificado nem declara a Alpha candidata a estável. A matriz e o QA detalham as pendências e os testes efetivamente observados.
