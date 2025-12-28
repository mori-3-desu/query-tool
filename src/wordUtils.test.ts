// 関数を作成
import { describe, it, expect } from 'vitest';
import { processWordList } from './wordUtils';

// 重複削除 ＆ ソート
describe('リスト加工(重複削除 & ソート)', () => {
  // テストデータ(重複あり、バラバラ）
  const input = ["みかん", "パイナップル", "みかん", "apple", "柿", "パイナップル"];
  // 重複を削除して短い順に並べ替えられるか
  it('重複を削除して短い順に並べ替えられるか', () => {
    const result = processWordList(input, 'length-asc');
    expect(result).toEqual(["柿", "みかん", "apple", "パイナップル"]);
  });

  //重複を削除して長い順に並べ替えられるか
  it('重複を削除して長い順に並べ替えられるか', () => {
    const result = processWordList(input, 'length-desc');
    expect(result).toEqual(["パイナップル", "apple", "みかん", "柿"]);
  });

  //重複を削除してあいうえお順に並べ替えられるか
  it('重複を削除してあいうえお順に並べ替えられるか', () => {
    const result = processWordList(input, 'dict');
    expect(result).toEqual(["apple", "パイナップル", "みかん", "柿"]);
  });

  //重複のみ削除するか
  it('重複のみ削除するか', () => {
    // どんな並び替えモードでもいいので実行
    const result = processWordList(input, 'length-asc');
    // 重複が削除されて4個になってるはず
    expect(result.length).toBe(4);
  });
});
