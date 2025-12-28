/**
 * リストから重複を削除する関数
 * @param lines 元の文字列リスト
 * @returns 重複が消えた新しいリスト
 */
export const removeDuplicates = (lines: string[]): string[] => {
    // Setを使って重複を消し、[...]で再び配列に戻す
    return [...new Set(lines)];
};