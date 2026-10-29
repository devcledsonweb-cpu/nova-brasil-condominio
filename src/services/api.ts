/**
 * Utilitário de requisições HTTP seguras com fallback resiliente
 * Garante que respostas não-JSON (como páginas 404 HTML do Vercel) não quebrem a aplicação.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    // Se for uma resposta bem-sucedida com JSON
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      return { success: true, data, status: res.status };
    }

    // Se o servidor retornou erro formatado em JSON (ex: validação 400)
    if (!res.ok && contentType.includes('application/json')) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errJson.error || `Erro HTTP ${res.status}`,
        status: res.status,
      };
    }

    // Caso de Vercel/ambiente estático que retorna HTML (ex: index.html ou 404)
    return {
      success: false,
      error: `Serviço de API estático (${res.status})`,
      status: res.status,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Erro de conexão com o servidor',
      status: 0,
    };
  }
}
