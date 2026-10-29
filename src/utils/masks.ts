/**
 * Utilitários de Máscaras e Formatação Padrão Brasileiro (. - / ( ) R$)
 */

// Remove qualquer caractere que não seja dígito
export const cleanDigits = (value: string = ''): string => {
  return value.replace(/\D/g, '');
};

// Máscara de CPF: 000.000.000-00
export const maskCPF = (value: string = ''): string => {
  const digits = cleanDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

// Máscara de CNPJ: 00.000.000/0001-00
export const maskCNPJ = (value: string = ''): string => {
  const digits = cleanDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
};

// Máscara dinâmica de Documento (CPF se <= 11 dígitos, CNPJ se > 11 dígitos)
export const maskDocument = (value: string = ''): string => {
  const digits = cleanDigits(value);
  if (digits.length > 11) {
    return maskCNPJ(digits);
  }
  return maskCPF(digits);
};

// Máscara de CEP: 00000-000
export const maskCEP = (value: string = ''): string => {
  const digits = cleanDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
};

// Máscara de Telefone: (00) 0000-0000 ou (00) 00000-0000
export const maskPhone = (value: string = ''): string => {
  const digits = cleanDigits(value).slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

// Máscara de Placa de Veículo: Padrão Mercosul (ABC1D23) ou Tradicional (ABC-1234)
export const maskPlate = (value: string = ''): string => {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  if (clean.length <= 3) return clean;

  // Se o 5º caractere for letra (índice 4), é Mercosul (ex: BRA2E19) -> sem hífen
  const fifthChar = clean[4];
  const isMercosul = fifthChar && isNaN(Number(fifthChar));

  if (isMercosul) {
    return clean;
  }

  // Padrão antigo: ABC-1234
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`;
};

// Máscara de Data: DD/MM/AAAA
export const maskDate = (value: string = ''): string => {
  const digits = cleanDigits(value).slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
};

// Formatação de Moeda Brasileira: R$ 0,00
export const maskCurrency = (value: string | number = ''): string => {
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  const digits = cleanDigits(value);
  if (!digits) return '';
  const num = (parseInt(digits, 10) / 100).toFixed(2);
  const parts = num.split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${intPart},${parts[1]}`;
};

// Converte string monetária formatada para número float (ex: "R$ 150,50" -> 150.5)
export const currencyToNumber = (val: string): number => {
  const digits = cleanDigits(val);
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
};
