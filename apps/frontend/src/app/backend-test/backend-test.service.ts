import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnvironmentStateService } from '../core/environment-state.service';

export interface TestResponse {
  message: string;
  timestamp: string;
  environment?: {
    production: boolean;
    frontendUrl: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BackendTestService {
  private http = inject(HttpClient);
  private envState = inject(EnvironmentStateService);
  
  getTestMessage(): Observable<TestResponse> {
    const apiUrl = this.envState.backendApiUrl;
    return this.http.get<TestResponse>(`${apiUrl}/api/test`);
  }
}
