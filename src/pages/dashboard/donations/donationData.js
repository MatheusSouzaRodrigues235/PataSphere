export const types = { money: 'Financeira', food: 'Ração', medicine: 'Medicamentos' };
export const payments = ['Pix', 'Transferência', 'Dinheiro', 'Entrega presencial'];
export const medicineUnits = ['unidades', 'caixas', 'frascos'];
export const initialDonations = [
  ['Ana Paula Ribeiro', 'ana.ribeiro', 'money', 15000, '', 'Pix', 28, 'Doação para ajudar nas despesas veterinárias dos filhotes resgatados na semana passada.'],
  ['Carlos Mendes', 'carlos.mendes', 'food', 15, 'kg', 'Entrega presencial', 27, 'Ração para cães adultos.'],
  ['Juliana Souza', 'juliana.souza', 'medicine', 6, 'caixas', 'Entrega presencial', 25, 'Medicamentos para o estoque da ONG.'],
  ['Roberto Lima', 'roberto.lima', 'money', 8000, '', 'Pix', 24, 'Contribuição para os cuidados dos animais.'],
  ['Fernanda Alves', 'fernanda.alves', 'food', 30, 'kg', 'Entrega presencial', 22, 'Ração para os animais do abrigo.'],
  ['Marcos Pereira', 'marcos.pereira', 'money', 30000, '', 'Transferência', 20, 'Contribuição para as despesas da ONG.'],
  ['Patrícia Gomes', 'patricia.gomes', 'money', 5000, '', 'Dinheiro', 18, 'Doação recebida na sede da ONG.'],
  ['Lucas Oliveira', 'lucas.oliveira', 'medicine', 3, 'frascos', 'Entrega presencial', 15, 'Medicamentos entregues na sede da ONG.'],
].map(([name, email, type, amount, unit, payment, day, description], index) => ({
  id: String(index), name, email: `${email}@example.com`, type, amount, unit, payment,
  date: `2026-10-${day}`, description, attachments: [],
}));

export const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const quantity = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
export const today = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

export function formatAmount({ type, amount, unit }) {
  return type === 'money' ? currency.format(amount / 100) : `${quantity.format(amount)} ${unit}`;
}

export function formatDate(date) {
  return date.split('-').reverse().join('/');
}

export function searchable(value) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR').trim();
}
