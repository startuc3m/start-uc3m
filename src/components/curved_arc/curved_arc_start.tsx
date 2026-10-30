import './curved_arc_start.css';
import startWordmark from './assets/start-wordmark.svg';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { HackathonParticipant, HackathonRole, GroupStatus } from './curved_arc_start_data';

export type { HackathonParticipant, HackathonRole, GroupStatus } from './curved_arc_start_data';

type FilterOption = 'Todos' | HackathonRole | GroupStatus;

const FILTER_OPTIONS: readonly FilterOption[] = [
  'Todos',
  'Tecnología',
  'Diseño',
  'Negocio',
  'Otro',
  'Busco grupo',
  'Abierto a sumar gente',
  'Tengo grupo',
];

function wrapIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return ((index % total) + total) % total;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getInitials(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
}

function getStatusClass(status: GroupStatus): string {
  if (status === 'Busco grupo') return 'is-open';
  if (status === 'Abierto a sumar gente') return 'is-partial';
  return '';
}

function ParticipantAvatar({ person }: { person: HackathonParticipant }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return <span className="player-card-avatar" aria-hidden="true">
    {person.foto_url && person.foto_url !== failedUrl ?
      <img src={person.foto_url} alt="" loading="lazy" onError={() => setFailedUrl(person.foto_url ?? null)} /> :
      getInitials(person.nombre)}
  </span>;
}

export default function CurvedArcStart({ participants }: { participants: HackathonParticipant[] }) {
  const [filterOption, setFilterOption] = useState<FilterOption>('Todos');
  const [targetOffset, setTargetOffset] = useState<number>(0);
  const [currentOffset, setCurrentOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const didDrag = useRef(false);
  const roster = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const dragStartOffset = useRef<number>(0);
  const lastDragY = useRef<number>(0);
  const lastDragTime = useRef<number>(0);
  const dragVelocity = useRef<number>(0);
  const animFrameId = useRef<number | null>(null);

  const filteredList = useMemo(() => {
    if (filterOption === 'Todos') return participants;
    if (
      filterOption === 'Busco grupo' ||
      filterOption === 'Abierto a sumar gente' ||
      filterOption === 'Tengo grupo'
    ) {
      return participants.filter((p) => p.estado_grupo === filterOption);
    }
    return participants.filter((p) => p.rol === filterOption);
  }, [participants, filterOption]);

  const totalItems = filteredList.length;

  const handleSelectFilter = (opt: FilterOption) => {
    setFilterOption(opt);
    setTargetOffset(0);
    setCurrentOffset(0);
  };

  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      setCurrentOffset((curr) => {
        const delta = targetOffset - curr;
        if (Math.abs(delta) < 0.0004) {
          return targetOffset;
        }
        const speed = 1 - Math.exp(-15 * dt);
        return curr + delta * speed;
      });

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [targetOffset]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      didDrag.current = false;
      setIsDragging(true);
      dragStartY.current = e.clientY;
      dragStartOffset.current = targetOffset;
      lastDragY.current = e.clientY;
      lastDragTime.current = performance.now();
      dragVelocity.current = 0;
    },
    [targetOffset]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const now = performance.now();
      const dt = Math.max(now - lastDragTime.current, 1);
      const deltaY = e.clientY - dragStartY.current;
      const stepY = e.clientY - lastDragY.current;
      if (Math.abs(deltaY) > 5) didDrag.current = true;

      const sensitivity = 0.0036;
      const newOffset = dragStartOffset.current - deltaY * sensitivity;

      setTargetOffset(newOffset);
      setCurrentOffset(newOffset);

      dragVelocity.current = -stepY / dt;
      lastDragY.current = e.clientY;
      lastDragTime.current = now;
    },
    [isDragging]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {}
      setIsDragging(false);

      const inertia = clamp(dragVelocity.current * 180, -2.5, 2.5);
      const destination = targetOffset + inertia;
      setTargetOffset(Math.round(destination));
    },
    [isDragging, targetOffset]
  );

  useEffect(() => {
    const element = roster.current;
    if (!element) return;
    let lastStep = -Infinity;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaX && !e.deltaY && (e.target as HTMLElement).closest('.profile-interests')) return;
      if (window.innerWidth <= 640 && !(e.target as HTMLElement).closest('.start-carousel')) return;
      const content = (e.target as HTMLElement).closest<HTMLElement>('.profile-sheet-title');
      if (content && ((e.deltaY > 0 && content.scrollTop + content.clientHeight < content.scrollHeight) ||
        (e.deltaY < 0 && content.scrollTop > 0))) return;
      e.preventDefault();
      if (!e.deltaY) return;
      const now = performance.now();
      // Los eventos ignorados no prolongan el bloqueo del siguiente paso.
      if (now - lastStep < 350) return;
      lastStep = now;
      setTargetOffset((prev) => Math.round(prev) + Math.sign(e.deltaY));
    };
    // React usa listeners pasivos para wheel; el nativo permite bloquear el scroll.
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      element.removeEventListener('wheel', onWheel);
    };
  }, []);

  const activeIndex = totalItems > 0 ? wrapIndex(Math.round(currentOffset), totalItems) : 0;
  const activePerson = filteredList[activeIndex];

  const handleCopyLink = useCallback(() => {
    if (activePerson?.linkedin_url && navigator.clipboard) {
      navigator.clipboard.writeText(activePerson.linkedin_url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  }, [activePerson]);

  const renderedCards = useMemo(() => {
    if (totalItems === 0) return [];
    const range = Math.min(4, Math.floor(totalItems / 2));
    const centerInt = Math.round(currentOffset);
    const list = [];

    for (let i = centerInt - range; i <= centerInt + Math.min(range, totalItems - range - 1); i++) {
      const dataIndex = wrapIndex(i, totalItems);
      const person = filteredList[dataIndex];
      if (!person) continue;

      const delta = i - currentOffset;
      const absDelta = Math.abs(delta);

      const y = delta * 170;
      const x = -Math.pow(absDelta, 1.58) * 54;
      const scale = clamp(1.0 - absDelta * 0.05, 0.78, 1.0);
      const opacity = clamp(1.0 - (absDelta - 2.85) * 0.7, 0, 1.0);
      const zIndex = Math.round(50 - absDelta * 6);
      const isApex = absDelta < 0.45;

      list.push({
        virtualIndex: i,
        dataIndex,
        person,
        delta,
        absDelta,
        x,
        y,
        scale,
        opacity,
        zIndex,
        isApex,
      });
    }

    return list;
  }, [currentOffset, totalItems, filteredList]);

  return (
    <div ref={roster} data-lenis-prevent tabIndex={0} role="region" aria-label="Directorio de participantes" onKeyDown={(e) => {
      if ((e.target as HTMLElement).closest('a, button, input, textarea, select')) return;
      if (['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        setTargetOffset((prev) => Math.round(prev) + (['ArrowUp', 'ArrowLeft'].includes(e.key) ? -1 : 1));
      }
    }} className="start-roster relative w-full min-h-[720px] h-[80dvh] overflow-hidden bg-[#f8f8fc] text-[#12123a] font-sans select-none flex flex-row">
      <select className="start-filter" aria-label="Filtrar participantes" value={filterOption}
        onChange={(e) => handleSelectFilter(e.target.value as FilterOption)}>
        {FILTER_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt === 'Todos' ? 'Todos los participantes' : opt}</option>)}
      </select>

      {/* LEFT COLUMN: Curved Arc Carousel */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="start-carousel w-[56%] h-full relative overflow-visible flex items-center justify-end cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
      >
        <div className="absolute right-16 top-0 bottom-0 w-72 pointer-events-none opacity-20">
          <svg className="w-full h-full" viewBox="0 0 260 800" fill="none">
            <path
              d="M -40 40 C 220 220, 250 400, 250 400 C 250 400, 220 580, -40 760"
              stroke="#333399"
              strokeWidth="2"
              strokeDasharray="4 6"
            />
          </svg>
        </div>

        <div className="start-card-anchor relative w-full h-full flex items-center justify-end pr-12 xl:pr-16">
          {renderedCards.map((item) => {
            if (item.opacity <= 0.01) return null;
            const isSelected = item.dataIndex === activeIndex;
            const statusClass = getStatusClass(item.person.estado_grupo);

            return (
              <button
                type="button"
                key={`card-${item.virtualIndex}`}
                aria-label={`Seleccionar a ${item.person.nombre}, ${item.person.rol}`}
                aria-pressed={isSelected}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!didDrag.current) setTargetOffset(item.virtualIndex);
                }}
                style={{
                  transform: `translate3d(${item.x}px, ${item.y}px, 0px) scale(${item.scale})`,
                  zIndex: item.zIndex,
                  opacity: item.opacity,
                }}
                className={`start-player-card ${isSelected ? 'is-selected' : ''}`}
              >
                <span className="player-card-topline">
                  <img className="start-wordmark" src={typeof startWordmark === 'string' ? startWordmark : startWordmark.src} alt="Start" />
                </span>
                <span className="player-card-portrait">
                  <span className="player-card-number" aria-label="Número de participante">
                    {String(participants.findIndex((p) => p.user_id === item.person.user_id) + 1).padStart(
                      2,
                      '0'
                    )}
                  </span>
                  <span className="player-card-role">{item.person.rol}</span>
                  <ParticipantAvatar person={item.person} />
                  {item.person.group_nombre && (
                    <span className="player-card-group-pill">{item.person.group_nombre}</span>
                  )}
                </span>
                <span className="player-card-identity">
                  <span className="player-card-name">{item.person.nombre}</span>
                  <span className="player-card-footer">
                    <span className={`player-card-status ${statusClass}`}>
                      <span aria-hidden="true" />
                      {item.person.estado_grupo}
                    </span>
                    <span className="player-card-mark" aria-hidden="true">
                      ↗
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="start-arc-controls absolute left-10 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-30">
          <button
            onClick={() => setTargetOffset((prev) => Math.round(prev) - 1)}
            aria-label="Anterior participante"
            className="p-3 rounded-full bg-white hover:bg-[#333399] hover:text-white border border-neutral-300 hover:border-[#333399] text-neutral-800 shadow-md transition-all hover:scale-110 active:scale-95"
          >
            <span aria-hidden="true">↑</span>
          </button>
          <button
            onClick={() => setTargetOffset((prev) => Math.round(prev) + 1)}
            aria-label="Siguiente participante"
            className="p-3 rounded-full bg-white hover:bg-[#333399] hover:text-white border border-neutral-300 hover:border-[#333399] text-neutral-800 shadow-md transition-all hover:scale-110 active:scale-95"
          >
            <span aria-hidden="true">↓</span>
          </button>
        </div>

        <div className="start-hints absolute bottom-8 left-10 flex items-center gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span aria-hidden="true">↕</span>
            <span>Arrastra o desliza para navegar</span>
          </div>
          <span className="text-neutral-300">•</span>
          <span>Click en cualquier tarjeta para seleccionar</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Description & Profile */}
      <div className="start-profile w-[44%] h-full relative flex flex-col justify-center px-10 xl:px-20 z-20 flex-shrink-0 border-l border-black/[0.04] bg-[#f8f8fc]">
        {activePerson ? (
          <article className="player-profile-sheet">
            <div className="profile-sheet-header">
              <img className="start-wordmark" src={typeof startWordmark === 'string' ? startWordmark : startWordmark.src} alt="Start" />
            </div>
            <div className="profile-sheet-title" key={activePerson.user_id} tabIndex={0} aria-label="Datos del participante">
              <h1>{activePerson.nombre}</h1>
              <div className="profile-player-facts">
                <div>
                  <span>ESPECIALIDAD</span>
                  <strong>{activePerson.rol}</strong>
                </div>
                <div>
                  <span>ESTADO DEL GRUPO</span>
                  <strong className="profile-team-status">
                    <i className={getStatusClass(activePerson.estado_grupo)} aria-hidden="true" />
                    {activePerson.estado_grupo}
                  </strong>
                  {activePerson.group_nombre && (
                    <span className="profile-group-name">Grupo: {activePerson.group_nombre}</span>
                  )}
                </div>
              </div>
              {activePerson.intereses.length > 0 && (
                <div>
                  <span className="profile-section-label">INTERESES</span>
                  <div className="profile-interests">
                    {activePerson.intereses.map((interes) => (
                      <span key={interes} className="profile-interest-chip">
                        {interes.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {activePerson.descripcion && (
                <div className="profile-player-bio">
                  <span className="profile-section-label">01 / SOBRE MÍ</span>
                  <p>{activePerson.descripcion}</p>
                </div>
              )}
            </div>
            <div className="profile-player-actions">
              {activePerson.linkedin_url && <>
                <a href={activePerson.linkedin_url} target="_blank" rel="noopener noreferrer">
                  Conectar en LinkedIn <span aria-hidden="true">↗</span>
                </a>
                <button onClick={handleCopyLink} title="Copiar perfil de LinkedIn" aria-live="polite">
                  {copiedLink ? <span aria-hidden="true">✓</span> : <span aria-hidden="true">⧉</span>}
                  {copiedLink ? 'Copiado' : 'Copiar enlace'}
                </button>
              </>}
            </div>
            <div className="profile-sheet-navigation">
              <div className="profile-roster-progress">
                <div className="profile-roster-dots">
                  {filteredList.map((person, index) => (
                    <button
                      key={person.user_id}
                      onClick={() => setTargetOffset(index)}
                      aria-label={`Ir a ${person.nombre}`}
                      aria-pressed={index === activeIndex}
                    />
                  ))}
                </div>
              </div>
              <div className="profile-navigation-buttons">
                <button
                  onClick={() => setTargetOffset((prev) => Math.round(prev) - 1)}
                  aria-label="Anterior"
                >
                  <span aria-hidden="true">‹</span>
                </button>
                <button
                  onClick={() => setTargetOffset((prev) => Math.round(prev) + 1)}
                  aria-label="Siguiente"
                >
                  <span aria-hidden="true">›</span>
                </button>
              </div>
            </div>
          </article>
        ) : (
          <div className="text-center text-neutral-400">
            <span aria-hidden="true">♙</span>
            <p>No hay participantes con este filtro</p>
          </div>
        )}
      </div>
    </div>
  );
}
