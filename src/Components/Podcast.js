// src/Components/PodcastCarousel.js
import React from "react";

export default function PodcastEmbed({
  channelId = "UCbfIppe2oCIZpT6eHvu6q1g", // canal @StartUC3MG
  playlistId,
  title = "Podcast – Episodios recientes",
  theme = "dark", // "dark" | "light"
  visible = 3, // cuantos vídeos a la vez
  startIndex = 1, // índice inicial (YouTube usa 1-based)
  className = "",
} = {}) {
  const derivedPlaylistId =
    playlistId ||
    (channelId.startsWith("UC") ? `UU${channelId.slice(2)}` : undefined);

  const [baseIndex, setBaseIndex] = React.useState(startIndex);

  const bg = theme === "light" ? "#f6f7fb" : "transparent";

  const next = () => setBaseIndex((i) => i + visible);
  const prev = () => setBaseIndex((i) => Math.max(1, i - visible));

  const frameSrc = (idx) =>
    `https://www.youtube.com/embed?listType=playlist&list=${derivedPlaylistId}&index=${idx}&modestbranding=1&rel=0`;

  return (
    <section className={`suc3m-carousel ${className}`} aria-label={title}>
      <div className="suc3m-carousel__container" style={{ background: bg }}>
        <div className="suc3m-carousel__header">
          <h2 className="suc3m-carousel__title">{title}</h2>
          <a
            className="suc3m-carousel__link"
            href="https://www.youtube.com/@StartUC3MG/videos"
            target="_blank"
            rel="noreferrer"
          >
            Go to YouTube ↗
          </a>
        </div>

        <div className="suc3m-carousel__track">
          <button
            className="suc3m-carousel__nav suc3m-carousel__nav--prev"
            onClick={prev}
            aria-label="Previous videos"
          >
            ‹
          </button>

          <div className="suc3m-carousel__frames" data-visible={visible}>
            {Array.from({ length: visible }).map((_, i) => {
              const idx = baseIndex + i;
              return (
                <div className="suc3m-carousel__frame" key={idx}>
                  <div className="suc3m-carousel__player">
                    <iframe
                      title={`${title} – video ${idx}`}
                      src={frameSrc(idx)}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      loading="lazy"
                      allowFullScreen
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className="suc3m-carousel__nav suc3m-carousel__nav--next"
            onClick={next}
            aria-label="Next videos"
          >
            ›
          </button>
        </div>

        <div className="suc3m-carousel__footer">
          <a
            className="StarterSection-cta"
            href="https://www.youtube.com/@StartUC3MG/videos"
            target="_blank"
            rel="noreferrer"
          >
            View more on YouTube
          </a>
        </div>
      </div>

      <style>{`
        .suc3m-carousel { --tx: #fff; --muted: rgba(255,255,255,.7); --bd: rgba(255,255,255,.14); margin: 4rem 0; }
        .suc3m-carousel__container { max-width: 1120px; margin: 0 auto; padding: 1.5rem; border-radius: 1rem; border: 1px solid var(--bd); backdrop-filter: blur(6px); box-shadow: 0 16px 40px rgba(0,0,0,.25); }
        .suc3m-carousel__header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
        .suc3m-carousel__title { margin: 0; color: var(--tx); font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 800; letter-spacing: -0.02em; font-size: clamp(1.3rem, 1.1rem + 1vw, 1.8rem); }
        .suc3m-carousel__link { color: var(--tx); text-decoration: none; border: 1px solid var(--bd); padding: .5rem .75rem; border-radius: .75rem; font-family: 'Josefin Sans Regular', Arial, sans-serif; }
        .suc3m-carousel__link:hover { background: rgba(255,255,255,.08); }

        .suc3m-carousel__track { position: relative; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: .75rem; }
        .suc3m-carousel__nav { appearance: none; background: rgba(255,255,255,.1); color: #fff; border: 1px solid var(--bd); border-radius: .75rem; width: 44px; height: 44px; font-size: 28px; line-height: 1; cursor: pointer; transition: transform .15s ease, background .2s ease; }
        .suc3m-carousel__nav:hover { transform: scale(1.06); background: rgba(255,255,255,.16); }

        .suc3m-carousel__frames { display: grid; gap: 1rem; grid-template-columns: repeat(var(--cols, 3), 1fr); }
        .suc3m-carousel__frames[data-visible="1"] { --cols: 1; }
        .suc3m-carousel__frames[data-visible="2"] { --cols: 2; }
        .suc3m-carousel__frames[data-visible="3"] { --cols: 3; }
        @media (max-width: 900px) { .suc3m-carousel__frames { --cols: 2; } }
        @media (max-width: 640px) { .suc3m-carousel__frames { --cols: 1; } }

        .suc3m-carousel__frame { overflow: hidden; border-radius: 1rem; border: 1px solid var(--bd); background: #000; box-shadow: 0 10px 30px rgba(0,0,0,.25); }
        .suc3m-carousel__player { position: relative; width: 100%; padding-top: 56.25%; }
        .suc3m-carousel__player iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; display: block; }

        .suc3m-carousel__footer { display: grid; place-items: center; margin-top: 1rem; }
        .StarterSection-cta { font-family: 'Josefin Sans Regular', Arial, sans-serif; margin: 1rem 0; }
      `}</style>
    </section>
  );
}


