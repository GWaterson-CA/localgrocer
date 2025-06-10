import { initTRPC } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getServerSession } from 'next-auth';
import { prisma } from '@/server/db';
import { authOptions } from '@/server/auth';

type CreateContextOptions = {
  session: Awaited<ReturnType<typeof getServerSession>>;
};

const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
  };
};

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;
  const session = await getServerSession(req, res, authOptions);

  return createInnerTRPCContext({
    session,
  });
};

const t = initTRPC.context<typeof createTRPCContext>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure; 