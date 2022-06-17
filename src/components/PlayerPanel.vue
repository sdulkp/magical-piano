<template>
  <div class="player-panel-container">
    <div class="panel-left">
      <div class="player-panel">
        <div class="panel-wrapper">
          <div class="btn-wrapper file-btn">
            <button type="button" @click="clickOpenFileBtn" :disabled="currentPlayStatus === 'start'">
              <img src="/icon/dir.svg" />
            </button>
            <input
              class="music-file"
              type="file"
              ref="fileBtn"
              @change="openAndResolveMusicFile"
              />
            <span>打开</span>
          </div>
          <div class="btn-wrapper play-pause-btn">
            <button type="button" @click="toggleAudio">
              <img :src="`/icon/${ currentPlayStatus === 'start' ? 'pause' : 'play'}.svg`" />
            </button>
            <span>播放</span>
          </div>
          <div class="btn-wrapper stop-btn">
            <button type="button" @click="stopAudio">
              <img src="/icon/stop.svg" />
            </button>
            <span>停止</span>
          </div>
          <div class="tone-adjustor-wrapper">
            <div class="tone-adjustor">
              <button type="button" @click="adjustTone(false)">
                <img src="/icon/minus.svg" />
              </button>
              <span>{{ tone > 0 ? '+ ' : '' }}{{ tone < 0 ? '- ' : '' }}{{ Math.abs(tone) }}</span>
              <button type="button" @click="adjustTone(true)">
                <img src="/icon/plus.svg" />
              </button>
            </div>
            <span>升降调</span>
          </div>
          <div class="switch-wrapper">
            <span>显示音名</span>
            <span
              :class="['switch-btn', { active: showNotesName }]"
              @click="store.commit('toggleNotesName')"
              >
            </span>
          </div>
        </div>
        
      </div>
      <div class="progress-bar-panel">
        <div :class="['play-info', { active: currentPlayStatus === 'start' }]">
          <span v-if="currentPlayStatus === 'start'">{{ '正在播放 ' + musicFileName }}</span>
          <span v-else>{{ musicFileName }}</span>
        </div>
        <div class="progress-bar">
          <span class="bar-shape">
            <span class="bar-shape-btn" :style="{ left: barBtnDistance }"></span>
            <span class="bar-shape-progress" :style="{ width: barWidth }"></span>
          </span>
          <span class="time-info">{{ playCurrentTime }} / {{ playTotalTime }}</span>
        </div>
      </div>
    </div>
    <div class="panel-right">
      <MusicList @reload="reloadAudio" />
    </div>
  </div>
</template>


<script setup>
import MusicList from '@/components/MusicList.vue';
import { loadNotesBuffer, resolveTracksFromMusFile } from '@/bll/playerbll';
import { playMusic } from '@/bll/playerbll';
import { _formatSeconds } from '@/util/tools';
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
let audioBufferList;
let ctx;
let trackList;
const infoQueue = [];
// 音调
const tone = ref(0);
// 音频文件名
const musicFileName = ref('');
// 音频文件
let musicFile;
// 当前播放时间
const playCurrentTime = ref(_formatSeconds(0));
// 总播放时间
const playTotalTime = ref(_formatSeconds(0));
let playTotalSeconds;
// 进度条宽度
const barWidth = ref('');
// 进度按钮移动距离
const barBtnDistance = ref('');
const currentPlayTimers = [];
const setBoardStatusTimers = [];

onMounted(async () => {
  // 加载音频资源
  audioBufferList = await loadNotesBuffer();
  store.commit('setAudioBufferList', audioBufferList);
});

const showNotesName = computed(() => store.state.player.showNotesName);
const currentPlayStatus = computed(() => store.state.player.currentPlayStatus);

const fileBtn = ref(null);
const clickOpenFileBtn = () => {
  fileBtn.value.click();
};

const resolveMusicFile = async (fileData, fileName, fileType) => {
  musicFile = fileData;
  musicFileName.value = `${fileName}.${fileType}`;
  const { _trackList, _trackTime } = await resolveTracksFromMusFile(fileData, tone.value);
  trackList = _trackList;
  playTotalTime.value = _formatSeconds(_trackTime);
  playTotalSeconds = _trackTime;
}

const openAndResolveMusicFile = async (e) => {
  const el = e.target;
  const file = el.files[0];
  const fileName = file.name.substring(0, file.name.lastIndexOf('.'));
  const fileType = file.name.substring(file.name.lastIndexOf('.') + 1);
  if (fileType !== 'mus') {
    alert('目前仅支持解析mus格式的文件');
  } else {
    resolveMusicFile(file, fileName, fileType);
  }
  el.value = null;
};

const setBarWidth = (isSuspend) => {
  if (isSuspend) {
    barWidth.value = '0%';
    barBtnDistance.value = '-0.4rem';
  } else {
    barWidth.value = (ctx.currentTime / playTotalSeconds * 100) + '%';
    barBtnDistance.value = `calc(${(ctx.currentTime / playTotalSeconds * 100)}% - 0.4rem)`;
  }
}

// 计算播放进度
const calPlayProgress = (isSuspend) => {
  if (isSuspend) {
    currentPlayTimers.forEach(timer => clearTimeout(timer));
    currentPlayTimers.length = 0;
  } else {
    currentPlayTimers.push(setTimeout(() => {
      const now = _formatSeconds(ctx.currentTime);
      if (now > playTotalTime.value) {
        stopAudio();
        calPlayProgress(true);
        setBarWidth(true);
      } else {
        playCurrentTime.value = now;
        setBarWidth();
        calPlayProgress(isSuspend);
      }
    }, 1000));
  }
}
 
const setBoardStatus = (isSuspend) => {
  if (isSuspend) {
    setBoardStatusTimers.forEach(timer => clearTimeout(timer));
    setBoardStatusTimers.length = 0;
  } else {
    infoQueue.forEach(noteInfo => {
      noteInfo && setBoardStatusTimers.push(setTimeout(() => {
        store.commit('setCurrentPlayNote', { index: noteInfo.index, active: true });
      }, (noteInfo.startTime - ctx.currentTime) * 1000));
      noteInfo && setBoardStatusTimers.push(setTimeout(() => {
        store.commit('setCurrentPlayNote', { index: noteInfo.index, active: false });
      // 减去30ms的原因是，连续敲击相同音符时，能够在视觉上看出时间间隔
      }, (noteInfo.stopTime - ctx.currentTime) * 1000 - 30));
    });
  }
}

// 播放/暂停音频
const toggleAudio = async () => {
  if (!trackList) {
    return alert('没有可播放的音源');
  }
  if (!ctx) {
    ctx = new AudioContext();
    ctx.suspend();
  }
  const { _play, _pause } = playMusic(ctx, audioBufferList, trackList, infoQueue);
  if (currentPlayStatus.value === 'ready') {
    await _play();
    setBoardStatus();
    calPlayProgress(false);
    store.commit('setCurrentPlayStatus', 'start');
  } else if (currentPlayStatus.value === 'start') {
    await _pause();
    setBoardStatus(true);
    calPlayProgress(true);
    store.commit('setCurrentPlayStatus', 'suspend');
  } else if (currentPlayStatus.value === 'suspend') {
    await _play();
    setBoardStatus();
    calPlayProgress(false);
    store.commit('setCurrentPlayStatus', 'start');
  }
}

// 停止播放音频
const stopAudio = async () => {
  if (currentPlayStatus.value === 'ready') {
    return;
  }
  calPlayProgress(true);
  setBarWidth(true);
  const { _pause } = playMusic(ctx, audioBufferList, trackList, infoQueue);
  await _pause();
  setBoardStatus(true);
  ctx = null;
  store.commit('setCurrentPlayStatus', 'ready');
}

const reloadAudio = async (fileInfo) => {
  await stopAudio();
  const { data, name, type } = fileInfo;
  await resolveMusicFile(data, name, type);
  toggleAudio();
}

// 升降调
const adjustTone = async (isPositive) => {
  let nowTone = tone.value;
  if (isPositive) {
    if (nowTone < 12) {
      nowTone += 1;
    } else {
      return;
    }
  } else {
    if (nowTone > -12) {
      nowTone -= 1;
    } else {
      return;
    }
  }
  tone.value = nowTone;
  const { _trackList } = await resolveTracksFromMusFile(musicFile, nowTone);
  trackList = _trackList;
  if (currentPlayStatus.value !== 'start') {
    return;
  }
  await toggleAudio();
  toggleAudio();
}
</script>


<style lang="scss">
@import '@/assets/scss/global';

.player-panel-container {
  padding: 0 1.5%;
  max-height: transferToRem(165);
  display: flex;

  .panel-left {
    margin-right: transferToRem(20);
    flex-basis: 100%;
    border-radius: transferToRem(6);
    background: $panelShadowColor;
    flex: 1;

    .player-panel {
      padding: 2.5% 2.5%;
      display: flex;
    }

    .panel-wrapper {
      display: flex;
    }

    .btn-wrapper {
      margin-right: transferToRem(20);
      height: transferToRem(40);
    }

    .btn-wrapper > button {
      margin: 0;
      padding: transferToRem(10);
      width: transferToRem(40);
      height: 100%;
      border: 0;
      border-radius: 50%;
      cursor: pointer;
      display: block;
      transition: all 0.3s;
    }

    .btn-wrapper > button:hover {
      transition: all 0.3s;
    }

    .btn-wrapper > button > img {
      width: 100%;
      height: 100%;
    }

    span {
      padding-top: transferToRem(6);
      font-family: Microsoft YaHei, sans-serif;
      font-size: transferToRem(13);
      color: #E6E6E6;
      text-align: center;
      user-select: none;
      display: block;
    }

    .btn-wrapper > span {
      width: transferToRem(40);
    }

    .file-btn {
      position: relative;
    }

    .file-btn > button {
      background-color: #FE9A2E;

      &:hover {
        background-color: #FAAC58;
      }
    }

    .file-btn .music-file {
      position: absolute;
      top: 0;
      left: 0;
      opacity: 0;
      z-index: -1;
    }

    .play-pause-btn > button {
      background-color: #0080FF;
      
      &:hover {
        background-color: #2E9AFE;
      }
    }

    .stop-btn > button {
      background-color: #FA5858;

      &:hover {
        background-color: #F78181;
      }
    }

    .tone-adjustor-wrapper {
      margin-right: transferToRem(20);
    }

    .tone-adjustor {
      padding: transferToRem(8);
      width: transferToRem(140);
      height: transferToRem(40);
      border-radius: transferToRem(20);;
      background-color: rgba(255, 255, 255, 0.2);
      box-sizing: border-box;
      display: flex;

      button {
        margin: 0;
        padding: transferToRem(5);
        width: transferToRem(24);
        border: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.25);
        cursor: pointer;
        box-sizing: border-box;
        transition: all 0.3s;
        flex-grow: 0;
        flex-shrink: 0;
        transition: all 0.3s;
      }

      button:hover {
        background: rgba(255, 255, 255, 0.35);
        transition: all 0.3s;
      }

      span {
        padding: 0;
        line-height: transferToRem(24);
        font-family: roboto, Arial, Microsoft Yahei, sans-serif;
        font-size: 1.8rem;
        font-weight: bold;
        user-select: none;
        flex: 1;
      }

      img {
        width: 100%;
        height: 100%;
      }
    }

    .tone-adjustor-wrapper span {
      width: transferToRem(140);
    }

    .switch-wrapper {
      display: flex;
      align-items: center;
    }

    .switch-wrapper > span {
      padding: 0;
      margin-right: transferToRem(10);
      width: fit-content;
      display: flex;
      align-items: center;
    }

    .switch-wrapper .switch-btn {
      position: relative;
      width: transferToRem(50);
      height: transferToRem(24);
      border-radius: transferToRem(12);
      box-sizing: border-box;
      background: rgba(255, 255, 255, 0.2);
      cursor: pointer;
      
      &::after {
        content: '';
        position: absolute;
        top: transferToRem(4);
        left: transferToRem(4);
        width: transferToRem(16);
        height: transferToRem(16);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        transition: all 0.3s;
      }
    }

    .switch-wrapper .switch-btn.active {
      background: rgba(46, 154, 254, 0.25);
      transition: all 0.3s;

      &::after {
        left: calc(100% - transferToRem(16 + 4));
        background: rgba(0, 128, 255, 0.8);
        transition: all 0.3s;
      }
    }

    .progress-bar-panel {
      padding: 0 2.5% 2.5%;
      
      > .play-info {
        padding-bottom: transferToRem(4);
        width: fit-content;
        height: transferToRem(15);
        font-family: Microsoft YaHei, sans-serif;
        font-size: transferToRem(13);
        color: #E6E6E6;
        overflow: hidden;
        user-select: none;
      }

      > .play-info > span {
        position: relative;
        top: 0;
        left: 0;
        padding: 0;
      }

      > .play-info.active > span {
        animation: info-rolling 10s linear infinite;;
      }

      @keyframes info-rolling {
        0% {
          left: 100%;
        }

        100% {
          left: 0;
          transform: translateX(-100%);
        }
      }

      > .progress-bar {
        display: flex;
        align-items: center;
      }

      > .progress-bar > .bar-shape {
        position: relative;
        padding: 0;
        width: transferToRem(400);
        height: transferToRem(2);
        border-radius: transferToRem(1);
        background: rgb(158, 158, 158);
      }

      > .progress-bar > .bar-shape > .bar-shape-btn {
        position: absolute;
        top: transferToRem(-4);
        left: transferToRem(-4);
        padding: 0;
        width: transferToRem(10);
        height: transferToRem(10);
        border-radius: 50%;
        background: rgb(76, 175, 80);
        z-index: 100;
      }

      > .progress-bar > .bar-shape > .bar-shape-progress {
        position: absolute;
        top: 0;
        left: 0;
        padding: 0;
        width: 0%;
        height: 100%;
        background: rgb(76, 175, 80);
      }

      > .progress-bar > .time-info {
        padding: 0 0 0 transferToRem(8);
        font-family: Microsoft YaHei, sans-serif;
        font-size: transferToRem(12);
        color: #E6E6E6;
        user-select: none;
      }
    }
  }

  .panel-right {
    flex-basis: 40%;
    flex-grow: 0;
    flex-shrink: 0;
  }
}
</style>