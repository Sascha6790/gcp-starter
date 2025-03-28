import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { EnvironmentStateService } from '../core/environment-state.service';

interface Item {
  id: number;
  name: string;
  description: string;
  completed: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss']
})
export class ItemsComponent implements OnInit {
  items: Item[] = [];
  itemForm: FormGroup;
  loading = false;
  error: string | null = null;
  editingItem: Item | null = null;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private envService: EnvironmentStateService
  ) {
    this.itemForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      completed: [false]
    });
  }

  ngOnInit(): void {
    this.loadItems();
  }

  private getApiUrl(path: string): string {
    return `${this.envService.backendApiUrl}${path}`;
  }

  loadItems(): void {
    this.loading = true;
    this.error = null;
    
    this.http.get<Item[]>(this.getApiUrl('/api/items'))
      .subscribe({
        next: (items) => {
          this.items = items;
          this.loading = false;
        },
        error: (err) => {
          this.error = `Error loading items: ${err.message}`;
          this.loading = false;
        }
      });
  }

  onSubmit(): void {
    if (this.itemForm.invalid) return;
    
    this.loading = true;
    this.error = null;
    
    const formData = this.itemForm.value;
    
    if (this.editingItem) {
      // Update existing item
      this.http.put<Item>(this.getApiUrl(`/api/items/${this.editingItem.id}`), formData)
        .subscribe({
          next: (updatedItem) => {
            const index = this.items.findIndex(i => i.id === updatedItem.id);
            if (index !== -1) {
              this.items[index] = updatedItem;
            }
            this.resetForm();
            this.loading = false;
          },
          error: (err) => {
            this.error = `Error updating item: ${err.message}`;
            this.loading = false;
          }
        });
    } else {
      // Create new item
      this.http.post<Item>(this.getApiUrl('/api/items'), formData)
        .subscribe({
          next: (newItem) => {
            this.items.unshift(newItem);
            this.resetForm();
            this.loading = false;
          },
          error: (err) => {
            this.error = `Error creating item: ${err.message}`;
            this.loading = false;
          }
        });
    }
  }

  resetForm(): void {
    this.itemForm.reset({ name: '', description: '', completed: false });
    this.editingItem = null;
  }

  editItem(item: Item): void {
    this.editingItem = item;
    this.itemForm.setValue({
      name: item.name,
      description: item.description,
      completed: item.completed
    });
  }

  deleteItem(id: number): void {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    this.loading = true;
    this.http.delete(this.getApiUrl(`/api/items/${id}`))
      .subscribe({
        next: () => {
          this.items = this.items.filter(item => item.id !== id);
          this.loading = false;
          if (this.editingItem?.id === id) {
            this.resetForm();
          }
        },
        error: (err) => {
          this.error = `Error deleting item: ${err.message}`;
          this.loading = false;
        }
      });
  }

  toggleComplete(item: Item): void {
    this.http.patch<Item>(this.getApiUrl(`/api/items/${item.id}/toggle`), {})
      .subscribe({
        next: (updatedItem) => {
          const index = this.items.findIndex(i => i.id === updatedItem.id);
          if (index !== -1) {
            this.items[index] = updatedItem;
          }
        },
        error: (err) => {
          this.error = `Error toggling item status: ${err.message}`;
        }
      });
  }
}
