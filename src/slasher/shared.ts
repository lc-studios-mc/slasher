import * as mc from "@minecraft/server";

export type SlasherContext = {
	itemStack: mc.ItemStack | null;
};

export const SLASHER_TYPE_ID = "slasher:slasher";
