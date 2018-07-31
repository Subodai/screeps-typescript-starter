import * as STATE from "config/states";
import { BodyBuilder } from "functions/tools";

export class Refiller {
    public static ticksBeforeRenew: number = 100;
    public static colour: string = "#888888";
    public static roleName: string = "refil";
    public static roster: number[]      = [ 0, 0, 0, 0, 1, 1, 1, 2, 1 ];
    public static rosterLinks: number[] = [ 0, 0, 0, 0, 1, 2, 2, 3, 1 ];
    public static bodyStructure: BodyPartConstant[][] = [
        [],
        [],
        [],
        [],
        BodyBuilder({ CARRY: 5, MOVE: 5 }),
        BodyBuilder({ CARRY: 10, MOVE: 10 }),
        BodyBuilder({ CARRY: 10, MOVE: 10 }),
        BodyBuilder({ CARRY: 20, MOVE: 20 }),
        BodyBuilder({ CARRY: 20, MOVE: 20 })
    ];

    /**
     * Refillers are only enabled at RCL4+ with storage
     * @param room
     */
    public static enabled(room: Room): boolean {
        if (room.memory.emergency) {
            if (room.storage && room.storage.store[RESOURCE_ENERGY] < 10000) {
                return false;
            }
        }
        // check for controller
        if (room.controller) {
            // check for level >= 4 and has storage
            if (room.controller.level >= 4 && room.storage) {
                return true;
            }
        }
        return false;
    }

    public static run(creep: Creep): void {
        // if creep is dying make sure it get's renewed
        creep.deathCheck(this.ticksBeforeRenew);
        // run as normal
        switch (creep.state) {
            // SPAWN state
            case STATE._SPAWN:
                creep.log("In Spawn state");
                if (!creep.isTired()) {
                    creep.log("Done spawning, transitioning to init");
                    creep.state = STATE._INIT;
                    this.run(creep);
                }
                break;
            // INIT state
            case STATE._INIT:
                this.runInitState(creep);
                break;
            // GATHERM state
            case STATE._GATHERM:
                creep.log("Fetching resources");

                if (creep.getNearbyMinerals(true, creep.memory.mineralType || undefined) === ERR_FULL) {
                    creep.log("Got Resrouces");
                    creep.state = STATE._DELIVERM;
                    this.run(creep);
                }
                break;
            // GATHER state
            case STATE._GATHER:
                creep.log("In gather state");
                if (creep.getNearbyEnergy(true) === ERR_FULL) {
                    creep.log("Got some energy");
                    creep.state = STATE._DELIVER;
                    this.run(creep);
                }
                break;
            // DELIVER resource
            case STATE._DELIVERM:
                creep.log("Delivering resources");
                if (creep.empty()) {
                    creep.state = STATE._INIT;
                    this.run(creep);
                }
                if (creep.deliverMinerals() === OK) {
                    creep.log("Delivered som resources");
                }
                break;
            // DELIVER state
            case STATE._DELIVER:
                creep.log("Delivering energy");
                if (creep.empty()) {
                    creep.state = STATE._INIT;
                    this.run(creep);
                }
                if (creep.deliverEnergy() === OK) {
                    creep.log("Delivered some energy");
                }
                break;
            // default unknown state
            default:
                creep.log("Creep in unknown state");
                creep.state = STATE._INIT;
                break;

        }
    }

    private static runInitState(creep: Creep): void {
        creep.log("Initiating Refiller");
        if (creep.atHome()) {
            creep.log("at home ready to gather");

            // Check for things that need energy
            const energyTargets = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => (
                    s.structureType === STRUCTURE_SPAWN ||
                    s.structureType === STRUCTURE_EXTENSION ||
                    s.structureType === STRUCTURE_TOWER ||
                    s.structureType === STRUCTURE_LAB
                ) && s.energy < s.energyCapacity && s.my
            });
            if (energyTargets.length > 0) {
                creep.state = STATE._GATHER;
                this.run(creep);
                return;
            }

            const resourceTargets = creep.room.find(FIND_STRUCTURES, {
                filter: (s) =>
                    s.structureType === STRUCTURE_LAB &&
                    (s.mineralIn !== null || s.compoundIn !== null) &&
                    s.mineralAmount < s.mineralCapacity &&
                    s.labType !== "reactor"
            });
            if (resourceTargets.length > 0) {
                const target: StructureLab = _.first(resourceTargets) as StructureLab;
                if (target.compoundIn) {
                    creep.memory.mineralType = target.compoundIn;
                } else if (target.mineralIn) {
                    creep.memory.mineralType = target.mineralIn;
                } else {
                    delete creep.memory.mineralType;
                }
                creep.state = STATE._GATHERM;
                this.run(creep);
                return;
            }
            // Just stick to gathering energy
            creep.state = STATE._GATHER;
            this.run(creep);
        }
    }
}
