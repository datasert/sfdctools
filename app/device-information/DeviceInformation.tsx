"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { SetPageTitle } from "@/components/SetPageTitle";

interface DeviceInfo {
  browser: {
    name: string;
    version: string;
    userAgent: string;
    vendor: string;
    language: string;
    languages: string[];
    cookieEnabled: boolean;
    onLine: boolean;
  };
  device: {
    platform: string;
    chipset?: string;
    hardwareConcurrency: number;
    maxTouchPoints: number;
    timezone: string;
    timezoneOffset: number;
  };
  screen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelDepth: number;
    orientation?: string;
  };
  network: {
    connectionType?: string;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  externalIP?: string;
  ipError?: string;
}

function getBrowserInfo(): DeviceInfo["browser"] {
  const ua = navigator.userAgent;
  let browserName = "Unknown";
  let browserVersion = "Unknown";

  // Detect browser
  if (ua.includes("Chrome") && !ua.includes("Edg")) {
    browserName = "Chrome";
    const match = ua.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  } else if (ua.includes("Firefox")) {
    browserName = "Firefox";
    const match = ua.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
    browserName = "Safari";
    const match = ua.match(/Version\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  } else if (ua.includes("Edg")) {
    browserName = "Edge";
    const match = ua.match(/Edg\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  }

  return {
    name: browserName,
    version: browserVersion,
    userAgent: ua,
    vendor: navigator.vendor || "Unknown",
    language: navigator.language,
    languages: Array.from(navigator.languages || []),
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
  };
}

function getPlatformLabel(): string {
  const uaData = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };

  if (uaData.userAgentData?.platform) {
    return uaData.userAgentData.platform;
  }

  const platform = navigator.platform || "Unknown";

  if (platform === "MacIntel" || platform === "MacPPC" || platform === "Mac68K") {
    return "macOS";
  }
  if (platform === "Win32" || platform === "Win64") {
    return "Windows";
  }
  if (platform.includes("Linux")) {
    return "Linux";
  }
  if (/iPhone|iPad|iPod/.test(platform)) {
    return "iOS";
  }

  return platform;
}

function getAppleChipset(): string | undefined {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return undefined;

    const webGl = gl as WebGLRenderingContext;
    const debugInfo = webGl.getExtension("WEBGL_debug_renderer_info") as
      | { UNMASKED_RENDERER_WEBGL: number }
      | null;
    if (!debugInfo) return undefined;

    const renderer = String(webGl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "");
    const match = renderer.match(/Apple M\d(?:\s*(?:Pro|Max|Ultra))?/i);
    return match ? match[0] : undefined;
  } catch {
    return undefined;
  }
}

function getDeviceInfo(): DeviceInfo["device"] {
  const platform = getPlatformLabel();
  const chipset = platform === "macOS" ? getAppleChipset() : undefined;

  return {
    platform,
    chipset,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
  };
}

function getScreenInfo(): DeviceInfo["screen"] {
  const info: DeviceInfo["screen"] = {
    width: window.screen.width,
    height: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight,
    colorDepth: window.screen.colorDepth,
    pixelDepth: window.screen.pixelDepth,
  };

  // Get orientation if available
  if (window.screen.orientation) {
    info.orientation = window.screen.orientation.type;
  } else if ((window.screen as any).orientation) {
    info.orientation = (window.screen as any).orientation;
  }

  return info;
}

function getNetworkInfo(): DeviceInfo["network"] {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (connection) {
    return {
      connectionType: connection.type || connection.effectiveType,
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
    };
  }

  return {};
}

async function getExternalIP(): Promise<{ ip?: string; error?: string }> {
  try {
    // Try multiple IP services
    const services = [
      "https://api.ipify.org?format=json",
      "https://api64.ipify.org?format=json",
      "https://ipapi.co/json/",
    ];

    for (const service of services) {
      try {
        const response = await fetch(service, { 
          method: "GET",
          headers: { "Accept": "application/json" },
        });
        if (response.ok) {
          const data = await response.json();
          return { ip: data.ip || data.query || data.ip_address };
        }
      } catch (e) {
        // Try next service
        continue;
      }
    }

    return { error: "Unable to fetch external IP from available services" };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { error: errorMessage };
  }
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-[var(--content-border)] bg-[var(--content-color)] p-4">
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | boolean | string[] }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-sm font-medium text-[var(--text-primary)] min-w-[140px]">{label}:</div>
      <div className="text-sm text-[var(--text-secondary)] flex-1 break-all">
        {Array.isArray(value) ? (
          <div className="space-y-1">
            {value.map((item, idx) => (
              <div key={idx} className="font-mono">{item}</div>
            ))}
          </div>
        ) : typeof value === "boolean" ? (
          <span className="font-mono">{value ? "Yes" : "No"}</span>
        ) : (
          <span className="font-mono">{String(value)}</span>
        )}
      </div>
    </div>
  );
}

export function DeviceInformation() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [loadingIP, setLoadingIP] = useState(true);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    const info: DeviceInfo = {
      browser: getBrowserInfo(),
      device: getDeviceInfo(),
      screen: getScreenInfo(),
      network: getNetworkInfo(),
    };

    setDeviceInfo(info);

    // Fetch external IP
    getExternalIP().then((result) => {
      setDeviceInfo((prev) => ({
        ...prev!,
        externalIP: result.ip,
        ipError: result.error,
      }));
      setLoadingIP(false);
    });
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
  };

  if (!deviceInfo) {
    return (
      <div className="p-6">
        <div className="text-center text-[var(--text-secondary)]">Loading device information...</div>
      </div>
    );
  }

  return (
    <>
      {ToastComponent}
      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Browser Information */}
          <InfoCard title="Browser Information">
            <InfoRow label="Name" value={deviceInfo.browser.name} />
            <InfoRow label="Version" value={deviceInfo.browser.version} />
            <InfoRow label="Vendor" value={deviceInfo.browser.vendor} />
            <InfoRow label="Language" value={deviceInfo.browser.language} />
            <InfoRow label="Languages" value={deviceInfo.browser.languages} />
            <InfoRow label="Cookies Enabled" value={deviceInfo.browser.cookieEnabled} />
            <InfoRow label="Online" value={deviceInfo.browser.onLine} />
            <div className="pt-2 border-t border-[var(--content-border)]">
              <div className="flex items-start gap-3">
                <div className="text-sm font-medium text-[var(--text-primary)] min-w-[140px]">User Agent:</div>
                <div 
                  className="text-xs text-[var(--text-secondary)] font-mono flex-1 break-all cursor-pointer hover:text-[var(--accent-color)] transition-colors"
                  onClick={() => copyToClipboard(deviceInfo.browser.userAgent)}
                  title="Click to copy"
                >
                  {deviceInfo.browser.userAgent}
                </div>
              </div>
            </div>
          </InfoCard>

          {/* Device Information */}
          <InfoCard title="Device Information">
            <InfoRow label="Platform" value={deviceInfo.device.platform} />
            {deviceInfo.device.chipset && (
              <InfoRow label="Chipset" value={deviceInfo.device.chipset} />
            )}
            <InfoRow label="CPU Cores" value={deviceInfo.device.hardwareConcurrency} />
            <InfoRow label="Max Touch Points" value={deviceInfo.device.maxTouchPoints} />
            <InfoRow label="Timezone" value={deviceInfo.device.timezone} />
            <InfoRow 
              label="Timezone Offset" 
              value={`${deviceInfo.device.timezoneOffset} minutes (${deviceInfo.device.timezoneOffset > 0 ? '-' : '+'}${Math.abs(deviceInfo.device.timezoneOffset / 60)} hours)`} 
            />
          </InfoCard>

          {/* Screen Information */}
          <InfoCard title="Screen Information">
            <InfoRow label="Width" value={`${deviceInfo.screen.width}px`} />
            <InfoRow label="Height" value={`${deviceInfo.screen.height}px`} />
            <InfoRow label="Available Width" value={`${deviceInfo.screen.availWidth}px`} />
            <InfoRow label="Available Height" value={`${deviceInfo.screen.availHeight}px`} />
            <InfoRow label="Color Depth" value={`${deviceInfo.screen.colorDepth} bits`} />
            <InfoRow label="Pixel Depth" value={`${deviceInfo.screen.pixelDepth} bits`} />
            {deviceInfo.screen.orientation && (
              <InfoRow label="Orientation" value={deviceInfo.screen.orientation} />
            )}
          </InfoCard>

          {/* Network & IP Information */}
          <InfoCard title="Network & IP Information">
            {deviceInfo.network.connectionType && (
              <InfoRow label="Connection Type" value={deviceInfo.network.connectionType} />
            )}
            {deviceInfo.network.effectiveType && (
              <InfoRow label="Effective Type" value={deviceInfo.network.effectiveType} />
            )}
            {deviceInfo.network.downlink !== undefined && (
              <InfoRow label="Downlink" value={`${deviceInfo.network.downlink} Mbps`} />
            )}
            {deviceInfo.network.rtt !== undefined && (
              <InfoRow label="RTT" value={`${deviceInfo.network.rtt} ms`} />
            )}
            <div className="pt-2 border-t border-[var(--content-border)]">
              <div className="flex items-start gap-3">
                <div className="text-sm font-medium text-[var(--text-primary)] min-w-[140px]">External IP:</div>
                <div className="text-sm text-[var(--text-secondary)] flex-1">
                  {loadingIP ? (
                    <span className="text-[var(--text-tertiary)]">Loading...</span>
                  ) : deviceInfo.externalIP ? (
                    <span 
                      className="font-mono cursor-pointer hover:text-[var(--accent-color)] transition-colors"
                      onClick={() => copyToClipboard(deviceInfo.externalIP!)}
                      title="Click to copy"
                    >
                      {deviceInfo.externalIP}
                    </span>
                  ) : deviceInfo.ipError ? (
                    <span className="text-red-500 text-xs">{deviceInfo.ipError}</span>
                  ) : (
                    <span className="text-[var(--text-tertiary)]">Not available</span>
                  )}
                </div>
              </div>
            </div>
          </InfoCard>
        </div>
      </div>
    </>
  );
}
