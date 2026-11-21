import { describe, it, expect } from 'vitest';
import { parseInvitations, validateProfile, validateClassification, canManage } from './model';

describe('importación de usuarios',()=>{
  it('conserva nombres y alias, normaliza y detecta duplicados',()=>{
    const rows=parseInvitations('Ana García, ANA@example.org\nLuis <luis@example.org>\nana@example.org;ana+it@example.org;a.na@example.org');
    expect(rows).toHaveLength(5);
    expect(rows[0]).toMatchObject({name:'Ana García',email:'ana@example.org',error:''});
    expect(rows[2].error).toMatch(/Duplicado/);
    expect(rows[3].error).toBe('');expect(rows[4].error).toBe('');
  });
  it('no descarta líneas ambiguas y limita lotes',()=>{
    expect(parseInvitations('Ana ana@example.org')[0].error).toBeTruthy();
    expect(()=>parseInvitations(Array.from({length:101},(_,i)=>`a${i}@example.org`).join('\n'))).toThrow(/100/);
    expect(()=>parseInvitations('á'.repeat(11000))).toThrow(/20 KB/);
  });
});
describe('perfil y permisos',()=>{
  const profile={name:' Ana ',career:'Ingeniería',course:'3',personality:null};
  it('exige los campos y acepta no saber la personalidad',()=>{
    expect(validateProfile({...profile,position:'junta'})).toEqual({name:'Ana',career:'Ingeniería',course:'3',personality:null,linkedin:''});
    for(const field of ['name','career','course'])expect(()=>validateProfile({...profile,[field]:' '})).toThrow();
    expect(()=>validateProfile({...profile,personality:'OTHER'})).toThrow();
    expect(()=>validateProfile({...profile,linkedin:'https://linkedin.com.evil.test'})).toThrow();
  });
  it('solo Junta e IT autorizado administran; un responsable no',()=>{
    expect(canManage({active:true,position:'junta'})).toBe(true);
    expect(canManage({active:true,manage_users:true})).toBe(true);
    expect(canManage({active:false,position:'junta'})).toBe(false);
    expect(canManage({active:true,position:'responsable'})).toBe(false);
    expect(()=>validateClassification({kind:'socio',manage_users:true})).toThrow();
    expect(()=>validateClassification({kind:'starter',department:'Marketing',manage_users:true})).toThrow();
  });
});

it('valida departamentos del catálogo y usa null para socios',()=>{
 const catalog=[{id:'IT',name:'IT'}];
 expect(validateClassification({kind:'socio'}).department).toBeNull();
 expect(validateClassification({kind:'starter',department:'IT'},catalog).department).toBe('IT');
 for(const department of ['it','Inventado','',null]) expect(()=>validateClassification({kind:'starter',department},catalog)).toThrow();
 expect(()=>validateClassification({kind:'socio',department:'IT'},catalog)).toThrow();
});
