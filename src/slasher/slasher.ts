import type { SlasherState } from "./shared";
import * as mc from "@minecraft/server";
import { SLASHER_TYPE_ID } from "./shared";

export function onEquip(player: mc.Player, state: SlasherState) {
	player.startItemCooldown("slasher_reset", 1);
}

export function onUnequip(player: mc.Player, state: SlasherState) {}

const SlasherItemComponent: mc.ItemCustomComponent = {
	onBeforeDurabilityDamage(arg) {
		arg.durabilityDamage = 0;
	},
};

mc.system.beforeEvents.startup.subscribe((ev) => {
	ev.itemComponentRegistry.registerCustomComponent(SLASHER_TYPE_ID, SlasherItemComponent);
});

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
