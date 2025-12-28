// 関数を作成
import { describe, it, expect } from 'vitest';
import { filterList } from './filter';

describe('抽出モード', () => {
  //テストデータ(色々なパターンの言葉を用意)
  const input = ["りんご", "ごりら", "あおりんご", "りんご飴", "林檎"];

  // 部分一致(*値*)
  it('*値* で値を含んでたらすべて取り出せるか', () => {
    //【りんご】を含んでいるもの(りんご、あおりんご、りんご飴)
    const result = filterList(input, '*りんご*');
    expect(result).toEqual(["りんご", "あおりんご", "りんご飴"]);
  });

  // 前方一致(値*)
  it('値* で値が含まれているものを取り出せるか', () => {
    const result = filterList(input, 'りんご*');
    expect(result).toEqual(["りんご", "りんご飴"]);
  });

  // 後方一致(*値)
  it('*値 で値が含まれているものを取り出せるか', () => {
    const result = filterList(input, '*りんご');
    expect(result).toEqual(["りんご", "あおりんご"]);
  });

  // 完全一致(値)
  it('アスタリスクなしで値と一致するもののみを取り出せるか', () => {
    const result = filterList(input, 'りんご');
    expect(result).toEqual(["りんご"]);
  });

  // マッチしない場合
  it('マッチしない場合、空のリストになるか', () => {
    const result = filterList(input, 'ばなな');
    expect(result).toEqual([]);
  });
});

 