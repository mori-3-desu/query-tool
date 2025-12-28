export type SortType = 'length-desc' | 'length-asc' | 'dict' | 'numeric-desc' | 'numeric-asc';

export const sortList = (list: string[], type: SortType): string[] => {
  const sorted = [...list];
  
  // 文字列から数値を最強に抜き出すヘルパー
  const extractNumber = (str: string): number => {
    // 1. 全角数字を半角に変換 (７ -> 7)
    const halfWidth = str.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
    // 2. カンマを除去 (1,000 -> 1000)
    const noComma = halfWidth.replace(/,/g, '');
    // 3. 最初の数値を検索
    const match = noComma.match(/-?\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  };

  switch (type) {
    case 'length-desc':
      return sorted.sort((a, b) => b.length - a.length || a.localeCompare(b, 'ja'));
    case 'length-asc':
      return sorted.sort((a, b) => a.length - b.length || a.localeCompare(b, 'ja'));
    case 'dict':
      return sorted.sort((a, b) => a.localeCompare(b, 'ja'));
    
    // 数値が高い順 (例: 100 -> 10 -> 1)
    case 'numeric-desc':
      return sorted.sort((a, b) => extractNumber(b) - extractNumber(a));
    
    // 数値が低い順 (例: 1 -> 10 -> 100)
    case 'numeric-asc':
      return sorted.sort((a, b) => extractNumber(a) - extractNumber(b));
      
    default:
      return sorted;
  }
};