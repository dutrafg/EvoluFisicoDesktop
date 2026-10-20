# EvoluFisico Windows — integração do Evolufisico2 em 20/10/2026

## Funcionalidades
- Nove anamneses organizadas por nível (iniciante, intermediário e avançado), formulário personalizado, histórico por identificador do aluno e exportação PDF AcroForm preenchível.
- Registros de anamneses salvos exclusivamente na chave `ef-forms-v1` do SQLite nativo criptografado pelo Windows (AES-GCM/DPAPI). A aplicação exige confirmação da gravação e não salva em `localStorage` em caso de erro.
- Acesso rápido às anamneses pelo perfil da avaliação de cada aluno.
- Diagnóstico ampliado dentro de Configurações > Manutenção; verificações por módulo e autocorreção conservadora.
- Configurações divididas em Geral, Dados e privacidade, Manutenção; preservadas funções de backup nativo, controle de atualização, armazenamento, recuperação e migração existentes do desktop.
- Melhoria de contraste no modo escuro, alinhamento dos cartões e estilos de impressão.
- Nada alterado na camada WPF, WebView2, SQLite e credenciais/segurança nativas.

## Validação e limites
Executar `node tests/forms-windows-integration.cjs` e o pipeline de Windows existente.
No Windows 10/11, testar gravação de uma anamnese real, fechar/reabrir a aplicação, confirmar histórico e PDF, exportação/restauração de backup, visual claro/escuro, atualização via instalador e regressão de cobranças.
Não prometer instalador pronto sem GitHub Actions concluído.
