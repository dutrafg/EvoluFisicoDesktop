# EvoluFísico Desktop EFI Alpha — desenvolvimento

Data da revisão: 24/10/2026.

## Referências registradas

| Repositório | Branch | SHA de referência |
|---|---|---|
| EvoluFísico2 | `main` | `b45a1f74ac5fd6053c598a9843ac62156e4ebf2a` |
| EvoluFísicoDesktop estável | `main` | `242649d248d766b8d3dfeeb498ce3472cedf0699` |
| EvoluFísicoDesktop Alpha | `feature/efi-qwen35-2b-alpha` | `a6c0d9afc4e9a06bd307a923f0c57d4110fc2422` |

A consulta feita nesta rodada confirmou que o EvoluFísico2 ainda aponta para `b45a1f7`. As correções recentes de tema portadas nesta rodada correspondem aos commits `98a8d38` e `abadbef`.

## Trabalho desta rodada

- Incluída uma tela inicial de Alunos/Perfil Unificado que agrupa avaliações pelo `cliente_id` existente, com busca, ordenação, histórico cronológico, métricas recentes e atalhos para avaliação, análise e áreas relacionadas.
- Leitura de identidade não altera registros legados. Nome e contato compartilhado não agrupam nem recebem ID durante a leitura.
- Adicionada migração assistida por avaliação legada: profissional escolhe criar perfil independente ou vincular explicitamente a um perfil existente. O app exige salvar um backup SQLite antes da gravação; cancelamento do backup cancela a migração. É possível migrar outros registros antigos um por vez.
- O atalho “Nova avaliação” usa o fluxo cadastral existente e não copia automaticamente medidas, fotos, pareceres ou conclusões anteriores.
- O fluxo de Avaliações agora apresenta seis etapas. “Objetivos” ocupa a etapa 2; objetivos múltiplos e observações são persistidos com a avaliação, carregados ao editar e preservados no autosave e na restauração de rascunhos.
- Portadas regras recentes de contraste claro/escuro e confirmação de salvamento da avaliação.
- Renomeada a saída do Inno Setup para `EvoluFisico_EFI_Alpha_Setup.exe`; o smoke test procura o nome exato do pacote.

## Commits criados nesta rodada

| Commit | Área |
|---|---|
| `e78d7bc0eaa0248a84cddf3416b96f806523523a` | Perfil/identidade legada somente leitura |
| `0cbd82fbb6ecf186861161f544a6abdcbd4a482a` | Avaliação: objetivos na etapa 2 e nome de saída |
| `6de5dd77587a04a3bda0d572c492effb80316a79` | Rascunhos com objetivos múltiplos e correção do smoke test |
| `a6c0d9afc4e9a06bd307a923f0c57d4110fc2422` | Vínculo legado explícito, backup obrigatório e leitura de identidade sem mutação |

## Estado e pendências

O Perfil Unificado permite consolidar registros antigos com confirmação humana e backup antes de cada gravação. A migração é por avaliação e ainda não faz uma reconciliação em lote. Objetivos foram adicionados sem alterar fórmulas científicas. As demais validações e limitações permanecem descritas em `EFI_ALPHA_PARIDADE.md` e `EFI_ALPHA_QA.md`.

A versão permanece Alpha para testes. O build compilou no Windows Actions; o smoke test automatizado instalou e desinstalou o pacote. Não houve homologação manual da interface instalada, nem atualização in-place com dados reais.
