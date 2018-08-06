import { Debug } from "functions/debug";

/**
 * Load Structure Lab Prototype Extensions
 */
Debug.Log("Prototype: StructureLab");

StructureLab.prototype.log = function(msg: string): void {
    Debug.Lab(msg, this);
};

Object.defineProperty(StructureLab.prototype, "mineralIn", {
    configurable: true,
    enumerable: false,
    get(): MineralConstant | null {
        this.initMemory();
        return Memory.structures[this.id].mineralIn || null;
    },
    set(v: MineralConstant | null): MineralConstant | null {
        return _.set(Memory, "structures." + this.id + ".mineralIn", v);
    }
});

Object.defineProperty(StructureLab.prototype, "compoundIn", {
    configurable: true,
    enumerable: false,
    get(): ResourceConstant | null {
        this.initMemory();
        return Memory.structures[this.id].compoundIn || null;
    },
    set(v: ResourceConstant | null): ResourceConstant | null {
        return _.set(Memory, "structures." + this.id + ".compoundIn", v);
    }
});

Object.defineProperty(StructureLab.prototype, "compoundOut", {
    configurable: true,
    enumerable: false,
    get(): ResourceConstant | null {
        this.initMemory();
        return Memory.structures[this.id].compoundOut || null;
    },
    set(v: ResourceConstant | null): ResourceConstant | null {
        return _.set(Memory, "structures." + this.id + ".compoundOut", v);
    }
});

Object.defineProperty(StructureLab.prototype, "boostTarget", {
    configurable: true,
    enumerable: false,
    get(): BoostTarget | null {
        this.initMemory();
        return Memory.structures[this.id].boostTarget || null;
    },
    set(v: BoostTarget | null): BoostTarget | null {
        return _.set(Memory, "structures." + this.id + ".boostTarget", v);
    }
});

Object.defineProperty(StructureLab.prototype, "reaction", {
    configurable: true,
    enumerable: false,
    get(): LabReaction | null {
        this.initMemory();
        const response = Memory.structures[this.id].reaction || null;
        if (response === null) {
            return response;
        }
        const reaction: LabReaction = {
            sourceLab1: Game.getObjectById(response.sourceLab1) as StructureLab,
            // tslint:disable-next-line:object-literal-sort-keys
            sourceLab2: Game.getObjectById(response.sourceLab2) as StructureLab,
            targetLab: this
        };
        return reaction;
    },
    set(v: LabReaction | null): LabReaction | null {
        if (v === null) {
            return _.set(Memory, "structures." + this.id + ".reaction", v);
        }
        const data = {
            sourceLab1: v.sourceLab1.id,
            // tslint:disable-next-line:object-literal-sort-keys
            sourceLab2: v.sourceLab2.id,
            targetLab: v.targetLab.id
        };
        return _.set(Memory, "structures." + this.id + ".reaction", data);
    }
});

/**
 * Define the labType based on it's position
 */
Object.defineProperty(StructureLab.prototype, "labType", {
    configurable: true,
    enumerable: false,
    get(): any {
        this.initMemory();
        if (!Memory.structures[this.id].labType) {
            const lab: StructureLab = this;
            let type: string = "reactor";
            // if we're within 2 of the terminal, we're a feeder
            if (lab.room.terminal && this.pos.inRangeTo(lab.room.terminal, 2)) {
                type = "feeder";
            }
            const spawns: StructureSpawn[] = lab.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_SPAWN
            }) as StructureSpawn[];

            let booster = false;
            for (const spawn of spawns) {
                if (spawn.pos.getRangeTo(lab) <= 1) {
                    booster = true;
                    break;
                }
            }
            if (booster) {
                type = "booster";
            }
            // Initialise this link
            Memory.structures[this.id].labType = type;
        }
        return Memory.structures[this.id].labType;
    },
    set(v: any): any {
        return _.set(Memory, "structures." + this.id + ".labType", v);
    }
});

Object.defineProperty(StructureLab.prototype, "emptyMe", {
    configurable: true,
    enumerable: false,
    get(): boolean {
        this.initMemory();
        return Memory.structures[this.id].emptyMe || false;
    },
    set(v: boolean): BoostTarget | null {
        return _.set(Memory, "structures." + this.id + ".emptyMe", v);
    }
});
