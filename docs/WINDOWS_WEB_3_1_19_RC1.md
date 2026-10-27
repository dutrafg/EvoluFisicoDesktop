# Sincronização Windows — EvoluFísico2 3.1.19 (RC-1)

Origem: `dutrafg/Evolufisico2@62140bac8aa689fa57cb2b1d44cf3e3da1ac0503`, manifesto `version.json` = `3.1.19`. Base Windows: `dutrafg/EvoluFisicoDesktop@242649d248d766b8d3dfeeb498ce3472cedf0699`.

## Escopo efetivamente implementado
- 20 papéis de parede locais, quatro categorias × cinco níveis de luminosidade; modo claro/escuro; seleção global e opção de imagem local comprimida.
- Transparência restrita às áreas vazias dos módulos e preservação do conteúdo dos cartões, com impressão/PDF sem papel de parede.
- Painel lateral minimizado na primeira execução (mantendo preferências existentes) e controle Minimizado/Maximizado em Configurações → Aparência.
- Nova preferência "Iniciar Insights minimizados" ativada por padrão, preservando a expansão manual e salvando a escolha local.
- Precaching desses recursos no service worker; teste novo para referências, sintaxe e preservação do bridge nativo.
- Build Windows na branch de RC com artifact de teste, sem publicar automaticamente uma release estável.

## Fora do RC-1 / pendente de adaptação nativa e homologação
- Novo Perfil Unificado integral, interação Perfil ↔ Avaliações e Evolução.
- EvoStore, mini-aplicativos reais e editor de dashboard da linha 3.x (a base Desktop mantém o editor 1.0.12).
- Novo sistema de 5 temas completos, com ícones por tema e persistência coerente no Windows.
- Mudanças de Análises Completas e reestruturação dos motores em Perfil/Evolução.
- Paridade do formulário, regra de cálculo, impressão, cobrança e atualizador em 3.1.19.
- Geração e validação de 4 alunos de teste × 4 avaliações em ambiente descartável (não inserir fichas fictícias automaticamente no banco real).
- Homologação visual, testes de migração com cópia do SQLite e produção de versão estável 3.x.

## Segurança e versionamento
A versão de instalação permanece 1.0.12 na RC porque NÃO há paridade funcional para liberar 3.1.19.
A identidade do instalador/AppId não mudou, nem os componentes C# de persistência.
Não criar release automática a partir desta branch. Testar usando máquina Windows isolada e backup.
A versão 3.1.19 aqui identifica a **origem da migração web**, não uma versão Windows finalizada.
