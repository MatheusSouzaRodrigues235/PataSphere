import { z } from 'zod';

const digits = (value) => value.replace(/\D/g, '');
const text = (label) => z.string({ error: label + ' é obrigatório.' }).trim()
  .min(1, label + ' é obrigatório.').max(160, label + ' deve ter até 160 caracteres.');

function checkDigit(value, weights) {
  const remainder = weights.reduce((sum, weight, index) =>
    sum + (value.charCodeAt(index) - 48) * weight, 0) % 11;
  return String(remainder < 2 ? 0 : 11 - remainder);
}

function validDocument(value, firstWeights, secondWeights) {
  if (/^(.)\1+$/.test(value)) return false;
  return checkDigit(value, firstWeights) + checkDigit(value, secondWeights) === value.slice(-2);
}

const cpf = z.string().trim().regex(/^(?:\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/, 'Informe um CPF válido.')
  .transform(digits)
  .refine((value) => validDocument(value, [10,9,8,7,6,5,4,3,2], [11,10,9,8,7,6,5,4,3,2]), 'Informe um CPF válido.');

export const cnpj = z.string().trim().toUpperCase()
  .regex(/^(?:[A-Z0-9]{12}\d{2}|[A-Z0-9]{2}\.[A-Z0-9]{3}\.[A-Z0-9]{3}\/[A-Z0-9]{4}-\d{2})$/, 'Informe um CNPJ válido.')
  .transform((value) => value.replace(/[./-]/g, ''))
  .refine((value) => validDocument(value, [5,4,3,2,9,8,7,6,5,4,3,2], [6,5,4,3,2,9,8,7,6,5,4,3,2]), 'Informe um CNPJ válido.');

const location = /^(.+?)\s*(?:[–—,/|-]\s*|\s+)(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/i;
const account = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email({ error: 'Informe um e-mail válido.' })),
  phone: z.string().trim().regex(/^(?:\d{10,11}|\(\d{2}\) \d{4,5}-\d{4})$/, 'Informe um telefone com DDD.').transform(digits),
  cep: z.string().trim().regex(/^\d{5}-?\d{3}$/, 'Informe um CEP válido.').transform(digits),
  city: text('Cidade / UF').regex(location, 'Informe a cidade e a sigla do estado, como São José dos Campos – SP.')
    .transform((value) => {
      const [, cidade, uf] = location.exec(value);
      return { cidade: cidade.trim(), uf: uf.toUpperCase() };
    }),
  password: z.string().regex(/^(?=.*\p{L})(?=.*[0-9]).{8,}$/u, 'Use pelo menos 8 caracteres, incluindo letras e números.')
    .refine((value) => Buffer.byteLength(value) <= 72, 'A senha excede o tamanho máximo de 72 bytes.'),
  consent: z.union([z.literal(true), z.literal('on')], { error: 'Aceite os termos para continuar.' }),
});

export const tutorRegistration = account.extend({
  firstName: text('Nome'),
  lastName: text('Sobrenome'),
  cpf,
});

export const ongRegistration = account.extend({
  organization: text('Nome da ONG'),
  cnpj,
  street: text('Rua'),
  district: text('Bairro'),
  number: text('Número'),
});
