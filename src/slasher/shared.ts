import * as mc from "@minecraft/server";

export const SLASHER_TYPE_ID = "slasher:slasher";

export type SlasherContext = {
	itemStack: mc.ItemStack | null;
};

export function createDefaultSlasherContext(): SlasherContext {
	return {
		itemStack: null,
	};
}
