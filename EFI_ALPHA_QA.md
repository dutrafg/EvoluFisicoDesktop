# QA — EvoluFísico Desktop EFI Alpha

Data: 24/10/2026 (America/Sao_Paulo). Este documento separa evidência automatizada de homologação prática.

## Referências de execução

| Verificação | Resultado observado |
|---|---|
| Workflow **EFI AI Alpha Build Validation**, run [40122126889](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40122126889), commit `39eac5834abd4e9208df5a4bbb43c00dc403684b` | Concluído com sucesso em runner Windows. |
| Sintaxe EFI JS e fixtures | Passaram no workflow. |
| Quatro históricos fictícios e elegibilidade EFIA | Passaram em `tests/efi-demo-fixtures.cjs`. São 16 avaliações sintéticas, não 10.000 casos. |
| Build Windows x64 com `-EfiAlpha` | Passou no runner Windows com .NET 8. |
| Integração EFI | `tests/efi-ai-alpha.cjs` passou. |
| Empacotamento do runtime CPU | Passou; runtime llama.cpp com versão/digest pinados foi incluído. |
| Compilação Inno Setup | Passou; artefato Setup criado. |
| Smoke de instalação e desinstalação | Passou em instalação silenciosa. Conferiu EXE, frontend, manifesto Alpha, runtime, painel EFI e fixtures; executou o desinstalador. |
| Inferência real Qwen3.5-2B | Workflow **EFI Real Qwen3.5 2B Inference**, run [40119653945](https://github.com/dutrafg/EvoluFisicoDesktop/actions/runs/40119653945), concluído com sucesso em Windows CPU com GGUF Q4_K_M e checksum validado. Foi uma execução automatizada de prompt sintético, não homologação clínica ou teste do fluxo completo dentro da janela instalada. |

## Testes solicitados que ainda não foram executados

- Campanha integrada de 10.000 cenários cobrindo os oito motores (EF68/EF70/EF77 + EF78–EF82) e invalidação de parecer.
- Testes de migração com bases antigas e novas, interrupção, rollback e preservação de registros reais.
- Teste de atualização sobre Alpha anterior contendo dados e desinstalação com verificação de preservação do banco.
- Abertura manual da interface instalada, gravação/leitura SQLite por cada módulo, Perfil Unificado, navegação completa e EFI a partir do aplicativo.
- Homologação de impressão/PDF, backup/restauração e modo claro/escuro em Windows/WebView2.
- Matriz de resoluções e escala Windows 100%, 125%, 150% e 200%; teclado, toque, acessibilidade e múltiplas paletas.
- Cancelamento real de inferência, runtime/modelo ausente ou corrompido, falta de RAM, modo offline após download e download interrompido/retomado.

## Campanha sintética local adicional

Executada nesta rodada diretamente contra `EFIALocal@0.5.0-rc.2` da branch (motores EF78–EF82), com 10.000 entradas determinísticas em 11 classes:

- 910 séries válidas e 909 séries com três datas ao longo de 21 dias: elegíveis.
- 909 casos em cada classe de duas avaliações, datas duplicadas, mistura de alunos, datas inválidas, valores ausentes, valores extremos, métodos diferentes, protocolos diferentes e intervalo total inferior a 21 dias.
- **0 exceções** e **0 valores não finitos** na árvore de resultados.
- As asserções de séries válidas, bloqueios temporais e identificação de mistura entre alunos passaram.

Esse harness foi executado em memória nesta sessão e ainda não está incorporado à suíte do repositório. A campanha exercita EF78–EF82; não cobre os oito motores integrados de ponta a ponta, nem testa a invalidação persistida de pareceres.

A auditoria Web de 24/10 relata 84 checagens de tema e testes de Perimetria, Impressão e Cobrança na web. Esses resultados não foram contados como QA do Desktop.

## Resultado

A Alpha tem build Windows, instalador e smoke de instalar/desinstalar aprovados em CI. A inferência real do Qwen também foi exercitada numa execução independente de CI. Não há evidência suficiente para declarar aprovados o funcionamento integral do aplicativo instalado, a atualização in-place, as migrações de dados, a interface de Perfil Unificado, ou os 10.000 cenários pedidos. Portanto, a versão permanece **Alpha para testes**, sem homologação estável.
