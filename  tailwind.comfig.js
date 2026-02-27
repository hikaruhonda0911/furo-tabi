module.exports = {
  theme: {
    extend: {
      colors: {
        furotabi: {
          // 背景
          base: '#FBFDFE',

          // 文字・主要UI高級感のある紺。
          main: '#020617',

          // アクセント：澄んだ水。
          accent: '#7DD3FC',

          // 補助テキスト：ノイズを削ぎ落とした薄いグレー。
          muted: '#64748B',

          // 境界線
          border: '#E2E8F0',

          //アクセントの深色
          'accent-dark': '#38BDF8',
        },
      },
      // デザイン哲学「引き算」を強調するための極細フォント設定
      fontWeight: {
        'extra-light': '100',
        light: '200',
      },
    },
  },
};
