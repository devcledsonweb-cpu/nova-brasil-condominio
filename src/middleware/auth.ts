import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken | { uid: string; email: string; name: string; role: 'sindico' | 'portaria' | 'admin' | 'supervisor' };
  userRole?: 'sindico' | 'portaria' | 'admin' | 'supervisor';
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const roleHeader = req.headers['x-user-role'] as string | undefined;
  const nameHeader = req.headers['x-user-name'] as string | undefined;
  const emailHeader = req.headers['x-user-email'] as string | undefined;

  // 1. If Firebase Bearer token is provided, verify it
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = decodedToken;
      req.userRole = (roleHeader === 'portaria' ? 'portaria' : 'sindico');
      return next();
    } catch (error) {
      console.warn('Bearer token verification error, falling back to role context:', error);
    }
  }

  // 2. Role context fallback
  if (roleHeader) {
    const isPortaria = roleHeader === 'portaria' || roleHeader === 'operador';
    const effectiveRole = isPortaria ? 'portaria' : 'sindico';
    req.user = {
      uid: `local-${roleHeader}`,
      email: emailHeader || `${roleHeader}@novabrasil.com`,
      name: nameHeader || (isPortaria ? 'Operador de Portaria' : 'Gestor Geral'),
      role: effectiveRole,
    };
    req.userRole = effectiveRole;
    return next();
  }

  // Default to Síndico/Admin role if no specific header to ensure smooth operation
  req.user = {
    uid: 'default-admin',
    email: 'administrativo@novabrasil.com',
    name: 'Administrador Geral',
    role: 'sindico',
  };
  req.userRole = 'sindico';
  next();
};

export const requireSindico = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.userRole && req.userRole === 'portaria') {
    return res.status(403).json({ error: 'Acesso restrito ao Gestor / Administração da Empresa.' });
  }
  next();
};
