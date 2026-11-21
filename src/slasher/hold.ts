import type { SlasherSession } from "./shared";
import * as mc from "@minecraft/server";
import { onEquip, onUnequip } from "./behavior";
import { createDefaultSlasherSession, SLASHER_TYPE_ID } from "./shared";

const slasherSessions = new Map<string, SlasherSession>();

function getOrCreateSlasherSession(player: mc.Player): SlasherSession {
	const current = slasherSessions.get(player.id);
	if (current) return current;

	const newSession = createDefaultSlasherSession();
	slasherSessions.set(player.id, newSession);
	return newSession;
}

function updateSlasherHold(player: mc.Player) {
	const s = getOrCreateSlasherSession(player);
	const health = player.getComponent(mc.EntityComponentTypes.Health)!;
	const equippable = player.getComponent(mc.EntityComponentTypes.Equippable)!;
	const mainItem = equippable.getEquipment(mc.EquipmentSlot.Mainhand);

	const prevItem = s.itemStack;

	if (health.currentValue > 0 && mainItem && mainItem.typeId === SLASHER_TYPE_ID) {
		s.itemStack = mainItem;
		if (prevItem === null) onEquip(player, s);
	} else {
		s.itemStack = null;
		if (prevItem !== null) onUnequip(player, s);
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
	slasherSessions.delete(ev.player.id);
});
