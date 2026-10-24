# EvoluFísico Desktop 1.1.0 Pré-Beta 1 — Integração em cinco etapas

Data: 24/10/2026. Origem: Evolufisico2 2.0.28 Pré-Beta. Base Desktop estável 1.0.12 (commit 242649d).

## Etapa 1 — Segurança, migração e dados
- Copiador conservador de notas/metas/tarefas/agenda do perfil WebView2 para registro cifrado `ef-desktop-organization-backup-v110` no SQLite via o bridge nativo.
- Verificação de escrita/leitura, detecção de divergência e restauração apenas quando a origem local está vazia. Nunca apaga registros legados automaticamente.
- **Limitação:** o WebView2 continua sendo a área de trabalho dos módulos antigos; o SQLite contém um espelho cifrado validado. Não é migração transacional completa nem sincronização bidirecional resolvida.
- Backup da versão estável recomendado antes de ensaiar.

## Etapa 2 — Perfil Unificado
- Módulo Alunos com identidade persistente separando homônimos, histórico, atalhos para Análises/Evolução/Formulários e objetivos em registro nativo cifrado.
- Ausência de cadastros fictícios ou fusão automática de pessoas.

## Etapa 3 — Avaliação em seis etapas e EF220 descritivo
- Inserida a etapa 2 «Definir Objetivos» movendo os campos originais da Avaliação, sem perder nomes ou alterar o motor de salvamento.
- Núcleo determinístico de metas (peso, cintura, gordura Pollock): estrita identidade, três datas, mínimo 21 dias, avaliação exclusivamente descritiva; **não** é a migração integral dos serviços EF220 da Web, nem substitui revisão profissional.

## Etapa 4 — Layout e personalização
- Layout Compacto, Estendido, Desktop; Dock Padrão/Moderna opcionais no painel de Configurações.
- Agenda, Tarefas e calculadora de IMC como minipainéis funcionais no Início.
- Corrigido o editor: alça exclusiva, captura por Pointer Events, detecção real de alvo por `elementsFromPoint`, Auto-organizar recompõe tamanhos **e ordem**, Restaurar retorna ao padrão, layout salvo localmente.

## Etapa 5 — Qualidade e distribuição isolada
- `tests/windows-beta-1-1-0.cjs` cobre sintaxe, recursos precache, identidade, EF220, gravação cifrada, regressão do editor e etapas da Avaliação. Complementar aos testes históricos e ao smoke do instalador.
- `.github/workflows/windows-beta.yml` compila no Windows, gera `EvoluFisicoDesktop-1.1.0-prebeta.1-Setup.exe`, testa instalação/desinstalação e envia o EXE como artefato do workflow.
- A branch de pré-beta não é mesclada à `main` sem homologação.

## Critérios pendentes para promoção a estável
1. Migração bidirecional/autoridade SQLite com transações e recuperação após falha; comparar backups em dados reais.
2. Exercitar fluxos de Avaliação e Perfil Unificado em Windows com dados de homônimos, revisões e objetivos reais anonimizados.
3. Homologar as fórmulas EF220 completas e sua integração ao restante da EFI, incluindo protocolos/aparelhos.
4. Ensaiar arraste e rolagem em telas Windows touch e múltiplos monitores/escalas; revisar Dock e modo escuro.
5. Executar impressão PDF real, restauração e atualização por cima do 1.0.12 em cópia protegida do banco.

**Não declarar esta candidata estável nem atualizar automaticamente a versão existente.**