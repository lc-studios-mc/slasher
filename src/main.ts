import * as mc from "@minecraft/server";

const SLASHER_ITEM_TYPE = "slasher:slasher";

const SlasherItemComponent: mc.ItemCustomComponent = {
	onBeforeDurabilityDamage(arg) {
		arg.durabilityDamage = 0;
	},
};

mc.system.beforeEvents.startup.subscribe((ev) => {
	ev.itemComponentRegistry.registerCustomComponent(SLASHER_ITEM_TYPE, SlasherItemComponent);
});

// disable vanilla attack damage by slasher
mc.world.beforeEvents.entityHurt.subscribe((ev) => {
	if (ev.damageSource.cause !== mc.EntityDamageCause.entityAttack) return;
	if (!(ev.damageSource.damagingEntity instanceof mc.Player)) return;

	const damagingItem = ev.damageSource.damagingEntity
		?.getComponent(mc.EntityComponentTypes.Equippable)
		?.getEquipment(mc.EquipmentSlot.Mainhand);
	if (damagingItem?.typeId === SLASHER_ITEM_TYPE) {
		ev.cancel = true;
	}
});
