(() => {
  const editor = document.getElementById('logo-editor');
  const languageSelect = document.getElementById('logo-languages');
  const examplesSelect = document.getElementById('logo-examples');
  const starterCode = 'repeat 4 [fd 120 rt 90]';

  function localizeChrome() {
    document.getElementById('logo-run').textContent = '実行 ▶';
    document.getElementById('logo-stop').textContent = '停止 ■';
    document.getElementById('logo-clear').textContent = '画面を消去';
    if (examplesSelect.options.length) {
      examplesSelect.options[0].textContent = 'サンプルを選択';
    }
    const english = languageSelect.querySelector('option[value="English"]');
    const spanish = languageSelect.querySelector('option[value="Spanish"]');
    if (english) english.textContent = 'English（英語）';
    if (spanish) spanish.textContent = 'Español（スペイン語）';
    const japanese = languageSelect.querySelector('option[value="Japanese"]');
    if (japanese) japanese.textContent = '日本語';
  }

  localizeChrome();
  languageSelect.addEventListener('change', localizeChrome);

  document.getElementById('logo-clear-code').addEventListener('click', () => {
    if (editor.value.trim() && !window.confirm('プログラムを消去しますか？（描いた絵は残ります）')) return;
    interpreter.clearCode();
  });

  if (!editor.value.trim()) editor.value = starterCode;

  editor.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !event.isComposing) {
      event.preventDefault();
      interpreter.run();
    }
  });
})();
