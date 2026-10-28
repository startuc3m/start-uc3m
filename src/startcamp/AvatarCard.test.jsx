import { fireEvent, render, screen } from '@testing-library/react';
import AvatarCard from './AvatarCard';

const PERFIL = {
  nombre: 'Ana García',
  estado_grupo: 'Busco grupo',
  rol: 'Diseño',
  intereses: [],
  linkedin_url: null,
  descripcion: null,
  nombre_grupo: null,
};

const tarjeta = () => screen.getByRole('article', { name: 'Perfil de Ana García' });

describe('AvatarCard: foto', () => {
  test('sin foto_url, las iniciales (como hasta ahora)', () => {
    render(<AvatarCard {...PERFIL} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(tarjeta()).toHaveTextContent('AG');
  });

  test('con foto_url, la foto en el círculo con el nombre como alt', () => {
    render(<AvatarCard {...PERFIL} foto_url="https://firmada/foto" />);
    const img = screen.getByRole('img', { name: 'Ana García' });
    expect(img).toHaveAttribute('src', 'https://firmada/foto');
    expect(img).toHaveClass('rounded-full');
    expect(tarjeta()).not.toHaveTextContent('AG');
  });

  test('si la foto no carga, vuelven las iniciales', () => {
    render(<AvatarCard {...PERFIL} foto_url="https://firmada/caducada" />);
    fireEvent.error(screen.getByRole('img', { name: 'Ana García' }));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(tarjeta()).toHaveTextContent('AG');
  });

  test('con otra URL después de un fallo, lo vuelve a intentar', () => {
    const { rerender } = render(<AvatarCard {...PERFIL} foto_url="https://firmada/caducada" />);
    fireEvent.error(screen.getByRole('img'));
    rerender(<AvatarCard {...PERFIL} foto_url="https://firmada/nueva" />);
    expect(screen.getByRole('img', { name: 'Ana García' })).toHaveAttribute('src', 'https://firmada/nueva');
  });

  test('en la vista previa sin nombre, el alt es el texto de ejemplo', () => {
    render(<AvatarCard {...PERFIL} nombre="" foto_url="blob:foto" preview />);
    expect(screen.getByRole('img', { name: 'Tu nombre' })).toBeInTheDocument();
  });
});
