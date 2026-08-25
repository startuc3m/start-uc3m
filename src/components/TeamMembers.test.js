import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeamMembers from './TeamMembers';
import departamentos from '../data/departamentos';

const clickFiltro = (nombre) =>
    userEvent.click(screen.getByRole('button', { name: nombre }));

test('no muestra descripción con el filtro "Todos"', () => {
    render(<TeamMembers />);
    expect(screen.queryByTestId('department-description')).not.toBeInTheDocument();
});

test('muestra la descripción del departamento seleccionado', () => {
    render(<TeamMembers />);
    clickFiltro('IT');
    expect(screen.getByTestId('department-description')).toHaveTextContent(
        departamentos['IT']
    );
});

test('cambia la descripción al cambiar de departamento', () => {
    render(<TeamMembers />);
    clickFiltro('IT');
    clickFiltro('Legal');
    expect(screen.getByTestId('department-description')).toHaveTextContent(
        departamentos['Legal']
    );
});

test('oculta la descripción al volver a "Todos"', () => {
    render(<TeamMembers />);
    clickFiltro('IT');
    clickFiltro('Todos');
    expect(screen.queryByTestId('department-description')).not.toBeInTheDocument();
});

test('Junta Directiva incluye a los responsables de cada departamento', () => {
    render(<TeamMembers />);
    clickFiltro('Junta Directiva');
    // Presidente y vicepresidente
    expect(screen.getByText('Iñigo Estebaranz')).toBeInTheDocument();
    expect(screen.getByText('Miguel Arnáiz')).toBeInTheDocument();
    // Responsables de otros departamentos
    expect(screen.getByText('Ioana Nedelcu')).toBeInTheDocument();
    expect(screen.getByText('Ana Giménez')).toBeInTheDocument();
    // Un asociado no debe aparecer
    expect(screen.queryByText('Juan García')).not.toBeInTheDocument();
});

test('los responsables siguen apareciendo en su propio departamento', () => {
    render(<TeamMembers />);
    clickFiltro('IT');
    expect(screen.getByText('Ioana Nedelcu')).toBeInTheDocument();
    expect(screen.getByText('Juan García')).toBeInTheDocument();
    expect(screen.queryByText('Iñigo Estebaranz')).not.toBeInTheDocument();
});
