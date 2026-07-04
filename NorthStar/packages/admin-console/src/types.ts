import type { IdentityUser, SiteContext } from "@ns/shared";

export interface AdminSession {
  token: string;
  user: IdentityUser;
}

export interface PageProps {
  site: SiteContext;
  token: string;
}
