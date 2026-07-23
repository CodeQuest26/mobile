import { createMMKV } from "react-native-mmkv";
import { StateStorage } from "zustand/middleware";

export const storage = createMMKV({ id: "makershub-storage" });

export const mmkvStorage: StateStorage = {
  getItem: (key) => storage.getString(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.remove(key),
};
