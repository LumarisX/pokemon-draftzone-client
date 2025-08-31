import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../services/auth0.service';

@Component({
  selector: 'debug',
  imports: [CommonModule],
  templateUrl: './debug.component.html',
})
export class DebugComponent implements OnInit {
  private authService = inject(AuthService);


  debugData!: {
    browser: string;
    os: string;
    userAgent: string;
    screenResolution: string;
    localTimeWithZone: string;
    deviceType: string;
    memoryUsage: {
      jsHeapSizeLimit: any;
      totalJSHeapSize: any;
      usedJSHeapSize: any;
    };
    utcTime: string;
    loginId: string;
    localstorage: {
      planner: any;
    };
  };

  ngOnInit() {
    this.debugData = {
      browser: this.getBrowserInfo(),
      os: this.getOSInfo(),
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      localTimeWithZone: this.getLocalTimeWithZone(),
      deviceType: this.getDeviceType(),
      memoryUsage: this.getMemoryUsage(),
      utcTime: this.getUTCTime(),
      loginId: 'Not logged in',
      localstorage: {
        planner: this.getPlannerData(),
      },
    };
    this.getLoginId();
  }

  getBrowserInfo(): string {
    const agent = navigator.userAgent.toLowerCase();
    if (agent.includes('chrome')) return 'Chrome';
    if (agent.includes('firefox')) return 'Firefox';
    if (agent.includes('safari')) return 'Safari';
    if (agent.includes('msie') || agent.includes('trident'))
      return 'Internet Explorer';
    if (agent.includes('edge')) return 'Edge';
    return 'Unknown';
  }

  getOSInfo(): string {
    const agent = navigator.userAgent.toLowerCase();
    if (agent.includes('windows')) return 'Windows';
    if (agent.includes('mac')) return 'MacOS';
    if (agent.includes('linux')) return 'Linux';
    if (agent.includes('android')) return 'Android';
    if (agent.includes('iphone') || agent.includes('ipad')) return 'iOS';
    return 'Unknown';
  }

  getDeviceType(): string {
    const width = window.innerWidth;
    if (width <= 768) return 'Mobile';
    if (width <= 1024) return 'Tablet';
    return 'Desktop';
  }

  getMemoryUsage() {
    // Safely check if `performance.memory` exists and is accessible
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        jsHeapSizeLimit: memory?.jsHeapSizeLimit || 'N/A',
        totalJSHeapSize: memory?.totalJSHeapSize || 'N/A',
        usedJSHeapSize: memory?.usedJSHeapSize || 'N/A',
      };
    }

    // Return 'N/A' if `performance.memory` is not available
    return {
      jsHeapSizeLimit: 'N/A',
      totalJSHeapSize: 'N/A',
      usedJSHeapSize: 'N/A',
    };
  }

  getLocalTimeWithZone(): string {
    const now = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `${now.toLocaleString()} (${timeZone})`;
  }

  getUTCTime(): string {
    return new Date().toISOString();
  }

  getLoginId() {
    // Mock implementation. Replace with actual login ID retrieval logic.
    this.authService.user$.subscribe((data) => {
      if (!data) return;
      this.debugData.loginId = `${data.username} (${data.sub})`;
    });
  }

  getPlannerData(): string {
    return localStorage.getItem('plannerData') || 'Empty';
  }

  copyToClipboard(): void {
    const debugInfo = JSON.stringify(this.debugData, null, 2);
    navigator.clipboard.writeText(debugInfo).then(
      () => alert('Debugging info copied to clipboard!'),
      (err) => alert('Failed to copy debugging info.'),
    );
  }

  convertToMB(bytes: any): string {
    if (bytes === 'N/A') return 'N/A';
    return (bytes / (1024 * 1024)).toFixed(2);
  }

  downloadAsTxt(): void {
    const exportData = this.debugData;
    const debugInfo = JSON.stringify(exportData, null, 2);
    const blob = new Blob([debugInfo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'draftzone-debugging.txt';
    a.click();
    URL.revokeObjectURL(url);
  }
}
