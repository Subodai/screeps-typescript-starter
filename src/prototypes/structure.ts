import { Debug } from "functions/debug";

export function loadStructurePrototypes(): void {
    Debug.Log("Loading Structure Prototype");

    if (!Memory.structures) {
        Debug.Memory("Initialising Structure Memory");
        Memory.structures = {};
    }

    // Adds structure memory to OwnedStructure things.
    // Easier to reason about garbage collection in this implementation.
    Object.defineProperty(OwnedStructure.prototype, "memory", {
        configurable: true,
        enumerable: false,
        get(): any {
            if (!Memory.structures[this.id]) {
                Memory.structures[this.id] = {};
            }
            return Memory.structures[this.id];
        },
        set(v: any): any {
            return _.set(Memory, "structures." + this.id, v);
        }
    });
}