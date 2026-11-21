import * as mc from "@minecraft/server";
import { onEquip, onUnequip, SLASHER_TYPE_ID } from "./slasher";

export type PlayerState = {
	slasher: {
		itemStack: mc.ItemStack | null;
	};
};

const playerStates = new Map<string, PlayerState>();

function getOrCreatePlayerState(player: mc.Player): PlayerState {
	const current = playerStates.get(player.id);
	if (current) return current;

	const state: PlayerState = {
		slasher: {
			itemStack: null,
		},
	};

	playerStates.set(player.id, state);
	return state;
}

function updateHeldItem(player: mc.Player) {
	const state = getOrCreatePlayerState(player);
	const health = player.getComponent(mc.EntityComponentTypes.Health)!;
	const equippable = player.getComponent(mc.EntityComponentTypes.Equippable)!;
	const mainItem = equippable.getEquipment(mc.EquipmentSlot.Mainhand);

	const prevItem = state.slasher.itemStack;

	if (health.currentValue > 0 && mainItem && mainItem.typeId === SLASHER_TYPE_ID) {
		state.slasher.itemStack = mainItem;
		if (prevItem === null) onEquip(player, state);
	} else {
		state.slasher.itemStack = null;
		if (prevItem !== null) onUnequip(player, state);
	}
}

mc.world.afterEvents.worldLoad.subscribe(() => {
	mc.world.getAllPlayers().forEach(updateHeldItem);
});

mc.world.afterEvents.playerSpawn.subscribe((ev) => {
	updateHeldItem(ev.player);
});

mc.world.afterEvents.playerHotbarSelectedSlotChange.subscribe((ev) => {
	updateHeldItem(ev.player);
});

mc.world.afterEvents.playerInventoryItemChange.subscribe(
	(ev) => {
		if (ev.slot === ev.player.selectedSlotIndex) updateHeldItem(ev.player);
	},
	{ ignoreQuantityChange: true, inventoryType: mc.PlayerInventoryType.Hotbar },
);

mc.world.afterEvents.entityDie.subscribe((ev) => {
	if (ev.deadEntity instanceof mc.Player) updateHeldItem(ev.deadEntity);
});

mc.world.beforeEvents.playerLeave.subscribe((ev) => {
	playerStates.delete(ev.player.id);
});
