import { Component, Input, Output, EventEmitter, signal, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import { ImageModule } from 'primeng/image';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LazyImage } from '../lazy-image/lazy-image';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, FileUploadModule, ImageModule, ButtonModule, TooltipModule, ToastModule, LazyImage],
  providers: [MessageService],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss'
})
export class FileUploadComponent implements OnChanges {
  @Input() accept: string = 'image/*,.pdf';
  @Input() maxFileSize: number = 5000000; // 5MB
  @Input() multiple: boolean = false;
  @Input() existingImageUrl?: string; // URL de imagen existente (para modo edición)
  @Output() fileSelect = new EventEmitter<File[]>();

  @ViewChild('fileUpload') fileUploadComponent?: FileUpload;

  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  isImage = signal<boolean>(false);
  hasExistingImage = signal<boolean>(false);
  imageExplicitlyRemoved = signal<boolean>(false);

  constructor(private messageService: MessageService) {}

  ngOnChanges(changes: SimpleChanges) {
    // Si el usuario eliminó explícitamente la imagen, no restaurarla a menos que cambie el input
    if (this.imageExplicitlyRemoved() && changes['existingImageUrl']?.previousValue === changes['existingImageUrl']?.currentValue) {
      return;
    }
    
    // Si el input cambió a null/undefined, resetear el flag de eliminación
    if (changes['existingImageUrl'] && !this.existingImageUrl) {
      this.imageExplicitlyRemoved.set(false);
    }
    
    // Si hay una URL de imagen existente, mostrarla
    if (changes['existingImageUrl'] && this.existingImageUrl && !this.selectedFile() && !this.imageExplicitlyRemoved()) {
      this.hasExistingImage.set(true);
      // Usar la URL directamente (el componente lazy-image manejará la construcción si es necesario)
      this.previewUrl.set(this.existingImageUrl);
      
      // Intentar detectar si es imagen - por defecto asumir que es imagen a menos que sea claramente PDF
      const urlLower = this.existingImageUrl.toLowerCase();
      const isPdf = urlLower.includes('.pdf') || urlLower.includes('/pdf/');
      
      // Si no es claramente un PDF, mostrar como imagen
      // El componente lazy-image manejará el error si no es una imagen válida
      this.isImage.set(!isPdf);
    } else if (!this.existingImageUrl && !this.selectedFile()) {
      this.hasExistingImage.set(false);
      this.previewUrl.set(null);
    }
  }

  onFileSelect(event: any) {
    const files: File[] = event.files;

    if (files && files.length > 0) {
      const file = files[0];

      // Guardar el archivo directamente
      this.selectedFile.set(file);
      // Cuando se selecciona un nuevo archivo, ya no hay imagen existente
      this.hasExistingImage.set(false);
      // Resetear el flag de eliminación ya que se seleccionó un nuevo archivo
      this.imageExplicitlyRemoved.set(false);
      
      // Verificar si es imagen
      if (file.type.startsWith('image/')) {
        this.isImage.set(true);
        // Crear URL de preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrl.set(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        this.isImage.set(false);
        this.previewUrl.set(null);
      }

      this.fileSelect.emit([...files]);
    }
  }

  /**
   * Obtiene el archivo seleccionado actual
   */
  getSelectedFile(): File | null {
    return this.selectedFile();
  }

  onError(event: any) {
    let errorMessage = 'Error al subir el archivo';
    
    if (event.error) {
      // Traducir mensajes de error comunes de PrimeNG
      const error = event.error.toString().toLowerCase();
      if (error.includes('file size')) {
        errorMessage = 'El archivo es demasiado grande. Tamaño máximo: 5MB';
      } else if (error.includes('file type') || error.includes('invalid file type')) {
        errorMessage = 'Tipo de archivo no válido. Solo se permiten PNG, JPG y PDF';
      } else {
        errorMessage = event.error;
      }
    }
    
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage
    });
  }

  onRemove() {
    // Limpiar completamente todo
    this.selectedFile.set(null);
    this.hasExistingImage.set(false);
    this.previewUrl.set(null);
    this.isImage.set(false);
    // Marcar que la imagen fue eliminada explícitamente
    this.imageExplicitlyRemoved.set(true);
    
    // Limpiar el componente de PrimeNG si existe
    if (this.fileUploadComponent) {
      this.fileUploadComponent.clear();
    }
    
    // Emitir evento vacío para indicar que se eliminó
    this.fileSelect.emit([]);
  }

  clear() {
    this.selectedFile.set(null);
    this.hasExistingImage.set(false);
    this.previewUrl.set(null);
    this.isImage.set(false);
    this.imageExplicitlyRemoved.set(false);
    
    // Limpiar el componente de PrimeNG si existe
    if (this.fileUploadComponent) {
      this.fileUploadComponent.clear();
    }
    this.fileSelect.emit([]);
  }

  getFileName(): string {
    const file = this.selectedFile();
    return file ? file.name : '';
  }

  getFileSize(): string {
    const file = this.selectedFile();
    if (!file) return '';
    const sizeInMB = file.size / (1024 * 1024);
    return sizeInMB.toFixed(2) + ' MB';
  }
}
