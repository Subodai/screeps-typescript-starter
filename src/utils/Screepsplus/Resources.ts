/**
 * Resources class for gathering details for stats
 */
export class Resources {
    public static getRooms(): object {
        const now = Game.time;
        if (global.resourcesTimeStamp === now) {
            return global.resources;
        }

        const retval: { [k: string]: any } = {};
        const minerals: { [k: string]: number } = {};

        for (const name in Game.rooms) {
            const room = Game.rooms[name];
            let summary = null;
            if (null === room) {
                summary = null;
            }

            // if this is a remote room
            if (!room.controller || !room.controller.my) {
                summary = this.SummarizeRemoteRoom(room);
                retval[name + "_remote"] = summary;
            } else {
                summary = this.SummarizeMyRoom(room);
                retval[name] = summary;
                this.AddStorageMinerals(room, minerals);
                this.AddTerminalMinerals(room, minerals);
            }
        }
        global.resourcesTimeStamp = now;
        global.roomSummary = retval;
        global.minerals = minerals;
        return retval;
    }

    private static SummarizeRemoteRoom(room: Room): object {
        return {};
    }

    private static SummarizeMyRoom(room: Room): object {
        if (null === room || undefined === room.controller || !room.controller.my) {
            return {};
        }
        // Dump a bunch of consts
        const controllerLevel               = room.controller.level;
        const controllerProgress            = room.controller.progress;
        const controllerNeeded              = room.controller.progressTotal;
        const controllerRequired            = controllerNeeded - controllerProgress;
        const controllerDowngrade           = room.controller.ticksToDowngrade;
        const controllerBlocked             = room.controller.upgradeBlocked;
        const controllerSafemode            = room.controller.safeMode ? room.controller.safeMode : 0;
        const controllerSafemodeAvail       = room.controller.safeModeAvailable;
        const controllerSafemodeCooldown    = room.controller.safeModeCooldown;
        const hasStorage                    = room.storage != null;
        const storageEnergy                 = room.storage ? room.storage.store[RESOURCE_ENERGY] : 0;
        const storageMinerals               = room.storage ? _.sum(room.storage.store) - storageEnergy : 0;
        const energyAvail                   = room.energyAvailable;
        const energyCap                     = room.energyCapacityAvailable;
        const containers: StructureContainer[] = room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_CONTAINER
        }) as StructureContainer[];
        const numContainers                 = containers == null ? 0 : containers.length;
        const containerEnergy               = _.sum(containers, (c: StructureContainer) => c.store[RESOURCE_ENERGY]);
        const sources: Source[]             = room.find(FIND_SOURCES);
        const numSources                    = sources == null ? 0 : sources.length;
        const sourceEnergy                  = _.sum(sources, (s: Source) => s.energy);
        const links: StructureLink[] = room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_LINK && s.my
        }) as StructureLink[];
        const numLinks                      = links == null ? 0 : links.length;
        const linkEnergy                    = _.sum(links, (l: StructureLink) => l.energy);
        const minerals                      = room.find(FIND_MINERALS);
        const mineral                       = minerals && minerals.length > 0 ? minerals[0] : null;
        const mineralType                   = mineral ? mineral.mineralType : "";
        const mineralAmount                 = mineral ? mineral.mineralAmount : 0;
        const extractors                    = room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_EXTRACTOR
        });
        const numExtractors                 = extractors.length;
        const creeps: Creep[]               = _.filter(Game.creeps, (c: Creep) => c.pos.roomName === room.name && c.my);
        const numCreeps                     = creeps ? creeps.length : 0;
        const enemyCreeps: Creep[]          = room.find(FIND_HOSTILE_CREEPS);
        const creepEnergy = _.sum(Game.creeps, (c: Creep) => c.pos.roomName === room.name ? c.carry.energy : 0);
        const numEnemies                    = enemyCreeps ? enemyCreeps.length : 0;
        const spawns: StructureSpawn[]      = room.find(FIND_MY_SPAWNS);
        const numSpawns                     = spawns ? spawns.length : 0;
        const spawnsSpawning                = _.sum(spawns, (s: StructureSpawn) => s.spawning ? 1 : 0);
        const towers: StructureTower[] = room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_TOWER && s.my
        }) as StructureTower[];
        const numTowers                     = towers ? towers.length : 0;
        const towerEnergy                   = _.sum(towers, (t: StructureTower) => t.energy);
        const constSites                    = room.find(FIND_CONSTRUCTION_SITES);
        const myConstSites = room.find(FIND_CONSTRUCTION_SITES, {
            filter: (cs) => cs.my
        });
        const numConstructionSites          = constSites.length;
        const numMyConstructionSites        = myConstSites.length;
        // const numSourceContainers = countSourceContainers(room);
        const hasTerminal                   = room.terminal != null;
        const terminalEnergy                = room.terminal ? room.terminal.store[RESOURCE_ENERGY] : 0;
        const terminalMinerals              = room.terminal ? _.sum(room.terminal.store) - terminalEnergy : 0;

        return {};
    }

    /**
     * Checks room for storage and pops it into the minerals object
     *
     * @param room
     * @param minerals
     */
    private static AddStorageMinerals(room: Room, minerals: { [k: string]: number }): void {
        if (room.storage) {
            for (const i in room.storage.store) {
                if (minerals[i] === undefined) {
                    minerals[i] = 0;
                }
                minerals[i] += room.storage.store[i];
            }
        }
    }

    /**
     * Checks room for terminal then adds to the minerals object
     *
     * @param room
     * @param minerals
     */
    private static AddTerminalMinerals(room: Room, minerals: { [k: string]: number }): void {
        if (room.terminal) {
            for (const i in room.terminal.store) {
                if (minerals[i] === undefined) {
                    minerals[i] = 0;
                }
                minerals[i] += room.terminal.store[i];
            }
        }
    }
}