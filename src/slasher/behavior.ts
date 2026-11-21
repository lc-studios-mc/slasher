import type { SlasherSession } from "./session";
import * as mc from "@minecraft/server";
import { SLASHER_TYPE_ID, StateName } from "./shared";

export function onEquip(player: mc.Player, s: SlasherSession) {
	player.startItemCooldown("slasher_reset", 1);

	s.fsm.start({ player, s });
	s.fsm.changeState(StateName.Idle, { player, s });
}

export function onUnequip(player: mc.Player, s: SlasherSession) {
	s.fsm.changeState(StateName.Inactive, { player, s });
}

export function onTick(player: mc.Player, s: SlasherSession) {
	s.fsm.tick({ player, s });
}

export function onStartUse(player: mc.Player, s: SlasherSession) {}

export function onStopUse(player: mc.Player, s: SlasherSession) {}

export function onSwing(player: mc.Player, s: SlasherSession) {}

// disable vanilla attack damage by slasher
mc.world.beforeEvents.entityHurt.subscribe((ev) => {
	if (ev.damageSource.cause !== mc.EntityDamageCause.entityAttack) return;
	if (!(ev.damageSource.damagingEntity instanceof mc.Player)) return;

	const damagingItem = ev.damageSource.damagingEntity
		?.getComponent(mc.EntityComponentTypes.Equippable)
		?.getEquipment(mc.EquipmentSlot.Mainhand);
	if (damagingItem?.typeId === SLASHER_TYPE_ID) {
		ev.cancel = true;
	}
});
