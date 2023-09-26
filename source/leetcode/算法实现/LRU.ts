type Key = string | number;

class LRUCache<T> {

  max: number = 1;

  cache: Map<Key, T> = new Map();

  keys: Key[] = [];

  constructor(max: number) {
    this.max = max;
  }

  private findKey(targetKey: Key) {
    return this.keys.findIndex(key => key === targetKey);
  }

  private removeKey(targetKey: Key) {
    const index = this.findKey(targetKey);
    if (index !== -1) {
      this.keys.splice(index, 1);
    }
  }

  private pruneCacheEntry(targetKey: Key) {
    this.removeKey(targetKey);
    this.cache.delete(targetKey);
  }

  get(key: Key) {
    if (this.findKey(key) === -1) {
      return null;
    }
    this.removeKey(key);
    this.keys.push(key);
    return this.cache.get(key);
  }
  put(key: Key, data: T) {
    const index = this.findKey(key);
    if (index === -1 && this.keys.length === this.max) {
      this.pruneCacheEntry(this.keys[0]);
    }
    this.removeKey(key);
    this.keys.push(key);
    this.cache.set(key, data);
    return this.cache.get(key) || null;
  }
}

let cache = new LRUCache<number>( 2 /* 缓存容量 */ );
const ans = [
  cache.put(1, 1),
  cache.put(2, 2),
  cache.get(1),    // 返回  1
  cache.put(3, 3),    // 该操作会使得密钥 2 作废
  cache.get(2),    // 返回 -1 (未找到)
  cache.put(4, 4),    // 该操作会使得密钥 1 作废
  cache.get(1),    // 返回 -1 (未找到)
  cache.get(3),       // 返回  3
  cache.get(4),       // 返回  4
];

ans.forEach(val => console.log(ans));