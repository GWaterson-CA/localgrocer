import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { type NextRequest } from 'next/server';
import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';

const handler = async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  const context = await createTRPCContext({ session });

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => context,
  });
};

export { handler as GET, handler as POST }; 