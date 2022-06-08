const _base64ToArrayBuffer = (base64) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}


const _readTextFromFile = async (file) => {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (e) => {
      resolve(e.target.result);
    };
  });
}


const _formatSeconds = (seconds) => {
  let minute = Math.floor(seconds / 60);
  let second = Math.ceil(seconds - minute * 60);
  if (second >= 60) {
    minute += 1;
    second = 0;
  }
  if (minute < 10) {
    minute = '0' + String(minute);
  }
  if (second < 10) {
    second = '0' + String(second);
  }
  return minute + ':' + second;
}


export {
  _base64ToArrayBuffer,
  _readTextFromFile,
  _formatSeconds,
};