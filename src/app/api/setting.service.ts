import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Settings } from '../pages/settings/settings.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SettingApiService {
  constructor(private apiService: ApiService) {}

  getSettings(): Observable<Settings | null> {
    return this.apiService.get(`user/settings`, true);
  }

  updateSettings(settingData: Partial<Settings>) {
    console.log(settingData);
    return this.apiService.patch(`user/settings`, settingData);
  }
}
