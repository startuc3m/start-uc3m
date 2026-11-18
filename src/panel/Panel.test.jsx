import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, it, expect } from 'vitest';
import Panel, { PersonalityPicker, Invitations } from './Panel';

it('presenta las 16 etiquetas y un enlace externo, sin test propio',()=>{
  const change=vi.fn();render(<PersonalityPicker value={null} onChange={change}/>);
  expect(screen.getAllByRole('radio')).toHaveLength(17);
  expect(screen.getByLabelText('No lo sé')).toBeChecked();
  fireEvent.click(screen.getByLabelText('INTJ'));expect(change).toHaveBeenCalledWith('INTJ');
  expect(screen.getByRole('link',{name:/test oficial/})).toHaveAttribute('href','https://www.16personalities.com/es/test-de-personalidad');
});
it('revisa un lote antes de crearlo y permite guardar sin enviar',async()=>{
  const api=vi.fn(async(action)=>action==='users'?{members:[],pending:0}:action==='preview'?{rows:[{email:'ana@example.org',name:'Ana',error:'',existing:false}]}:{ok:true});
  render(<Invitations client={{api}} actorId="self" perform={fn=>fn()} busy={false}/>);
  fireEvent.change(screen.getByLabelText('Personas a invitar'),{target:{value:'Ana, ana@example.org'}});
  fireEvent.click(screen.getByRole('button',{name:'Revisar lista'}));
  await screen.findByRole('table');
  expect(api.mock.calls.some(([action])=>action==='invite')).toBe(false);
  fireEvent.click(screen.getByRole('button',{name:'Guardar sin enviar'}));
  await waitFor(()=>expect(api).toHaveBeenCalledWith('invite',expect.objectContaining({send:false,text:'Ana, ana@example.org',batch_id:expect.any(String)})));
});
it('no permite confirmar destinatarios inválidos',async()=>{
  const api=vi.fn(async action=>action==='users'?{members:[],pending:0}:{rows:[{email:'mal',error:'Correo inválido'}]});
  render(<Invitations client={{api}} actorId="self" perform={fn=>fn()} busy={false}/>);
  fireEvent.change(screen.getByLabelText('Personas a invitar'),{target:{value:'mal'}});
  fireEvent.click(screen.getByRole('button',{name:'Revisar lista'}));
  expect(await screen.findByRole('button',{name:'Confirmar y preparar invitaciones'})).toBeDisabled();
});
it('permanece deshabilitado sin configuración',()=>{
  render(<Panel config={{enabled:false}}/>);
  expect(screen.getByRole('heading',{name:'Estamos preparando tu espacio'})).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Entrar'})).not.toBeInTheDocument();
});
