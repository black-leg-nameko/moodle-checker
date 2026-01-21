const params = new URLSearchParams(window.location.search);
const reason = params.get('reason');
const ip = params.get('ip') || 'Unknown';
const target = params.get('target') || '';

document.getElementById('public-ip').textContent = ip;

let safetyScore = 10;
let color = '#ef4444';
if (reason === 'vpn_active') {
    safetyScore = 40;
    color = '#f59e0b';
}
if (reason === 'not_configured') {
    safetyScore = 0;
    color = '#9ca3af';
}

const donut = document.getElementById('donut');
const deg = Math.max(0, Math.min(100, safetyScore)) * 3.6;
donut.style.setProperty('--donut-deg', `${deg}deg`);
donut.style.setProperty('--donut-color', color);

if (reason === 'vpn_active') {
    document.getElementById('icon').textContent = '🔒';
    document.getElementById('result-status').textContent = 'VPN検知';
    document.getElementById('description').textContent = '物理的には学内にいますが、VPNが有効なためMoodleサーバーには学外IPが届いています。VPNをオフにしてください。';
}
if (reason === 'not_configured') {
    document.getElementById('icon').textContent = '⚙️';
    document.getElementById('title').textContent = '初期設定が必要です';
    document.getElementById('result-status').textContent = '未設定';
    document.getElementById('description').textContent = '大学のIPアドレス設定が完了していません。拡張機能のアイコンをクリックして、学内Wi-FiのIPプレフィックスを設定してください。';
}

// Proceed (at your own risk): notify background to set a one-time bypass, then navigate
const proceedLink = document.getElementById('proceed-link');
proceedLink.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!target) return;
    try {
        await chrome.runtime.sendMessage({ type: 'bypass', target });
    } catch (_e) {
        // ignore
    }
    location.href = decodeURIComponent(target);
});

// Open the in-extension settings page
document.getElementById('settings-link').addEventListener('click', (e) => {
    e.preventDefault();
    const url = chrome.runtime.getURL('popup.html');
    location.href = url;
});