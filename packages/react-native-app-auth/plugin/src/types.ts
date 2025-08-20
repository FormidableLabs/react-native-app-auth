import { ConfigPlugin } from '@expo/config-plugins';

export interface AppAuthProps {
  redirectUrls?: string[];
  ios?: {
    urlScheme?: string;
  };
  android?: {
    appAuthRedirectScheme?: string;
  };
}

export type AppAuthConfigPlugin = ConfigPlugin<AppAuthProps | undefined>;