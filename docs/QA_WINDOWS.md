# Plano de homologação — EvoluFisico Desktop 9.0-beta

## Verificado em ambiente Linux
- 28/28 scripts JavaScript: `node --check` aprovado.
- 56/56 recursos referenciados no HTML presentes.
- 8/8 testes simulados de Service Worker aprovados.
- Regressão de limpeza após impressão aprovada.
- **Esses resultados não são testes reais do Windows ou do WebView2.**

## Verificações automáticas no Windows (GitHub Actions)
1. Validar frontend.
2. Compilar e publicar .NET 8 WPF para win-x64.
3. Executar testes de Service Worker e limpeza de impressão no pacote publicado.
4. Gerar instalador via Inno Setup 6.
5. Confirmar que o instalador .exe existe e tem tamanho plausível.
6. Disponibilizar artefato para download.

## Testes manuais necessários antes de declarar estabilidade
- Instalar e desinstalar em Windows 10 e 11 x64.
- Abrir aplicativo com WebView2 Runtime disponível e ausente.
- Criar avaliação, editar, salvar, fechar e reabrir.
- Exportar, importar e restaurar backup.
- Gerar PDF de todos os relatórios e verificar se não inclui o painel principal.
- Confirmar modo claro/escuro e layout responsivo.
- Reiniciar sem internet e verificar os dados existentes.
- Testar atualização sobre instalação anterior sem perda de dados.

## Situação
**Aguardando confirmação do resultado da compilação Windows e homologação manual.** Não declarar instalador aprovado sem evidências.
