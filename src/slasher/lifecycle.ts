import type { SlasherState } from "./shared";
import * as mc from "@minecraft/server";
import { SLASHER_TYPE_ID } from "./shared";
import { onEquip, onUnequip } from "./slasher";

const slasherStates = new Map<string, SlasherState>();

function getOrCreateSlasherState(player: mc.Player): SlasherState {
	const current = slasherStates.get(player.id);
	if (current) return current;

	const state: SlasherState = {
		itemStack: null,
	};

	slasherStates.set(player.id, state);
	return state;
}

function updateSlasherHold(player: mc.Player) {
	const state = getOrCreateSlasherState(player);
	const health = player.getComponent(mc.EntityComponentTypes.Health)!;
	const equippable = player.getComponent(mc.EntityComponentTypes.Equippable)!;
	const mainItem = equippable.getEquipment(mc.EquipmentSlot.Mainhand);

	const prevItem = state.itemStack;

	if (health.currentValue > 0 && mainItem && mainItem.typeId === SLASHER_TYPE_ID) {
		state.itemStack = mainItem;
		if (prevItem === null) onEquip(player, state);
	} else {
		state.itemStack = null;
		if (prevItem !== null) onUnequip(player, state);
	}
}

mc.world.afterEvents.worldLoad.subscribe(() => {
	mc.world.getAllPlayers().forEach(updateSlasherHold);
});

mc.world.afterEvents.playerSpawn.subscribe((ev) => {
	updateSlasherHold(ev.player);
});

mc.world.afterEvents.playerHotbarSelectedSlotChange.subscribe((ev) => {
	updateSlasherHold(ev.player);
});

mc.world.afterEvents.playerInventoryItemChange.subscribe(
	(ev) => {
		if (ev.slot === ev.player.selectedSlotIndex) updateSlasherHold(ev.player);
	},
	{ ignoreQuantityChange: true, inventoryType: mc.PlayerInventoryType.Hotbar },
);

mc.world.afterEvents.entityDie.subscribe((ev) => {
	if (ev.deadEntity instanceof mc.Player) updateSlasherHold(ev.deadEntity);
});

mc.world.beforeEvents.playerLeave.subscribe((ev) => {
	slasherStates.delete(ev.player.id);
});
