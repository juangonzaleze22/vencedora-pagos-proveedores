import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-mobile-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mobile-bottom-nav.html',
  styleUrl: './mobile-bottom-nav.scss'
})
export class MobileBottomNav {
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-th-large', route: '/dashboard' },
    { label: 'Proveedores', icon: 'pi pi-users', route: '/providers/locate' },
    { label: 'Pagos', icon: 'pi pi-wallet', route: '/payments/register' },
    { label: 'Reportes', icon: 'pi pi-chart-bar', route: '/reports/detailed' },
    { label: 'Cierre', icon: 'pi pi-calculator', route: '/cashier-close' }
  ];

  constructor(private router: Router) {}

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }
}
