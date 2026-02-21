/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(tabs)` | `/(tabs)/` | `/(tabs)/albums` | `/(tabs)/cloud` | `/(tabs)/profile` | `/(tabs)/search` | `/(tabs)/sharing` | `/_sitemap` | `/about` | `/albums` | `/albums-select` | `/cloud` | `/data-safety` | `/disclaimer` | `/file-viewer` | `/permission-intro` | `/privacy-policy-intro` | `/privacy-policy-view` | `/profile` | `/search` | `/settings` | `/sharing`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
