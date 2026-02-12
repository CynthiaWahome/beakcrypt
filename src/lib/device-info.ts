interface DeviceInfo {
  browser?: string;
  os?: string;
}

export function getDeviceInfo(): DeviceInfo {
  if (typeof navigator === "undefined") return {};

  const ua = navigator.userAgent;

  return {
    browser: parseBrowser(ua),
    os: parseOS(ua),
  };
}

function parseBrowser(ua: string): string | undefined {
  const edge = ua.match(/Edg(?:e|A|iOS)?\/(\d+)/);
  if (edge) return `Edge ${edge[1]}`;

  const firefox = ua.match(/Firefox\/(\d+)/);
  if (firefox) return `Firefox ${firefox[1]}`;

  const samsung = ua.match(/SamsungBrowser\/(\d+)/);
  if (samsung) return `Samsung Internet ${samsung[1]}`;

  const opera = ua.match(/OPR\/(\d+)/);
  if (opera) return `Opera ${opera[1]}`;

  const chrome = ua.match(/Chrome\/(\d+)/);
  if (chrome) return `Chrome ${chrome[1]}`;

  const safari = ua.match(/Version\/(\d+(?:\.\d+)?).*Safari/);
  if (safari) return `Safari ${safari[1]}`;

  return undefined;
}

function parseOS(ua: string): string | undefined {
  const ios = ua.match(/(?:iPhone|iPad|iPod).*OS (\d+[_\.]\d+)/);
  if (ios) return `iOS ${ios[1].replace(/_/g, ".")}`;

  const android = ua.match(/Android (\d+(?:\.\d+)?)/);
  if (android) return `Android ${android[1]}`;

  const mac = ua.match(/Mac OS X (\d+[_\.]\d+(?:[_\.]\d+)?)/);
  if (mac) return `macOS ${mac[1].replace(/_/g, ".")}`;

  if (ua.includes("Windows NT 10.0")) return "Windows 10+";
  if (ua.includes("Windows NT 6.3")) return "Windows 8.1";
  if (ua.includes("Windows NT 6.1")) return "Windows 7";
  if (ua.includes("Windows")) return "Windows";

  if (ua.includes("Linux")) return "Linux";

  if (ua.includes("CrOS")) return "ChromeOS";

  return undefined;
}
