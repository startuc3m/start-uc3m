// src/Components/PodcastCarousel.js
import React from "react";
import "../styles/Podcast.css";

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
      <div className="suc3m-carousel__container">
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
    </section>
  );
}


