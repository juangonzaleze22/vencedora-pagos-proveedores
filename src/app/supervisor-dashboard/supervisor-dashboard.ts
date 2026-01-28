import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppHeader } from '../shared/components/layout/app-header/app-header';
import { PageContainer } from '../shared/components/layout/page-container/page-container';
import { StatCard } from '../shared/components/ui/stat-card/stat-card';
import { ActionCard } from '../shared/components/ui/action-card/action-card';
import { ReportService } from '../shared/services/report.service';
import { DashboardStats } from '../shared/services/report.service';

@Component({
  selector: 'app-supervisor-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    AppHeader,
    PageContainer,
    StatCard,
    ActionCard
  ],
  templateUrl: './supervisor-dashboard.html',
  styleUrl: './supervisor-dashboard.scss',
  standalone: true,
})
export class SupervisorDashboard {
  private _stats = signal<DashboardStats | null>(null);
  private _loading = signal<boolean>(false);

  readonly stats = this._stats.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor(private reportService: ReportService) {
    this.loadDashboard();
  }

  private loadDashboard() {
    this._loading.set(true);
    this.reportService.getDashboard().subscribe({
      next: (data) => {
        this._stats.set(data);
        this._loading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this._loading.set(false);
      }
    });
  }

  get statsValue() {
    return this._stats() || {
      pendingPayments: 0,
      processedPayments: 0,
      totalSuppliers: 0,
      totalDebt: 0
    };
  }
}
