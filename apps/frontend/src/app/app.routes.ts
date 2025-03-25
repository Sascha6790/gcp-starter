import { Route } from '@angular/router';
import { BackendTestComponent } from './backend-test/backend-test.component';

export const appRoutes: Route[] = [
  {
    path: 'backend-test',
    component: BackendTestComponent
  },
  {
    path: '',
    redirectTo: 'backend-test',
    pathMatch: 'full'
  }
];
