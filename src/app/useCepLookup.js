import { useEffect, useRef, useState } from 'react';

const readCep = (value) => /^\d{5}-?\d{3}$/.test(value.trim()) ? value.trim().replace('-', '') : '';

export default function useCepLookup(fields, onAddress) {
  const request = useRef(null);
  const [message, setMessage] = useState('');

  useEffect(() => () => request.current?.controller.abort(), []);

  function reset() {
    request.current?.controller.abort();
    request.current = null;
    setMessage('');
  }

  async function lookup(event) {
    const input = event.currentTarget;
    const cep = readCep(input.value);
    if (request.current?.cep === cep) return;
    reset();
    if (!cep || !input.form) return;

    const targets = Object.entries(fields).flatMap(([name, key]) => {
      const field = input.form.elements.namedItem(name);
      return field ? [{ name, key, field, initialValue: field.value }] : [];
    });
    const controller = new AbortController();
    const current = { cep, controller };
    request.current = current;
    setMessage('Consultando CEP…');

    const isCurrent = () => request.current === current && input.isConnected && readCep(input.value) === cep;
    const timeout = window.setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch('https://viacep.com.br/ws/' + cep + '/json/', { signal: controller.signal });
      if (!response.ok) throw new Error('Falha na consulta de CEP');
      const address = await response.json();
      if (!isCurrent()) return;
      if (address.erro) {
        setMessage('CEP não encontrado. Confira o número ou preencha o endereço manualmente.');
        return;
      }
      if (!address.localidade || !address.uf) throw new Error('Endereço incompleto');
      address.cityWithUf = address.localidade + ' – ' + address.uf;

      const changes = {};
      for (const { name, key, field, initialValue } of targets) {
        const value = address[key];
        if (typeof value !== 'string' || !value.trim() || field.value !== initialValue) continue;
        changes[name] = value;
        if (!onAddress) field.value = value;
      }
      onAddress?.(changes);
      setMessage(Object.keys(changes).length
        ? 'Endereço preenchido com os dados do CEP. Confira os campos.'
        : 'Confira os campos do endereço.');
    } catch {
      if (isCurrent()) {
        request.current = null;
        setMessage('Não foi possível consultar o CEP. Tente novamente ou preencha o endereço manualmente.');
      }
    } finally {
      window.clearTimeout(timeout);
    }
  }

  return { lookup, message, reset };
}
