const ipInput = document.getElementById('ip-prefix') as HTMLInputElement;
const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;
const currentValueSpan = document.getElementById('current-value') as HTMLSpanElement;

interface StorageData {
    campusIpPrefix?: string;
}

const updateDisplay = () => {
    chrome.storage.sync.get(['campusIpPrefix'], (result: StorageData) => {
        console.log('取得したデータ:', result);
        if (result.campusIpPrefix) {
            currentValueSpan.textContent = result.campusIpPrefix;
            ipInput.value = result.campusIpPrefix;
        } else {
            currentValueSpan.textContent = '未設定';
            ipInput.value = '';
        }
    });
};

updateDisplay();

saveBtn.addEventListener('click', () => {
    const prefix = ipInput.value.trim();

    if (!prefix) {
        statusDiv.textContent = '値を入力してください';
        statusDiv.style.color = '#ef4444';
        return;
    }

    chrome.storage.sync.set({ campusIpPrefix: prefix }, () => {
        if (chrome.runtime.lastError) {
            console.error('保存エラー:', chrome.runtime.lastError);
            statusDiv.textContent = '保存に失敗しました';
            statusDiv.style.color = '#ef4444';
            return;
        }

        console.log('保存成功:', prefix);
        statusDiv.textContent = '保存完了';
        statusDiv.style.color = '#10b981';
        
        setTimeout(() => {
            updateDisplay();
            statusDiv.textContent = '';
        }, 5000);
    });
});
