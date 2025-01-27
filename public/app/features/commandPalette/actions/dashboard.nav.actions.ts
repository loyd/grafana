import { locationService, getBackendSrv } from '@grafana/runtime';
import { Action } from 'kbar';

async function getDashboardNav(parentId: string): Promise<Action[]> {
  const data: Array<{ type: string; title: string; url: string }> = await getBackendSrv().get('/api/search');

  const goToDashboardActions: Action[] = data
    .filter((item) => item.type === 'dash-db')
    .map((item) => ({
      parent: parentId,
      id: `go/dashboard/${item.url}`,
      name: `Go to dashboard ${item.title}`,
      perform: () => {
        locationService.push(item.url);
      },
    }));

  return goToDashboardActions;
}

export default async (parentId: string) => {
  const dashboardNav = await getDashboardNav(parentId);
  return dashboardNav;
};
