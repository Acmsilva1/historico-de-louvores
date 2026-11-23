# AGENTS.md

## 1. Princípios
- Priorize soluções simples, eficientes, seguras e sustentáveis.
- Respeite a arquitetura, as tecnologias e os padrões existentes.
- Antes de implementar, compreenda o fluxo e as dependências envolvidas.
- Evite abstrações, dependências e complexidade desnecessárias.

## 2. Desenvolvimento
- Implemente somente o que foi solicitado.
- Não realize refatorações ou alterações fora do escopo.
- Reutilize componentes, funções e serviços existentes.
- Preserve a separação de responsabilidades e a modularidade.
- Prefira alterações pequenas, localizadas e fáceis de manter.
- Não crie arquivos ou documentação sem necessidade.

## 3. Arquitetura e Tecnologias
- Respeite a stack definida em cada projeto.
- Em Node.js, preserve a organização MVC quando existente.
- Em React, priorize componentes reutilizáveis e interfaces responsivas.
- Em bancos de dados, utilize consultas eficientes e parametrizadas.
- Preserve contratos de APIs, schemas e integrações existentes.

## 4. Segurança e DevOps
- Nunca exponha credenciais, tokens ou informações sensíveis.
- Respeite variáveis de ambiente e configurações de infraestrutura.
- Não altere pipelines, containers ou configurações de produção sem autorização.
- Considere LGPD, controle de acesso e proteção de dados.
- Evite alterações destrutivas ou irreversíveis.

## 5. Orquestração e Subagentes
- Utilize o modelo principal como orquestrador para planejamento, decisões arquiteturais, integração e validação final.
- Sempre avalie a divisão de tarefas independentes entre subagentes.
- Priorize modelos menores e econômicos para tarefas simples, repetitivas ou bem delimitadas.
- Reserve modelos mais capazes para problemas complexos, decisões críticas e raciocínio aprofundado.
- Execute tarefas independentes em paralelo quando houver benefício real.
- Forneça aos subagentes somente o contexto necessário para suas responsabilidades.
- Evite duplicação de trabalho, contexto e processamento entre agentes.
- Consolide e valide os resultados dos subagentes antes da entrega.
- Não delegue tarefas triviais quando o custo da orquestração superar o benefício.
- Caso a ferramenta não suporte subagentes ou seleção de modelos, execute diretamente sem simular delegações.

## 6. Autonomia e Validação
- Resolva problemas técnicos dentro do escopo com autonomia.
- Não solicite confirmação para decisões técnicas triviais.
- Solicite autorização para mudanças estruturais ou de alto impacto.
- Execute testes e verificações disponíveis quando aplicável.
- Não afirme que algo funciona sem validação.
- Ao concluir, resuma objetivamente o que foi alterado e eventuais pendências.

## 7. Comunicação
- Seja direto, técnico e objetivo.
- Evite explicações extensas para alterações simples.
- Aponte riscos, inconsistências e alternativas melhores quando relevantes.
- Não proponha funcionalidades adicionais sem necessidade.