import React from 'react';
import '../styles/EventSectionDivider.css';

function EventSectionDivider({ label, title, subtitle }) {
    return (
        <div className='event-divider' aria-hidden='true'>
            <div className='event-divider__rail' />
            <div className='event-divider__content'>
                <span className='event-divider__label'>{label}</span>
                {title ? <h3 className='event-divider__title'>{title}</h3> : null}
                {subtitle ? <p className='event-divider__subtitle'>{subtitle}</p> : null}
            </div>
            <div className='event-divider__rail' />
        </div>
    );
}

export default EventSectionDivider;