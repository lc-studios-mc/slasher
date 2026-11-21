import * as mc from "@minecraft/server";
import { SLASHER_TYPE_ID } from "./shared";

const SlasherItemComponent: mc.ItemCustomComponent = {
	onBeforeDurabilityDamage(arg) {
		arg.durabilityDamage = 0;
	},
};

mc.system.beforeEvents.startup.subscribe((ev) => {
	ev.itemComponentRegistry.registerCustomComponent(SLASHER_TYPE_ID, SlasherItemComponent);
});
