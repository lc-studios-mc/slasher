import type { FsmState } from "@/lib/fsm";
import type { SlasherSession } from "./session";

export const SLASHER_TYPE_ID = "slasher:slasher";

export type ActionName = (typeof ActionName)[keyof typeof ActionName];
export const ActionName = {
	Slash: "slash",
} as const;

export type StateName = (typeof StateName)[keyof typeof StateName];
export const StateName = {
	Idle: "idle",
	Slash: "slash",
	SlamWindup: "slamWindup",
	SlamClash: "slamClash",
} as const;

export type StateContext = {
	s: SlasherSession;
};

export type SlasherState = FsmState<StateContext>;
