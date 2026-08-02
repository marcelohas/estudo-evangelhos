# Camada de conteúdo do site

Esta pasta é a fonte editorial normalizada do projeto. PDFs e EPUBs permanecem
como documentos de origem e arquivos para download; a interface deve consumir
dados estruturados por passagem.

## Estrutura proposta

```text
content/
  harmonies/       # correspondências entre perícopes dos quatro Evangelhos
  catena/pt-BR/    # comentários normalizados por Evangelho e passagem
  catena/en/       # texto inglês de conferência
  bible/           # referências bíblicas e metadados da edição utilizada
  schemas/         # contratos dos arquivos JSON
```

Cada harmonia deve produzir exatamente cinco blocos na interface:

1. Evangelho ou passagem consultada;
2. Catena de Mateus;
3. Catena de Marcos;
4. Catena de Lucas;
5. Catena de João.

Quando não houver paralelo narrativo direto, o card permanece visível e deve
ser marcado como `temática` ou `sem_paralelo`, nunca simplesmente omitido.

## Identificação e pesquisa

Cada passagem deve possuir um identificador estável no formato
`livro-capítulo-versículo-inicial-versículo-final`, por exemplo
`mc-2-1-12`. A referência exibida ao leitor continua em português:
`Marcos 2,1-12`.

O índice publicado deve conter somente os campos necessários para localizar o
conteúdo completo:

- identificador da passagem e da harmonia;
- Evangelista, capítulo e intervalo de versículos;
- referência canônica;
- título e aliases da perícope;
- palavras-chave editoriais;
- trecho curto do texto bíblico.

A busca é executada no navegador e normaliza acentos, pontuação e
abreviações. Assim, `Mc 2:1-12`, `Marcos 2,1-12` e `marcos 2 1 12` devem
encontrar a mesma passagem. Nenhum desses dados exige API ou banco de dados em
execução.

## Conteúdo gerado

Execute, dentro de `frontend/`:

```bash
npm run bible:generate
npm run content:generate
```

`bible:generate` extrai somente Mateus, Marcos, Lucas e João do PDF da Bíblia
Ave-Maria e gera registros independentes por versículo. O extrator usa
`pdfjs-dist` porque a extração convencional do PDF não preserva corretamente os
acentos. Quando o pacote não estiver instalado em `frontend/node_modules`, seu
caminho pode ser informado por `PDFJS_DIST_PATH`.

O comando transforma `fonte-xml/catena.xml` em arquivos de publicação dentro
de `content/generated/`. O diretório contém um manifesto, um índice leve de
pesquisa e um arquivo de registros para cada Evangelista disponível na fonte.

O mesmo comando converte as seções de `traducao-pt/*-em-revisao/` em registros
`pt-BR`, gera `search-index-pt-BR.json` e registra em
`translation-audit.json` as diferenças de divisão de versículos entre a
tradução e o XML. Essas diferenças não são descartadas automaticamente:
seções agrupadas na tradução continuam pesquisáveis pela referência
portuguesa e ficam sinalizadas para revisão editorial.

Cada seção portuguesa recebe também `bibleText`, montado a partir dos
versículos da Bíblia Ave-Maria. Dessa forma, o texto bíblico e o comentário da
Catena permanecem fontes independentes mesmo quando aparecem juntos na tela.

Os arquivos em `generated/` não devem ser corrigidos manualmente. Correções
devem ser feitas na fonte ou no gerador e, em seguida, regeneradas. A fonte XML
atual está em inglês e contém Marcos, Lucas e João. Mateus ainda exige uma
fonte estruturada equivalente.
