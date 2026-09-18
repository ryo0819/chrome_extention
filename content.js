(() => {
    if (!('documentPictureInPicture' in window)) return;

    const BTN_CLASS = 'docpip-toggle-button';

    let pipWindow = null;
    let player = null;
    let placeholder = null;

    const getPlayer = () => document.querySelector('#movie_player');

    // ページのCSSをPiPウィンドウへコピーする（プレーヤーの見た目を保つため）
    const copyStyles = (win) => {
        for (const sheet of Array.from(document.styleSheets)) {
            try {
                const css = Array.from(sheet.cssRules).map((r) => r.cssText).join('');
                const style = win.document.createElement('style');
                style.textContent = css;
                win.document.head.appendChild(style);
            } catch (e) {
                // クロスオリジンのCSSは読めないのでlinkとして読み込ませる
                if (sheet.href) {
                    const link = win.document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = sheet.href;
                    win.document.head.appendChild(link);
                }
            }
        }

        const own = win.document.createElement('style');
        own.textContent = `
      html, body { margin: 0; padding: 0; width: 100%; height: 100%;
                   background: #000; overflow: hidden; }
      #movie_player { width: 100% !important; height: 100% !important; }
    `;
        win.document.head.appendChild(own);
    };

    // プレーヤーを元の位置へ戻す
    const restore = () => {
        if (player && placeholder && placeholder.parentNode) {
            placeholder.replaceWith(player);
            player.style.width = '';
            player.style.height = '';
            if (typeof player.setSize === 'function') player.setSize();
        }
        player = null;
        placeholder = null;
        pipWindow = null;
    };

    const openPip = async (event) => {
        event.stopPropagation();
        event.preventDefault();

        if (pipWindow) {
            pipWindow.close();
            return;
        }

        const target = getPlayer();
        if (!target) return;

        const rect = target.getBoundingClientRect();
        pipWindow = await documentPictureInPicture.requestWindow({
            width: Math.round(rect.width) || 640,
            height: Math.round(rect.height) || 360,
        });

        player = target;
        copyStyles(pipWindow);

        // 元の場所には同じ大きさの箱を残し、ページのレイアウト崩れを防ぐ
        placeholder = document.createElement('div');
        placeholder.style.width = `${rect.width}px`;
        placeholder.style.height = `${rect.height}px`;
        placeholder.style.background = '#000';
        player.replaceWith(placeholder);
        pipWindow.document.body.append(player);

        const fit = () => {
            if (typeof player.setSize === 'function') player.setSize();
        };
        pipWindow.addEventListener('resize', fit);
        fit();

        pipWindow.addEventListener('pagehide', restore, { once: true });
    };

    // プレーヤーのコントロール右側にボタンを追加する
    const addButton = () => {
        const controls = document.querySelector('.ytp-right-controls');
        if (!controls || controls.querySelector(`.${BTN_CLASS}`)) return;

        const btn = document.createElement('button');
        btn.className = `ytp-button ${BTN_CLASS}`;
        btn.title = 'ピクチャーインピクチャー（操作ボタン付き）';
        btn.textContent = '⧉';
        btn.style.cssText = 'font-size:18px;line-height:1;opacity:.9;';
        btn.addEventListener('click', openPip);
        controls.prepend(btn);
    };

    setInterval(addButton, 1000);
})();
