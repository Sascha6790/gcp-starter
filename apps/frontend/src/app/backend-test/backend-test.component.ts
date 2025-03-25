import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackendTestService, TestResponse } from './backend-test.service';
import { EnvironmentStateService } from '../core/environment-state.service';

@Component({
  selector: 'app-backend-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="backend-test-container">
      <h2>Backend Connection Test</h2>
      
      <div *ngIf="loading" class="loading">
        Loading...
      </div>
      
      <div *ngIf="error" class="error">
        Error connecting to backend: {{ error }}
      </div>
      
      <div *ngIf="testResponse && !loading" class="success">
        <p>{{ testResponse.message }}</p>
        <p class="timestamp">Timestamp: {{ testResponse.timestamp | date:'medium' }}</p>
        
        <div *ngIf="testResponse.environment" class="environment-info">
          <h3>Backend Environment Information</h3>
          <p>Production Mode: {{ testResponse.environment.production ? 'Yes' : 'No' }}</p>
          <p>Frontend URL set in Backend: {{ testResponse.environment.frontendUrl }}</p>
        </div>
        
        <div class="environment-info">
          <h3>Frontend Environment Information</h3>
          <p>Backend API URL: {{ environment.BACKEND_API_URL }}</p>
          <p>NODE_ENV: {{ environment.NODE_ENV }}</p>
        </div>
      </div>
      
      <button (click)="testBackend()" [disabled]="loading">
        Test Backend Connection
      </button>
    </div>
  `,
  styles: [`
    .backend-test-container {
      margin: 20px;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 5px;
      max-width: 500px;
    }
    
    h2 {
      color: #333;
    }
    
    .loading {
      color: #666;
      margin: 10px 0;
    }
    
    .error {
      color: #d32f2f;
      margin: 10px 0;
      padding: 10px;
      background-color: #ffebee;
      border-radius: 4px;
    }
    
    .success {
      color: #388e3c;
      margin: 10px 0;
      padding: 10px;
      background-color: #e8f5e9;
      border-radius: 4px;
    }
    
    .timestamp {
      font-size: 0.8em;
      color: #666;
    }
    
    button {
      margin-top: 10px;
      padding: 8px 16px;
      background-color: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    
    .environment-info {
      margin-top: 10px;
      padding: 10px;
      background-color: #e3f2fd;
      border-radius: 4px;
    }
    
    .environment-info h3 {
      margin-top: 0;
      color: #0d47a1;
      font-size: 16px;
    }
    
    .environment-info p {
      margin: 5px 0;
      font-size: 14px;
    }
  `]
})
export class BackendTestComponent implements OnInit {
  private backendTestService = inject(BackendTestService);
  private envService = inject(EnvironmentStateService);
  
  testResponse: TestResponse | null = null;
  loading = false;
  error: string | null = null;
  
  // Expose environment config for the template
  get environment() {
    return this.envService.entireConfig;
  }
  
  ngOnInit(): void {
    // Automatically test the backend on component initialization
    this.testBackend();
  }
  
  testBackend(): void {
    this.loading = true;
    this.error = null;
    this.testResponse = null;
    
    this.backendTestService.getTestMessage().subscribe({
      next: (response) => {
        this.testResponse = response;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Unknown error occurred';
        this.loading = false;
      }
    });
  }
}
