import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Settings } from '../pages/settings/settings.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SettingApiService {
  private apiService = inject(ApiService);


  getSettings() {
    return this.apiService.get<Settings | null>(`user/settings`, true);
  }

  updateSettings(settingData: Partial<Settings>) {
    console.log(settingData);
    return this.apiService.patch(`user/settings`, settingData);
  }
}
