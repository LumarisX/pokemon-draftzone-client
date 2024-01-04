import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private apiService: ApiService) { }

  getUsers() {
    return (this.apiService.get("users"))
  }

  getDraftById(teamId: string) {
    return this.apiService.get(`users/lumaris/${teamId}`);
  }
}
