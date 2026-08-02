# Evangelhos em Harmonia — Catena Aurea

## Objetivo

Permitir que uma pessoa pesquise uma passagem ou tema do Evangelho e visualize,
na mesma página, as correspondências nos quatro Evangelhos e os comentários da
Catena Aurea compilada por Santo Tomás de Aquino.

## Experiência principal

1. O usuário digita uma referência, trecho ou tema, como `Marcos 2,1-12` ou
   `cura do paralítico`.
2. O sistema identifica a perícope e suas passagens paralelas.
3. A página apresenta exatamente cinco cards:
   - um card com o Evangelho pesquisado;
   - Catena de Mateus;
   - Catena de Marcos;
   - Catena de Lucas;
   - Catena de João.
4. Quando não existir paralelo direto, o card do Evangelista continua presente
   e informa uma correspondência temática ou a ausência de paralelo.

## Regras do MVP

- Site público, responsivo e acessível a partir de 360 px.
- Sem login, API externa ou conteúdo editável pelo usuário.
- Conteúdo servido de arquivos estruturados gerados previamente.
- PDFs disponíveis apenas como downloads e fontes de conferência.
- Busca por referência bíblica, palavras-chave, título da perícope e aliases.
- Interface em português do Brasil.
- Publicação do código no GitHub após revisão de licenças e atribuições.

## Organização visual

- Uma página principal, orientada à leitura e não a um dashboard administrativo.
- Busca em destaque no primeiro viewport.
- Card do Evangelho ocupando toda a largura.
- Quatro cards da Catena em duas colunas no desktop e uma coluna no celular.
- Tipografia editorial, fundo claro, contraste elevado e cores discretas para
  distinguir cada Evangelista.

## Evolução posterior

- Indexar todas as perícopes dos quatro Evangelhos.
- Abrir o comentário integral de cada Catena.
- Busca textual em todo o acervo.
- Links para a Bíblia Ave-Maria e para os PDFs completos.
- Favoritos e anotações locais, sem exigir conta.
