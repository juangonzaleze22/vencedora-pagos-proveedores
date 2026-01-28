import { Component, Input, signal, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageModule } from 'primeng/image';

@Component({
  selector: 'app-lazy-image',
  standalone: true,
  imports: [CommonModule, ImageModule],
  templateUrl: './lazy-image.html',
  styleUrl: './lazy-image.scss'
})
export class LazyImage implements AfterViewInit, OnDestroy {
  @Input() src?: string | null;
  @Input() alt: string = 'Imagen';
  @Input() width: string = '100%';
  @Input() height: string = '100%';
  @Input() objectFit: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down' = 'cover';
  @Input() rounded: boolean = true;
  @Input() preview: boolean = false;

  @ViewChild('imageContainer', { static: false }) imageContainer?: ElementRef;
  @ViewChild('hiddenImage', { static: false }) hiddenImage?: ElementRef<HTMLImageElement>;

  imageError = signal(false);
  imageLoaded = signal(false);
  shouldLoad = signal(false);
  private observer?: IntersectionObserver;
  private hasLoaded = false;

  ngAfterViewInit() {
    // Usar Intersection Observer para lazy loading
    if ('IntersectionObserver' in window && this.imageContainer) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.hasLoaded) {
            this.shouldLoad.set(true);
            this.hasLoaded = true;
            this.observer?.disconnect();
          }
        });
      }, {
        rootMargin: '50px' // Cargar 50px antes de que sea visible
      });
      
      this.observer.observe(this.imageContainer.nativeElement);
    } else {
      // Fallback: cargar inmediatamente si no hay soporte para IntersectionObserver
      this.shouldLoad.set(true);
      this.hasLoaded = true;
    }
  }

  onImageError() {
    this.imageError.set(true);
    this.imageLoaded.set(false);
  }

  onImageLoad() {
    this.imageError.set(false);
    this.imageLoaded.set(true);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  get hasValidSrc(): boolean {
    return !!this.src && !this.imageError();
  }

  get imageSrc(): string | undefined {
    // Solo retornar el src si debe cargarse (lazy loading)
    return this.shouldLoad() && this.hasValidSrc ? this.src! : undefined;
  }

  get imageClass(): string {
    const classes = ['transition-opacity duration-300'];
    if (this.rounded) {
      classes.push('rounded');
    }
    if (this.objectFit === 'cover') {
      classes.push('object-cover');
    } else if (this.objectFit === 'contain') {
      classes.push('object-contain');
    }
    return classes.join(' ');
  }

  get styleClass(): string {
    const classes = ['w-full h-full'];
    if (this.rounded) {
      classes.push('rounded');
    }
    return classes.join(' ');
  }
}

