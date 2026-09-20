import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

test('la ruta raiz monta la home sin romper', () => {
  renderAt('/');
  expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
});

test('la ruta /equipo monta la pagina de equipo', () => {
  renderAt('/equipo');
  expect(document.body.textContent.length).toBeGreaterThan(0);
});
