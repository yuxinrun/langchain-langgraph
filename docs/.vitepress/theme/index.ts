import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import HeroDiagram from './components/HeroDiagram.vue'
import RuntimeStack from './components/RuntimeStack.vue'
import GraphAnatomy from './components/GraphAnatomy.vue'
import FrameworkBars from './components/FrameworkBars.vue'
import VersionTimeline from './components/VersionTimeline.vue'
import GraphFlow from './components/GraphFlow.vue'
import BrandMark from './components/BrandMark.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'home-hero-image': () => h(HeroDiagram),
      'home-hero-info-before': () => h(BrandMark, { variant: 'pill' })
    })
  },
  enhanceApp({ app }) {
    app.component('BrandMark', BrandMark)
    app.component('RuntimeStack', RuntimeStack)
    app.component('GraphAnatomy', GraphAnatomy)
    app.component('FrameworkBars', FrameworkBars)
    app.component('VersionTimeline', VersionTimeline)
    app.component('GraphFlow', GraphFlow)
  }
}
