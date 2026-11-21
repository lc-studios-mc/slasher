import type { FsmState } from "@/lib/fsm";
import type { SlasherSession } from "./session";
import * as mc from "@minecraft/server";

export const SLASHER_TYPE_ID = "slasher:slasher";

export type SlasherState = FsmState<StateContext>;

export type StateContext = {
	player: mc.Player;
	s: SlasherSession;
};

export type StateName = (typeof StateName)[keyof typeof StateName];
export const StateName = {
	Inactive: "inactive",
	Idle: "idle",
} as const;
