export async function getRawIPs(): Promise<string[]> {
  return new Promise((resolve) => {
    const ips: string[] = [];
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel("");
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
  
      pc.onicecandidate = (event) => {
        if (!event || !event.candidate) {
          resolve(ips);
          pc.close();
          return;
        }
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
        const match = ipRegex.exec(event.candidate.candidate);
        if (match && !ips.includes(match[1])) {
          ips.push(match[1]);
        }
      };
      setTimeout(() => { resolve(ips); pc.close(); }, 1000);
    } catch (_err) {
      // Return an empty array when RTCPeerConnection is unavailable (e.g., MV3 service worker)
      resolve([]);
    }
  });
}