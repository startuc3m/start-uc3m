import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/EventSectionDivider.css';
import '../styles/CollapsibleEvent.css';

function CollapsibleEvent({ id, label, title, subtitle, defaultOpen = false, children }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const location = useLocation();
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (location.hash === `#${id}`) {
            setIsOpen(true);
        }
    }, [location.hash, id]);

    const toggle = () => {
        setIsOpen((open) => {
            // Al plegar, si el usuario ya había bajado dentro del evento, devolvemos
            // el banner a la vista para que no se quede colgado a media página.
            if (open && wrapperRef.current && wrapperRef.current.getBoundingClientRect().top < 0) {
                wrapperRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return !open;
        });
    };

    return (
        <div id={id} ref={wrapperRef} className='event-anchor-section collapsible-event'>
            <button
                type='button'
                className={`event-divider collapsible-event__toggle${isOpen ? ' is-open' : ''}`}
                onClick={toggle}
                aria-expanded={isOpen}
                aria-controls={`${id}-panel`}
            >
                <span className='event-divider__rail' />
                <span className='event-divider__content'>
                    <span className='event-divider__label'>{label}</span>
                    {title ? <span className='event-divider__title'>{title}</span> : null}
                    {subtitle ? <span className='event-divider__subtitle'>{subtitle}</span> : null}
                    <span className='collapsible-event__hint'>
                        {isOpen ? 'Ocultar evento' : 'Ver evento'}
                        <span className='collapsible-event__chevron' aria-hidden='true' />
                    </span>
                </span>
                <span className='event-divider__rail' />
            </button>

            <div id={`${id}-panel`} className='collapsible-event__panel' hidden={!isOpen}>
                {children}
            </div>
        </div>
    );
}

export default CollapsibleEvent;
