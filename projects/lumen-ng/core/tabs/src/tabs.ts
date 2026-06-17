/**
 * Tabs adapter over `@angular/aria` (Developer Preview).
 *
 * Architectural rule (de-risks RISK #1 — aria API churn): every `@angular/aria` touchpoint
 * is funneled through THIS one file. If aria's selectors/exports change between previews,
 * only this adapter changes — never the consumer's templates or the styled `helm` layer.
 *
 * signng does NOT re-author the accordion/tabs state machine; it inherits Google's
 * accessibility (roving focus, `aria-selected`, panel wiring) and adds the styled skin on top.
 *
 * Selectors provided (unchanged, from aria): `[ngTabs]`, `[ngTabList]`, `[ngTab]`,
 * `[ngTabPanel]`, `ng-template[ngTabContent]`. `[(selectedTab)]` lives on `[ngTabList]`.
 */
import { Tab, TabContent, TabList, TabPanel, Tabs } from '@angular/aria/tabs';

export {
  Tabs as SignngTabs,
  TabList as SignngTabList,
  Tab as SignngTab,
  TabPanel as SignngTabPanel,
  TabContent as SignngTabContent,
};

/** Single import barrel — pull the whole tabs primitive set into a standalone component. */
export const SIGNNG_TABS = [Tabs, TabList, Tab, TabPanel, TabContent] as const;
