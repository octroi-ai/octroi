class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787/api";

class ApiClient {
  private apiKey: string | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { "X-Octroi-Key": this.apiKey } : {}),
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: { code: "NETWORK", message: "Network error" } }));
      throw new ApiError(res.status, body.error?.code || "UNKNOWN", body.error?.message || "Request failed");
    }
    return res.json();
  }

  analytics = {
    getUsage: (params?: { from?: string; to?: string; project_id?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return this.request<{ data: any[]; period: { from: string; to: string } }>(`/v1/analytics/usage${qs ? `?${qs}` : ""}`);
    },
    getSavings: (params?: { from?: string; to?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return this.request<{ savings: any; period: { from: string; to: string } }>(`/v1/analytics/savings${qs ? `?${qs}` : ""}`);
    },
  };

  esg = {
    getFootprint: (params?: { from?: string; to?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return this.request<{ footprint: any; period: { from: string; to: string } }>(`/v1/esg/footprint${qs ? `?${qs}` : ""}`);
    },
    generateCertificate: (data: { period_start: string; period_end: string }) =>
      this.request<{ certificate: any }>(`/v1/esg/certificate`, { method: "POST", body: JSON.stringify(data) }),
  };

  compliance = {
    getStatus: () =>
      this.request<{ score: number; total_systems: number; compliant_systems: number; systems: any[] }>(`/v1/compliance/status`),
    runAudit: (systemId: string) =>
      this.request<any>(`/v1/compliance/audit`, { method: "POST", body: JSON.stringify({ system_id: systemId }) }),
  };

  broker = {
    getPrices: () => this.request<{ prices: any[] }>(`/v1/broker/prices`),
    getProviders: () => this.request<{ providers: any[]; count: number }>(`/v1/broker/providers?full=1`),
    addProvider: (def: any) =>
      this.request<{ provider: any }>(`/v1/broker/providers`, { method: "POST", body: JSON.stringify(def) }),
    updateRules: (rules: any[]) =>
      this.request<{ rules: any[] }>(`/v1/broker/rules`, { method: "PUT", body: JSON.stringify({ rules }) }),
  };
}

export const apiClient = new ApiClient();

// Dev convenience: authenticate automatically with a local dev key when provided.
const devKey = process.env.NEXT_PUBLIC_DEV_API_KEY;
if (devKey) apiClient.setApiKey(devKey);

export { ApiError };
