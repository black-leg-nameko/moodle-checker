import { getRawIPs } from './network';

// One-time bypass per tab when the user chooses "Proceed"
const bypassNextNavByTab = new Map<number, string>();

async function checkAndNavigate(tabId: number, url: string) {
  const result = await chrome.storage.sync.get(['campusIpPrefix']);
  const campusPrefix = result.campusIpPrefix as string | undefined;
  if (!campusPrefix) {
    const warningUrl = chrome.runtime.getURL(`warning.html?reason=not_configured&target=${encodeURIComponent(url)}`);
    await chrome.tabs.update(tabId, { url: warningUrl });
    return;
  }

  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const { ip: publicIp } = await response.json();

    const rawIps = await getRawIPs();

    const isPublicIpCampus = publicIp.startsWith(campusPrefix);
    const isPhysicalInCampus = rawIps.some(ip => typeof ip === 'string' && ip.startsWith(campusPrefix));

    if (isPublicIpCampus) {
      bypassNextNavByTab.set(tabId, url);
      await chrome.tabs.update(tabId, { url });
    } else {
      const reason = isPhysicalInCampus ? "vpn_active" : "outside_campus";
      const warningUrl = chrome.runtime.getURL(`warning.html?ip=${publicIp}&reason=${reason}&target=${encodeURIComponent(url)}`);
      await chrome.tabs.update(tabId, { url: warningUrl });
    }
  } catch (error) {
    console.error("ネットワークチェック失敗:", error);
  }
}

async function validateNetworkPath(tabId: number, url: string) {
  const result = await chrome.storage.sync.get(['campusIpPrefix']);
  const campusPrefix = result.campusIpPrefix as string | undefined;

  if (!campusPrefix) {
    const warningUrl = chrome.runtime.getURL(`warning.html?reason=not_configured&target=${encodeURIComponent(url)}`);
    chrome.tabs.update(tabId, { url: warningUrl });
    return;
  }

  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const { ip: publicIp } = await response.json();

    const rawIps = await getRawIPs();

    const isPublicIpCampus = publicIp.startsWith(campusPrefix);
    const isPhysicalInCampus = rawIps.some(ip => typeof ip === 'string' && ip.startsWith(campusPrefix));

    if (!isPublicIpCampus) {
      const reason = isPhysicalInCampus ? "vpn_active" : "outside_campus";
      const warningUrl = chrome.runtime.getURL(`warning.html?ip=${publicIp}&reason=${reason}&target=${encodeURIComponent(url)}`);
      chrome.tabs.update(tabId, { url: warningUrl });
    }
  } catch (error) {
    console.error("ネットワークチェック失敗:", error);
  }
}

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  const { tabId, url } = details;
  if (!url) return;
  if (url.includes('warning.html')) return;
  const bypassTarget = bypassNextNavByTab.get(tabId);
  if (bypassTarget && url.startsWith(bypassTarget)) {
    bypassNextNavByTab.delete(tabId);
    return;
  }
  if (url.includes('moodle')) {
    const checkingUrl = chrome.runtime.getURL(`warning.html?reason=checking&target=${encodeURIComponent(url)}`);
    chrome.tabs.update(tabId, { url: checkingUrl });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    // If a bypass is set, skip validation once for this tab
    const bypassTarget = bypassNextNavByTab.get(tabId);
    if (bypassTarget && tab.url.startsWith(bypassTarget)) {
      bypassNextNavByTab.delete(tabId);
      return;
    }

    if (tab.url.includes('moodle') && !tab.url.includes('warning.html')) {
      validateNetworkPath(tabId, tab.url);
    }
  }
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: chrome.runtime.getURL("popup.html")
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'check' && typeof message?.target === 'string') {
    const tabId = sender.tab?.id;
    if (typeof tabId === 'number') {
      checkAndNavigate(tabId, message.target)
        .then(() => sendResponse({ ok: true }))
        .catch(() => sendResponse({ ok: false }));
      return true;
    } else {
      sendResponse({ ok: false, error: 'no_tab' });
      return false;
    }
  }
  if (message?.type === 'bypass' && typeof message?.target === 'string') {
    const tabId = sender.tab?.id;
    if (typeof tabId === 'number') {
      try {
        const url = new URL(message.target);
        bypassNextNavByTab.set(tabId, url.toString());
        sendResponse({ ok: true });
      } catch {
        sendResponse({ ok: false, error: 'invalid_target' });
      }
    } else {
      sendResponse({ ok: false, error: 'no_tab' });
    }
    return true;
  }
  return false;
});