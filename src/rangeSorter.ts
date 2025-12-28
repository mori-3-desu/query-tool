import { type SortType } from './sort';

type ParsedLine = {
  original: string;
  val1: string; // ! (ソート基準)
  val2: string; // ? (付随する値)
};

// 1. 数値抽出ヘルパー
const extractNumber = (str: string): number => {
  const normalized = str
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/,/g, '');
  const match = normalized.match(/-?[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

// 2. マッチ判定ヘルパー
const checkMatchInline = (text: string, keyword: string): boolean => {
  if (!keyword) return true;
  if (keyword.startsWith('*') && keyword.endsWith('*')) return text.includes(keyword.slice(1, -1));
  if (keyword.startsWith('*')) return text.endsWith(keyword.slice(1));
  if (keyword.endsWith('*')) return text.startsWith(keyword.slice(0, -1));
  return text.includes(keyword);
};

// 3. 正規表現生成ヘルパー (厳密チェック用)
const createRegexFromFormat = (format: string): RegExp => {
  let temp = format.replace(/[.*+^${}()|[\]\\"'`]/g, '\\$&');
  temp = temp.replace(/\\"/g, '["\']').replace(/\\'/g, '["\']');
  temp = temp.replace(/\s+/g, '\\s*');
  const pattern = temp
    .replace('!', '(?<val1>.*?)') 
    .replace('\\?', '(?<val2>.*?)'); 
  return new RegExp(pattern);
};

export const rangeSort = (
  text: string, 
  type: SortType, 
  filterKeyword: string = '', 
  removeDuplicate: boolean = false,
  formatString: string = '{ jp: "!", roma: "?" }',
  addComma: boolean = true 
): string => {
  const lines = text.split('\n');
  const result: string[] = [];
  
  let buffer: ParsedLine[] = [];
  const strictPattern = createRegexFromFormat(formatString);

  // ★「!」がフォーマット文字列の "最初の方" にあるかチェック
  // これで、値が2つ取れた時にどっちを ! (val1) にするか決める
  const bangIndex = formatString.indexOf('!');
  const questionIndex = formatString.indexOf('?');
  const isBangFirst = bangIndex < questionIndex; // ! が ? より先なら true

  const flushBuffer = () => {
    if (buffer.length === 0) return;

    // A. フィルタリング
    let processedBuffer = buffer;
    if (filterKeyword) {
      processedBuffer = buffer.filter(item => 
        checkMatchInline(item.val1, filterKeyword) || checkMatchInline(item.val2, filterKeyword)
      );
    }

    // B. 重複削除
    if (removeDuplicate) {
      const seen = new Set<string>();
      processedBuffer = processedBuffer.filter(item => {
        const key = `${item.val1}:::${item.val2}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    // C. ソート (val1 = ! の部分を基準にする)
    processedBuffer.sort((a, b) => {
      const keyA = a.val1;
      const keyB = b.val1;

      switch (type) {
        case 'length-desc':
          return keyB.length - keyA.length || keyA.localeCompare(keyB, 'ja');
        case 'length-asc':
          return keyA.length - keyB.length || keyA.localeCompare(keyB, 'ja');
        case 'numeric-desc':
          return extractNumber(keyB) - extractNumber(keyA);
        case 'numeric-asc':
          return extractNumber(keyA) - extractNumber(keyB);
        case 'dict':
        default:
          return keyA.localeCompare(keyB, 'ja');
      }
    });

    // D. 出力
    if (addComma) {
        result.push(...processedBuffer.map(item => {
            return item.original.trim().endsWith(',') ? item.original : item.original + ',';
        }));
    } else {
        result.push(...processedBuffer.map(item => item.original));
    }
    
    buffer = [];
  };

  for (const line of lines) {
    // 1. まず厳密なパターンでチェック
    const strictMatch = line.match(strictPattern);
    
    if (strictMatch && strictMatch.groups) {
      const cleanLine = line.replace(/[,;]\s*$/, ''); 
      buffer.push({
        original: cleanLine,
        val1: strictMatch.groups.val1,
        val2: strictMatch.groups.val2
      });
    } 
    else {
      // 2. ★ここが新機能！厳密チェックでダメなら「値っぽいもの」を無理やり抽出
      // クォーテーションの中身 or 数字のカタマリ を2つ探す
      
      // 簡易版抽出ロジック：クォートの中身 or 単語 を抜き出す
      const values = line.match(/(".*?"|'.*?'|[-0-9,.]+)/g);

      if (values && values.length >= 2) {
         // 余計なクォートを外す
         const v1 = values[0].replace(/^["']|["']$/g, '');
         const v2 = values[1].replace(/^["']|["']$/g, '');
         
         const cleanLine = line.replace(/[,;]\s*$/, ''); 
         
         // フォーマット文字列での ! と ? の順番に従って割り当て
         buffer.push({
           original: cleanLine,
           val1: isBangFirst ? v1 : v2, // ! が先なら1つ目が val1
           val2: isBangFirst ? v2 : v1  // ! が後なら2つ目が val1
         });
      } else {
         // どうやってもデータに見えない行は無視して出力
         flushBuffer();
         result.push(line);
      }
    }
  }
  flushBuffer(); 

  return result.join('\n');
};