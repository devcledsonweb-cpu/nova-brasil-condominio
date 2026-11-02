/**
 * Utilitários para formatação e integração com WhatsApp Web / App
 */

export function cleanPhoneForWhatsApp(phone?: string | null): string | null {
  if (!phone) return null;
  // Remove todos os caracteres que não sejam dígitos
  let digits = phone.replace(/\D/g, '');

  if (!digits) return null;

  // Se o usuário digitou com zero na frente (ex: 011981112233), remove o zero inicial
  if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
    digits = digits.substring(1);
  }

  // Se tem 10 dígitos (DDD + 8 dígitos) ou 11 dígitos (DDD + 9 dígitos), adiciona código do Brasil (55)
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }

  // Validação mínima de comprimento para DDI + DDD + número
  if (digits.length < 12 || digits.length > 14) {
    return null;
  }

  return digits;
}

export function getWhatsAppUrl(phone?: string | null, message?: string): string | null {
  const clean = cleanPhoneForWhatsApp(phone);
  if (!clean) return null;

  const baseUrl = `https://wa.me/${clean}`;
  if (message && message.trim()) {
    return `${baseUrl}?text=${encodeURIComponent(message.trim())}`;
  }
  return baseUrl;
}
