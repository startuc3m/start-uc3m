import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeamMembers from './TeamMembers';
import { descripcionDe, esJuntaDirectiva } from '../data/departamentos';

// Los tests se apoyan en los botones de filtro que renderiza el propio
// componente, no en nombres concretos, para que sigan valiendo cuando
// cambie la lista de miembros.
const botonesDeDepartamento = () =>
    screen
        .getAllByRole('button')
        .map(boton => boton.textContent)
        .filter(nombre => nombre !== 'Todos');

const clickFiltro = (nombre) =>
    userEvent.click(screen.getByRole('button', { name: nombre }));

const cargosVisibles = (container) =>
    Array.from(container.querySelectorAll('.member-position')).map(el => el.textContent);

test('no muestra descripción con el filtro "Todos"', () => {
    render(<TeamMembers />);
    expect(screen.queryByTestId('department-description')).not.toBeInTheDocument();
});

test('todos los departamentos del equipo tienen descripción', () => {
    render(<TeamMembers />);
    for (const departamento of botonesDeDepartamento()) {
        clickFiltro(departamento);
        expect(screen.getByTestId('department-description')).toHaveTextContent(
            descripcionDe(departamento)
        );
    }
});

test('oculta la descripción al volver a "Todos"', () => {
    render(<TeamMembers />);
    clickFiltro(botonesDeDepartamento()[0]);
    clickFiltro('Todos');
    expect(screen.queryByTestId('department-description')).not.toBeInTheDocument();
});

test('Junta Directiva incluye a los responsables y excluye a los asociados', () => {
    const { container } = render(<TeamMembers />);
    const junta = botonesDeDepartamento().find(esJuntaDirectiva);
    expect(junta).toBeDefined();

    clickFiltro(junta);
    const cargos = cargosVisibles(container);
    expect(cargos).toEqual(expect.arrayContaining(['Responsable']));
    expect(cargos.some(cargo => cargo.startsWith('Asociad'))).toBe(false);
});

test('los responsables siguen apareciendo en su propio departamento', () => {
    const { container } = render(<TeamMembers />);
    const otro = botonesDeDepartamento().find(dep => !esJuntaDirectiva(dep));

    clickFiltro(otro);
    expect(cargosVisibles(container)).toEqual(expect.arrayContaining(['Responsable']));
});
