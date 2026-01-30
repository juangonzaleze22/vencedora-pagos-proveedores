import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthContext } from '../../../../contexts/auth.context';
import { ThemeService } from '../../../../shared/services/theme.service';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-app-header',
  standalone: true,
  imports: [CommonModule, AvatarModule, BadgeModule, MenuModule, TooltipModule],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss'
})
export class AppHeader {
  @Input() title: string = 'Dashboard';
  @Input() subtitle?: string;

  constructor(
    public authContext: AuthContext,
    public themeService: ThemeService
  ) {}

  get userName(): string {
    return this.authContext.currentUser()?.name || 'Usuario';
  }

  get userInitials(): string {
    const name = this.userName;
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getProfileMenuItems(): MenuItem[] {
    const isDark = this.themeService.isDark();
    return [
      {
        label: isDark ? 'Tema claro' : 'Tema oscuro',
        icon: isDark ? 'pi pi-sun' : 'pi pi-moon',
        command: () => this.themeService.toggleTheme()
      },
      { separator: true },
      {
        label: 'Cerrar sesión',
        icon: 'pi pi-sign-out',
        styleClass: 'text-red-600',
        command: () => this.logout()
      }
    ];
  }

  logout(): void {
    this.authContext.logout();
  }
}
