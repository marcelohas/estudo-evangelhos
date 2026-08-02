# Evangelhos em Harmonia

Site estático para pesquisar uma passagem dos Evangelhos e comparar, na mesma
página, as correspondências da Catena Aurea de Mateus, Marcos, Lucas e João.

## Arquitetura

- React executado somente no navegador;
- conteúdo armazenado em arquivos TypeScript estáticos;
- nenhuma API, banco de dados, autenticação ou processo de servidor;
- build produzido pelo Vite em `dist/`;
- caminhos relativos, compatíveis com GitHub Pages.

## Desenvolvimento

```bash
npm install
npm run dev
```

O comando de desenvolvimento abre apenas um servidor local temporário para
facilitar a edição. Ele não faz parte da publicação.

## Gerar o site estático

```bash
npm test
```

O resultado publicável será:

```text
dist/
├── abrir-site.html
├── index.html
├── favicon.svg
└── assets/
    ├── index-*.css
    └── index-*.js
```

Para conferir sem servidor, abra `dist/abrir-site.html` com duplo clique. Esse
arquivo contém o CSS e o JavaScript incorporados. O `index.html` continua sendo
o arquivo apropriado para a publicação no GitHub Pages.

## Publicação

Gere a versão pronta para o GitHub a partir de `frontend/`:

```bash
npm run build:github
```

O comando cria `docs/index.html` e copia apenas os assets usados pela versão
atual. O workflow `.github/workflows/pages.yml` publica `docs/` a cada envio
para a branch `main`. No GitHub, selecione **Settings → Pages → Source → GitHub
Actions** uma única vez.

Repositório: <https://github.com/marcelohas/estudo-evangelhos>
