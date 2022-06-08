const state = {
  // 当前播放状态：ready就绪，start正在播放，suspend暂停
  currentPlayStatus: 'ready',
  // 是否显示音名，默认显示
  showNotesName: true,
  // 音频buffer
  audioBufferList: [],
  // 当前演奏的音符
  currentPlayNote: null,
};


const getters = {
  getAudioBuffers() {
    return state.audioBufferList;
  },
  getCurrentPlayNotes() {
    return state.currentPlayNotes;
  }
};


const mutations = {
  toggleNotesName(state) {
    state.showNotesName = !state.showNotesName;
  },
  setAudioBufferList(state, list) {
    state.audioBufferList = list;
  },
  setCurrentPlayStatus(state, status) {
    state.currentPlayStatus = status;
  },
  setCurrentPlayNote(state, note) {
    state.currentPlayNote = note;
  }
};


const actions = {};


export default {
  state,
  getters,
  actions,
  mutations,
};