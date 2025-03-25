import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
  
  getTestMessage(): Observable<TestResponse> {
    const apiUrl = `${environment.apiUrl || ''}/api/test`;
    return this.http.get<TestResponse>(apiUrl);
  }
}
