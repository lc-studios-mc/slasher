import * as mc from "@minecraft/server";

export const SLASHER_TYPE_ID = "slasher:slasher";

export type SlasherSession = {
	itemStack: mc.ItemStack | null;
};

export function createDefaultSlasherSession(): SlasherSession {
	return {
		itemStack: null,
	};
}
