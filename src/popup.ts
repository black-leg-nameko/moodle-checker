const ipInput = document.getElementById('ip-prefix') as HTMLInputElement;
const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;

chrome.storage.sync.get(['campusIpPrefix'], (result) => {
    if (result.campusIpPrefix) {
        ipInput.value = result.campusIpPrefix;
    }
});

saveBtn.addEventListener('click', () => {
    const prefix = ipInput.value.trim();

    if (!prefix) {
        statusDiv.textContent = '学内IPのprefixを入力してください';
        statusDiv.style.color = 'red';
        return;
    }

    chrome.storage.sync.set({ campusIpPrefix: prefix }, () => {
        statusDiv.texContent = '設定を保存しました';
        statusDiv.style.color = 'green';

        setTimeout(() => {
            statusDiv.textContent = '';
        }, 3000);
    });
});
