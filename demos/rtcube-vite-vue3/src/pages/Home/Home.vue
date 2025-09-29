<script setup lang="ts">
import { useLoginState } from '@tencentcloud/chat-uikit-vue3';
import { useRouter } from 'vue-router';

const { loginUserInfo } = useLoginState();

const router = useRouter();

type Product = {
  key: string;
  title: string;
  description: string;
  accent: string;
};

const products: Product[] = [
  { key: 'chat', title: 'Chat', description: '企业级聊天 UI 组件与引擎，一键集成 IM 体验', accent: '#4F8EF7' },
];

function goStages(sceneId: string) {
  if (loginUserInfo.value?.userId) {
    router.push({ name: 'Stages', params: { sceneId } });
  } else {
    router.push({ name: 'Login', params: { sceneId } });
  }
}
</script>

<template>
  <div class="home">
    <header class="hero">
      <div class="brand">
        RTCube
      </div>
      <h1 class="headline">
        下一代实时互动体验
      </h1>
      <p class="sub">
        用 RTCube 组件 搭建高端 Demo · 开箱即用
      </p>
      <div class="cta">
        <!-- <button class="primary" @click="goStages('chat')">
          立即体验 Chat
        </button> -->
        <!-- <button class="ghost" @click="goStages('live')">
          看看 Live
        </button> -->
      </div>
    </header>

    <section class="grid">
      <article
        v-for="item in products"
        :key="item.key"
        class="card"
        :style="{ '--accent': item.accent }"
      >
        <div class="badge" />
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
        <button class="enter" @click="goStages(item.key)">
          进入体验
        </button>
      </article>
    </section>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  background: radial-gradient(1200px 600px at 20% 0%, rgba(79,142,247,0.18), transparent),
              radial-gradient(900px 500px at 90% 10%, rgba(139,125,255,0.16), transparent),
              linear-gradient(180deg, #0f1222 0%, #0a0c18 100%);
  color: #e8ebff;
}
.hero {
  padding: 72px 24px 48px;
  text-align: center;
}
.brand {
  display: inline-block;
  font-weight: 700;
  letter-spacing: 2px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
}
.headline { font-size: 44px; margin: 16px 0 8px; }
.sub { opacity: 0.8; }
.cta { margin-top: 24px; display: flex; gap: 12px; justify-content: center; }
.primary {
  padding: 10px 18px; border-radius: 12px; border: none; color: #091021; font-weight: 600;
  background: linear-gradient(135deg, #6aa6ff, #4F8EF7); cursor: pointer;
}
.ghost {
  padding: 10px 18px; border-radius: 12px; background: transparent; border: 1px solid rgba(255,255,255,0.24);
  color: #e8ebff; cursor: pointer;
}
.grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;
  padding: 24px; max-width: 1100px; margin: 0 auto 60px;
}
.card {
  position: relative; padding: 20px; border-radius: 16px; background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  transition: transform .25s ease, box-shadow .25s ease;
}
.card:hover { transform: translateY(-3px); box-shadow: 0 16px 42px rgba(0,0,0,0.35); }
.badge {
  position: absolute; right: 18px; top: 18px; width: 12px; height: 12px; border-radius: 50%;
  background: var(--accent);
}
.enter {
  margin-top: 16px; padding: 8px 12px; border-radius: 10px; border: none; cursor: pointer;
  color: #0b1224; font-weight: 600; background: linear-gradient(135deg, var(--accent), #6ee7b7);
}
</style>
