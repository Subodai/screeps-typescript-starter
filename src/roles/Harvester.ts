import * as STATE from "config/states";
import { BodyBuilder } from "functions/tools";

/**
 * Harvesters collect energy in a room and bring it back to the base
 */
export class Harvester {
    public static ticksBeforeRenew: number = 100;
    public static colour: string = "#ffff00";
    public static roleName: string = "harvest";
    private static multiplier: number = 2;
    public static roster: number[] = [ 0, 2, 2, 2, 2, 2, 2, 2, 2 ];
    public static bodyStructure: BodyPartConstant[][] = [
        [],
        BodyBuilder({ WORK: 1, CARRY: 2, MOVE: 2 }),
        BodyBuilder({ WORK: 1, CARRY: 3, MOVE: 4 }),
        BodyBuilder({ CARRY: 5, MOVE: 5 }),
        BodyBuilder({ CARRY: 13, MOVE: 13 }),
        BodyBuilder({ CARRY: 18, MOVE: 18 }),
        BodyBuilder({ CARRY: 18, MOVE: 18 }),
        BodyBuilder({ CARRY: 18, MOVE: 18 }),
        BodyBuilder({ CARRY: 18, MOVE: 18 })
    ];
    // is role enabled
    public static enabled(room: Room): boolean {
        if (!room.memory.charging && global.chargeRoom && global.chargeRoom === room.name) { return false; }
        if (room.controller && room.memory.minersNeeded && room.memory.minersNeeded > 0) {
            const list = room.activeCreepsInRole(this);
            if (list.length < room.memory.minersNeeded * this.multiplier) {
                return true;
            }
        }
        return false;
    }
    // run the role
    public static run(creep: Creep): void {
        // if creep is dying make sure it gets renewed
        creep.deathCheck(this.ticksBeforeRenew);
        // run as normal
        switch (creep.state) {
            case STATE._SPAWN:
                this.runSpawnState(creep);
                break;
            // fall through
            case STATE._INIT:
                this.runInitState(creep);
                break;
            // GATHER Minerals state
            case STATE._GATHERM:
                this.runGatherMineralsState(creep);
                break;
            // GATHER state
            case STATE._GATHER:
                this.runGatherEnergyState(creep);
                break;
            // DELIVER state
            case STATE._DELIVER:
                this.runDeliverState(creep);
                break;
            default:
                creep.log("Creep in unknown state");
                creep.state = STATE._INIT;
                break;
        }
    }

    private static runSpawnState(creep: Creep): void {
        creep.log("In spawn state");
        if (!creep.isTired()) {
            creep.log("Done spawning setting to init");
            creep.state = STATE._INIT;
            this.run(creep);
        }
    }

    private static runInitState(creep: Creep): void {
        creep.log("Initiating Harvester");
        if (creep.atHome()) {
            if (!creep.empty()) {
                creep.state = STATE._DELIVER;
                this.run(creep);
            }
            creep.log("at home ready to collect");
            creep.state = STATE._GATHERM;
            this.run(creep);
        }
    }

    private static runGatherMineralsState(creep: Creep): void {
        creep.log("In gather Minerals state");
        // Attempt to gather minerals?
        const result = creep.getNearbyMinerals(true);
        switch  (result) {
            // Full, just put into deliver state
            case ERR_FULL:
                creep.log("Creep is full moving to deliver state");
                creep.state = STATE._DELIVER;
                this.run(creep);
                break;
            case OK:
            case ERR_INVALID_TARGET:
                creep.log("Travelling to minerals");
                break;
            // not found, just gather energy
            case ERR_NOT_FOUND:
            default:
                creep.log("No Minerals attempting energy instead " + result);
                creep.state = STATE._GATHER;
                this.run(creep);
                break;
        }
    }

    private static runGatherEnergyState(creep: Creep): void {
        creep.log("In gather Energy State");
        if (creep.getNearbyEnergy() === ERR_FULL) {
            creep.log("Got some energy");
            creep.state = STATE._DELIVER;
            this.run(creep);
        }
    }

    private static runDeliverState(creep: Creep): void {
        creep.log("Delivering energy");
        if (creep.empty()) {
            creep.state = STATE._INIT;
            // this.run(creep);
        }
        if (creep.atHome()) {
            if (creep.deliverEnergy() === OK && _.sum(creep.carry) === 0) {
                creep.log("Delivered some energy");
                creep.state = STATE._INIT;
            }
        }

    }
}
