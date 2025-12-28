// ■ 判定ロジックだけを切り出した便利関数 (New!)
export const checkMatch = (text: string, keyword: string): boolean => {
  if (!keyword) return true; // キーワードなしなら全部OK

  // 1. 部分一致 (*値*)
  if (keyword.startsWith('*') && keyword.endsWith('*')) {
    const target = keyword.slice(1, -1);
    return text.includes(target);
  }

  // 2. 前方一致 (値*)
  if (keyword.endsWith('*')) {
    const target = keyword.slice(0, -1);
    return text.startsWith(target);
  }

  // 3. 後方一致 (*値)
  if (keyword.startsWith('*')) {
    const target = keyword.slice(1);
    return text.endsWith(target);
  }

  // 4. 完全一致
  return text === keyword;
};

// ■ 既存のリストフィルター関数 (中身ですぐ checkMatch を使うように修正)
export const filterList = (list: string[], keyword: string, exclude: boolean = false): string[] => {
  if (!keyword) return list;

  return list.filter(line => {
    const isMatch = checkMatch(line, keyword);
    // excludeがtrueなら「マッチしない」ものを残す
    return exclude ? !isMatch : isMatch;
  });
};