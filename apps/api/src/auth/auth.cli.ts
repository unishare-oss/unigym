import 'dotenv/config';
import { PrismaService } from '../db/prisma.service.js';
import { createAuth } from './auth.factory.js';

// Used by the Better Auth CLI to generate the Prisma schema. Runtime uses
// Nest's single PrismaService instance instead.
export default createAuth(new PrismaService());
