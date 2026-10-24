# Matriz de paridade — EvoluFísico2 × Desktop EFI Alpha

Referências consultadas em 24/10/2026: EvoluFísico2 `main@b45a1f74`, Desktop estável `main@242649d` e Alpha `feature/efi-qwen35-2b-alpha@6de5dd7`. O `main` Web não avançou além de `b45a1f7` nesta rodada.

| Módulo/área | Estado na Alpha | Diferença e trabalho restante |
|---|---|---|
| Início | Parcial | Cards e organização existentes; falta homologar widgets e gestos atuais em WebView2. |
| Alunos / Perfil Unificado | Parcial; primeira tela integrada | Busca, ordenação, histórico e métricas agrupam pelo `cliente_id`. Registros antigos sem ID aparecem individualmente. Falta migração segura e centralização persistente de dados pessoais, formulários, evolução, análises, relatórios e finanças. |
| Avaliações | Parcial; seis etapas presentes | Objetivos está na etapa 2 e persiste/recupera seleção e observações. Falta homologação integral de protocolos, validação, cálculos, fotos, relatórios e invalidação de análises derivadas. |
| Evolução | Parcial | Histórico e comparações existem; cronologia, invalidação de análises dependentes e PDF precisam de homologação Windows. |
| Calculadora / Laboratório | Parcial/implementado | EF77 e laboratório estão conectados; verificar paridade atual de entradas, protocolos e limites com o Web. |
| Formulários / Anamnese | Parcial | Há fluxos existentes; testar edição, persistência SQLite e vínculo com perfil/relatório. |
| Análises / motores EFIA | Parcial | Oito componentes EF68/70/77/78–82 existem. Regras temporais básicas e fixtures estão cobertas; campanha integrada de 10.000 casos e invalidação longitudinal persistida pendem. |
| EFI Intelligence / Qwen | Parcial; inferência real em CI | Runtime CPU e gerenciador existem; inferência sintética real Q4_K_M foi executada em workflow separado. Falta validação dos estados de instalação/erro/cancelamento pelo produto. |
| Cobranças | Parcial | Histórico financeiro existente; vínculo com perfil e paridade recente precisam de testes. |
| Organização | Parcial | Agenda/tarefas/metas existem; notas/metas ainda usam perfil WebView2 em partes, não SQLite. |
| Configurações | Parcial | Temas, paleta, segurança, manutenção e atualização nativa existem; falta confirmar paridade integral e opções EFI/Qwen em interface instalada. |
| Backup e restauração | Presente, homologação incompleta | Implementações nativas existem; restauração, compatibilidade de formatos antigos e preservação em atualização pendem. |
| Navegação e personalização | Parcial | Sidebar, cores e cards existem; ainda falta validação de layouts/miniapps atuais no Windows. |
| Relatórios e PDF | Parcial | Relatórios nativos existem; faltam verificação A4, separação privado/compartilhável e impressão manual. |
| Armazenamento e segurança | Parcial; SQLite nativo | Banco criptografado e IDs persistentes são a base Windows. Registros legados sem ID ainda não foram migrados para perfil unificado; testar migrações e rollback. |
| Atualizações e manutenção | Parcial | Atualizador existe; atualização Alpha sobre Alpha preservando dados não foi testada. |
| Temas claro/escuro | Portadas correções recentes; homologação pendente | Regras Web de confirmação de avaliação escura e contraste foram integradas e passaram teste automatizado. Falta auditoria visual de todas as janelas/telas WebView2. |
| Privacidade/LGPD | Parcial | Criptografia e minimização de prompt estão previstas; revisar logs, consentimento, backup e compartilhamento. |

## Classificação

“Implementado” significa que o código existe ou um teste específico passou. “Parcial” indica função presente com equivalência, integração ou homologação ainda incompleta. Build e testes estáticos não contam como homologação visual.
