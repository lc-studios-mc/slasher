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
