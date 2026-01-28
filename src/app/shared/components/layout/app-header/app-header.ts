import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthContext } from '../../../../contexts/auth.context';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';

@Component({
  selector: 'app-app-header',
  standalone: true,
  imports: [CommonModule, ButtonModule, AvatarModule, BadgeModule],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss'
})
export class AppHeader {
  @Input() title: string = 'Dashboard';
  @Input() subtitle?: string;

  constructor(
    public authContext: AuthContext,
    private router: Router
  ) {}

  get userName(): string {
    return this.authContext.currentUser()?.name || 'Usuario';
  }

  get userInitials(): string {
    const name = this.userName;
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  onNotificationClick() {
    // TODO: Implementar notificaciones
  }

  onProfileClick() {
    // TODO: Implementar menú de perfil
  }
}
