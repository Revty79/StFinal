import {
  EraModel,
  GalaxyStore,
  MarkerModel,
  SettingModel,
  WorldAggregate,
  WorldSummary,
} from "@/lib/galaxy/types";

const STORAGE_KEY = "galaxy_forge_web_v1";

const emptyStore = (): GalaxyStore => ({
  worlds: [],
  eras: [],
  settings: [],
  markers: [],
});

const sanitizeString = (value: string | null | undefined): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed;
};

const generateId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export interface GalaxyRepository {
  listWorlds(): Promise<WorldSummary[]>;
  getWorld(worldId: string): Promise<WorldAggregate | null>;
  createWorld(name: string, description?: string): Promise<WorldSummary>;
  updateWorld(world: WorldSummary): Promise<void>;
  deleteWorld(worldId: string): Promise<void>;

  listEras(worldId: string): Promise<EraModel[]>;
  upsertEra(era: EraModel): Promise<EraModel>;
  deleteEra(eraId: string): Promise<void>;

  listSettings(worldId: string): Promise<SettingModel[]>;
  upsertSetting(setting: SettingModel): Promise<SettingModel>;
  deleteSetting(settingId: string): Promise<void>;

  listMarkers(worldId: string): Promise<MarkerModel[]>;
  upsertMarker(marker: MarkerModel): Promise<MarkerModel>;
  deleteMarker(markerId: string): Promise<void>;
}

export class LocalStorageGalaxyRepository implements GalaxyRepository {
  private readStore(): GalaxyStore {
    if (typeof window === "undefined") {
      return emptyStore();
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyStore();
    }

    try {
      const parsed = JSON.parse(raw) as Partial<GalaxyStore>;
      return {
        worlds: parsed.worlds ?? [],
        eras: parsed.eras ?? [],
        settings: parsed.settings ?? [],
        markers: parsed.markers ?? [],
      };
    } catch {
      return emptyStore();
    }
  }

  private writeStore(store: GalaxyStore): void {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  private mutate<T>(updater: (store: GalaxyStore) => T): T {
    const store = this.readStore();
    const result = updater(store);
    this.writeStore(store);
    return result;
  }

  async listWorlds(): Promise<WorldSummary[]> {
    const store = this.readStore();
    return [...store.worlds].sort((a, b) => b.createdAt - a.createdAt);
  }

  async getWorld(worldId: string): Promise<WorldAggregate | null> {
    const store = this.readStore();
    const world = store.worlds.find((item) => item.id === worldId);
    if (!world) {
      return null;
    }

    return {
      ...world,
      eras: store.eras
        .filter((item) => item.worldId === worldId)
        .sort((a, b) => a.orderIndex - b.orderIndex || (a.startYear ?? 0) - (b.startYear ?? 0)),
      settings: store.settings
        .filter((item) => item.worldId === worldId)
        .sort((a, b) => a.name.localeCompare(b.name)),
      markers: store.markers
        .filter((item) => item.worldId === worldId)
        .sort((a, b) => (a.year ?? 0) - (b.year ?? 0) || a.name.localeCompare(b.name)),
    };
  }

  async createWorld(name: string, description?: string): Promise<WorldSummary> {
    return this.mutate((store) => {
      const world: WorldSummary = {
        id: generateId(),
        name: name.trim(),
        description: sanitizeString(description),
        createdAt: Date.now(),
      };
      store.worlds.unshift(world);
      return world;
    });
  }

  async updateWorld(world: WorldSummary): Promise<void> {
    this.mutate((store) => {
      const index = store.worlds.findIndex((item) => item.id === world.id);
      if (index < 0) {
        return;
      }
      store.worlds[index] = {
        ...world,
        name: world.name.trim(),
        description: sanitizeString(world.description),
      };
    });
  }

  async deleteWorld(worldId: string): Promise<void> {
    this.mutate((store) => {
      store.worlds = store.worlds.filter((item) => item.id !== worldId);
      store.eras = store.eras.filter((item) => item.worldId !== worldId);
      store.settings = store.settings.filter((item) => item.worldId !== worldId);
      store.markers = store.markers.filter((item) => item.worldId !== worldId);
    });
  }

  async listEras(worldId: string): Promise<EraModel[]> {
    const store = this.readStore();
    return store.eras
      .filter((item) => item.worldId === worldId)
      .sort((a, b) => a.orderIndex - b.orderIndex || (a.startYear ?? 0) - (b.startYear ?? 0));
  }

  async upsertEra(era: EraModel): Promise<EraModel> {
    return this.mutate((store) => {
      const id = era.id || generateId();
      const nextEra: EraModel = {
        ...era,
        id,
        name: era.name.trim(),
        description: sanitizeString(era.description),
      };
      const index = store.eras.findIndex((item) => item.id === id);
      if (index < 0) {
        store.eras.push(nextEra);
      } else {
        store.eras[index] = nextEra;
      }
      return nextEra;
    });
  }

  async deleteEra(eraId: string): Promise<void> {
    this.mutate((store) => {
      store.eras = store.eras.filter((item) => item.id !== eraId);
      store.settings = store.settings.map((setting) =>
        setting.eraId === eraId ? { ...setting, eraId: undefined } : setting,
      );
      store.markers = store.markers.map((marker) =>
        marker.eraId === eraId ? { ...marker, eraId: undefined } : marker,
      );
    });
  }

  async listSettings(worldId: string): Promise<SettingModel[]> {
    const store = this.readStore();
    return store.settings
      .filter((item) => item.worldId === worldId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async upsertSetting(setting: SettingModel): Promise<SettingModel> {
    return this.mutate((store) => {
      const id = setting.id || generateId();
      const nextSetting: SettingModel = {
        ...setting,
        id,
        name: setting.name.trim(),
        description: sanitizeString(setting.description),
      };
      const index = store.settings.findIndex((item) => item.id === id);
      if (index < 0) {
        store.settings.push(nextSetting);
      } else {
        store.settings[index] = nextSetting;
      }
      return nextSetting;
    });
  }

  async deleteSetting(settingId: string): Promise<void> {
    this.mutate((store) => {
      store.settings = store.settings.filter((item) => item.id !== settingId);
      store.markers = store.markers.map((marker) =>
        marker.settingId === settingId ? { ...marker, settingId: undefined } : marker,
      );
    });
  }

  async listMarkers(worldId: string): Promise<MarkerModel[]> {
    const store = this.readStore();
    return store.markers
      .filter((item) => item.worldId === worldId)
      .sort((a, b) => (a.year ?? 0) - (b.year ?? 0) || a.name.localeCompare(b.name));
  }

  async upsertMarker(marker: MarkerModel): Promise<MarkerModel> {
    return this.mutate((store) => {
      const id = marker.id || generateId();
      const nextMarker: MarkerModel = {
        ...marker,
        id,
        name: marker.name.trim(),
        description: sanitizeString(marker.description),
        category: sanitizeString(marker.category),
      };
      const index = store.markers.findIndex((item) => item.id === id);
      if (index < 0) {
        store.markers.push(nextMarker);
      } else {
        store.markers[index] = nextMarker;
      }
      return nextMarker;
    });
  }

  async deleteMarker(markerId: string): Promise<void> {
    this.mutate((store) => {
      store.markers = store.markers.filter((item) => item.id !== markerId);
    });
  }
}
