/**
 * Serviço de Consulta de CEP (ViaCEP)
 * Preenche automaticamente endereço, bairro, cidade e estado, mantendo os campos 100% alteráveis pelo usuário.
 */

import { cleanDigits } from '../utils/masks.ts';

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean;
}

export interface AddressLookupResult {
  success: boolean;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  fullAddress: string;
  error?: string;
}

export const fetchAddressByCep = async (cepInput: string): Promise<AddressLookupResult> => {
  const cleanCep = cleanDigits(cepInput);

  if (cleanCep.length !== 8) {
    return {
      success: false,
      street: '',
      neighborhood: '',
      city: '',
      state: '',
      fullAddress: '',
      error: 'O CEP deve conter 8 dígitos.',
    };
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (!response.ok) {
      throw new Error(`Falha na resposta do serviço de CEP (${response.status})`);
    }

    const data: ViaCepResponse = await response.json();

    if (data.erro) {
      return {
        success: false,
        street: '',
        neighborhood: '',
        city: '',
        state: '',
        fullAddress: '',
        error: 'CEP não encontrado.',
      };
    }

    // Compor endereço sugestivo (ex: "Rua das Flores, Jardim América")
    const fullAddressParts: string[] = [];
    if (data.logradouro) fullAddressParts.push(data.logradouro);
    if (data.bairro) fullAddressParts.push(data.bairro);

    return {
      success: true,
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: (data.uf || '').toUpperCase(),
      fullAddress: fullAddressParts.join(', ') || data.logradouro || '',
    };
  } catch (error: any) {
    return {
      success: false,
      street: '',
      neighborhood: '',
      city: '',
      state: '',
      fullAddress: '',
      error: error.message || 'Erro ao consultar CEP.',
    };
  }
};
