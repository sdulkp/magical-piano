<template>
  <div class="keyboard-container">
    <div class="keyboard-header">
      <div class="header-outer-border"></div>
      <div class="header-inner-border"></div>
    </div>
    <div
      class="keyboard-body"
      @mouseup="clearBoard"
      @mouseleave="clearBoard"
      >
      <div
        v-for="note in notesWhiteList"
        :key="note.id"
        :class="['key', 'key-white', { active: note.isActive }]"
        :style="{ background: note.color }"
        :note-index="note.noteIndex"
        >
        <span v-if="showNotesName" class="note-name">{{ note.name }}</span>
      </div>
      <div class="key-black-wrapper key-black-wrapper-1">
        <div
          v-for="note in notesBlackList1"
          :key="note.id"
          :class="['key', 'key-black', { active: note.isActive }]"
          :note-index="note.noteIndex"
          >
          <span class="key-shadow" :style="{ background: note.color }"></span>
          <div class="key-deco"></div>
        </div>
      </div>
      <div class="key-black-wrapper key-black-wrapper-2">
        <div
          v-for="note in notesBlackList2"
          :key="note.id"
          :class="['key', 'key-black', { active: note.isActive }]"
          :note-index="note.noteIndex"
          >
          <span class="key-shadow" :style="{ background: note.color }"></span>
          <div class="key-deco"></div>
        </div>
      </div>
      <div class="key-black-wrapper key-black-wrapper-3">
        <div
          v-for="note in notesBlackList3"
          :key="note.id"
          :class="['key', 'key-black', { active: note.isActive }]"
          :note-index="note.noteIndex"
          >
          <span class="key-shadow" :style="{ background: note.color }"></span>
          <div class="key-deco"></div>
        </div>
      </div>
      <div class="key-black-wrapper key-black-wrapper-4">
        <div
          v-for="note in notesBlackList4"
          :key="note.id"
          :class="['key', 'key-black', { active: note.isActive }]"
          :note-index="note.noteIndex"
          >
          <span class="key-shadow" :style="{ background: note.color }"></span>
          <div class="key-deco"></div>
        </div>
      </div>
      <div class="key-black-wrapper key-black-wrapper-5">
        <div
          v-for="note in notesBlackList5"
          :key="note.id"
          :class="['key', 'key-black', { active: note.isActive }]"
          :note-index="note.noteIndex"
          >
          <span class="key-shadow" :style="{ background: note.color }"></span>
          <div class="key-deco"></div>
        </div>
      </div>
      <div class="key-black-wrapper key-black-wrapper-6">
        <div
          v-for="note in notesBlackList6"
          :key="note.id"
          :class="['key', 'key-black', { active: note.isActive }]"
          :note-index="note.noteIndex"
          >
          <span class="key-shadow" :style="{ background: note.color }"></span>
          <div class="key-deco"></div>
        </div>
      </div>
      <div class="key-black-wrapper key-black-wrapper-7">
        <div
          v-for="note in notesBlackList7"
          :key="note.id"
          :class="['key', 'key-black', { active: note.isActive }]"
          :note-index="note.noteIndex"
          >
          <span class="key-shadow" :style="{ background: note.color }"></span>
          <div class="key-deco"></div>
        </div>
      </div>
      <div class="key-black-wrapper key-black-wrapper-8">
        <div
          v-for="note in notesBlackList8"
          :key="note.id"
          :class="['key', 'key-black', { active: note.isActive }]"
          :note-index="note.noteIndex"
          >
          <span class="key-shadow" :style="{ background: note.color }"></span>
          <div class="key-deco"></div>
        </div>
      </div>
    </div>
    <div class="keyboard-footer"></div>
  </div>
</template>


<script setup>
import notesList from '@/config/notes';
import boardColors from '@/config/board_colors';
import { noteOn, noteOff } from '@/bll/playerbll';
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';

const ctx = new AudioContext();

// 建立音符索引与渲染索引的映射关系
const notesIndexMap = new Map();
notesList.forEach((note, index) => notesIndexMap.set(note.noteIndex, index));
// 建立音符索引与buffer source的映射关系
const notesBufferMap = new Map();
const keyPressedMap = new Map();
notesList.forEach(note => note.key && keyPressedMap.set(note.key, false));
const canAccessKeyMap = notesList.filter(note => note.key).map(note => note.key);

const store = useStore();
const showNotesName = computed(() => store.state.player.showNotesName);
const audioBufferList = computed(() => store.state.player.audioBufferList);

const notesListRef = ref(notesList);
const notesWhiteList = computed(() => notesListRef.value.filter(item => item.type === 'white'));
const notesBlackList = notesListRef.value.filter(item => item.type === 'black');
const notesBlackList1 = computed(() => notesBlackList.filter(item => item.noteIndex === 1));
const notesBlackList2 = computed(() => notesBlackList.filter(item => item.noteIndex >= 3 && item.noteIndex <= 13));
const notesBlackList3 = computed(() => notesBlackList.filter(item => item.noteIndex >= 16 && item.noteIndex <= 25));
const notesBlackList4 = computed(() => notesBlackList.filter(item => item.noteIndex >= 28 && item.noteIndex <= 37));
const notesBlackList5 = computed(() => notesBlackList.filter(item => item.noteIndex >= 40 && item.noteIndex <= 49));
const notesBlackList6 = computed(() => notesBlackList.filter(item => item.noteIndex >= 52 && item.noteIndex <= 61));
const notesBlackList7 = computed(() => notesBlackList.filter(item => item.noteIndex >= 64 && item.noteIndex <= 73));
const notesBlackList8 = computed(() => notesBlackList.filter(item => item.noteIndex >= 76 && item.noteIndex <= 85));

// 建立键盘与note的映射关系
const notesBoardMap = new Map();
notesListRef.value.forEach(note => note.key && notesBoardMap.set(note.key, note));

// 当前演奏的音符
const currentPlayNote = computed(() => store.state.player.currentPlayNote);
watch(currentPlayNote, (noteInfo) => {
  const index = notesIndexMap.get(noteInfo.index);
  if (noteInfo.active) {
    setBoardColor(notesListRef.value[index]);
  } else {
    clearBoardColor(notesListRef.value[index]);
  }
});

const currentPlayStatus = computed(() => store.state.player.currentPlayStatus);
watch(currentPlayStatus, (status) => {
  if (status !== 'start') {
    clearBoard();
  }
});

const setBoardColor = (note) => {
  if (note.type === 'white') {
    note.color = boardColors[0].white;
  } else {
    note.color = boardColors[0].black;
  }
  note.isActive = true;
};

const clearBoardColor = (note) => {
  note.color = null;
  note.isActive = false;
};

const clearBoard = () => {
  notesListRef.value.forEach(note => {
    clearBoardColor(note);
  });
};

// 鼠标点击弹奏音符
const playNoteByCursor = (e) => {
  const noteIndex = e.currentTarget.getAttribute('note-index');
  const note = notesListRef.value[notesIndexMap.get(parseInt(noteIndex))];
  const source = noteOn({
    ctx,
    audioBufferList: audioBufferList.value,
    index: note.noteIndex,
    type: note.type,
    delay: 0,
    duration: 0,
    byHand: true,
  });
  notesBufferMap.set(note.noteIndex, source);
  setBoardColor(note);
};

const stopNoteByCursor = (e) => {
  const noteIndex = e.currentTarget.getAttribute('note-index');
  const note = notesListRef.value[notesIndexMap.get(parseInt(noteIndex))];
  const source = notesBufferMap.get(note.noteIndex);
  source && noteOff(source, ctx.currentTime, 0.8);
};

// 使用键盘弹奏音符
const playNoteByBoard = (e) => {
  if (!canAccessKeyMap.includes(e.key)) {
    return;
  }
  // 防止长按键盘多次触发弹奏
  if (keyPressedMap.get(e.key)) {
    return;
  }
  keyPressedMap.set(e.key, true);
  const note = notesBoardMap.get(e.key);
  const source = noteOn({
    ctx,
    audioBufferList: audioBufferList.value,
    index: note.noteIndex,
    type: note.type,
    delay: 0,
    duration: 0,
    byHand: true,
  });
  notesBufferMap.set(note.noteIndex, source);
  setBoardColor(note);
}

const stopNoteByBoard = (e) => {
  if (!canAccessKeyMap.includes(e.key)) {
    return;
  }
  keyPressedMap.set(e.key, false);
  const note = notesBoardMap.get(e.key);
  const source = notesBufferMap.get(note.noteIndex);
  source && noteOff(source, ctx.currentTime, 0.8);
  clearBoardColor(note);
}

onMounted(() => {
  if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
    // 移动端绑定touch事件
    document.querySelectorAll('.key').forEach(item => {
      item.addEventListener('touchstart', playNoteByCursor);
      item.addEventListener('touchend', stopNoteByCursor);
    });
  } else {
    // PC端绑定mouse事件
    document.querySelectorAll('.key').forEach(item => {
      item.addEventListener('mousedown', playNoteByCursor);
      item.addEventListener('mouseup', stopNoteByCursor);
    });
  }
});

onUnmounted(() => {
  if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
    // 移动端绑定touch事件
    document.querySelectorAll('.key').forEach(item => {
      item.removeEventListener('touchstart', playNoteByCursor);
      item.removeEventListener('touchend', stopNoteByCursor);
    });
  } else {
    // PC端绑定mouse事件
    document.querySelectorAll('.key').forEach(item => {
      item.removeEventListener('mousedown', playNoteByCursor);
      item.removeEventListener('mouseup', stopNoteByCursor);
    });
  }
});

onMounted(() => document.addEventListener('keydown', playNoteByBoard));
onMounted(() => document.addEventListener('keyup', stopNoteByBoard));
onUnmounted(() => document.removeEventListener('keydown', playNoteByBoard));
onUnmounted(() => document.removeEventListener('keyup', stopNoteByBoard));
</script>


<style lang="scss">
@import '@/assets/scss/global';

$whiteKeyBorderColor: #BDBDBD;
$blackKeyWidth: 8.979%;
$blackKeyHeight: 66.5%;

.keyboard-container {
  position: absolute;
  bottom: 0;
  width: 100%;
  overflow: hidden;

  .header-outer-border {
    padding-bottom: 0.22%;
    background-color: #585858;
  }

  .header-inner-border {
    padding-bottom: 0.28%;
    background: linear-gradient($globalBackground, #B43104 40%);
  }
}

.keyboard-body {
  position: relative;
  display: flex;
  justify-content: center;
}

.keyboard-footer {
  height: 10px;
}

.key {
  position: relative;
  cursor: pointer;

  &.active .key-shadow {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 100;
  }
}

.key-white {
  padding-bottom: 11.88%;
  width: 1.8%;
  border-left: transferToRem(1) solid $whiteKeyBorderColor;
  border-right: transferToRem(1) solid $whiteKeyBorderColor;
  border-bottom-left-radius: transferToRem(2);
  border-bottom-right-radius: transferToRem(2);
  background: linear-gradient(-30deg, #FFFBF0, #FFFFFF);
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  &:first-child {
    border-left: 0;
  }

  &:last-child {
    border-right: 0;
  }

  .note-name {
    position: absolute;
    left: 50%;
    bottom: 5%;
    transform: translateX(-50%);
    font-family: roboto, Arial, Microsoft Yahei, Hiragino Sans GB, Heiti SC, sans-serif;
    font-size: transferToRem(16);
    color: #848484;
    user-select: none;
    z-index: 200;
  }

  &.active .note-name {
    color: #FFFFFF;
  }

  @media (max-width: 1024px) {
    .note-name {
      font-size: transferToRem(14);
    }
  }

  .key-deco {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding-bottom: 16%;
  }
}

.key-black {
  position: absolute;
  top: 0;
  width: $blackKeyWidth;
  height: 100%;
  border-bottom-left-radius: transferToRem(3);
  border-bottom-right-radius: transferToRem(3);
  background: black;
  box-shadow: transferToRem(4) transferToRem(2) transferToRem(5) rgba(0, 0, 0, 0.36);

  .key-deco {
    position: absolute;
    top: -1%;
    left: 50%;
    width: 55%;
    height: 99%;
    border-left: 2px solid;
    border-right: 2px solid;
    border-image: linear-gradient(black 6%, rgb(72, 72, 72)) 10;
    transform: translateX(-50%);
    background: linear-gradient(black, #1C1C1C);

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: -1px;
      right: -1px;
      height: 7.5%;
      background: rgb(58, 58, 58);
      clip-path: polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%);
    }
  }
}

.key-black-wrapper {
  position: absolute;
  height: $blackKeyHeight;
  $singleLeft: calc(100% / 7);
  $wrapperWidth: 13.4%;
  z-index: 500;

  .key-black:nth-child(1) {
    left: calc($singleLeft - 0.66 * $blackKeyWidth);
  }

  .key-black:nth-child(2) {
    left: calc(2 * $singleLeft - 0.33 * $blackKeyWidth);
  }

  .key-black:nth-child(3) {
    left: calc(4 * $singleLeft - 0.66 * $blackKeyWidth);
  }

  .key-black:nth-child(4) {
    left: calc(5 * $singleLeft - 0.46 * $blackKeyWidth);
  }

  .key-black:nth-child(5) {
    left: calc(6 * $singleLeft - 0.33 * $blackKeyWidth);
  }

  &.key-black-wrapper-1 {
    top: 0;
    left: 0;
    width: 3.76%;

    .key-black {
      left: calc(calc((100% - 2px) / 2) - 0.33 * 32%);
      width: 32%;
    }
  }

  &.key-black-wrapper-2 {
    left: 3.76%;
    width: $wrapperWidth;
  }

  &.key-black-wrapper-3 {
    left: calc(3.82% + $wrapperWidth);
    width: $wrapperWidth;
  }

  &.key-black-wrapper-4 {
    left: calc(3.9% + 2 * $wrapperWidth);
    width: $wrapperWidth;
  }

  &.key-black-wrapper-5 {
    left: calc(4.0% + 3 * $wrapperWidth);
    width: $wrapperWidth;
  }

  &.key-black-wrapper-6 {
    left: calc(4.08% + 4 * $wrapperWidth);
    width: $wrapperWidth;
  }

  &.key-black-wrapper-7 {
    left: calc(4.15% + 5 * $wrapperWidth);
    width: $wrapperWidth;
  }

  &.key-black-wrapper-8 {
    left: calc(4.23% + 6 * $wrapperWidth);
    width: $wrapperWidth;
  }
}
</style>