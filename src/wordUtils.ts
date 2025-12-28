import { type SortType } from './sort';

export function processWordList(lines: string[], sortType: SortType): string[] {
  // ここでの重複削除(Set)はやめて、そのままソートだけ行うように変更
  const list = [...lines];

  return list.sort((a, b) => {
    switch (sortType) {
      case 'length-desc':
        return b.length - a.length || a.localeCompare(b);
      case 'length-asc':
        return a.length - b.length || a.localeCompare(b);
      case 'dict':
        return a.localeCompare(b);
      case 'numeric-desc':
        return (parseFloat(b) || 0) - (parseFloat(a) || 0);
      case 'numeric-asc':
        return (parseFloat(a) || 0) - (parseFloat(b) || 0);
      default:
        return 0;
    }
  });
}