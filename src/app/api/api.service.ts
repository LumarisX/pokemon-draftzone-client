import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})

export class ApiService {

    private serverUrl = "http://localhost:9960";

    httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json'
        })
    }

    constructor(private http: HttpClient) { }

    get(path: string) {
        return this.http.get(`${this.serverUrl}/${path}`)
    }

    post(path: string, data: any) {
        return this.http.post(`${this.serverUrl}/${path}`, data)
    }

    delete(path: string) {
        console.log(`${this.serverUrl}/${path}`)
        return this.http.delete(`${this.serverUrl}/${path}`)
    }
}