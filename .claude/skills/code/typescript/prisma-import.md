# Prisma client import

The generated client lives at a non-standard path. Always import from:

```ts
import { ... } from "@prisma/client-generated";
```

Never use `@prisma/client`.
