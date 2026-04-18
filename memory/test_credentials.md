# Test credentials (local dev / seed data)

Seeded via `npm run db:seed:demo` after replica-set migration.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@texplore.in` | `Admin@12345` |
| President | `president@texplore-amity.com` | `Pres@12345` |
| Vice President | `vp@texplore-amity.com` | `Vp@12345` |
| Coordinator | `coordinator@texplore-amity.com` | `Coord@12345` |
| Member | `member@texplore-amity.com` | `Member@12345` |

Notes:
- MongoDB runs as a replica set (`rs0`) because Prisma requires transactions. Connection string in `.env`:
  `mongodb://localhost:27017/texplore?replicaSet=rs0&directConnection=true`
- All roles have `about:self:update` permission, so every logged-in user can open `/admin/about/my-profile` — the page auto-creates a blank `AboutMember` with `isPublished: false` so nothing appears on the public `/about` until the user explicitly enables "Show on the public About page".
