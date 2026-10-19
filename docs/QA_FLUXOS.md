# Plano de validação — Avaliações, PDF e Backup

## Automatizado no GitHub Actions
O arquivo `tests/flows-regression.cjs` faz 10 verificações **estáticas** no frontend publicado. O pipeline também executa testes simulados do service worker e do tratamento após impressão. Essas verificações não executam um navegador real.

## Homologação funcional obrigatória (Windows)
Usar perfil de teste, nunca dados reais sem backup.

### Avaliações
1. Criar uma avaliação fictícia, salvar e reiniciar o aplicativo.
2. Confirmar que o registro permanece no histórico.
3. Editar a avaliação, salvar e reiniciar; conferir as alterações.
4. Criar segunda avaliação do mesmo cliente e verificar evolução.
5. Tentar salvar com cofre bloqueado e confirmar que nenhuma avaliação incompleta é persistida.

### PDF
1. Abrir uma avaliação e gerar PDF individual; conferir nome, medidas, gráficos e paginação.
2. Gerar relatório comparativo com duas avaliações diferentes.
3. Cancelar a impressão e verificar se layout e tema permanecem íntegros.
4. Repetir a impressão três vezes e verificar que menu lateral e botões não entram no PDF.
5. Conferir impressão em modo claro e escuro.

### Backup
1. Exportar backup completo com avaliações fictícias.
2. Conferir que o arquivo baixado não está vazio.
3. Em perfil de teste separado, importar o backup e comparar registros e cobranças.
4. Tentar importar JSON inválido e confirmar que registros anteriores permanecem.
5. Testar exportação/importação criptografada com senha válida e inválida.
6. Reiniciar o aplicativo e conferir persistência.

## Critério de aprovação
Somente considerar homologado quando os testes manuais acima passarem, além do GitHub Actions verde. Nunca restaurar backup de teste sobre dados reais.
