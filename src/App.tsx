import { useState, useEffect } from 'react';
import { processWordList } from './wordUtils';
import { filterList } from './filter';
import { rangeSort } from './rangeSorter';
import { type SortType } from './sort';

// アイコン共通クラス
const iconBase = "inline-block mr-1 transform transition-transform group-hover:scale-110";

// ★さらに分かりやすくなったマニュアル (Readme)
const WELCOME_TEXT = `/* Query Tool v0.0 Ultimate
   エンジニアやクリエイターのための補助テキスト管理ツール

   【📁 ファイル操作】
   - ファイルを開く : PC内のテキストファイルを読み込みます。
   - 上書き保存   : 開いているファイルをそのまま上書き保存します。
   - 別名保存     : 編集した内容を新しいファイルとして保存します。

   【⚙️ モード別機能と例】
   1. 抽出/削除
      - 特定のキーワードを含む行だけを抜き出したり、逆に削除したりします。
      - (例) "error" と入力 → ログからエラー行だけを抽出
      
      [🔍 検索ヒント]
      - *りんご* : 部分一致 (これを含む行)  りんご  あおりんご  りんご飴
      - りんご* : 前方一致 (これで始まる行)  りんご  りんご飴
      - *りんご  : 後方一致 (これで終わる行)  りんご  あおりんご
      - りんご   : 完全一致 (値と完全に一致する行のみ)  りんご

   2. 置換
      - 文字列を別の文字に置き換えます。正規表現も使用可能。
      - (例) "foo" を "bar" に一括置換

   3. 範囲対象 (高度なソート)
      - 自分用で作りましたがよろしければお使いください！
      - データの構造を崩さずに、中身の値だけで並び替えます。
      - ★重要: 対象外の行（const やコメント等）の位置はそのままで、
        「指定したフォーマットに合う行だけ」が並び替わります。

      (例) 以下のようなデータの場合...
      const DATA = [
        { id: 100, name: "Sample" },
        { id: 2, name: "Test" },
        { id: 50, name: "Demo" }
      ];
      
      ※フォーマットに { id: !, name: ? } と指定すると、
      !を基準にして(上の例だと100,2,5の列が基準対象){}が含まれている行のみがソートされ、const等の行の位置はそのまま維持されます。

   【Tips】
   - サイドバーの境界線をドラッグすると幅を変えられます ↔️
   - 下のログエリアの境界線をドラッグすると高さを変えられます ↕️
   - 右上の「❓ 使い方」ボタンでいつでもこの画面に戻れます。
   お問い合わせ / Source Code】
   ツールをよりよくしていきたいため、バグ報告や機能要望などございましたら
   GitHubの "Issues" までお気軽にご連絡ください！
   👉 https://github.com/mori-3-desu/query-tool
*/

const DATA = [
  { id: 100, name: "Sample" },
  { id: 2, name: "Test" },
  { id: 50, name: "Demo" }
];`;

function App() {
  // 初期値をマニュアルに設定
  const [text, setText] = useState<string>(WELCOME_TEXT);
  const [history, setHistory] = useState<string[]>([]);

  // ダークモード設定
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  const [sortType, setSortType] = useState<SortType>('length-desc'); //ソート設定 (文字数順/辞書順など)
  const [removeDuplicate, setRemoveDuplicate] = useState(true); //重複削除設定
  const [mode, setMode] = useState<'extract' | 'replace' | 'range'>('extract'); //抽出・置換・範囲検索モード

  const [filterKeyword, setFilterKeyword] = useState(''); //特定の要素を取り出す設定 絞り込み/検索キーワード
  const [formatString, setFormatString] = useState('{ jp: "!", roma: "?" }'); //範囲検索のフォーマット指定
  const [autoComma, setAutoComma] = useState(true); //末尾への自動カンマ付与設定
  const [isExcludeMode, setIsExcludeMode] = useState(false); //除外(行削除)モードのON/OFF

  // 置換用
  const [replaceTarget, setReplaceTarget] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [useRegex, setUseRegex] = useState(false);

  // ファイル操作・ログ
  const [fileHandle, setFileHandle] = useState<any>(null);
  const [deletedLines, setDeletedLines] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  // リサイズ機能（縦：ログエリア）
  const [logHeight, setLogHeight] = useState(240);
  const [isResizingLog, setIsResizingLog] = useState(false);

  // リサイズ機能（横：サイドバー）
  const [sidebarWidth, setSidebarWidth] = useState(384); // 初期幅 (w-96相当)
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  // --- ライトモードダークモード ---
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // --- マニュアル表示機能 ---
  const showManual = () => {
    if (text.trim() !== '' && !confirm('エディタの内容が上書きされますが、マニュアルを表示しますか？')) {
      return;
    }
    setHistory(prev => [...prev, text]);
    setText(WELCOME_TEXT);
    setStatusMessage('📖 マニュアルを表示しました');
  };

  // --- リサイズ処理 (縦) ---
  const startResizingLog = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizingLog(true);
    const startY = mouseDownEvent.clientY;
    const startHeight = logHeight;

    const onMouseMove = (e: MouseEvent) => {
      const newHeight = startHeight - (e.clientY - startY);
      if (newHeight > 50 && newHeight < 800) setLogHeight(newHeight);
    };
    const onMouseUp = () => {
      setIsResizingLog(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // --- リサイズ処理 (横) ---
  const startResizingSidebar = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizingSidebar(true);
    const startX = mouseDownEvent.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      if (newWidth > 250 && newWidth < 800) setSidebarWidth(newWidth);
    };
    const onMouseUp = () => {
      setIsResizingSidebar(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // --- ファイル操作 ---
  const handleOpenFile = async () => {
    try {
      // @ts-ignore
      const [handle] = await window.showOpenFilePicker({ types: [{ description: 'Text Files', accept: { 'text/plain': ['.txt', '.js', '.ts', '.json', '.csv', '.html', '.css', '.py'] } }] });
      const file = await handle.getFile();
      const contents = await file.text();
      setText(contents);
      setFileHandle(handle);
      setHistory([]);
      setDeletedLines([]);
      setStatusMessage(`📂 ${file.name} を開きました`);
    } catch (err) { }
  };

  // --- 上書き保存 ---
  const handleOverwriteSave = async () => {
    if (!text || !fileHandle) return;
    if (!confirm(`【確認】"${fileHandle.name}" を上書き保存しますか？`)) return;
    try {
      const writable = await fileHandle.createWritable();
      await writable.write(text);
      await writable.close();
      setStatusMessage('✅ 保存完了！');
    } catch (err) { alert('❌ 保存に失敗しました'); }
  };

  // --- 別名保存 ---
  const handleExportSave = () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = fileHandle ? fileHandle.name.replace(/(\.[\w\d_-]+)$/i, '_edited$1') : 'edited.txt';
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMessage('📥 別名保存完了');
  };

  // --- 1個前に戻る ---
  const handleUndo = () => {
    if (history.length === 0) return;
    setText(history[history.length - 1]);
    setHistory(prev => prev.slice(0, -1));
    setDeletedLines([]);
    setStatusMessage('↩️ Undoしました');
  };

  // --- デバッグ等取り除き用(使用場所限られるかも) ---
  const setConsoleLogPreset = () => {
    setReplaceTarget('console\\.log\\s*\\(.*?\\);?');
    setReplaceValue('');
    setUseRegex(true);
    setStatusMessage('🔧 console.log削除設定を適用');
  };

  // --- 抽出・置換・範囲・重複・クリア処理
  const handleProcess = () => {
    setHistory(prev => [...prev, text]);
    let resultText = '';
    const originalLines = text.split('\n');
    let logLines: string[] = [];

    if (mode === 'replace') {
      if (!replaceTarget) return;
      try {
        const pattern = useRegex ? replaceTarget : replaceTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(pattern, 'g');
        originalLines.forEach((line) => {
          if (searchRegex.test(line)) {
            const newLine = line.replace(searchRegex, replaceValue);
            logLines.push(`🔄 ${line.trim()} → ${newLine.trim() || '(削除)'}`);
          }
        });
        resultText = text.replace(searchRegex, replaceValue);
        if (text !== resultText) {
          setStatusMessage(`✨ ${logLines.length}箇所を置換しました`);
          setDeletedLines(logLines);
        } else {
          setStatusMessage('⚠️ 対象が見つかりませんでした');
          setDeletedLines([]);
        }
      } catch (e) {
        alert('❌ 正規表現が正しくありません');
        return;
      }
    } else {
      if (mode === 'range') {
        resultText = rangeSort(text, sortType, filterKeyword, removeDuplicate, formatString, autoComma);
        setStatusMessage('⚡ 範囲変換完了');
      } else {
        let list = originalLines;
        list = filterList(list, filterKeyword, isExcludeMode);
        const resultArr = processWordList(list, sortType);
        resultText = resultArr.join('\n');
        setStatusMessage('⚡ 抽出/削除完了');
      }

      const normalize = (s: string) => s.trim().replace(/,$/, '');
      const resultCount = new Map<string, number>();
      resultText.split('\n').forEach(line => {
        const key = normalize(line);
        if (key) resultCount.set(key, (resultCount.get(key) || 0) + 1);
      });
      let deleted: string[] = [];
      originalLines.forEach(line => {
        const key = normalize(line);
        if (!key) return;
        const count = resultCount.get(key) || 0;
        if (count > 0) {
          resultCount.set(key, count - 1);
        } else {
          deleted.push(`🗑️ 除外/重複: ${line.trim()}`);
        }
      });
      setDeletedLines(deleted);
    }
    setText(resultText);
  };

  const handleClear = () => {
    if (confirm('エディタを空にしますか？')) {
      setHistory(prev => [...prev, text]);
      setText('');
      setDeletedLines([]);
      setStatusMessage('🧹 クリアしました');
    }
  };

  // ボタンStyle
  const btnBase = "flex-1 py-2 rounded font-bold text-xs shadow transition-all duration-150 active:scale-95 active:shadow-inner";
  const btnPrimary = `${btnBase} bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800`;
  const btnSuccess = `${btnBase} bg-green-600 text-white hover:bg-green-700 active:bg-green-800`;
  const btnSecondary = `${btnBase} bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:active:bg-gray-800`;
  const btnBlue = `${btnBase} bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700`;
  const btnOutline = `py-1.5 px-3 rounded text-xs font-bold border transition-all duration-150 active:scale-95`;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans">
      {/* Header */}
      <header className="flex-none h-16 px-6 flex justify-between items-center bg-white dark:bg-gray-800 shadow-sm z-20 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-extrabold flex items-center gap-2 tracking-tight">
          <span className="text-2xl">🗃️</span> Query Tool <span className="text-sm font-medium text-gray-500 dark:text-gray-400">v1.0</span>
        </h1>
        <div className="flex gap-3 items-center">
          {/* 使い方ボタン */}
          <button onClick={showManual} className="text-xs font-bold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full transition-all active:scale-95 flex items-center gap-1">
            <span>❓</span> 使い方
          </button>
          
          {statusMessage && <span className="text-xs font-bold text-green-600 dark:text-green-400 px-3 py-1 bg-green-50 dark:bg-green-900/30 rounded-full animate-pulse">{statusMessage}</span>}
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-90">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 flex overflow-hidden p-4 gap-0 w-full relative">

        {/* Sidebar */}
        <div style={{ width: sidebarWidth }} className="flex-none flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">

          {/* File Panel */}
          <section className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-md transition-shadow">
            <h2 className="font-bold mb-3 text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
              <span className={iconBase}>📁</span> FILE CONTROL
            </h2>
            <div className="flex flex-col gap-3">
              <button onClick={handleOpenFile} className={btnBlue}>📂 ファイルを開く</button>
              <div className="flex gap-3">
                <button onClick={handleOverwriteSave} disabled={!fileHandle} className={fileHandle ? btnSuccess : btnSecondary}>💾 上書き保存</button>
                <button onClick={handleExportSave} className={btnPrimary}>📥 別名保存</button>
              </div>
            </div>
          </section>

          {/* Mode Panel */}
          <section className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-md transition-shadow">
            <h2 className="font-bold mb-3 text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
              <span className={iconBase}>⚙️</span> MODE SELECT
            </h2>
            <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1.5 mb-4 shadow-inner">
              {['extract', 'replace', 'range'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m as any)}
                  className={`flex-1 py-2 rounded-md text-xs font-bold transition-all duration-200 ${mode === m ? 'bg-white dark:bg-gray-600 shadow-sm text-purple-600 dark:text-purple-300 scale-[1.02]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  {m === 'extract' ? '抽出/削除' : m === 'replace' ? '置換' : '範囲対象'}
                </button>
              ))}
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
              {mode === 'extract' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-purple-500 dark:text-purple-400 mb-1">{isExcludeMode ? '💀 除外キーワード' : '🔍 抽出キーワード'}</label>
                    <input type="text" value={filterKeyword} onChange={(e) => setFilterKeyword(e.target.value)} placeholder="例: *apple*" className="w-full p-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:border-purple-500 transition-colors shadow-sm" />
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-xs text-purple-700 dark:text-purple-300 flex gap-2 items-start">
                    <span className="text-lg">💡</span>
                    <div>
                      <p className="font-bold mb-1">ヒント</p>
                      <ul className="list-disc list-inside space-y-1 opacity-80">
                        <li><code className="bg-purple-100 dark:bg-purple-800/50 px-1.5 py-0.5 rounded">*りんご*</code> : 部分一致</li>
                        <li><code className="bg-purple-100 dark:bg-purple-800/50 px-1.5 py-0.5 rounded">りんご*</code> : 前方一致</li>
                        <li><code className="bg-purple-100 dark:bg-purple-800/50 px-1.5 py-0.5 rounded">*りんご</code> : 後方一致</li>
                        <li><code className="bg-purple-100 dark:bg-purple-800/50 px-1.5 py-0.5 rounded">りんご</code> : 完全一致</li>
                      </ul>
                    </div>
                  </div>
                  <label className="flex items-center cursor-pointer p-3 rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
                    <input type="checkbox" checked={isExcludeMode} onChange={(e) => setIsExcludeMode(e.target.checked)} className="w-5 h-5 mr-3 accent-red-500" />
                    <span className="text-sm font-bold text-red-500 dark:text-red-400">🔥 行ごと完全に削除</span>
                  </label>
                </div>
              )}

              {mode === 'replace' && (
                <div className="space-y-4">
                  <button onClick={setConsoleLogPreset} className={`${btnOutline} w-full border-blue-300 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-white dark:bg-transparent`}>✨ プリセット: console.logを削除</button>
                  <input type="text" value={replaceTarget} onChange={(e) => setReplaceTarget(e.target.value)} placeholder="検索対象" className="w-full p-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 font-mono outline-none focus:border-blue-500 transition-colors shadow-sm" />
                  <input type="text" value={replaceValue} onChange={(e) => setReplaceValue(e.target.value)} placeholder="置換後 (空で削除)" className="w-full p-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 font-mono outline-none focus:border-blue-500 transition-colors shadow-sm" />
                  <label className="flex items-center text-sm text-gray-600 dark:text-gray-400 cursor-pointer"><input type="checkbox" checked={useRegex} onChange={(e) => setUseRegex(e.target.checked)} className="w-4 h-4 mr-2 accent-blue-500" /> 正規表現を使う</label>
                </div>
              )}

              {mode === 'range' && (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-xs text-green-700 dark:text-green-300 flex gap-2 items-start">
                    <span className="text-lg">✨</span>
                    <div>
                      <p className="font-bold text-green-600 dark:text-green-400 mb-1">フォーマット指定</p>
                      <p><code>!</code> <span className="mx-1 opacity-50">→</span> ソート基準を指定</p>
                      <p><code>?</code> <span className="mx-1 opacity-50">→</span> ソート基準によって値が変わる場所</p>
                    </div>
                  </div>
                  <input type="text" value={formatString} onChange={(e) => setFormatString(e.target.value)} className="w-full p-3 text-sm font-mono rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:border-green-500 transition-colors shadow-sm" />
                  <label className="flex items-center text-sm text-gray-600 dark:text-gray-400 cursor-pointer"><input type="checkbox" checked={autoComma} onChange={(e) => setAutoComma(e.target.checked)} className="w-4 h-4 mr-2 accent-green-500" /> 末尾に自動カンマ</label>
                  <input type="text" value={filterKeyword} onChange={(e) => setFilterKeyword(e.target.value)} placeholder="範囲内絞り込み" className="w-full p-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:border-green-500 transition-colors shadow-sm" />
                </div>
              )}
            </div>
          </section>

          {/* Action Panel */}
          <section className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-md transition-shadow sticky bottom-0">
            <h2 className="font-bold mb-3 text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
              <span className={iconBase}>⚡️</span> ACTION
            </h2>
            <div className="space-y-3">
              {mode !== 'replace' && (
                <>
                  <label className="flex items-center text-sm font-medium cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"><input type="checkbox" checked={removeDuplicate} onChange={(e) => setRemoveDuplicate(e.target.checked)} className="w-5 h-5 mr-3 accent-purple-500 rounded" /> 重複を自動削除</label>
                  <div className="relative">
                    <select value={sortType} onChange={(e) => setSortType(e.target.value as SortType)} className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm outline-none appearance-none focus:border-purple-500 transition-colors shadow-sm cursor-pointer font-medium">
                      <option value="length-desc">⬇️ 文字数が多い順</option>
                      <option value="length-asc">⬆️ 文字数が少ない順</option>
                      <option value="dict">🔤 辞書順 (A-Z)</option>
                      <option value="numeric-desc">🔢 数値が高い順 (9→1)</option>
                      <option value="numeric-asc">🔢 数値が低い順 (1→9)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">▼</div>
                  </div>
                </>
              )}
              <button
                onClick={handleProcess}
                className={`w-full py-3 rounded-xl text-white font-bold shadow-md transition-all duration-200 text-base ${mode === 'replace' ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700' : (isExcludeMode ? 'bg-red-500 hover:bg-red-600 active:bg-red-700' : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800')} active:scale-95 active:shadow-inner`}
              >
                {mode === 'replace' ? '🔄 置換を実行' : '⚡ 実行する'}
              </button>
            </div>
          </section>
        </div>

        {/* 横リサイズハンドル */}
        <div
          onMouseDown={startResizingSidebar}
          className={`w-4 -ml-2 cursor-col-resize flex items-center justify-center z-30 group hover:w-6 hover:-ml-3 transition-all`}
        >
          <div className={`w-1 h-12 rounded-full transition-colors ${isResizingSidebar ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-purple-400'}`} />
        </div>

        {/* Editor & Log */}
        <div className="flex-1 flex flex-col overflow-hidden h-full relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          
          {/* Editor Area */}
          <div className="flex-1 relative overflow-hidden min-h-0 group">
            <textarea
              className="absolute inset-0 w-full h-full p-6 bg-transparent border-none resize-none outline-none font-mono text-base leading-relaxed custom-scrollbar whitespace-pre text-gray-800 dark:text-gray-200 selection:bg-purple-200 dark:selection:bg-purple-900/50"
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              placeholder="ここにテキストを貼り付けてください..."
            />
            {/* 右上のボタン群 */}
            <div className="absolute top-3 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/80 dark:bg-gray-800/80 p-1 rounded-lg backdrop-blur-sm">
               <button onClick={handleUndo} disabled={history.length === 0} className={`${btnOutline} ${history.length > 0 ? 'border-yellow-400 text-yellow-600 hover:bg-yellow-50' : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}>↩️ Undo</button>
               <button onClick={() => navigator.clipboard.writeText(text)} className={`${btnOutline} border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700`}>📋 Copy</button>
               <button onClick={handleClear} className={`${btnOutline} border-red-300 text-red-500 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/30`}>🗑️ Clear</button>
            </div>
          </div>

          {/* 縦リサイズハンドル */}
          <div 
            onMouseDown={startResizingLog}
            className="h-8 -mt-4 z-20 cursor-row-resize flex items-center justify-center group w-full transition-all relative"
          >
            {/* v4対応のlinearグラデーション */}
            <div className={`absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-red-50/80 to-transparent dark:from-red-900/30 pointer-events-none transition-opacity ${isResizingLog ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
            <div className={`px-4 py-1 rounded-full flex items-center gap-2 text-xs font-bold transition-all shadow-sm backdrop-blur-md border ${isResizingLog ? 'bg-purple-500 text-white border-purple-500 scale-105' : 'bg-white/90 dark:bg-gray-800/90 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 group-hover:border-purple-400 group-hover:text-purple-500'}`}>
              <span className="text-lg leading-none">⬍</span> ログエリア
            </div>
          </div>

          {/* Log Area */}
          <div 
            style={{ height: logHeight }} 
            className="flex-none bg-red-50/80 dark:bg-red-900/30 border-t border-red-100 dark:border-red-900/50 flex flex-col overflow-hidden transition-none backdrop-blur-sm"
          >
            <div className="flex-none p-3 border-b border-red-100/50 dark:border-red-900/30 flex justify-between items-center">
              <h2 className="font-bold text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                {mode === 'replace' ? '🔄 置換履歴' : '🗑️ 削除/除外/重複ログ'}
                {deletedLines.length > 0 && <span className="bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full text-xs font-extrabold">{deletedLines.length}</span>}
              </h2>
              <button onClick={() => setDeletedLines([])} className="text-xs font-bold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors active:scale-95">ログをクリア</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar font-mono text-sm">
              {deletedLines.length > 0 ? (
                <div className="text-red-700 dark:text-red-300 space-y-1">
                  {deletedLines.map((line, i) => <div key={i} className="border-b border-red-200/30 dark:border-red-800/30 pb-1 hover:bg-red-100/50 dark:hover:bg-red-900/20 px-1 rounded transition-colors whitespace-pre-wrap break-all">{line}</div>)}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 italic gap-2 opacity-70">
                  <span className="text-4xl">📭</span>
                  <span>履歴はありません</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;