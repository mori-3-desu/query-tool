//　重複テスト
// 関数を作成
import { describe, it, expect } from 'vitest';
import { removeDuplicates } from './duplication';
    //テスト 重複が含まれているか
describe('重複削除機能', () => {
    it('重複が含まれている場合、削除して値を返すか', () => {
        const input = ["りんご", "みかん", "りんご", "ぶどう"];

        //重複を消す関数を使う
        const result = removeDuplicates(input);

        //りんごが一つになって、合計三つになってるはず
        expect(result).toEqual(["りんご", "みかん", "ぶどう"]);
    });

    it('重複がない場合は、そのままオッケーを返すか変化しないか', () => {
        const input = ["A", "B", "C"];
        const result = removeDuplicates(input);
        expect(result).toEqual(["A", "B", "C"]);
    });
});
