import type { SlasherState } from "../shared";
import * as mc from "@minecraft/server";
import { StateName } from "../shared";

export const SlamWindupState: SlasherState = {
	name: StateName.SlamWindup,
};

export const SlamClashState: SlasherState = {
	name: StateName.SlamClash,
};
