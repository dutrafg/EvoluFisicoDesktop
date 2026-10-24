# Matriz de paridade — EvoluFísico2 × Desktop EFI Alpha

Referências: EvoluFísico2 `main@b45a1f74`; Desktop estável `main@242649d`; Desktop experimental `feature/efi-qwen35-2b-alpha@39eac583`. Em 24/10/2026, o web publicou correções de tema nos commits `98a8d38` e `abadbef`, posteriores à base Alpha.

| Módulo/área | Estado na Alpha | Diferença e trabalho restante |
|---|---|---|
| Início | Parcial; base estável integrada | Cards editáveis e agenda existem; comparar miniaplicativos recentes e validar gestos/layout em WebView2. |
| Alunos / Perfil Unificado | Parcial; identidade existe, perfil unificado ausente | Há alunos vinculados por ID e históricos agrupados. Falta a tela central com dados pessoais, objetivos, avaliações, formulários, evolução, EFIA, relatórios e finanças. |
| Avaliações | Parcial | Persistência e fluxo existentes. Equivalência às seis etapas atuais e todos os campos/protocolos deve ser fechada; não copiar medidas, fotos ou conclusões antigas. |
| Evolução | Parcial | Comparações e histórico presentes. Necessária homologação atual de cronologia, invalidade de análises dependentes e PDFs em Windows. |
| Calculadora / Laboratório | Parcial/implementado | EF77 e evidências laboratoriais estão conectados; conferir paridade de entradas, métodos, limites e saídas com a main atual. |
| Formulários / Anamnese | Parcial | Modelos e vínculo estão descritos; testar edição, persistência SQLite, identidade, PDF e migração. |
| Análises / EFIA científico | Parcial/implementado | Oito componentes EF68/70/77/78–82 estão integrados e regras temporais básicas cobertas. Campanha Desktop de 10.000 casos, protocolo a protocolo e invalidação longitudinal ainda pendem. |
| EFI Intelligence / Qwen | Parcial, inferência real demonstrada em CI | Catálogo, runtime CPU e teste real Q4_K_M existem. Falta validar todos os estados de instalação/erro/cancelamento pelo produto e homologar fluxo EFI na aplicação instalada. |
| Cobranças | Parcial | Controle mensal e histórico existem; conferir novas mudanças da web e testar ligação financeira com perfil unificado e backup. |
| Organização | Parcial | Agenda/tarefas/metas estão presentes; notas/metas ainda usam perfil WebView2 e não SQLite. |
| Configurações | Parcial | Temas, paleta, segurança, manutenção e atualizador nativo existem; revisar paridade integral e configuração EFI/Qwen. |
| Backup e restauração | Presente, homologação incompleta | Caminhos nativos existem; restauração, compatibilidade antiga e preservação em atualização precisam de teste em Windows. |
| Navegação e personalização | Parcial | Sidebar, cores e organização de cards existem; layouts/miniapps recentes do web não foram todos sincronizados. |
| Relatórios e PDF | Parcial | Relatórios e nomes próprios do Desktop existem; faltam validação visual A4, separação privada/compartilhável e teste de impressão real. |
| Armazenamento e segurança | Parcial/implementação nativa superior em parte | SQLite cifrado e IDs são apropriados ao Windows. Migração legada é conservadora; validar FK/migrações, backup prévio, rollback e conteúdo de todos os módulos. |
| Atualizações e manutenção | Implementado parcialmente | Atualizador próprio e dados de versão existem; falta confirmar atualização Alpha sobre Alpha preservando dados. |
| Temas claro/escuro | Pendente de sincronização recente | Aplicar seletivamente os commits web `98a8d38` e `abadbef`, depois validar as telas equivalentes no WebView2; a auditoria Web não comprova o Desktop. |
| Privacidade e LGPD | Parcial | Criptografia e minimização do prompt são previstas; conferir logs, consentimento, backup, uso do perfil e compartilhamento de relatórios. |

## Escala de classificação

- **Implementado:** código existe na base Alpha ou foi exercitado por teste específico.
- **Parcial:** existe uma parte funcional, mas faltam equivalência, integração ou homologação.
- **Pendente:** função ausente ou correção compatível ainda não portada.
- A tabela não usa “aprovado” quando só há verificação estática ou workflow de build.
