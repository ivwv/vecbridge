/**
 * Tailwind CDN 主题配置（各示例页共用）
 * 用法：<script src="https://cdn.tailwindcss.com"></script>
 *       <script src="./assets/tailwind-theme.js"></script>
 */
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"Microsoft YaHei"', '"PingFang SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Cascadia Code"', 'Consolas', 'monospace'],
      },
    },
  },
};
