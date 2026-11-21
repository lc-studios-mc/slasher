import type { SlasherContext } from "./shared";
import * as mc from "@minecraft/server";
import { createDefaultSlasherContext, SLASHER_TYPE_ID } from "./shared";
import { onEquip, onUnequip } from "./slasher";

const slasherContexts = new Map<string, SlasherContext>();

function getOrCreateSlasherContext(player: mc.Player): SlasherContext {
	const current = slasherContexts.get(player.id);
	if (current) return current;

	const newCtx = createDefaultSlasherContext();
	slasherContexts.set(player.id, newCtx);
	return newCtx;
}

function updateSlasherHold(player: mc.Player) {
	const ctx = getOrCreateSlasherContext(player);
	const health = player.getComponent(mc.EntityComponentTypes.Health)!;
	const equippable = player.getComponent(mc.EntityComponentTypes.Equippable)!;
	const mainItem = equippable.getEquipment(mc.EquipmentSlot.Mainhand);

	const prevItem = ctx.itemStack;

	if (health.currentValue > 0 && mainItem && mainItem.typeId === SLASHER_TYPE_ID) {
		ctx.itemStack = mainItem;
		if (prevItem === null) onEquip(player, ctx);
	} else {
		ctx.itemStack = null;
		if (prevItem !== null) onUnequip(player, ctx);
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
	slasherContexts.delete(ev.player.id);
});
