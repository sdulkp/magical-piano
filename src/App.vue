<script setup>
import KeyBoard from '@/components/Keyboard.vue';
import PlayerPanel from '@/components/PlayerPanel.vue';
</script>

<template>
  <header class="main-title">Magical Piano</header>
  <PlayerPanel />
  <KeyBoard />
</template>

<style lang="scss">
@import '@/assets/scss/global';

.main-title {
  padding: 1.5% 1.5%;
  font-family: rozha, Arial, Microsoft Yahei, sans-serif;;
  font-size: transferToRem(32);
  color: #2E9AFE;
  text-shadow: 0px 0px 1px #FFFFFF;
  user-select: none;
}
</style>
