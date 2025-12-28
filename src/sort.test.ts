import { describe, it, expect } from 'vitest';
import { sortList } from './sort'; // ★ここを修正！

describe('ソート (並び替え)機能 ', () => {
  // テストデータ
  const input = ["柿", "ライオン", "ぱんだ"];

  // 1. 長い順
  it('文字数が降順（長い順）に並び変えられるか', () => { 
    const result = sortList(input, 'length-desc'); // ★ここも sortList に！
    expect(result).toEqual(["ライオン", "ぱんだ", "柿"]);
  });

  // 2. 短い順
  it('文字数が昇順（短い順）に並び変えられるか', () => {
    const result = sortList(input, 'length-asc'); // ★ここも！
    expect(result).toEqual(["柿", "ぱんだ", "ライオン"]);
  });

  // 3. 辞書順
  it('あいうえお順(辞書順)に並び変えられるか', () => {
    const result = sortList(input, 'dict'); // ★ここも！
    expect(result).toEqual(["ぱんだ", "ライオン", "柿"]);
  });
  
  // 4. 安全性
  it('元の配列が書き換わっていないか', () => {
    sortList(input, 'length-desc'); // ★ここも！
    expect(input).toEqual(["柿", "ライオン", "ぱんだ"]);
  });

  // ---------------------------------------------------
  // ■ 追加: 数値ソートのテスト
  // ---------------------------------------------------
  const numInput = ["アイテム10個", "アイテム2個", "アイテム1個", "アイテム20個"];

  it('数値が高い順（20→1）に並び変えられるか', () => {
    const result = sortList(numInput, 'numeric-desc'); // ★ここも！
    expect(result).toEqual(["アイテム20個", "アイテム10個", "アイテム2個", "アイテム1個"]);
  });

  it('数値が低い順（1→20）に並び変えられるか', () => {
    const result = sortList(numInput, 'numeric-asc'); // ★ここも！
    expect(result).toEqual(["アイテム1個", "アイテム2個", "アイテム10個", "アイテム20個"]);
  });
});