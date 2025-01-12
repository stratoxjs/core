import stratoxViteEscapeLiteral from './stratox-vite-escape-literal'
import stratoxViteConfig from './stratox-vite-config'


export default function stratoxVitePlugin() {
  return [stratoxViteConfig(), stratoxViteEscapeLiteral()];
}
