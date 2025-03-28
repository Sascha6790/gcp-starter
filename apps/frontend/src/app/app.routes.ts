import { Route } from '@angular/router';
import { BackendTestComponent } from './backend-test/backend-test.component';
import { ItemsComponent } from './items/items.component';

export const appRoutes: Route[] = [
  {
    path: 'backend-test',
    component: BackendTestComponent
  },
  {
    path: 'items',
    component: ItemsComponent
  },
  {
    path: '',
    redirectTo: 'backend-test',
    pathMatch: 'full'
  }
];
