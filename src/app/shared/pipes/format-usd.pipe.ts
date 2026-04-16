import { Pipe, PipeTransform } from '@angular/core';
import { formatUsd } from '../utils/format-usd';

@Pipe({
  name: 'formatUsd',
  standalone: true
})
export class FormatUsdPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    return formatUsd(value);
  }
}
