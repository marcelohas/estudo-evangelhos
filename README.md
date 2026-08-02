# Evangelhos em Harmonia

Site de estudo comparativo dos quatro Evangelhos com os comentários da
Catena Aurea em português do Brasil.

## Organização

- `frontend/`: aplicação web responsiva.
- `content/`: contratos e dados normalizados para pesquisa e comparação.
- `traducao-pt/`: traduções editoriais e PDFs gerados.
- `fonte-xml/`: fontes estruturadas de conferência.
- `scripts/`: extração, tradução, normalização e geração de documentos.
- `storage/`: reservado para dados locais de execução; não editar manualmente.

## Fluxo principal

O usuário pesquisa uma passagem ou tema e recebe um card do Evangelho
consultado mais quatro cards da Catena, um para cada Evangelista. A interface
mantém todos os cards visíveis mesmo quando uma correspondência for apenas
temática.

## Arquitetura do MVP

O primeiro MVP é um site estático: os dados são normalizados antes da
publicação e carregados pela interface sem API ou autenticação. Essa escolha
reduz complexidade e torna a leitura rápida em celulares e computadores.

## Publicação no GitHub Pages

A versão publicável está em `docs/` e o arquivo de entrada é
`docs/index.html`. O workflow `.github/workflows/pages.yml` publica essa pasta
automaticamente quando a branch `main` é enviada ao GitHub.

Para atualizar `docs/` depois de modificar o frontend:

```bash
cd frontend
npm run build:github
```

Os PDFs e o EPUB de origem são mantidos apenas localmente e não são enviados ao
Git. Antes de publicar textos derivados, confirme as licenças e atribuições das
edições utilizadas.
