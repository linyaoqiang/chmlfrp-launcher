<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'


const menuCollapse = ref(false)
const size = ref({
  width: 0,
  height: 0
})
const menuDisplay = computed(() => {
  return PATHS.includes(route.path)
})
const menuStyle = computed(()=>{
  const style:{[key:string]: any} = {}
  if (size.value.width > 768 && !menuCollapse.value) {
    style['flex'] = '1'
    style['max-width'] = '140px'
  }
  return style
})

const router = useRouter()
const route = useRoute()





onMounted(() => {
  window.ipcRenderer.on('win-resize', (_event, winSize: Array<number>) => {
    // 处理事件
    const [width, height] = winSize
    updateCollapse(width, height)
    size.value = {
      width,
      height
    }
  });


  window.ipcRenderer.invoke('token-get').then((ret) => {
    if (!ret) {
      router.replace('/login')
    }
  })
})


function updateCollapse(width: number, _height: number) {
  if (width < 768) {
    menuCollapse.value = true
  } else {
    menuCollapse.value = false
  }
}

function to(path: string) {
  router.replace(path)
}

function toggleCollapse() {
  menuCollapse.value = !menuCollapse.value
}

const PATHS = [
  '/',
  '/tunnel',
  '/settings'
]






</script>



<template>
  <div class="app-container">
    <el-menu  v-if="menuDisplay" :style="menuStyle" :default-active="route.path" :collapse="menuCollapse">
      <el-menu-item @click="toggleCollapse">
        <el-icon v-if="menuCollapse">
          <i-ep-expand />
        </el-icon>
        <el-icon v-else>
          <i-ep-fold />
        </el-icon>
        <template #title>{{ menuCollapse ? '展开' : '收起' }}</template>
      </el-menu-item>
      <el-menu-item index="/" @click="to('/')">
        <el-icon>
          <i-ep-home-filled />
        </el-icon>
        <template #title>首页</template>
      </el-menu-item>

      <el-menu-item index="/tunnel" @click="to('/tunnel')">
        <el-icon>
          <i-ep-connection />
        </el-icon>
        <template #title>隧道</template>
      </el-menu-item>


      <el-menu-item index="/settings" @click="to('/settings')">
        <el-icon>
          <i-ep-setting />
        </el-icon>
        <template #title>设置</template>
      </el-menu-item>
    </el-menu>


    <div class="app-content">
      <RouterView v-slot="{ Component }">
        <template v-if="Component">
          <Transition mode="out-in">
            <!-- <KeepAlive> -->
            <Suspense>
              <!-- 主要内容 -->
              <component :is="Component"></component>
              <!-- 加载中状态 -->
              <template #fallback>
                正在加载...
              </template>
            </Suspense>
            <!-- </KeepAlive> -->
          </Transition>
        </template>
      </RouterView>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  width: 100vw;
  height: 100vh;
}

.app-siderbar {
  height: 100vh;
  overflow: hidden;
  width: 200px !important;
}

.normal-siderbar {
  max-width: 180px;
  flex: 1;
}

.app-content {
  flex: 5;
}
</style>
