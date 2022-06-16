import { noteDownNames, notesMap } from '@/config/notes_name';
import notesSource from '@/config/notes_source';
import { _base64ToArrayBuffer, _readTextFromFile } from '@/util/tools';


const loadNotesBuffer = async () => {
  const ctx = new AudioContext();
  const audioBufferList = [];
  for (let key of noteDownNames) {
    const url = notesSource[key];
    const base64 = url.split(',')[1];
    let buffer = _base64ToArrayBuffer(base64);
    buffer = await ctx.decodeAudioData(buffer);
    audioBufferList.push(buffer);
  }
  ctx.close();
  return audioBufferList;
};


// 解析文件构建音轨数组
const resolveTracksFromMusFile = async (file, tone = 0) => {
  const text = typeof file === 'string' ? file : await _readTextFromFile(file);
  const textArr = text.split('###');
  const header = textArr[0].replace(/\\r|\\n/g, ' ').trim().split(/\s+/);
  // 升降调
  const deltaIndex = parseInt(header[0]) + tone;
  // 每分钟节拍数
  const beats = parseInt(header[1]);
  // 每拍毫秒数
  const beatTime = 60 / beats * 1000;
  // 构建音轨数组
  const _trackList = [];
  let durationList = [];
  let noteName;
  let beat;
  let duration;
  let noteDelayTime;
  let maxTrackTime = -Infinity;
  for (let i = 1; i < textArr.length; i++) {
    // 延后0.5s播放，避免第一个音符无法播放
    const trackIndex = i;
    noteDelayTime = 0.5;
    const track = [];
    const noteList = textArr[i].replace(/\(\d+\)/g, '').replace(/\\r|\\n/g, ' ').trim().split(/\s+/);
    noteList.forEach(notes => {
      const _notes = notes.split('|');
      if (_notes.length <= 1) {
        // &为休止符
        [noteName, beat] = _notes[0].split('/');
        duration = beat * beatTime / 1000;
        noteName !== '&' && track.push({
          index: notesMap.get(noteName) + deltaIndex,
          type: noteName.match(/[#|b]/) ? 'black' : 'white',
          delay: noteDelayTime,
          duration: duration,
          trackIndex,
        });
        noteDelayTime = noteDelayTime + duration;
      } else {
        // 同时弹奏多个音符
        const t = [];
        for (let i = 0; i < _notes.length; i++) {
          [noteName, beat] = _notes[i].split('/');
          duration = beat * beatTime / 1000;
          durationList.push(duration);
          noteName !== '&' && t.push({
            index: notesMap.get(noteName) + deltaIndex,
            type: noteName.match(/[#|b]/) ? 'black' : 'white',
            delay: noteDelayTime,
            duration: duration,
            trackIndex,
          });
        }
        track.push(t);
        noteDelayTime = noteDelayTime + Math.max(...durationList);
        durationList = [];
      }
    });
    if (noteDelayTime > maxTrackTime) {
      maxTrackTime = noteDelayTime;
    }
    _trackList.push(track);
  }
  return {
    _trackList,
    _trackTime: Math.ceil(maxTrackTime),
  };
}


/** 
 * @ctx audioContext实例 
 * @audioBufferList store中存储的音源buffer
 * @index 音名索引
 * @type white | black
 * @delay 延迟播放时间
 * @duration 播放时长
 * @byHand 是否用键盘或鼠标演奏
 * @infoQueue note播放队列
*/
const noteOn = ({ 
    ctx, 
    audioBufferList, 
    index, 
    type, 
    delay, 
    duration, 
    trackIndex,
    byHand = false,
    infoQueue
  }) => {
    const audioBuffer = audioBufferList[index];
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = false;
    source.connect(ctx.destination);
    source.playbackRate.value = 1;
    source.gainNode = ctx.createGain();
    source.gainNode.connect(ctx.destination);
    source.gainNode.gain.value = 0;
    source.gainNode.gain.linearRampToValueAtTime(1.0, delay + duration * 0.2);
    source.connect(source.gainNode);
    source.start(delay);
    !byHand && infoQueue.push({
      source,
      startTime: delay,
      stopTime: delay + duration,
      index,
      type,
      trackIndex,
    });
    return source;
}


const noteOff = (source, stopTime, fadeTime) => {
  if (source.gainNode) {
    const gain = source.gainNode.gain;
    gain.linearRampToValueAtTime(gain.value, stopTime);
    gain.linearRampToValueAtTime(-1.0, stopTime + fadeTime);
  }
  source.stop(stopTime + fadeTime);
};


const playMusic = (ctx, audioBufferList, trackList, infoQueue) => {
  const startNotes = () => {
    trackList.forEach(track => {
      track.forEach(item => {
        if (Array.isArray(item)) {
          item.forEach(it => it.delay >= ctx.currentTime && noteOn({
            ctx,
            audioBufferList,
            ...it,
            byHand: false,
            infoQueue,
          }));
        } else {
          item.delay >= ctx.currentTime && noteOn({
            ctx,
            audioBufferList,
            ...item,
            byHand: false,
            infoQueue,
          });
        }
      });
    });
  };

  const stopNotes = () => {
    infoQueue.forEach(item => {
      const { source, stopTime } = item;
      noteOff(source, stopTime, 0.2);
    });
  }

  return {
    _play: () => {
      ctx && ctx.resume();
      startNotes();
      stopNotes();
    },
    _pause: () => {
      infoQueue.forEach(o => noteOff(o.source, ctx.currentTime, 0.1));
      infoQueue.length = 0;
      return new Promise((resolve) => {
        setTimeout(() => {
          ctx.suspend();
          resolve();
        }, 150);
      });
    },
  };
}


export {
  loadNotesBuffer,
  resolveTracksFromMusFile,
  noteOn,
  noteOff,
  playMusic,
};