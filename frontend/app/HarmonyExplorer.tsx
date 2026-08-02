"use client";

import { FormEvent, useMemo, useState } from "react";
import { harmonies, type Harmony } from "../content/harmonies";
import { searchHarmonies } from "../content/search";
import { catalogRange, searchCatalog, type CatalogRecord } from "../content/catalog";
import { normalizeSearchText } from "../content/search";

const evangelistClass: Record<string, string> = {
  Mateus: "matthew",
  Marcos: "mark",
  Lucas: "luke",
  João: "john",
};

const loavesParallelReferences = [
  { book: "Mateus", chapter: 14, verseStart: 13, verseEnd: 21 },
  { book: "Marcos", chapter: 6, verseStart: 30, verseEnd: 44 },
  { book: "Lucas", chapter: 9, verseStart: 10, verseEnd: 17 },
  { book: "João", chapter: 6, verseStart: 1, verseEnd: 15 },
] as const;

function loavesParallelResult(value: string) {
  const query = normalizeSearchText(value);
  const isParallel = loavesParallelReferences.some(({ book, chapter, verseStart, verseEnd }) =>
    query === normalizeSearchText(`${book} ${chapter},${verseStart}-${verseEnd}`),
  );
  if (!isParallel) return null;
  const records = loavesParallelReferences.map(({ book, chapter, verseStart, verseEnd }) =>
    catalogRange(book, chapter, verseStart, verseEnd),
  );
  return records.every((record): record is CatalogRecord => record !== null) ? records : null;
}

function CardMonogram({ evangelist }: { evangelist: string }) {
  return (
    <span className={`monogram ${evangelistClass[evangelist] ?? ""}`} aria-hidden="true">
      {evangelist.slice(0, 1)}
    </span>
  );
}

export function HarmonyExplorer() {
  const [query, setQuery] = useState("Marcos 2,1-12");
  const [selectedId, setSelectedId] = useState(harmonies[0].id);
  const [selectedEvangelist, setSelectedEvangelist] = useState(harmonies[0].primary.evangelist);
  const [message, setMessage] = useState("");
  const [catalogResult, setCatalogResult] = useState<CatalogRecord | null>(null);
  const [parallelResults, setParallelResults] = useState<CatalogRecord[] | null>(null);

  const selected = useMemo(
    () => harmonies.find((item) => item.id === selectedId) ?? harmonies[0],
    [selectedId],
  );

  const selectedGospel =
    selected.catena.find((card) => card.evangelist === selectedEvangelist) ?? selected.catena[0];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parallelMatch = loavesParallelResult(query);
    if (parallelMatch) {
      setParallelResults(parallelMatch);
      setCatalogResult(null);
      setMessage("");
      return;
    }
    const found = searchHarmonies(query)[0];
    if (found) {
      setSelectedId(found.harmony.id);
      setSelectedEvangelist(found.evangelist);
      setMessage("");
      setCatalogResult(null);
      setParallelResults(null);
      return;
    }
    const catalogMatch = searchCatalog(query)[0];
    if (catalogMatch) {
      setCatalogResult(catalogMatch);
      setParallelResults(null);
      setMessage("");
      return;
    }
    setMessage(
      "Ainda não indexamos essa passagem. Experimente “Batismo de Jesus”, “Marcos 2,1-12” ou “João 20”.",
    );
  }

  function choose(item: Harmony) {
    setSelectedId(item.id);
    setSelectedEvangelist(item.primary.evangelist);
    setQuery(item.primary.reference);
    setMessage("");
    setCatalogResult(null);
    setParallelResults(null);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Evangelhos em Harmonia — início">
          <span className="brand-mark">EH</span>
          <span>
            <strong>Evangelhos em Harmonia</strong>
            <small>Catena Aurea em português</small>
          </span>
        </a>
        <a className="about-link" href="#sobre">Sobre o acervo</a>
      </header>

      <section className="hero" id="top">
        <p className="eyebrow">Escritura · Tradição · Comparação</p>
        <h1>Uma passagem. Quatro Evangelhos.<br />A voz dos Padres da Igreja.</h1>
        <p className="intro">
          Digite uma referência ou tema para encontrar os textos paralelos e comparar,
          lado a lado, os comentários reunidos por Santo Tomás de Aquino.
        </p>

        <form className="search" onSubmit={submit} role="search">
          <label htmlFor="gospel-search">Passagem ou tema do Evangelho</label>
          <div className="search-row">
            <input
              id="gospel-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex.: Marcos 2,1-12 ou cura do paralítico"
            />
            <button type="submit">Comparar</button>
          </div>
          {message && <p className="search-message" role="status">{message}</p>}
        </form>

        <div className="suggestions" aria-label="Passagens de exemplo">
          <span>Experimente:</span>
          {harmonies.map((item) => (
            <button key={item.id} onClick={() => choose(item)} type="button">
              {item.shortTitle}
            </button>
          ))}
        </div>
      </section>

      {parallelResults ? (
        <section className="results" aria-live="polite">
          <div className="result-heading">
            <div>
              <p className="eyebrow">Resultado da comparação</p>
              <h2>Multiplicação dos pães</h2>
            </div>
            <span className="result-count">1 Evangelho + 4 Catenas</span>
          </div>

          <article className="gospel-card">
            <div className="card-topline">
              <span className="card-kicker">Evangelho consultado</span>
              <span className="reference">{parallelResults[0].reference}</span>
            </div>
            <div className="gospel-content">
              <CardMonogram evangelist={parallelResults[0].book} />
              <div>
                <h3>Evangelho segundo {parallelResults[0].book}</h3>
                <blockquote>{parallelResults[0].bibleText}</blockquote>
                <p className="source-note">Bíblia Ave-Maria · texto independente da Catena Aurea.</p>
              </div>
            </div>
          </article>

          <div className="parallel-catenas">
            {parallelResults.map((record) => (
              <section className="parallel-catena" key={record.book}>
                <div className="parallel-catena-heading">
                  <CardMonogram evangelist={record.book} />
                  <div>
                    <span className="card-kicker">Catena de</span>
                    <h3>{record.book}</h3>
                    <span className="reference">{record.reference}</span>
                  </div>
                </div>
                {record.comments.map((comment, index) => (
                  <article className="catena-card" key={`${record.book}-${comment.author}-${index}`}>
                    <h4 className="father-name">{comment.author}</h4>
                    {comment.text.split(/\n\s*\n/).map((paragraph, paragraphIndex) => (
                      <p className="commentary" key={paragraphIndex}>{paragraph}</p>
                    ))}
                  </article>
                ))}
              </section>
            ))}
          </div>
        </section>
      ) : catalogResult ? (
        <section className="results" aria-live="polite">
          <div className="result-heading">
            <div>
              <p className="eyebrow">Resultado no acervo completo</p>
              <h2>{catalogResult.reference}</h2>
            </div>
            <span className="result-count">Catena em revisão editorial</span>
          </div>

          <article className="gospel-card">
            <div className="card-topline">
              <span className="card-kicker">Passagem comentada</span>
              <span className="reference">{catalogResult.reference}</span>
            </div>
            <div className="gospel-content">
              <CardMonogram evangelist={catalogResult.book} />
              <div>
                <h3>Evangelho segundo {catalogResult.book}</h3>
                <blockquote>{catalogResult.bibleText}</blockquote>
                <p className="source-note">Bíblia Ave-Maria · texto independente da Catena Aurea.</p>
              </div>
            </div>
          </article>

          <div className="catalog-comments">
            {catalogResult.comments.map((comment, index) => (
              <article className="catena-card" key={`${comment.author}-${index}`}>
                <div className="card-topline">
                  <span className="card-kicker">Comentário da Catena Aurea</span>
                  <span className="reference">{catalogResult.reference}</span>
                </div>
                <h3 className="father-name">{comment.author}</h3>
                {comment.text.split(/\n\s*\n/).map((paragraph, paragraphIndex) => (
                  <p className="commentary" key={paragraphIndex}>{paragraph}</p>
                ))}
              </article>
            ))}
          </div>
        </section>
      ) : (
      <section className="results" aria-live="polite">
        <div className="result-heading">
          <div>
            <p className="eyebrow">Resultado da comparação</p>
            <h2>{selected.title}</h2>
          </div>
          <span className="result-count">1 Evangelho + 4 Catenas</span>
        </div>

        <article className="gospel-card">
          <div className="card-topline">
            <span className="card-kicker">Evangelho consultado</span>
            <span className="reference">{selectedGospel.reference}</span>
          </div>
          <div className="gospel-content">
            <CardMonogram evangelist={selectedGospel.evangelist} />
            <div>
              <h3>Segundo {selectedGospel.evangelist}</h3>
              <blockquote>“{selectedGospel.gospelText}”</blockquote>
              <p className="source-note">Texto bíblico para leitura e localização da perícope.</p>
            </div>
          </div>
        </article>

        <div className="catena-grid">
          {selected.catena.map((card) => (
            <article className="catena-card" key={card.evangelist}>
              <div className="card-topline">
                <div className="evangelist-title">
                  <CardMonogram evangelist={card.evangelist} />
                  <div>
                    <span className="card-kicker">Catena de</span>
                    <h3>{card.evangelist}</h3>
                  </div>
                </div>
                <span className="reference">{card.reference}</span>
              </div>
              <span className={`parallel-badge ${card.kind}`}>
                {card.kind === "direta"
                  ? "Correspondência direta"
                  : card.kind === "temática"
                    ? "Correspondência temática"
                    : "Sem paralelo"}
              </span>
              <p className="commentary">{card.commentary}</p>
              <footer>
                <span>{card.fathers}</span>
                <span className="collection-status">Texto integral em preparação</span>
              </footer>
            </article>
          ))}
        </div>
      </section>
      )}

      <section className="about" id="sobre">
        <p className="eyebrow">Sobre o acervo</p>
        <h2>Uma leitura sinótica guiada pela tradição patrística</h2>
        <p>
          A Catena Aurea organiza comentários dos Padres da Igreja versículo por versículo.
          Esta interface prepara o acervo para pesquisa por referência, tema e passagem paralela,
          mantendo cada Evangelista claramente identificado.
        </p>
      </section>

      <footer className="site-footer">
        <strong>Evangelhos em Harmonia</strong>
        <span>Projeto de estudo da Catena Aurea</span>
      </footer>
    </main>
  );
}
