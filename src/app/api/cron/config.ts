import { type NextApiRequest } from 'next';

export const CRON_SECRET = process.env.CRON_SECRET;

export function validateCronRequest(req: NextApiRequest) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !CRON_SECRET) {
    return false;
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return false;
  }

  return token === CRON_SECRET;
}

export const CRON_SCHEDULES = {
  FLYERS: '0 */6 * * *', // Every 6 hours
  MEAL_PLAN: '0 0 * * *', // Daily at midnight
} as const; 