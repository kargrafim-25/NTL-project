import session from 'express-session';
import connectPg from 'connect-pg-simple';

export function configureSession(pool: any) {
  const PgSession = connectPg(session);
  
  return session({
    store: new PgSession({
      pool,
      tableName: 'sessions'
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  });
}
