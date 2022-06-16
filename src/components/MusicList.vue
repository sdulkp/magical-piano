<template>
  <div class="music-list-wrapper">
    <div class="music-list-header">
      <img src="/icon/music.svg" />
      <span>音乐列表</span>
    </div>
    <ul class="music-list-body">
      <li
        v-for="music in musicListRef"
        :key="music.id"
        @click="loadMusicFile(music)"
        >
        {{ music.name }}-{{ music.author}}
      </li>
    </ul>
  </div>
</template>


<script setup>
import musicList from '@/config/music_list';
import { ref } from 'vue';
import axios from 'axios';

const musicListRef = ref(musicList);
const emit = defineEmits(['reload']);
const loadMusicFile = async (music) => {
  const res = await axios.get(`/apps/magical-piano/load_mus_file/${music.url}`);
  emit('reload', { data: res.data, ...music});
};
</script>


<style lang="scss">
@import '@/assets/scss/global';

.music-list-wrapper {
  height: 100%;
  border-radius: transferToRem(6);
  background: $panelShadowColor;

  .music-list-header {
    position: relative;
    padding: transferToRem(16);
    height: transferToRem(50);
    line-height: transferToRem(18);
    box-sizing: border-box;
    font-family: Microsoft YaHei, sans-serif;
    font-size: transferToRem(18);
    color: #E6E6E6;
    display: flex;
    align-items: center;
  }

  .music-list-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: -50%;
    width: 200%;
    height: 1px;
    background: rgba(220, 220, 220, 0.5);
    transform: scale(0.5);
  }

  .music-list-header > img {
    margin-right: transferToRem(14);
    width: transferToRem(20);
    height: transferToRem(20);
  }

  .music-list-body {
    margin: 0;
    padding: transferToRem(6) transferToRem(16);
    height: calc(100% - transferToRem(50));
    box-sizing: border-box;
    list-style: none;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .music-list-body > li {
    margin: transferToRem(6) 0;
    font-size: transferToRem(13);
    color: #E6E6E6;
    cursor: pointer;
  }

  .music-list-body > li:hover {
    color: #2E9AFE;
  }
}
</style>