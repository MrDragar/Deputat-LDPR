// services/api.ts (в микрофронтенде)
export interface LDPRReport {
  user_id: number;
  data: any; // Ваша FormData
}

export interface PdfResponse {
  status: string;
  message: string; // URL к PDF файлу
}

class ReportApiService {
  private baseURL = 'https://депутатлдпр.рф';

  private getAuthToken(): string | null {
    // Пробуем получить токен из хоста или localStorage
    try {
      const hostToken = (window as any).__HOST_AUTH_TOKEN__;
      return hostToken || localStorage.getItem('authToken');
    } catch {
      return localStorage.getItem('authToken');
    }
  }

  private getHeaders() {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async createPdfReport(reportData: LDPRReport): Promise<PdfResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/reports/`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Ошибка при создании PDF:', error);
      throw error;
    }
  }

  // Метод для скачивания PDF по URL
  async downloadPdf(pdfUrl: string, filename?: string): Promise<void> {
    try {
      const token = this.getAuthToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(pdfUrl, { headers });
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки PDF: ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || `report_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      console.error('Ошибка при скачивании PDF:', error);
      throw error;
    }
  }

  setHostToken(token: string) {
    (window as any).__HOST_AUTH_TOKEN__ = token;
  }
}

export const reportApi = new ReportApiService();