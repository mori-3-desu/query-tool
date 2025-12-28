import { sortList, type SortType } from "./sort";

export const processWordList = (array: string[], type: SortType) => {
    // 重複を削除する(Setを使う)
    const uniqueList = [...new Set(array)];

    // きれいになったリストを並び替えて返す
    return sortList(uniqueList, type);
};