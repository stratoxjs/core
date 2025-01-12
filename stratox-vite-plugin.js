import stratoxViteEscapeLiteral from './stratox-vite-escape-literal.js'
import stratoxViteConfig from './stratox-vite-config.js'

export default function stratoxVitePlugin() {
  return [stratoxViteConfig(), stratoxViteEscapeLiteral()];
}
