import { describe, it, expect } from 'vitest';
import { rangeSort } from './rangeSorter';

describe('rangeSort (逆パターン & 数値テスト)', () => {
  
  // ユーザー様の提示したケース
  const complexInput = `
const List = [
  [int: 45,000, string: "壊"],
  [int: 5,000, string: "破壊"],
];
  `;

  it('逆パターン [int: ?, string: !] で文字数昇順 (length-asc) が正しく動くか', () => {
    // ! = string("壊", "破壊") -> ソート基準
    // ? = int(45000, 5000) -> 値
    
    const result = rangeSort(
      complexInput, 
      'length-asc', // 文字数が少ない順
      '', 
      false, 
      '[int: ?, string: "!"]', // フォーマット指定
      true
    );

    // 期待: "壊" (1文字) が先、 "破壊" (2文字) が後
    // const行などは無視されるので、配列の中身の順序を確認
    
    // インデックス検索
    const indexShort = result.indexOf('45,000'); // "壊" の行
    const indexLong = result.indexOf('5,000');   // "破壊" の行

    // 45,000 ("壊") が先に来ているべき
    expect(indexShort).toBeLessThan(indexLong);
  });

  it('数値順 (numeric-desc) でカンマ付き数字が正しくソートされるか', () => {
    // ! = int (45000, 5000) -> ソート基準
    // ? = string -> 値
    
    const result = rangeSort(
      complexInput,
      'numeric-desc', // 数値が高い順
      '',
      false,
      '[int: "!", string: ?]', // 今度は数値を ! に指定
      true
    );
    
    // 期待: 45,000 が先、 5,000 が後
    const indexHigh = result.indexOf('45,000');
    const indexLow = result.indexOf('5,000');
    
    expect(indexHigh).toBeLessThan(indexLow);
  });
});