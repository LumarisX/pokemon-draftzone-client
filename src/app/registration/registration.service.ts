import { Injectable } from "@angular/core";
import { ApiService } from "../api/api.service";

@Injectable({
    providedIn: 'root'
})

export class RegistrationService {

    constructor(private api: ApiService) { }

    newUser(userData: any) {
        return this.api.post(`users/`, userData)
    }

}