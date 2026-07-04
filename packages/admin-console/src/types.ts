import type { IdentityUser, SiteContext } from "@dianzi/shared";

export interface AdminSession {
  token: string;
  user: IdentityUser;
}

export interface PageProps {
  site: SiteContext;
  token: string;
}
