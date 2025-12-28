import { describe, it, expect } from 'vitest';
import { processWordList } from './wordUtils';

describe('リスト加工(ソートのみ)', () => {
  // 重複を含む入力データ
  const input = ["みかん", "apple", "パイナップル", "みかん", "パイナップル", "柿"];

  it('重複を残したまま短い順に並べ替えられるか', () => {
    const result = processWordList(input, 'length-asc');
    // 期待値: 重複はそのまま、文字数順になる
    expect(result).toEqual(["柿", "みかん", "みかん", "apple", "パイナップル", "パイナップル"]);
  });

  it('重複を残したまま長い順に並べ替えられるか', () => {
    const result = processWordList(input, 'length-desc');
    expect(result).toEqual(["パイナップル", "パイナップル", "apple", "みかん", "みかん", "柿"]);
  });

  it('重複を残したままあいうえお順に並べ替えられるか', () => {
    const result = processWordList(input, 'dict');
    // 辞書順 (英語 -> 日本語)
    expect(result).toEqual(["apple", "パイナップル", "パイナップル", "みかん", "みかん", "柿"]);
  });
});
