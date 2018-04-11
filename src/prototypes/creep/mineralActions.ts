/**
 * Creep Actions related to minerals
 */

/**
 * Get Nearby minerals to pickup
 */
Creep.prototype.getNearbyMinerals = function(storage: boolean = false): number {
    // First are we full?
    if (this.full()) {
        this.log("Creep full cannot get nearby minerals");
        // Clear the pickup target
        this.invalidateMineralTarget(true);
    }
    if (!this.memory.mineralPickup && storage) { this.findStorageMinerals(); }
    // Start with ground minerals
    if (!this.memory.mineralPickup) { this.findGroundMinerals(); }
    // Next Container Minerals
    if (!this.memory.mineralPickup) { this.findContainerMinerals(); }
    // Do we have a target?
    if (this.memory.mineralPickup) { return this.moveToAndPickupMinerals(); }
    // No target return not found
    return ERR_NOT_FOUND;
};

/**
 * Invalidate mineral storage in creep memory
 */
Creep.prototype.invalidateMineralTarget = function(full: boolean = false): number {
    delete this.memory.mineralPickup;
    if (full) { return ERR_FULL; }
    return ERR_INVALID_TARGET;
};

/**
 * Find minerals in storage
 */
Creep.prototype.findStorageMinerals = function(): void {
    // Have an override, call it storeMinerals for now (it'l do)
    if (this.room.memory.storeMinerals) { return; }
    const storage = this.room.storage;
    // Does this room have a storage? (no harm in checking)
    if (storage) {
        // Is there something other than energy in the storage?
        if (_.sum(storage.store) - storage.store[RESOURCE_ENERGY] > 0) {
            // Set the target to be the storage
            this.memory.mineralPickup = storage.id;
        }
    }
};

/**
 * Find ground based minerals
 */
Creep.prototype.findGroundMinerals = function(): void {
    let resource: boolean | Resource = false;
    const thisCreep = this;
    this.log("Creep has no mineral memory, finding stuff to pickup");
    // First check for nearby dropped resources
    const resources = this.room.find(FIND_DROPPED_RESOURCES, {
        filter: (i) => i.resourceType !== RESOURCE_ENERGY &&
            i.amount > (this.pos.getRangeTo(i) / this.moveEfficiency())
    });
    // Did we find resources?
    if (resources.length > 0) {
        this.log("Found some minerals picking the clostest");
        // get the closest resource
        resource = _.min(resources, (r) => thisCreep.pos.getRangeTo(r));
        // Did we find some resources?
        if (resource) {
            // We did, let's store their id
            this.memory.mineralPickup = resource.id;
        }
    }
};

/**
 * Find minerals on containers
 */
Creep.prototype.findContainerMinerals = function(): void {
    let container: boolean | Structure = false;
    const thisCreep = this;
    this.log("Creep searching for mineral containers");
    // Check for containers with anything other than energy in them
    const containers = this.room.find(FIND_STRUCTURES, {
        filter: (i) => i.structureType === STRUCTURE_CONTAINER &&
            (_.sum(i.store) - i.store[RESOURCE_ENERGY]) > 0
    });
    // Any containers?
    if (containers.length > 0) {
        this.log("Found some mineral containers, picking the most cost effective");
        container = _.max(containers, (c: StructureContainer) =>
            (_.sum(c.store) - c.store[RESOURCE_ENERGY]) / thisCreep.pos.getRangeTo(c));
        // Did we find a container
        if (container) {
            // We did it, store the id
            this.memory.mineralPickup = container.id;
        }
    }
};

/**
 * Move to and pickup minerals
 */
Creep.prototype.moveToAndPickupMinerals = function(): number {
    this.log("Found minerals in memory");
    const target: Resource | StructureContainer | StructureStorage | null =
        Game.getObjectById(this.memory.mineralPickup);
    // if the target is invalid, or cannot be found let's clear it
    if (!target) { return this.invalidateMineralTarget(); }
    // Quick validation pass on the target
    if (target instanceof Resource) {
        // If it's going to disapwn before we get there, then there's no point in carrying on
        if (target.amount < (this.pos.getRangeTo(target) / this.moveEfficiency())) {
            return this.invalidateMineralTarget();
        }
        // Can we pick it up yet?
        if (!this.canPickup(target)) {
            this.say(global.sayMove);
            // We can't pick it up yet, let's move to it
            this.travelTo(target);
        }
        // Can we pick it up after our move?
        if (this.canPickup(target)) {
            // Attempt to pick it up
            const pickupResult = this.pickup(target);
            // Check the result
            if (pickupResult === ERR_NOT_IN_RANGE) {
                // something went wrong
            } else if (pickupResult === OK) {
                this.say(global.sayPickup);
                // Invalidate and return full
                return this.invalidateMineralTarget(true);
            }
        }
    } else if (target instanceof StructureContainer || target instanceof StructureStorage) {
        // Check there is still res in the container
        if (_.sum(target.store) - target.store[RESOURCE_ENERGY] === 0) {
            return this.invalidateMineralTarget();
        }
        // Can we pick it up yet?
        if (!this.canPickup(target)) {
            this.say(global.sayMove);
            // Can't pick it up yet, so lets move towards it
            this.travelTo(target);
        }
        // Can we pick it up now?
        if (this.canPickup(target)) {
            // Loop through all the resources in the container
            for (const r in target.store) {
                // If there is more than 0 of this mineral, let's pick it up
                if (target.store.hasOwnProperty(r) && r !== RESOURCE_ENERGY) {
                    // Attempt to pick it up
                    const pickupResult = this.withdraw(target, r as ResourceConstant);
                    // check the result
                    if (pickupResult === ERR_NOT_IN_RANGE) {
                        // something probbaly went wrong
                    } else if (pickupResult === OK) {
                        this.say(global.sayWithdraw);
                        // Invalidate and return full
                        return this.invalidateMineralTarget(this.full());
                    }
                }
            }
        }
    }
    // We've probably moved return ok
    return OK;
};