import * as mc from "@minecraft/server";

export type SlasherState = {
	itemStack: mc.ItemStack | null;
};

export const SLASHER_TYPE_ID = "slasher:slasher";
