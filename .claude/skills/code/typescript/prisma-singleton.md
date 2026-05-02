# Prisma client singleton

Use the singleton from `src/server/db.ts`, not `new PrismaClient()` directly:

```ts
import { db } from "../../src/server/db";
```
