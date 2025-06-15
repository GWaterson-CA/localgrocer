import { initTRPC } from '@trpc/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/server/db';
import { authOptions } from '@/server/auth';

// NOTE: We support both Next.js "pages" (req/res) and App Router (edge Request) environments.
// When called from the App Router we will be provided a `session` directly, otherwise we fall back
// to deriving it via `getServerSession`.

// The input type can therefore be either the classic `{ req, res }` pair or `{ session }`.

type ContextParam =
  | {
      /** App Router – the session has already been resolved */
      session: Awaited<ReturnType<typeof getServerSession>>;
    }
  | {
      /** Pages Router – we have access to req / res objects */
      req: any;
      res: any;
    };

const createInnerTRPCContext = (opts: { session: Awaited<ReturnType<typeof getServerSession>> }) => {
  return {
    session: opts.session,
    prisma,
  };
};

export const createTRPCContext = async (opts: ContextParam) => {
  if ('session' in opts) {
    // App Router path – session is provided
    return createInnerTRPCContext({ session: opts.session });
  }

  // Pages Router / fallback – resolve session from req/res
  const session = await getServerSession(opts.req as any, opts.res as any, authOptions);
  return createInnerTRPCContext({ session });
};

const t = initTRPC.context<typeof createTRPCContext>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure; 