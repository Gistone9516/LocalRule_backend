declare global {
  namespace Express {
    interface Request {
      id: string;
      adminId?: string;
      adminEmail?: string;
      adminPlan?: string;
    }
  }
}

export {};
